import { extractIndianMobileDigits } from '@/lib/indianPhone';

export type UnverifiedContactKind = 'phone' | 'email' | 'whatsapp' | 'map';

const KIND_LABEL: Record<UnverifiedContactKind, string> = {
  phone: 'phone number',
  email: 'email',
  whatsapp: 'WhatsApp number',
  map: 'map location',
};

export function unverifiedContactMessage(kind: UnverifiedContactKind): string {
  if (kind === 'map') {
    return "This business has not added its map location yet on FinderB, in order to protect you from frauds and spams we can't show this unverified detail.";
  }
  return `This business has not verified its ${KIND_LABEL[kind]} yet on FinderB, in order to protect you from frauds and spams we can't show this unverified detail.`;
}

export function hasBusinessMapPin(input: {
  latitude?: number | string | null;
  longitude?: number | string | null;
}): boolean {
  const lat = typeof input.latitude === 'number' ? input.latitude : Number(input.latitude);
  const lng = typeof input.longitude === 'number' ? input.longitude : Number(input.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export function isBusinessWhatsappVerified(input: {
  whatsappVerified?: boolean | null;
  whatsappNumber?: string | null;
  publicPhone?: string | null;
  mobile?: string | null;
  mobileVerified?: boolean | null;
}): boolean {
  if (input.whatsappVerified) return true;
  const wa = extractIndianMobileDigits(input.whatsappNumber);
  if (!wa) return false;
  const phone = extractIndianMobileDigits(input.publicPhone || input.mobile);
  return Boolean(input.mobileVerified) && Boolean(phone) && wa === phone;
}
