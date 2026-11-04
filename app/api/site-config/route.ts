import { getSiteConfig, publicSiteConfig } from '@/lib/siteConfig';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function GET() {
  const config = await getSiteConfig();
  return mobileApiJson(publicSiteConfig(config));
}
