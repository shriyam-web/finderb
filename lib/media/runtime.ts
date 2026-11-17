import 'server-only';

import { getSiteConfig, type MediaProvider } from '@/lib/siteConfig';
import { s3Env } from '@/lib/media/env';

export { s3Env };

/**
 * Cloudinary stays in force until Site Configurations selects Amazon S3
 * and the server actually has storage settings.
 */
export async function effectiveMediaProvider(): Promise<MediaProvider> {
  const config = await getSiteConfig();
  if (config.media.provider === 's3' && s3Env().ready) return 's3';
  return 'cloudinary';
}
