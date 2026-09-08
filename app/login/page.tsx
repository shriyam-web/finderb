'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { loginUser } from '@/app/actions/user';
import { getSafeRedirectPath } from '@/lib/authRedirect';
import { useRouter, useSearchParams } from 'next/navigation';
import UserAuthShell, { UserAuthDivider, UserAuthTrustRow } from '@/components/auth/UserAuthShell';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import AuthRedirectScreen from '@/components/auth/AuthRedirectScreen';
import { useAlreadyLoggedInRedirect } from '@/hooks/useAlreadyLoggedInRedirect';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedLoginPath, setSuggestedLoginPath] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
  const authRedirect = useAlreadyLoggedInRedirect({
    kind: 'user',
    redirectTo,
  });

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccess('Account created. Sign in to continue.');
    }
    if (searchParams.get('welcome') === '1') {
      setSuccess('Welcome to FinderB! Your account is ready.');
    }
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
    }
    const suggested = searchParams.get('suggested');
    if (suggested) {
      setSuggestedLoginPath(suggested);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestedLoginPath('');
    setSuccess('');

    try {
      const result = await loginUser(email, password);
      if (result.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finderb-session-change', { detail: { type: 'user' } }));
        }
        router.push(redirectTo);
      } else {
        setError(result.error || 'Login failed');
        setSuggestedLoginPath(result.suggestedLoginPath || '');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
          <UserAuthTrustRow />
        </div>
      }
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f273b]">Sign in</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          The fastest way in — use Truecaller, Google, or your email.
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

      <SocialAuthButtons mode="login" redirectPath={redirectTo} onError={setError} />

      <UserAuthDivider />

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="group relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#215481]"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#215481] transition-colors hover:text-[#1a4367]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="group relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#215481]"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={128}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-[#215481]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#215481] to-[#1a4367] py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(33,84,129,0.9)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in with email'}
          {!loading && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </form>
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
