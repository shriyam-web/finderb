import { unzlibSync } from 'fflate';

function linear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relLuma(red: number, green: number, blue: number): number {
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function paeth(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const diagonal = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= diagonal) return left;
  if (upDistance <= diagonal) return up;
  return upLeft;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>>
    0
  );
}

function decodeBase64(value: string): Uint8Array {
  const clean = value.replace(/\s/g, '');
  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const a = alphabet.indexOf(clean[index]);
    const b = alphabet.indexOf(clean[index + 1]);
    const c = alphabet.indexOf(clean[index + 2]);
    const d = alphabet.indexOf(clean[index + 3]);
    bytes.push((a << 2) | (b >> 4));
    if (clean[index + 2] !== '=') bytes.push(((b & 15) << 4) | (c >> 2));
    if (clean[index + 3] !== '=') bytes.push(((c & 3) << 6) | d);
  }
  return Uint8Array.from(bytes);
}

/** Average brightness of the left and right halves of an 8-bit PNG. */
export function pngHalfLuma(base64: string): { left: number; right: number } | null {
  const bytes = decodeBase64(base64);
  if (bytes.length < 8 || bytes[0] !== 0x89) return null;

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Uint8Array[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR' && data.length >= 10) {
      width = readUint32(data, 0);
      height = readUint32(data, 4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 0;
  if (!width || !height || bitDepth !== 8 || !channels || !idat.length) return null;

  const packed = new Uint8Array(idat.reduce((sum, chunk) => sum + chunk.length, 0));
  let cursor = 0;
  for (const chunk of idat) {
    packed.set(chunk, cursor);
    cursor += chunk.length;
  }

  let inflated: Uint8Array;
  try {
    inflated = unzlibSync(packed);
  } catch {
    return null;
  }

  const stride = width * channels;
  const raw = new Uint8Array(height * stride);
  let input = 0;
  let output = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[input];
    input += 1;
    if (filter == null || input + stride > inflated.length) return null;
    for (let x = 0; x < stride; x += 1) {
      const value = inflated[input];
      input += 1;
      const left = x >= channels ? raw[output - channels] : 0;
      const up = y > 0 ? raw[output - stride] : 0;
      const upLeft = x >= channels && y > 0 ? raw[output - stride - channels] : 0;
      let next = value;
      if (filter === 1) next = (value + left) & 255;
      else if (filter === 2) next = (value + up) & 255;
      else if (filter === 3) next = (value + ((left + up) >> 1)) & 255;
      else if (filter === 4) next = (value + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) return null;
      raw[output] = next;
      output += 1;
    }
  }

  const half = Math.max(1, Math.floor(width / 2));
  let leftSum = 0;
  let leftCount = 0;
  let rightSum = 0;
  let rightCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * channels;
      const gray = channels <= 2;
      const red = raw[pixel];
      const green = gray ? red : raw[pixel + 1];
      const blue = gray ? red : raw[pixel + 2];
      const luma = relLuma(red, green, blue);
      if (x < half) {
        leftSum += luma;
        leftCount += 1;
      } else {
        rightSum += luma;
        rightCount += 1;
      }
    }
  }
  if (!leftCount || !rightCount) return null;
  return { left: leftSum / leftCount, right: rightSum / rightCount };
}
