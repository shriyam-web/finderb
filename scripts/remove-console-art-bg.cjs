/**
 * Turn the business-home carousel JPGs into PNGs with a transparent backdrop.
 * Keeps interior whites (speech bubbles, cards) by only punching out white
 * that is connected to the image edge.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '../mobile/assets/console');
const FILES = ['leads.jpg', 'photos.jpg', 'verify.jpg', 'growth.jpg', 'profile.jpg'];

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function dilate(src, width, height) {
  const dst = Buffer.from(src);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (src[i]) continue;
      if (
        src[i - 1] ||
        src[i + 1] ||
        src[i - width] ||
        src[i + width] ||
        src[i - width - 1] ||
        src[i - width + 1] ||
        src[i + width - 1] ||
        src[i + width + 1]
      ) {
        dst[i] = 1;
      }
    }
  }
  return dst;
}

async function punchEdgeWhite(file) {
  const input = path.join(DIR, file);
  const output = path.join(DIR, file.replace(/\.jpg$/i, '.png'));
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const n = width * height;
  const content = Buffer.alloc(n);

  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    content[i] = luma(r, g, b) < 246 || sat > 14 ? 1 : 0;
  }

  let mask = content;
  for (let k = 0; k < 5; k++) mask = dilate(mask, width, height);

  const bg = Buffer.alloc(n);
  const stack = [];
  const push = (i) => {
    if (i < 0 || i >= n || mask[i] || bg[i]) return;
    bg[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (i >= width) push(i - width);
    if (i + width < n) push(i + width);
  }

  for (let i = 0; i < n; i++) {
    const o = i * channels;
    if (!bg[i]) {
      data[o + 3] = 255;
      continue;
    }
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const L = luma(r, g, b);
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (L >= 242 && sat < 16) {
      data[o + 3] = 0;
    } else if (L >= 228 && sat < 28) {
      data[o + 3] = Math.max(0, Math.min(255, Math.round((246 - L) * 14)));
    } else {
      data[o + 3] = 255;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(output);
  const stat = fs.statSync(output);
  console.log('wrote', path.basename(output), Math.round(stat.size / 1024) + 'kb');
}

(async () => {
  for (const file of FILES) {
    if (!fs.existsSync(path.join(DIR, file))) {
      console.warn('missing', file);
      continue;
    }
    await punchEdgeWhite(file);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
