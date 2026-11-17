import { getSiteConfig, publicSiteConfig } from '@/lib/siteConfig';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { s3Env } from '@/lib/media/runtime';

export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function GET() {
  const config = await getSiteConfig();
  const published = publicSiteConfig(config);
  const effective = config.media.provider === 's3' && s3Env().ready ? 's3' : 'cloudinary';
  return mobileApiJson({
    ...published,
    media: { provider: published.media.provider, effective },
  });
}
