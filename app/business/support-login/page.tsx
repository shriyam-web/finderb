import { redirect } from 'next/navigation';
import {
  redeemSupportLoginCode,
  redeemSupportLoginToken,
} from '@/lib/auth/supportLogin.server';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ token?: string | string[]; code?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
}

export default async function BusinessSupportLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const code = firstParam(params.code);
  const token = firstParam(params.token);

  if (!code && !token) {
    redirect('/business/login?error=support_token_missing');
  }

  const result = code
    ? await redeemSupportLoginCode(code)
    : await redeemSupportLoginToken(token);

  if (!result.success) {
    redirect(
      `/business/login?error=${encodeURIComponent(result.error || 'support_login_failed')}`,
    );
  }

  redirect('/business/dashboard?support=1');
}
