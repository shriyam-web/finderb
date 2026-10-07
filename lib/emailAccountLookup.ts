import type { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export type AccountType = 'user' | 'merchant' | 'admin';

type SupabaseServerClient = ReturnType<typeof createClient>;

/**
 * Row-level security hides pending and unapproved businesses from the public key,
 * so "already registered?" lookups need the service client to see every account.
 */
function lookupClient(fallback: SupabaseServerClient): SupabaseServerClient {
  return (createServiceClient() as unknown as SupabaseServerClient | null) ?? fallback;
}

const ACCOUNT_LABELS: Record<AccountType, string> = {
  user: 'User',
  merchant: 'Merchant',
  admin: 'Admin',
};

export const LOGIN_PATHS: Record<AccountType, string> = {
  user: '/login',
  merchant: '/business/login',
  // Admin accounts are managed in the separate FinderB Admin app.
  admin: '',
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

  const db = lookupClient(supabase);
  const emailPattern = normalizedEmail.replace(/[%_\\]/g, '\\$&');
  const [userRes, businessEmailRes, businessWorkRes, adminRes] = await Promise.all([
    db.from('User').select('id').ilike('email', emailPattern).limit(1),
    db.from('Business').select('id').ilike('email', emailPattern).limit(1),
    db.from('Business').select('id').ilike('workEmail', emailPattern).limit(1),
    db.from('admins').select('id').eq('email', normalizedEmail).maybeSingle(),
  ]);

  const types: AccountType[] = [];
  if (userRes.data?.length) types.push('user');
  if (businessEmailRes.data?.length || businessWorkRes.data?.length) types.push('merchant');
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
  const types = (await lookupEmailAccountTypes(supabase, email)).filter(
    // A FinderB user may reuse their own email for a business once they verify it.
    (type) => !(registeringAs === 'merchant' && type === 'user')
  );
  if (!types.length) return null;
  return types.find((type) => type === registeringAs) ?? types[0];
}

export const BUSINESS_MOBILE_TAKEN_MESSAGE =
  'This mobile number is already registered with FinderB Business. Log in instead, or use another number.';

/**
 * Mobile is a login identifier for both merchants and users, so one number belongs to one account.
 * Matches the last 10 digits in the business mobile columns and the user phone column,
 * so `+91…`, `91…` and `0…` forms count. Throws if a lookup fails.
 */
export async function lookupMobileAccountTypes(
  supabase: SupabaseServerClient,
  mobile: string
): Promise<Array<'merchant' | 'user'>> {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return [];
  const db = lookupClient(supabase);
  const pattern = `%${digits}`;
  const [mobileRes, ownerRes, userRes] = await Promise.all([
    db.from('Business').select('id').ilike('mobile', pattern).limit(1),
    db.from('Business').select('id').ilike('owner_mobile', pattern).limit(1),
    db.from('User').select('id').ilike('phone', pattern).limit(1),
  ]);
  const failed = mobileRes.error ?? ownerRes.error ?? userRes.error;
  if (failed) throw failed;
  const types: Array<'merchant' | 'user'> = [];
  if (mobileRes.data?.length || ownerRes.data?.length) types.push('merchant');
  if (userRes.data?.length) types.push('user');
  return types;
}

/**
 * Null when the number can be used for a business; otherwise the message to show the merchant.
 * A number on a FinderB user account is allowed once the owner verifies it.
 */
export async function businessMobileConflictMessage(
  supabase: SupabaseServerClient,
  mobile: string
): Promise<string | null> {
  const types = await lookupMobileAccountTypes(supabase, mobile);
  return types.includes('merchant') ? BUSINESS_MOBILE_TAKEN_MESSAGE : null;
}

export function getAlternateAccountType(
  types: AccountType[],
  currentPortal: AccountType
): AccountType | null {
  return types.find((type) => type !== currentPortal) ?? null;
}
