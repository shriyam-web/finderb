import 'server-only';

import { businessProfileLockError, mobileUpdateProfile } from '@/lib/auth/mobileAuth.server';
import { effectiveMediaProvider } from '@/lib/media/runtime';

const MAX_BYTES = 3_000_000;
const DATA_URI = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

/** Uploads a cropped profile photo (data URI) and saves it as the user's avatar. */
export async function uploadUserAvatar(userId: string, dataUri: unknown) {
  const match = typeof dataUri === 'string' ? DATA_URI.exec(dataUri) : null;
  if (!match) return { success: false as const, error: 'Choose a JPG, PNG or WebP photo.' };
  if (Math.floor((match[2].length * 3) / 4) > MAX_BYTES) {
    return { success: false as const, error: 'This photo is too large. Choose a smaller one.' };
  }
  const locked = await businessProfileLockError(userId);
  if (locked) return { success: false as const, error: locked };

  if ((await effectiveMediaProvider()) === 's3') {
    const { storePublicImage } = await import('@/lib/media/store');
    const stored = await storePublicImage(Buffer.from(match[2], 'base64'), 'avatar');
    if (!stored.ok) return { success: false as const, error: stored.error };
    return mobileUpdateProfile(userId, { avatarUrl: stored.url });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    return { success: false as const, error: 'Photo upload is not available right now.' };
  }

  let secureUrl = '';
  try {
    const form = new FormData();
    form.append('file', dataUri as string);
    form.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const body = (await response.json().catch(() => null)) as { secure_url?: unknown } | null;
    if (response.ok && typeof body?.secure_url === 'string') secureUrl = body.secure_url;
    if (!secureUrl) console.error('[avatar upload] Cloudinary status', response.status);
  } catch (error) {
    console.error('[avatar upload]', error);
  }
  if (!secureUrl) {
    return { success: false as const, error: 'Could not upload the photo. Please try again.' };
  }

  return mobileUpdateProfile(userId, { avatarUrl: secureUrl });
}
