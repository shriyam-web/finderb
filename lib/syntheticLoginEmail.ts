/** Phone-only sign-in addresses are not a real inbox. */
export function isSyntheticLoginEmail(email: string | null | undefined): boolean {
  const value = String(email || '').trim().toLowerCase();
  return (
    value.endsWith('@phone.finderb.local') ||
    value.endsWith('@whatsapp.finderb.local')
  );
}
