import crypto from 'crypto';

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

export async function uploadPrivateFile(file: File, resource: PrivateResource, folder: string) {
  const auth = creds();
  if (!auth) {
    return {
      success: false as const,
      error: 'Private file storage is not configured. Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.',
    };
  }
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
    error?: { message?: string };
  } | null;
  if (!response.ok || !body?.public_id) {
    return { success: false as const, error: body?.error?.message || 'The file could not be stored privately.' };
  }
  return {
    success: true as const,
    asset: {
      publicId: body.public_id,
      resource,
      format: String(body.format || ''),
    } satisfies StoredAsset,
    duration: body.duration,
    width: body.width,
    height: body.height,
  };
}

export async function destroyPrivateAsset(asset: StoredAsset) {
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
