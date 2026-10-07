'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserAuthShell, { UserAuthTrustRow } from '@/components/auth/UserAuthShell';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forBusiness = searchParams.get('for') === 'business';
  const signInPath = forBusiness ? '/business/login' : '/login';
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [oauthHint, setOauthHint] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setOauthHint('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        next?: string;
        provider?: string;
      };

      if (!data.success) {
        setError(data.error || 'Could not start a password reset.');
        return;
      }

      if (data.next === 'oauth') {
        setOauthHint(data.message || 'Sign in with your social account instead.');
        return;
      }

      if (data.next === 'code') {
        router.push(
          `/reset-password?email=${encodeURIComponent(email.trim())}${forBusiness ? '&for=business' : ''}`,
        );
        return;
      }

      setMessage(data.message || 'If an account exists for this email, we sent a reset code.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserAuthShell
      mode="login"
      footer={
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">
            Remembered it?{' '}
            <Link href={signInPath} className="font-semibold text-[#215481] hover:text-[#1a4367]">
              Sign in
            </Link>
          </p>
          <UserAuthTrustRow />
        </div>
      }
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f273b]">Forgot password</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter the email on your FinderB account. We’ll send a 6-digit code if you signed up with a password.
        </p>
      </div>

      {error ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/90 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {oauthHint ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/90 px-3.5 py-3 text-sm text-amber-900">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p>{oauthHint}</p>
            <Link href={signInPath} className="mt-2 inline-flex font-semibold text-[#215481] underline-offset-2 hover:underline">
              Go to sign in
            </Link>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3.5 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="group relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#215481]"
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

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#215481] to-[#1a4367] py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(33,84,129,0.9)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset code'}
          {!loading ? <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /> : null}
        </button>
      </form>
    </UserAuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#eef3f9] pt-24">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
