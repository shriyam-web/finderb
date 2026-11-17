import 'server-only';

import { randomBytes } from 'crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { optimizePublicImage } from '@/lib/media/optimizeImage';
import { s3Env } from '@/lib/media/runtime';

const MAX_BYTES = 8_000_000;

let client: S3Client | null = null;

function storageClient() {
  const env = s3Env();
  if (!env.ready) return null;
  if (!client) {
    client = new S3Client({
      region: env.region,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
    });
  }
  return { client, env };
}

export async function storePublicImage(
  bytes: Buffer,
  folder: 'business' | 'avatar' | 'rehost',
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (bytes.length < 32 || bytes.length > MAX_BYTES) {
    return { ok: false, error: 'This photo is too large. Choose a smaller one.' };
  }
  const optimized = await optimizePublicImage(bytes);
  if (!optimized || optimized.kind === 'gif') {
    return { ok: false, error: 'Choose a JPG, PNG or WebP photo.' };
  }
  const storage = storageClient();
  if (!storage) return { ok: false, error: 'Photo storage is not available right now.' };
  const now = new Date();
  const base = `public/${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomBytes(16).toString('hex')}`;
  const objects = [
    { key: `${base}/original.${optimized.ext}`, body: optimized.original, type: optimized.mime },
    ...optimized.variants.map((variant) => ({
      key: `${base}/w${variant.width}.webp`,
      body: variant.body,
      type: 'image/webp',
    })),
  ];
  const written: string[] = [];
  try {
    for (const object of objects) {
      await storage.client.send(new PutObjectCommand({
        Bucket: storage.env.publicBucket,
        Key: object.key,
        Body: object.body,
        ContentType: object.type,
        CacheControl: 'public, max-age=31536000, immutable',
        ServerSideEncryption: 'AES256',
      }));
      written.push(object.key);
    }
  } catch (error) {
    console.error('[media store]', error instanceof Error ? error.name : 'put failed');
    await Promise.all(written.map((key) => storage.client.send(new DeleteObjectCommand({
      Bucket: storage.env.publicBucket,
      Key: key,
    })).catch(() => undefined)));
    return { ok: false, error: 'Could not upload the photo. Please try again.' };
  }
  return { ok: true, url: `https://${storage.env.cdnHost}/${base}/w1600.webp` };
}
