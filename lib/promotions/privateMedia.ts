import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { effectiveMediaProvider } from '@/lib/media/runtime';
import { deletePrivateObject, deletePublicPromotion, mediaStorage, putPrivateBytes } from '@/lib/media/s3';
import { readMp4Facts } from '@/lib/promotions/mp4Facts';

export type PrivateResource = 'image' | 'video' | 'raw';

export type StoredAsset = {
  publicId: string;
  resource: PrivateResource;
  format: string;
};

type Creds = { cloudName: string; apiKey: string; apiSecret: string };

function creds(): Creds | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || '';
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function privateMediaConfigured() {
  return Boolean(creds());
}

export function publicVideoPreset() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || '';
  if (!cloudName || !uploadPreset) return null;
  return { cloudName, uploadPreset };
}

/** Cloudinary API signature. Values without "&" match signature version 2. */
export function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .filter((key) => params[key])
    .sort()
    .map((key) => `${key}=${params[key]}`.replace(/&/g, '%26'))
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

/** Short-lived URL. It expires in 10 minutes and is not a public asset link. */
export function privateDownloadUrl(asset: StoredAsset, attachment = false): string | null {
  const auth = creds();
  if (!auth || !asset.publicId) return null;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const expiresAt = String(Math.floor(Date.now() / 1000) + 10 * 60);
  const params: Record<string, string> = {
    expires_at: expiresAt,
    public_id: asset.publicId,
    timestamp,
    type: 'authenticated',
  };
  if (asset.format) params.format = asset.format;
  if (attachment) params.attachment = 'true';
  const signature = signCloudinaryParams(params, auth.apiSecret);
  const query = new URLSearchParams({ ...params, api_key: auth.apiKey, signature });
  return `https://api.cloudinary.com/v1_1/${auth.cloudName}/${asset.resource}/download?${query}`;
}

async function uploadWithPreset(file: File, resource: PrivateResource) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || '';
  if (!cloudName || !uploadPreset) {
    return { success: false as const, error: 'The file could not be stored. Try again.' };
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`, {
    method: 'POST',
    body: form,
  });
  const body = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    format?: string;
    duration?: number;
    width?: number;
    height?: number;
    error?: { message?: string };
  } | null;
  if (!response.ok || !body?.public_id) {
    return { success: false as const, error: 'The file could not be stored. Try again.' };
  }
  return {
    success: true as const,
    asset: {
      publicId: body.public_id,
      resource,
      format: String(body.format || ''),
    } satisfies StoredAsset,
    deliveryUrl: body.secure_url || null,
    duration: body.duration,
    width: body.width,
    height: body.height,
  };
}

async function storeSwitchedFile(file: File, resource: PrivateResource) {
  const store = mediaStorage();
  if (!store) return { success: false as const, error: 'The file could not be stored. Try again.' };
  const bytes = Buffer.from(await file.arrayBuffer());
  const mov = file.type === 'video/quicktime';
  const ext = resource === 'video'
    ? (mov ? 'mov' : 'mp4')
    : file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'application/pdf'
          ? 'pdf'
          : 'jpg';
  const contentType = resource === 'video'
    ? (mov ? 'video/quicktime' : 'video/mp4')
    : file.type || 'application/octet-stream';
  if (resource === 'video') {
    const facts = readMp4Facts(bytes);
    if (!facts?.width || !facts.height) {
      return { success: false as const, error: 'FinderB could not read this video. Use an MP4 or MOV.' };
    }
    const now = new Date();
    const key = `public/promotions/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
    try {
      await store.client.send(new PutObjectCommand({
        Bucket: store.env.publicBucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        ServerSideEncryption: 'AES256',
      }));
    } catch {
      return { success: false as const, error: 'The file could not be stored. Try again.' };
    }
    return {
      success: true as const,
      asset: { publicId: key, resource, format: ext } satisfies StoredAsset,
      deliveryUrl: `https://${store.env.cdnHost}/${key}`,
      duration: facts.duration,
      width: facts.width,
      height: facts.height,
    };
  }
  const key = `private/verification/${crypto.randomBytes(16).toString('hex')}.${ext}`;
  try {
    const saved = await putPrivateBytes(key, bytes, contentType);
    if (!saved) return { success: false as const, error: 'The file could not be stored. Try again.' };
  } catch {
    return { success: false as const, error: 'The file could not be stored. Try again.' };
  }
  return {
    success: true as const,
    asset: { publicId: key, resource, format: ext } satisfies StoredAsset,
    deliveryUrl: null as string | null,
    duration: undefined,
    width: undefined,
    height: undefined,
  };
}

export async function uploadPrivateFile(file: File, resource: PrivateResource, folder: string) {
  if ((await effectiveMediaProvider()) === 's3') return storeSwitchedFile(file, resource);
  const auth = creds();
  if (!auth) return uploadWithPreset(file, resource);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { folder, timestamp, type: 'authenticated' };
  const signature = signCloudinaryParams(params, auth.apiSecret);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', auth.apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('type', 'authenticated');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${auth.cloudName}/${resource}/upload`, {
    method: 'POST',
    body: form,
  });
  const body = (await response.json().catch(() => null)) as {
    public_id?: string;
    format?: string;
    duration?: number;
    width?: number;
    height?: number;
    secure_url?: string;
    error?: { message?: string };
  } | null;
  if (!response.ok || !body?.public_id) {
    return uploadWithPreset(file, resource);
  }
  return {
    success: true as const,
    asset: {
      publicId: body.public_id,
      resource,
      format: String(body.format || ''),
    } satisfies StoredAsset,
    deliveryUrl: null as string | null,
    duration: body.duration,
    width: body.width,
    height: body.height,
  };
}

/** Short-lived signature so the phone can send a video straight to Cloudinary. */
export function signPrivateUpload(folder: string) {
  const auth = creds();
  if (!auth) return null;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { folder, timestamp, type: 'authenticated' };
  return {
    cloudName: auth.cloudName,
    apiKey: auth.apiKey,
    timestamp,
    signature: signCloudinaryParams(params, auth.apiSecret),
    folder,
  };
}

export async function readPrivateVideo(publicId: string) {
  const auth = creds();
  if (!auth || !publicId) return null;
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${auth.cloudName}/resources/video/authenticated/${publicId}`,
    { headers: { Authorization: `Basic ${Buffer.from(`${auth.apiKey}:${auth.apiSecret}`).toString('base64')}` } },
  );
  const body = (await response.json().catch(() => null)) as {
    format?: string;
    duration?: number;
    width?: number;
    height?: number;
    bytes?: number;
  } | null;
  if (!response.ok || !body) return null;
  return {
    format: String(body.format || ''),
    duration: Number(body.duration),
    width: Number(body.width),
    height: Number(body.height),
    bytes: Number(body.bytes),
  };
}

export async function destroyPrivateAsset(asset: StoredAsset) {
  if (asset.publicId.startsWith('private/')) {
    await deletePrivateObject(asset.publicId);
    return;
  }
  if (asset.publicId.startsWith('public/promotions/')) {
    await deletePublicPromotion(asset.publicId);
    return;
  }
  const auth = creds();
  if (!auth || !asset.publicId) return;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { public_id: asset.publicId, timestamp, type: 'authenticated' };
  const signature = signCloudinaryParams(params, auth.apiSecret);
  const body = new URLSearchParams({ ...params, api_key: auth.apiKey, signature });
  await fetch(`https://api.cloudinary.com/v1_1/${auth.cloudName}/${asset.resource}/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => undefined);
}

export function readStoredAssets(value: unknown): StoredAsset[] {
  if (!Array.isArray(value)) return [];
  const assets: StoredAsset[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const resource = row.resource;
    const publicId = String(row.publicId || '');
    if (!publicId || (resource !== 'image' && resource !== 'video' && resource !== 'raw')) continue;
    assets.push({ publicId, resource, format: String(row.format || '') });
  }
  return assets;
}
