import type { createClient } from '@/utils/supabase/server';

export type AccountType = 'user' | 'merchant' | 'admin';

type SupabaseServerClient = ReturnType<typeof createClient>;

const ACCOUNT_LABELS: Record<AccountType, string> = {
  user: 'User',
  merchant: 'Merchant',
  admin: 'Admin',
};

export const LOGIN_PATHS: Record<AccountType, string> = {
  user: '/login',
  merchant: '/business/login',
  admin: '/admin/login',
};

export function getAccountTypeLabel(type: AccountType): string {
  return ACCOUNT_LABELS[type];
}

export async function lookupEmailAccountTypes(
  supabase: SupabaseServerClient,
  email: string
): Promise<AccountType[]> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) return [];

  const [userRes, businessRes, adminRes] = await Promise.all([
    supabase.from('User').select('id').eq('email', normalizedEmail).maybeSingle(),
    supabase
      .from('Business')
      .select('id')
      .or(`workEmail.eq.${normalizedEmail},email.eq.${normalizedEmail}`)
      .limit(1),
    supabase.from('admins').select('id').eq('email', normalizedEmail).maybeSingle(),
  ]);

  const types: AccountType[] = [];
  if (userRes.data) types.push('user');
  if (businessRes.data?.length) types.push('merchant');
  if (adminRes.data) types.push('admin');
  return types;
}

export function formatWrongPortalLoginMessage(
  registeredAs: AccountType,
  attemptingAs: AccountType
): string {
  const registeredLabel = getAccountTypeLabel(registeredAs);
  const attemptingLabel = getAccountTypeLabel(attemptingAs);

  if (registeredAs === attemptingAs) {
    return `No ${registeredLabel} account found with this email.`;
  }

  return `This email is registered as a ${registeredLabel} account, not a ${attemptingLabel} account. Please use the correct sign-in page for your account type.`;
}

export function formatRegistrationConflictMessage(
  existingType: AccountType,
  registeringAs: AccountType
): string {
  const existingLabel = getAccountTypeLabel(existingType);
  const registeringLabel = getAccountTypeLabel(registeringAs);

  if (existingType === registeringAs) {
    return `This email is already registered as a ${existingLabel} account. Please sign in instead.`;
  }

  return `This email is already registered as a ${existingLabel} account. You cannot create a ${registeringLabel} account with the same email. Please sign in with your existing account or use a different email.`;
}

export async function getRegistrationConflict(
  supabase: SupabaseServerClient,
  email: string,
  registeringAs: AccountType
): Promise<AccountType | null> {
  const types = await lookupEmailAccountTypes(supabase, email);
  if (!types.length) return null;
  return types.find((type) => type === registeringAs) ?? types[0];
}

export function getAlternateAccountType(
  types: AccountType[],
  currentPortal: AccountType
): AccountType | null {
  return types.find((type) => type !== currentPortal) ?? null;
}
