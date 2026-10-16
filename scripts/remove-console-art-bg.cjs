/**
 * Punch only the backdrop white from carousel art.
 * Interior whites (cards, paper) stay; cream JPEG halos are peeled from the
 * outside so the subject sits cleanly on a colored slide.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '../mobile/assets/console');
const PREVIEW_DIR = path.join(os.tmpdir(), 'finderb-carousel-preview');
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
      if (src[i - 1] || src[i + 1] || src[i - width] || src[i + width]) dst[i] = 1;
    }
  }
  return dst;
}

function floodFromEdge(blocked, width, height) {
  const n = width * height;
  const reach = Buffer.alloc(n);
  const stack = [];
  const push = (i) => {
    if (i < 0 || i >= n || blocked[i] || reach[i]) return;
    reach[i] = 1;
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
  return reach;
}

function restoreHoles(keep, width, height) {
  const opened = floodFromEdge(keep, width, height);
  const filled = Buffer.alloc(width * height);
  for (let i = 0; i < filled.length; i++) filled[i] = opened[i] ? 0 : 1;
  return filled;
}

function unmultiplyWhite(r, g, b, a) {
  if (a <= 0) return [0, 0, 0, 0];
  if (a >= 254) return [r, g, b, 255];
  const fa = a / 255;
  const inv = 1 - fa;
  const u = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * inv) / fa)));
  return [u(r), u(g), u(b), a];
}

function whiteMass(keep, data, channels, i, width, height) {
  const x = i % width;
  const y = (i / width) | 0;
  let count = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
      const j = yy * width + xx;
      if (!keep[j]) continue;
      const o = j * channels;
      if (isCream(data[o], data[o + 1], data[o + 2], true)) count++;
    }
  }
  return count;
}

function isCream(r, g, b, loose) {
  const L = luma(r, g, b);
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  const whitePull = Math.min(r, g, b);
  if (loose) return (L >= 208 && sat < 72) || whitePull >= 198;
  return (L >= 228 && sat < 48) || whitePull >= 224;
}

function isPeelable(r, g, b, loose) {
  const L = luma(r, g, b);
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (!isCream(r, g, b, loose)) return false;
  const pure = L >= 250 && sat < 8;
  if (pure && !loose) return false;
  return true;
}

function touchesClear(keep, i, width, height) {
  const x = i % width;
  const y = (i / width) | 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) return true;
      if (!keep[yy * width + xx]) return true;
    }
  }
  return false;
}

function distTo(flag, width, height, cap) {
  const n = width * height;
  const dist = new Uint16Array(n);
  dist.fill(cap + 1);
  const q = [];
  for (let i = 0; i < n; i++) {
    if (!flag[i]) continue;
    dist[i] = 0;
    q.push(i);
  }
  for (let head = 0; head < q.length; head++) {
    const i = q[head];
    const d = dist[i];
    if (d >= cap) continue;
    const x = i % width;
    const nd = d + 1;
    if (x > 0 && dist[i - 1] > nd) {
      dist[i - 1] = nd;
      q.push(i - 1);
    }
    if (x < width - 1 && dist[i + 1] > nd) {
      dist[i + 1] = nd;
      q.push(i + 1);
    }
    if (i >= width && dist[i - width] > nd) {
      dist[i - width] = nd;
      q.push(i - width);
    }
    if (i + width < n && dist[i + width] > nd) {
      dist[i + width] = nd;
      q.push(i + width);
    }
  }
  return dist;
}

function peelHalo(keep, data, channels, width, height) {
  const n = width * height;
  const color = Buffer.alloc(n);
  const clear = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    if (!keep[i]) {
      clear[i] = 1;
      continue;
    }
    const o = i * channels;
    if (!isCream(data[o], data[o + 1], data[o + 2], true)) color[i] = 1;
  }
  const toColor = distTo(color, width, height, 6);
  const toClear = distTo(clear, width, height, 6);
  const next = Buffer.from(keep);
  for (let i = 0; i < n; i++) {
    if (!keep[i]) continue;
    const o = i * channels;
    if (!isCream(data[o], data[o + 1], data[o + 2], true)) continue;
    if (toColor[i] <= 3 && toClear[i] <= 3) next[i] = 0;
  }
  return next;
}

function fringeAlpha(r, g, b) {
  const L = luma(r, g, b);
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  const whitePull = Math.min(r, g, b);
  if (L >= 236 && sat < 28) return 0;
  if (whitePull >= 220) return Math.max(0, Math.round((255 - whitePull) * 3.2));
  const strength = Math.max(255 - whitePull, (240 - L) * 1.4, sat * 0.9);
  return Math.max(0, Math.min(255, Math.round(strength)));
}

async function punchEdgeWhite(file) {
  const input = path.join(DIR, file);
  const output = path.join(DIR, file.replace(/\.jpg$/i, '.png'));
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const n = width * height;
  const ink = Buffer.alloc(n);

  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const L = luma(r, g, b);
    const whitePull = Math.min(r, g, b);
    ink[i] = !(L >= 246 && sat < 18) && !(whitePull >= 250 && sat < 24) && (L < 248 || sat > 16) ? 1 : 0;
  }

  const closed = dilate(ink, width, height);
  const edgeWhite = floodFromEdge(closed, width, height);
  let keep = Buffer.alloc(n);
  for (let i = 0; i < n; i++) keep[i] = edgeWhite[i] ? 0 : 1;
  keep = restoreHoles(keep, width, height);
  const solid = Buffer.from(keep);
  keep = peelHalo(keep, data, channels, width, height);
  keep = peelHalo(keep, data, channels, width, height);

  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];

    if (!solid[i]) {
      data[o + 3] = 0;
      continue;
    }

    if (keep[i]) {
      if (touchesClear(keep, i, width, height)) {
        const a = Math.max(fringeAlpha(r, g, b), 255 - Math.min(r, g, b));
        const [nr, ng, nb, na] = unmultiplyWhite(r, g, b, Math.min(255, a));
        data[o] = nr;
        data[o + 1] = ng;
        data[o + 2] = nb;
        data[o + 3] = na;
        continue;
      }
      data[o + 3] = 255;
      continue;
    }

    const a = fringeAlpha(r, g, b);
    const [nr, ng, nb, na] = unmultiplyWhite(r, g, b, a);
    data[o] = nr;
    data[o + 1] = ng;
    data[o + 2] = nb;
    data[o + 3] = na;
  }

  await sharp(data, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(output);

  let trans = 0;
  let semi = 0;
  let opaqueWhite = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = data[o + 3];
    if (a === 0) trans++;
    else if (a < 255) semi++;
    else {
      const L = luma(data[o], data[o + 1], data[o + 2]);
      const sat = Math.max(data[o], data[o + 1], data[o + 2]) - Math.min(data[o], data[o + 1], data[o + 2]);
      if (L >= 245 && sat < 12) opaqueWhite++;
    }
  }

  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const preview = path.join(PREVIEW_DIR, file.replace(/\.jpg$/i, '-on-blue.png'));
  await sharp({
    create: { width, height, channels: 3, background: { r: 56, g: 189, b: 248 } },
  })
    .composite([{ input: output, blend: 'over' }])
    .png()
    .toFile(preview);
  const stat = fs.statSync(output);
  console.log(
    'wrote',
    path.basename(output),
    Math.round(stat.size / 1024) + 'kb',
    'trans',
    trans,
    'semi',
    semi,
    'opaqueWhite',
    opaqueWhite,
  );
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
