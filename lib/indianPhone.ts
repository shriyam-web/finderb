export const INDIAN_MOBILE_LENGTH = 10;
/** Max national digits kept after stripping +91 / trunk 0 (landlines can be 8–11). */
export const INDIAN_PHONE_MAX_LENGTH = 11;
export const INDIAN_LANDLINE_MIN_LENGTH = 8;

/**
 * Normalize Indian phone digit input.
 * Strips +91 / 91 and a single trunk-prefix 0 *before* length capping so a pasted
 * `09876543210` keeps all 10 mobile digits instead of losing the last one.
 */
export function extractIndianMobileDigits(value: unknown): string {
  if (value == null) return '';

  const text = typeof value === 'string' ? value : String(value);
  if (!text) return '';

  let digits = text.replace(/\D/g, '');
  if (!digits) return '';

  // Country code: 91XXXXXXXXXX or 9191… edge cases
  if (digits.startsWith('91') && digits.length > INDIAN_MOBILE_LENGTH) {
    digits = digits.slice(2);
  }

  // Trunk prefix: 0 + 10-digit national number (mobile or landline)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Extra leading zeros from paste (00…)
  while (digits.length > INDIAN_MOBILE_LENGTH && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, INDIAN_PHONE_MAX_LENGTH);
}

export function formatIndianMobileDisplay(digits: string): string {
  const normalized = extractIndianMobileDigits(digits);
  if (!normalized) return '';
  if (normalized.length <= 5) return normalized;
  return `${normalized.slice(0, 5)} ${normalized.slice(5)}`;
}

export function isValidIndianMobileDigits(digits: string): boolean {
  const normalized = extractIndianMobileDigits(digits);
  return /^[6-9]\d{9}$/.test(normalized);
}

/** Indian landline / STD numbers (not mobile). Often start with 1–5 after trunk 0 is removed. */
export function isValidIndianLandlineDigits(digits: string): boolean {
  const normalized = extractIndianMobileDigits(digits);
  if (isValidIndianMobileDigits(normalized)) return false;
  if (
    normalized.length < INDIAN_LANDLINE_MIN_LENGTH ||
    normalized.length > INDIAN_PHONE_MAX_LENGTH
  ) {
    return false;
  }
  // Reject obviously incomplete / garbage; allow STD-style numbers.
  return /^\d+$/.test(normalized) && !/^0+$/.test(normalized);
}

export function isValidIndianPhoneDigits(
  digits: string,
  options: { allowLandline?: boolean } = {},
): boolean {
  if (isValidIndianMobileDigits(digits)) return true;
  if (options.allowLandline && isValidIndianLandlineDigits(digits)) return true;
  return false;
}

export function normalizeIndianPhoneForStorage(value: string): string {
  return extractIndianMobileDigits(value);
}

export function formatIndianPhoneLabel(value: string): string {
  const digits = extractIndianMobileDigits(value);
  if (!digits) return '';
  if (isValidIndianLandlineDigits(digits) && digits.length !== INDIAN_MOBILE_LENGTH) {
    return `+91 ${digits}`;
  }
  return `+91 ${formatIndianMobileDisplay(digits)}`;
}

export function indianMobileValidationError(
  value: string,
  options: { required?: boolean; allowLandline?: boolean; label?: string } = {},
): string | null {
  const { required = true, allowLandline = false, label } = options;
  const digits = extractIndianMobileDigits(value);
  const fieldLabel = label || (allowLandline ? 'phone number' : 'mobile number');

  if (!digits) {
    return required ? `Enter your ${fieldLabel}.` : null;
  }

  if (isValidIndianPhoneDigits(digits, { allowLandline })) {
    return null;
  }

  if (allowLandline) {
    if (digits.length < INDIAN_LANDLINE_MIN_LENGTH) {
      return 'Enter a valid mobile (10 digits) or landline number.';
    }
    return 'Enter a valid Indian mobile or landline number.';
  }

  if (digits.length < INDIAN_MOBILE_LENGTH) {
    return 'Enter all 10 digits. A leading 0 or +91 is fine — we remove it automatically.';
  }

  return 'Enter a valid 10-digit Indian mobile number (starts with 6–9).';
}
