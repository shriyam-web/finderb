'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { loginUser } from '@/app/actions/user';
import { getSafeRedirectPath } from '@/lib/authRedirect';
import { useRouter, useSearchParams } from 'next/navigation';

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

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccess('Account created. Sign in to continue.');
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
        const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
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

  return (
    <div className="relative min-h-[calc(100dvh-5rem)] bg-[#f4f7fb] px-4 pb-8 pt-[5.25rem] sm:px-6 sm:pt-28 lg:min-h-[calc(100dvh-4rem)] lg:py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(33,84,129,0.08) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(249,184,100,0.12) 0%, transparent 40%)',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_64px_-32px_rgba(15,39,59,0.28)] lg:min-h-[560px] lg:flex-row">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden bg-[#153551] lg:flex lg:w-[42%] lg:flex-col lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            aria-hidden
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="pointer-events-none absolute -right-8 bottom-0 h-[72%] w-[88%] opacity-90 relative">
            <Image
              src="/hero-new.png"
              alt=""
              fill
              className="object-contain object-right-bottom"
              sizes="420px"
              priority
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#153551] via-[#153551]/40 to-transparent" />

          <div className="relative z-10 p-10 xl:p-12">
            <Link href="/" className="inline-block">
              <Image
                src="/logo1.png"
                alt="FinderB"
                width={132}
                height={44}
                className="h-9 w-auto brightness-0 invert"
                priority
              />
            </Link>
            <div className="mt-14 max-w-xs">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f9b864]">
                Your city, mapped
              </p>
              <h1 className="mt-3 text-[1.75rem] font-semibold leading-snug tracking-tight text-white xl:text-[2rem]">
                Pick up where you left off
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Saved searches, reviews, and your dashboard — all in one place across 300+ cities in India.
              </p>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 px-10 py-8 xl:px-12">
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '300+', label: 'Cities' },
                { value: '2M+', label: 'Listings' },
                { value: '4.8', label: 'Avg rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-white">{stat.value}</p>
                  <p className="text-[11px] text-white/55">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <div className="flex flex-1 flex-col justify-start px-6 pb-8 pt-10 sm:px-10 lg:justify-center lg:px-12 lg:py-10 xl:px-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#0f273b]">Sign in</h2>
              <p className="mt-1.5 text-sm text-[#64748b]">
                Access your saved places, reviews, and dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/80 px-3.5 py-3 text-sm text-red-700">
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
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3.5 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-[#334155]">
                  Email
                </label>
                <div className="group relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#215481]"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-[#334155]">
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-medium text-[#215481] transition-colors hover:text-[#1a4367]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="group relative">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#215481]"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-[#0f172a] outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#94a3b8] transition-colors hover:text-[#215481]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#215481] py-3 text-sm font-semibold text-white transition-all hover:bg-[#1a4367] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Continue'}
                {!loading && (
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </form>

            <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
              <p className="text-center text-sm text-[#64748b]">
                New here?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-[#215481] transition-colors hover:text-[#1a4367]"
                >
                  Create an account
                </Link>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#94a3b8]">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Secure sign-in
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  India-wide listings
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={12} />
                  Free to use
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#f4f7fb] pt-[5.25rem] sm:pt-28 lg:pt-0">
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
