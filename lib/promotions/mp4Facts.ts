export type Mp4Facts = { duration: number; width: number; height: number };

function boxSize(buf: Buffer, offset: number) {
  const size = buf.readUInt32BE(offset);
  if (size === 1 && offset + 16 <= buf.length) return { size: Number(buf.readBigUInt64BE(offset + 8)), header: 16 };
  if (size === 0) return { size: buf.length - offset, header: 8 };
  return { size, header: 8 };
}

function walk(buf: Buffer, start: number, end: number, visit: (name: string, offset: number, header: number, boxEnd: number) => void) {
  let offset = start;
  while (offset + 8 <= end) {
    const name = buf.toString('ascii', offset + 4, offset + 8);
    const { size, header } = boxSize(buf, offset);
    if (!Number.isFinite(size) || size < header || offset + size > end) break;
    const boxEnd = offset + size;
    visit(name, offset, header, boxEnd);
    if (name === 'moov' || name === 'trak' || name === 'mdia' || name === 'minf' || name === 'stbl') {
      walk(buf, offset + header, boxEnd, visit);
    }
    offset = boxEnd;
  }
}

function factsFrom(buf: Buffer, start: number, end: number): Mp4Facts | null {
  let timescale = 0;
  let units = 0;
  let width = 0;
  let height = 0;
  walk(buf, start, end, (name, offset, header) => {
    if (name === 'mvhd' && !timescale) {
      const version = buf[offset + header] || 0;
      if (version === 1 && offset + header + 32 <= buf.length) {
        timescale = buf.readUInt32BE(offset + header + 20);
        units = Number(buf.readBigUInt64BE(offset + header + 24));
      } else if (offset + header + 20 <= buf.length) {
        timescale = buf.readUInt32BE(offset + header + 12);
        units = buf.readUInt32BE(offset + header + 16);
      }
    }
    if (name === 'tkhd') {
      const version = buf[offset + header] || 0;
      const widthAt = offset + header + (version === 1 ? 88 : 76);
      if (widthAt + 8 <= buf.length) {
        const trackWidth = buf.readUInt32BE(widthAt) / 65536;
        const trackHeight = buf.readUInt32BE(widthAt + 4) / 65536;
        if (trackWidth > 1 && trackHeight > 1) {
          width = trackWidth;
          height = trackHeight;
        }
      }
    }
  });
  if (!timescale || !units) return null;
  return { duration: units / timescale, width, height };
}

/** Reads length and picture size from an MP4 or MOV, including one whose index sits at the end. */
export function readMp4Facts(buf: Buffer): Mp4Facts | null {
  const direct = factsFrom(buf, 0, buf.length);
  if (direct?.width && direct.height) return direct;
  const marker = Buffer.from('moov');
  let at = buf.indexOf(marker);
  while (at >= 4) {
    const size = buf.readUInt32BE(at - 4);
    if (size >= 8 && at - 4 + size <= buf.length) {
      const nested = factsFrom(buf, at - 4, at - 4 + size);
      if (nested?.width && nested.height) return nested;
    }
    at = buf.indexOf(marker, at + 4);
  }
  return direct;
}

export async function readRemoteMp4Facts(url: string, length: number): Promise<Mp4Facts | null> {
  const take = Math.min(length, 2 * 1024 * 1024);
  const load = async (start: number, end: number) => {
    const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
    if (!response.ok && response.status !== 206) return null;
    return Buffer.from(await response.arrayBuffer());
  };
  const head = await load(0, take - 1);
  const fromHead = head ? readMp4Facts(head) : null;
  if (fromHead) return fromHead;
  if (length <= take) return null;
  const tailStart = Math.max(0, length - take);
  const tail = await load(tailStart, length - 1);
  return tail ? readMp4Facts(tail) : null;
}
