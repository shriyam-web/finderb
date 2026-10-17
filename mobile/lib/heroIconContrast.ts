import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Image, Platform } from 'react-native';
import { pngHalfLuma } from './pngHalfLuma';

/** Above this, a white icon disappears into the photo, so the icon turns dark. */
const LIGHT_BACKGROUND = 0.62;

export type HeroIconBackground = {
  leftLight: boolean;
  rightLight: boolean;
};

function toFlags(luma: { left: number; right: number }): HeroIconBackground {
  return {
    leftLight: luma.left >= LIGHT_BACKGROUND,
    rightLight: luma.right >= LIGHT_BACKGROUND,
  };
}

function channelLuma(red: number, green: number, blue: number): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function averageRgba(data: Uint8ClampedArray | Uint8Array): number {
  let sum = 0;
  let count = 0;
  for (let index = 0; index < data.length; index += 4) {
    sum += channelLuma(data[index], data[index + 1], data[index + 2]);
    count += 1;
  }
  return count ? sum / count : 0;
}

function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

function coverRect(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
) {
  const viewAspect = viewWidth / viewHeight;
  const imageAspect = imageWidth / imageHeight;
  if (imageAspect > viewAspect) {
    const sw = imageHeight * viewAspect;
    return { sx: (imageWidth - sw) / 2, sy: 0, sw, sh: imageHeight };
  }
  const sh = imageWidth / viewAspect;
  return { sx: 0, sy: (imageHeight - sh) / 2, sw: imageWidth, sh };
}

function iconBoxes(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
) {
  const visible = coverRect(imageWidth, imageHeight, viewWidth, viewHeight);
  const boxWidth = Math.max(1, visible.sw * 0.2);
  const boxHeight = Math.max(1, visible.sh * 0.28);
  return {
    left: { x: visible.sx, y: visible.sy, width: boxWidth, height: boxHeight },
    right: {
      x: visible.sx + visible.sw - boxWidth,
      y: visible.sy,
      width: boxWidth,
      height: boxHeight,
    },
  };
}

async function sampleWeb(
  uri: string,
  view: { width: number; height: number },
): Promise<HeroIconBackground | null> {
  if (typeof document === 'undefined') return null;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.crossOrigin = 'anonymous';
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('image'));
    element.src = uri;
  });
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) return null;
  const boxes = iconBoxes(width, height, view.width, view.height);
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const read = (box: { x: number; y: number; width: number; height: number }) => {
    context.clearRect(0, 0, 4, 4);
    context.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, 4, 4);
    return averageRgba(context.getImageData(0, 0, 4, 4).data);
  };
  try {
    return toFlags({ left: read(boxes.left), right: read(boxes.right) });
  } catch {
    return null;
  }
}

async function localPhoto(uri: string): Promise<string> {
  if (!/^https?:/i.test(uri)) return uri;
  let hash = 0;
  for (let index = 0; index < uri.length; index += 1) {
    hash = (hash * 31 + uri.charCodeAt(index)) >>> 0;
  }
  const downloaded = await FileSystem.downloadAsync(uri, `${FileSystem.cacheDirectory}hero-ink-${hash}`);
  return downloaded.uri;
}

async function sampleNative(
  uri: string,
  view: { width: number; height: number },
): Promise<HeroIconBackground | null> {
  const local = await localPhoto(uri);
  const { width, height } = await imageSize(local);
  if (!width || !height) return null;
  const boxes = iconBoxes(width, height, view.width, view.height);
  const read = async (box: { x: number; y: number; width: number; height: number }) => {
    const originX = Math.max(0, Math.min(width - 1, Math.round(box.x)));
    const originY = Math.max(0, Math.min(height - 1, Math.round(box.y)));
    const shot = await manipulateAsync(
      local,
      [
        {
          crop: {
            originX,
            originY,
            width: Math.max(1, Math.min(width - originX, Math.round(box.width))),
            height: Math.max(1, Math.min(height - originY, Math.round(box.height))),
          },
        },
        { resize: { width: 4, height: 4 } },
      ],
      { base64: true, format: SaveFormat.PNG, compress: 1 },
    );
    if (!shot.base64) return null;
    return pngHalfLuma(shot.base64);
  };
  const left = await read(boxes.left);
  const right = await read(boxes.right);
  if (!left || !right) return null;
  return toFlags({ left: (left.left + left.right) / 2, right: (right.left + right.right) / 2 });
}

/** Whether the top-left and top-right of a cover photo are light enough to hide a white icon. */
export async function heroIconBackground(
  uri: string,
  view: { width: number; height: number },
): Promise<HeroIconBackground | null> {
  if (!uri || view.width < 2 || view.height < 2) return null;
  try {
    if (Platform.OS === 'web' || typeof document !== 'undefined') {
      const web = await sampleWeb(uri, view);
      if (web) return web;
    }
    if (Platform.OS === 'web') return null;
    return await sampleNative(uri, view);
  } catch {
    return null;
  }
}
