import 'server-only';

import { escapeIlikePattern } from '@/lib/searchMatch';
import { createServiceClient } from '@/lib/supabase/service';

export async function deleteUserAccountById(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const id = userId.trim();
  if (!id) {
    return { success: false, error: 'Account not found.' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: 'Account deletion is not configured on the server.' };
  }

  const { data: user, error: loadError } = await supabase
    .from('User')
    .select('id, supabaseAuthId')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    console.error('[account-delete] load', loadError);
    return { success: false, error: 'Could not load your account.' };
  }
  if (!user) {
    return { success: false, error: 'Account not found.' };
  }

  await supabase.from('user_push_tokens').delete().eq('user_id', id);

  const authId = typeof user.supabaseAuthId === 'string' ? user.supabaseAuthId.trim() : '';
  if (authId) {
    const { error: authError } = await supabase.auth.admin.deleteUser(authId);
    if (authError) {
      console.warn('[account-delete] supabase auth', authError.message);
    }
  }

  const { error: deleteError } = await supabase.from('User').delete().eq('id', id);
  if (deleteError) {
    console.error('[account-delete] delete', deleteError);
    return { success: false, error: 'Could not delete your account. Please email support@finderb.com.' };
  }

  return { success: true };
}

/**
 * One email or mobile belongs to one account type. When a business is registered with a
 * FinderB user's email or mobile, that user account becomes the business and is removed.
 * Returns the ids of the removed user accounts.
 */
export async function removeUserAccountsMovedToBusiness(email: string, mobile: string): Promise<string[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const normalizedEmail = email.trim().toLowerCase();
  const digits = mobile.replace(/\D/g, '').slice(-10);
  const [byEmail, byPhone] = await Promise.all([
    normalizedEmail
      ? supabase.from('User').select('id').ilike('email', escapeIlikePattern(normalizedEmail))
      : Promise.resolve({ data: [], error: null }),
    digits.length === 10
      ? supabase.from('User').select('id').ilike('phone', `%${digits}`)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (byEmail.error || byPhone.error) {
    console.error('[account-delete] moved-to-business lookup', byEmail.error ?? byPhone.error);
    return [];
  }

  const ids = [...new Set([...(byEmail.data ?? []), ...(byPhone.data ?? [])].map((row) => String(row.id)))];
  const removed: string[] = [];
  for (const id of ids) {
    const result = await deleteUserAccountById(id);
    if (result.success) removed.push(id);
    else console.error('[account-delete] moved-to-business', id, result.error);
  }
  return removed;
}
