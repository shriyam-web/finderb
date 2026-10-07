'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import UserAuthShell, { UserAuthTrustRow } from '@/components/auth/UserAuthShell';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forBusiness = searchParams.get('for') === 'business';
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!data.success) {
        setError(data.error || 'Could not reset your password.');
        return;
      }
      setSuccess('Password updated. You can sign in now.');
      setTimeout(() => router.push(forBusiness ? '/business/login' : '/login'), 900);
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
            Need a new code?{' '}
            <Link href={forBusiness ? '/forgot-password?for=business' : '/forgot-password'} className="font-semibold text-[#215481] hover:text-[#1a4367]">
              Request again
            </Link>
          </p>
          <UserAuthTrustRow />
        </div>
      }
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold tracking-tight text-[#0f273b]">Reset password</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter the 6-digit code from your email and choose a new password.
        </p>
      </div>

      {error ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/90 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3.5 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{success}</span>
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
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">6-digit code</p>
          <OtpCodeBoxes value={code} onChange={setCode} tone="neutral" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            New password
          </label>
          <div className="group relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <div className="group relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              required
              minLength={8}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#215481] to-[#1a4367] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Update password'}
          {!loading ? <ArrowRight size={16} /> : null}
        </button>
      </form>
    </UserAuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#eef3f9] pt-24">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
