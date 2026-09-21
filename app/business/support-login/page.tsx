import { redirect } from 'next/navigation';
import { redeemSupportLoginToken } from '@/lib/auth/supportLogin.server';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function BusinessSupportLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = String(params.token || '').trim();

  if (!token) {
    redirect('/business/login?error=support_token_missing');
  }

  const result = await redeemSupportLoginToken(token);
  if (!result.success) {
    redirect(
      `/business/login?error=${encodeURIComponent(result.error || 'support_login_failed')}`,
    );
  }

  redirect('/business/dashboard?support=1');
}
