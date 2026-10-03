export function isSyntheticLoginEmail(email: string | null | undefined): boolean {
  const value = String(email || '').trim().toLowerCase();
  return (
    value.endsWith('@phone.finderb.local') ||
    value.endsWith('@whatsapp.finderb.local')
  );
}

export function displayAccountEmail(email: string | null | undefined): string {
  const value = String(email || '').trim();
  return value && !isSyntheticLoginEmail(value) ? value : '';
}
