export function countryFlagEmoji(isoCode: string) {
  if (!isoCode) return '';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
}
