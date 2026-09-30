'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSafeRedirectPath } from '@/lib/authRedirect';
import { useSearchParams } from 'next/navigation';
import UserAuthShell, { UserAuthTrustRow } from '@/components/auth/UserAuthShell';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import AuthRedirectScreen from '@/components/auth/AuthRedirectScreen';
import { useAlreadyLoggedInRedirect } from '@/hooks/useAlreadyLoggedInRedirect';

function LoginContent() {
  const [socialError, setSocialError] = useState('');
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
  const authRedirect = useAlreadyLoggedInRedirect({
    kind: 'user',
    redirectTo,
  });
  const oauthError = searchParams.get('error');
  const queryError = oauthError
    ? decodeURIComponent(oauthError.replace(/\+/g, ' '))
    : '';
  const error = socialError || queryError;
  const suggestedLoginPath = searchParams.get('suggested') || '';
  const success =
    searchParams.get('welcome') === '1'
      ? 'Welcome to FinderB! Your account is ready.'
      : searchParams.get('signup') === 'success'
        ? 'Account created. Sign in to continue.'
        : '';

  if (authRedirect.status === 'checking') {
    return <LoginFallback />;
  }

  if (authRedirect.status === 'redirecting') {
    return <AuthRedirectScreen message={authRedirect.message} />;
  }

  return (
    <UserAuthShell
      mode="login"
      footer={
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">
            New here?{' '}
            <Link
              href={redirectTo !== '/dashboard' ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup'}
              className="font-semibold text-[#215481] transition-colors hover:text-[#1a4367]"
            >
              Create an account
            </Link>
          </p>
          <p className="text-center text-sm text-slate-500">
            Own a business?{' '}
            <Link
              href="/business/login"
              className="font-semibold text-[#215481] transition-colors hover:text-[#1a4367]"
            >
              Partner sign in
            </Link>
          </p>
          <UserAuthTrustRow />
        </div>
      }
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f273b]">Sign in</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Continue with Google, Truecaller, or WhatsApp.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/90 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            {suggestedLoginPath && (
              <Link
                href={suggestedLoginPath}
                className="mt-2 inline-flex font-semibold text-[#2563eb] underline-offset-2 hover:underline"
              >
                Go to the correct sign-in page
              </Link>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3.5 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <SocialAuthButtons mode="login" redirectPath={redirectTo} onError={setSocialError} />

      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
        WhatsApp sign-in is coming soon. By continuing, you agree to FinderB&apos;s{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-slate-600">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600">
          Privacy Policy
        </Link>
        .
      </p>
    </UserAuthShell>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem-6.75rem)] items-center justify-center bg-[#eef3f9] pt-24 lg:min-h-[calc(100dvh-5rem)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
