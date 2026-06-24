'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { registerUser } from '@/app/actions/user';
import { getSafeRedirectPath } from '@/lib/authRedirect';
import { useRouter, useSearchParams } from 'next/navigation';
import UserAuthShell, { UserAuthDivider, UserAuthTrustRow } from '@/components/auth/UserAuthShell';
import OAuthButtonGroup from '@/components/auth/OAuthButtonGroup';

function SignupContent() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedLoginPath, setSuggestedLoginPath] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestedLoginPath('');

    try {
      const result = await registerUser({ fullName, email, password });
      if (result.success) {
        router.push(redirectTo);
      } else {
        setError(result.error || 'Registration failed');
        setSuggestedLoginPath(result.suggestedLoginPath || '');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserAuthShell
      mode="signup"
      footer={
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href={redirectTo !== '/dashboard' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}
              className="font-semibold text-[#215481] transition-colors hover:text-[#1a4367]"
            >
              Sign in
            </Link>
          </p>
          <UserAuthTrustRow />
        </div>
      }
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f273b]">Create account</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Join in seconds with Google — or use your email below.
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
                Sign in with your existing account
              </Link>
            )}
          </div>
        </div>
      )}

      <OAuthButtonGroup mode="signup" redirectPath={redirectTo} onError={setError} />

      <UserAuthDivider label="or sign up with email" />

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Full name
          </label>
          <div className="group relative">
            <User
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#215481]"
            />
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              required
            />
          </div>
        </div>

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
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="group relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#215481]"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          {loading ? 'Creating account…' : 'Create account with email'}
          {!loading && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
        By continuing, you agree to FinderB&apos;s{' '}
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

function SignupFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#eef3f9] pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupContent />
    </Suspense>
  );
}
