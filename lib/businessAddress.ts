export const MIN_ADDRESS_LINE1_LENGTH = 5;

export function combineBusinessAddress(line1: string, line2?: string | null): string {
  return [line1.trim(), line2?.trim() ?? ''].filter(Boolean).join(', ');
}

export function validateAddressLine1(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter address line 1.';
  if (trimmed.length < MIN_ADDRESS_LINE1_LENGTH) {
    return `Address line 1 must be at least ${MIN_ADDRESS_LINE1_LENGTH} characters.`;
  }
  return null;
}

export function validateRegistrationAddressLines(line1: string, _line2?: string): string | null {
  return validateAddressLine1(line1);
}
