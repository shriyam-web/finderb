import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const ANDROID = path.join(ROOT, "android", "app", "src", "main", "res");

if (!SRC || !fs.existsSync(SRC)) {
  console.error("Usage: node scripts/apply-fb-icon.mjs <source.png>");
  process.exit(1);
}

const mipmap = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};
const adaptive = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};
const splash = {
  mdpi: 96,
  hdpi: 144,
  xhdpi: 192,
  xxhdpi: 288,
  xxxhdpi: 384,
};

async function writePng(file, image) {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await image.png().toFile(file);
}

async function writeWebp(file, image) {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await image.webp({ quality: 96 }).toFile(file);
}

/** Knock out near-white plate so only the FB glyph remains. */
async function extractGlyph(srcPath) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = Buffer.from(data);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const a = px[i + 3];
    if (a < 8) {
      px[i + 3] = 0;
      continue;
    }
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const chroma = max - min;
    if (min >= 228 && chroma <= 28) {
      px[i + 3] = 0;
      continue;
    }
    if (min >= 210 && chroma <= 18) {
      px[i + 3] = 0;
    }
  }

  return sharp(px, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 12 })
    .png()
    .toBuffer();
}

/** Vertical center of opaque mass — better than bbox for this top-heavy glyph. */
async function opaqueCenterY(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let weight = 0;
  let sumY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a < 24) continue;
      const w = a / 255;
      weight += w;
      sumY += y * w;
    }
  }
  return weight > 0 ? sumY / weight : info.height / 2;
}

async function centerOnCanvas(
  glyphBuf,
  size,
  {
    padRatio = 0.14,
    background = { r: 0, g: 0, b: 0, alpha: 0 },
  } = {},
) {
  const pad = Math.round(size * padRatio);
  const inner = Math.max(1, size - pad * 2);
  const fitted = await sharp(glyphBuf)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const meta = await sharp(fitted).metadata();
  const gw = meta.width || inner;
  const gh = meta.height || inner;
  const massY = await opaqueCenterY(fitted);
  const left = Math.round((size - gw) / 2);
  // Place so opaque mass sits on the canvas mid-line (not the bbox mid-line).
  const top = Math.round(size / 2 - massY);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  }).composite([
    {
      input: fitted,
      left,
      top: Math.max(0, Math.min(size - gh, top)),
    },
  ]);
}

const meta = await sharp(SRC).metadata();
const glyph = await extractGlyph(SRC);
const glyphMeta = await sharp(glyph).metadata();

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const white = { r: 255, g: 255, b: 255, alpha: 1 };

// App icon: a bit more padding on every side around the FB mark
const ICON_PAD = 0.18;
const ADAPTIVE_PAD = 0.22;
// Android 12+ splash masks the icon in a circle (~192dp of 288dp).
// Square FB mark must sit inside that circle → ~30% pad each side.
const SPLASH_PAD = 0.3;

// App icon / splash: glyph centered on white (equal optical padding)
await writePng(
  path.join(ASSETS, "icon.png"),
  await centerOnCanvas(glyph, 1024, { padRatio: ICON_PAD, background: white }),
);
await writePng(
  path.join(ASSETS, "favicon.png"),
  await centerOnCanvas(glyph, 196, { padRatio: ICON_PAD, background: white }),
);
await writePng(
  path.join(ASSETS, "splash-icon.png"),
  await centerOnCanvas(glyph, 512, { padRatio: SPLASH_PAD, background: white }),
);
await writePng(
  path.join(ASSETS, "splash-logo.png"),
  await centerOnCanvas(glyph, 1024, {
    padRatio: SPLASH_PAD,
    background: white,
  }),
);

// Hero / in-app mark: ONLY the FB symbol, no plate / no bg color
const heroMark = await centerOnCanvas(glyph, 1024, {
  padRatio: 0.08,
  background: transparent,
});
await writePng(path.join(ASSETS, "fb-mark.png"), heroMark);
await writePng(path.join(ASSETS, "fb-glyph.png"), heroMark);

await writePng(
  path.join(ASSETS, "android-icon-foreground.png"),
  await centerOnCanvas(glyph, 1024, { padRatio: ADAPTIVE_PAD, background: transparent }),
);
await writePng(
  path.join(ASSETS, "android-icon-background.png"),
  sharp({
    create: { width: 1024, height: 1024, channels: 3, background: "#FFFFFF" },
  }),
);

const monoGlyph = await sharp(glyph).greyscale().threshold(210).png().toBuffer();
await writePng(
  path.join(ASSETS, "android-icon-monochrome.png"),
  await centerOnCanvas(monoGlyph, 1024, { padRatio: ADAPTIVE_PAD, background: transparent }),
);

const splashFullW = 1284;
const splashFullH = 2778;
const splashMark = await (
  await centerOnCanvas(glyph, 640, {
    padRatio: SPLASH_PAD,
    background: transparent,
  })
)
  .png()
  .toBuffer();
await writePng(
  path.join(ASSETS, "splash-full.png"),
  sharp({
    create: {
      width: splashFullW,
      height: splashFullH,
      channels: 3,
      background: "#FFFFFF",
    },
  }).composite([
    {
      input: splashMark,
      top: Math.round(splashFullH / 2 - 320),
      left: Math.round(splashFullW / 2 - 320),
    },
  ]),
);

const iconWhite = await (
  await centerOnCanvas(glyph, 1024, { padRatio: ICON_PAD, background: white })
)
  .png()
  .toBuffer();

for (const [dpi, size] of Object.entries(mipmap)) {
  const dir = path.join(ANDROID, `mipmap-${dpi}`);
  const img = sharp(iconWhite).resize(size, size, { fit: "cover" });
  await writeWebp(path.join(dir, "ic_launcher.webp"), img.clone());
  await writeWebp(path.join(dir, "ic_launcher_round.webp"), img);
}

for (const [dpi, size] of Object.entries(adaptive)) {
  const dir = path.join(ANDROID, `mipmap-${dpi}`);
  await writeWebp(
    path.join(dir, "ic_launcher_foreground.webp"),
    await centerOnCanvas(glyph, size, { padRatio: ADAPTIVE_PAD, background: transparent }),
  );
  await writeWebp(
    path.join(dir, "ic_launcher_monochrome.webp"),
    await centerOnCanvas(monoGlyph, size, { padRatio: ADAPTIVE_PAD, background: transparent }),
  );
}

for (const [dpi, size] of Object.entries(splash)) {
  const dir = path.join(ANDROID, `drawable-${dpi}`);
  await writePng(
    path.join(dir, "splashscreen_logo.png"),
    await centerOnCanvas(glyph, size, {
      padRatio: SPLASH_PAD,
      background: white,
    }),
  );
}

console.log("Applied FB icon", {
  source: `${meta.width}x${meta.height}`,
  glyph: `${glyphMeta.width}x${glyphMeta.height}`,
});
