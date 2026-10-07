import { businessHasPublicPhoto } from '@/lib/businessMapping';
import { isValidIndianMobileDigits } from '@/lib/indianPhone';
import { isKycInReview, isKycVerified } from '@/lib/businessVerification';

export type MissingProfileField = {
  key: string;
  label: string;
  /** Settings modal key; null when not editable in Settings */
  settingsKey: string | null;
  /** Where to send the merchant to fix this field */
  action: 'settings' | 'kyc';
};

type CompletionField = {
  key: string;
  label: string;
  settingsKey: string | null;
  action: 'settings' | 'kyc';
};

/** Legacy DB fields — tracked via kycStatus only, not as separate profile gaps */
export const KYC_DOCUMENT_FIELD_KEYS = [
  'panNumber',
  'aadharNumber',
  'panUrl',
  'aadharUrl',
  'msmeGstUrl',
] as const;

const COMPLETION_FIELDS: CompletionField[] = [
  { key: 'businessName', label: 'Legal Business Name', settingsKey: 'businessName', action: 'settings' },
  { key: 'displayName', label: 'Business Display Name', settingsKey: 'displayName', action: 'settings' },
  { key: 'category', label: 'Business Category', settingsKey: 'category', action: 'settings' },
  { key: 'publicPhone', label: 'Public Phone', settingsKey: 'publicPhone', action: 'settings' },
  { key: 'ownerInfo', label: 'Owner Information', settingsKey: 'ownerInfo', action: 'settings' },
  { key: 'businessAddress', label: 'Address', settingsKey: 'businessAddress', action: 'settings' },
  { key: 'city', label: 'City', settingsKey: 'city', action: 'settings' },
  { key: 'state', label: 'State', settingsKey: 'state', action: 'settings' },
  { key: 'country', label: 'Country', settingsKey: 'country', action: 'settings' },
  { key: 'about', label: 'About Business', settingsKey: 'about', action: 'settings' },
  { key: 'profilePictureUrl', label: 'Business Photos (required to go public)', settingsKey: 'media', action: 'settings' },
  { key: 'timings', label: 'Business Timings', settingsKey: 'timings', action: 'settings' },
  { key: 'yearsInBusiness', label: 'Year of Establishment', settingsKey: 'yearsInBusiness', action: 'settings' },
  { key: 'website', label: 'Website', settingsKey: 'website', action: 'settings' },
  { key: 'facebookUrl', label: 'Facebook URL', settingsKey: 'facebookUrl', action: 'settings' },
  { key: 'instagramUrl', label: 'Instagram URL', settingsKey: 'instagramUrl', action: 'settings' },
  { key: 'youtubeUrl', label: 'Youtube URL', settingsKey: 'youtubeUrl', action: 'settings' },
  { key: 'whatsappNumber', label: 'Whatsapp Number', settingsKey: 'whatsappNumber', action: 'settings' },
  { key: 'mapLocation', label: 'Google Maps Location', settingsKey: 'mapLocation', action: 'settings' },
];

export { isKycVerified, isKycInReview } from '@/lib/businessVerification';

export function getKycMissingField(kycStatus?: string | null): MissingProfileField | null {
  if (isKycVerified(kycStatus)) return null;
  if (isKycInReview(kycStatus)) return null;

  return {
    key: 'kyc',
    label: 'Identity verification (KYC)',
    settingsKey: null,
    action: 'kyc',
  };
}

function isOwnerInfoComplete(business: Record<string, unknown>): boolean {
  const name = String(business.ownerName || '').trim();
  const mobile = String(business.ownerMobile || '');
  return Boolean(name) && isValidIndianMobileDigits(mobile);
}

function isFieldComplete(business: Record<string, unknown>, field: CompletionField): boolean {
  if (field.key === 'ownerInfo') {
    return isOwnerInfoComplete(business);
  }

  if (field.key === 'mapLocation') {
    const lat = business.latitude as number | undefined;
    const lng = business.longitude as number | undefined;
    return lat != null && lng != null && !(lat === 0 && lng === 0);
  }

  if (field.key === 'profilePictureUrl') {
    return businessHasPublicPhoto(business);
  }

  const value = business[field.key];
  return (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    (typeof value !== 'object' || Object.keys(value as object).length > 0)
  );
}

export function getProfileCompletion(business: Record<string, unknown> | null | undefined) {
  const missingFields: MissingProfileField[] = [];
  let completedCount = 0;

  COMPLETION_FIELDS.forEach((field) => {
    if (isFieldComplete(business || {}, field)) {
      completedCount++;
    } else {
      missingFields.push({
        key: field.key,
        label: field.label,
        settingsKey: field.settingsKey,
        action: field.action,
      });
    }
  });

  // Same photo gate as public visibility: profile or gallery counts as one completeness slot.
  if (businessHasPublicPhoto(business || {})) {
    completedCount++;
  }

  if (
    business?.paymentModes &&
    Array.isArray(business.paymentModes) &&
    business.paymentModes.length > 0
  ) {
    completedCount++;
  } else {
    missingFields.push({
      key: 'paymentModes',
      label: 'Payment Modes',
      settingsKey: 'paymentModes',
      action: 'settings',
    });
  }

  const totalFields = COMPLETION_FIELDS.length + 2;
  const percentage = Math.round((completedCount / totalFields) * 100);

  return { percentage, missingFields, totalFields, completedCount };
}

/**
 * Profile listing gaps + optional single KYC row (never individual PAN/Aadhaar/doc fields).
 * KYC document storage is handled via Digio — not counted as separate profile fields.
 */
export function getAccountMissingFields(
  business: Record<string, unknown> | null | undefined
): MissingProfileField[] {
  const { missingFields } = getProfileCompletion(business);
  const kycField = getKycMissingField(business?.kycStatus as string | undefined);
  return kycField ? [...missingFields, kycField] : missingFields;
}

/** Map a dashboard completion label to a settings modal key (for deep links) */
export function settingsKeyFromCompletionKey(key: string): string | null {
  if (key === 'kyc') return null;
  if (key === 'images' || key === 'profilePictureUrl') return 'media';
  if (key === 'paymentModes') return 'paymentModes';
  if (key === 'ownerInfo') return 'ownerInfo';
  const field = COMPLETION_FIELDS.find((f) => f.key === key);
  return field?.settingsKey ?? null;
}
