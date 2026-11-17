'use server';

import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
import { effectiveMediaProvider } from '@/lib/media/runtime';
import { ownershipDetailsLock } from '@/lib/ownershipRequest.server';

const DATA_URI = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_BYTES = 5_000_000;

/** Stores one merchant photo when Amazon S3 is the active photo store. */
export async function uploadOwnedBusinessPhoto(businessId: string, dataUri: string) {
  if ((await effectiveMediaProvider()) !== 's3') {
    return { success: false as const, error: 'Photo upload is using Cloudinary.' };
  }
  const match = DATA_URI.exec(dataUri || '');
  if (!match) return { success: false as const, error: 'Choose a JPG, PNG or WebP photo.' };
  if (Math.floor((match[2].length * 3) / 4) > MAX_BYTES) {
    return { success: false as const, error: 'This photo is too large. Choose a smaller one.' };
  }
  const auth = await assertBusinessTab(businessId, 'listings', 'edit');
  if (!auth.ok) return { success: false as const, error: auth.error };
  const locked = await ownershipDetailsLock(businessId);
  if (locked.locked) return { success: false as const, error: locked.error };
  const stored = await (await import('@/lib/media/store')).storePublicImage(Buffer.from(match[2], 'base64'), 'business');
  if (!stored.ok) return { success: false as const, error: stored.error };
  return { success: true as const, url: stored.url };
}
