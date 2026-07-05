export const TRUECALLER_PHONE_EMAIL_DOMAIN = 'phone.finderb.local';

export function isTruecallerEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TRUECALLER_ENABLED === 'true' &&
      process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_KEY?.trim()
  );
}

export function getTruecallerPartnerKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_KEY?.trim();
  return key || null;
}

export function getTruecallerPartnerName(): string {
  return process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_NAME?.trim() || 'FinderB';
}

export function getTruecallerSiteOrigin(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, '');
  return 'https://finderb.com';
}

export function getTruecallerPrivacyUrl(): string {
  return `${getTruecallerSiteOrigin()}/privacy`;
}

export function getTruecallerTermsUrl(): string {
  return `${getTruecallerSiteOrigin()}/terms`;
}

export function isValidTruecallerRequestId(requestId: string): boolean {
  return /^[\w\-+=/.]{8,64}$/.test(requestId);
}

export function buildTruecallerDeepLink(requestId: string): string | null {
  const partnerKey = getTruecallerPartnerKey();
  if (!partnerKey) return null;

  const params = new URLSearchParams({
    type: 'btmsheet',
    requestNonce: requestId,
    partnerKey,
    partnerName: getTruecallerPartnerName(),
    lang: 'en',
    privacyUrl: getTruecallerPrivacyUrl(),
    termsUrl: getTruecallerTermsUrl(),
    loginPrefix: 'continue',
    loginSuffix: 'login',
    ctaPrefix: 'continuewith',
    ctaColor: '%230087FF',
    ctaTextColor: '%23ffffff',
    btnShape: 'round',
    ttl: '600000',
  });

  return `truecallersdk://truesdk/web_verify?${params.toString()}`;
}

export function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (Boolean(navigator.platform) && /iPad|iPhone|iPod/.test(navigator.platform));
  return /Android/i.test(ua) && !iOS;
}
