export const INDIAN_MOBILE_LENGTH = 10;

export function extractIndianMobileDigits(value: string): string {
  if (!value) return '';

  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('91') && digits.length > INDIAN_MOBILE_LENGTH) {
    digits = digits.slice(2);
  }

  digits = digits.replace(/^0+/, '');

  return digits.slice(0, INDIAN_MOBILE_LENGTH);
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

export function normalizeIndianPhoneForStorage(value: string): string {
  return extractIndianMobileDigits(value);
}

export function formatIndianPhoneLabel(value: string): string {
  const digits = extractIndianMobileDigits(value);
  if (!digits) return '';
  return `+91 ${formatIndianMobileDisplay(digits)}`;
}

export function indianMobileValidationError(
  value: string,
  options: { required?: boolean } = {},
): string | null {
  const { required = true } = options;
  const digits = extractIndianMobileDigits(value);

  if (!digits) {
    return required ? 'Enter your 10-digit mobile number.' : null;
  }

  if (digits.length < INDIAN_MOBILE_LENGTH) {
    return 'Enter all 10 digits. Do not add 0, +91, or spaces.';
  }

  if (!isValidIndianMobileDigits(digits)) {
    return 'Enter a valid 10-digit Indian mobile number (starts with 6–9).';
  }

  return null;
}
