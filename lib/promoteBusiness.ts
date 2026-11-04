import { isPromoteBusinessOnlineEnabled } from '@/lib/siteConfig';

export { isPromoteBusinessOnlineEnabled };

/** Hide every Promote Your Business Online page while the Site Configurations switch is off. */
export async function promoteBusinessOnlineOrNull(): Promise<boolean> {
  return isPromoteBusinessOnlineEnabled();
}
