import 'server-only';

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
