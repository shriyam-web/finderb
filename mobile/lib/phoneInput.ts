/**
 * Room for an autofilled or pasted number such as "+91 98765 43210" or "0091-98765-43210".
 * A native maxLength of 10 cuts these off before JavaScript sees them.
 */
export const PHONE_INPUT_MAX_LENGTH = 20;

/**
 * Turns whatever lands in a mobile field (typing, paste, keyboard or SMS autofill) into national digits.
 *
 * A leading country code is removed only when it is unambiguous: an explicit "+91" / "0091", or a number
 * that is exactly the country code plus a full national number. A typed 10-digit number that happens to
 * start with 91 is left alone.
 */
export function mobileInputDigits(raw: string, previous = '', dial = '91'): string {
  const max = dial === '91' ? 10 : 15;
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    digits = digits.replace(/^00/, '');
    if (digits.startsWith(dial)) digits = digits.slice(dial.length);
    return digits.replace(/^0+/, '').slice(0, max);
  }

  digits = digits.replace(/^0+/, '');
  if (digits.length <= max) return digits;

  // Typing past a complete number keeps the number as it was.
  if (previous.length === max && digits.startsWith(previous)) return previous;
  if (digits.length === max + dial.length && digits.startsWith(dial)) return digits.slice(dial.length);
  return digits.slice(0, max);
}
