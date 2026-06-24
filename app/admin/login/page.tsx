'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { loginAdmin } from '@/app/actions/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await loginAdmin(email, password);
    if (result.success) {
      router.push('/admin/payments');
      return;
    }

    setError(result.error || 'Login failed');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-[#153551] to-[#215481] px-6 py-8 text-white">
          <Image src="/businesslogo.png" alt="FinderB" width={120} height={36} className="h-7 w-auto brightness-0 invert" />
          <h1 className="mt-6 text-2xl font-bold">Admin sign in</h1>
          <p className="mt-2 text-sm text-white/80">Manage merchant recharges and payment records.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
              <Mail size={14} />
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none ring-[#215481]/20 focus:border-[#215481] focus:ring-2"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
              <Lock size={14} />
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 pr-10 text-sm outline-none ring-[#215481]/20 focus:border-[#215481] focus:ring-2"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#153551] py-2.5 text-sm font-semibold text-white hover:bg-[#215481] disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-zinc-500">
            <Link href="/" className="text-[#215481] hover:underline">
              Back to FinderB
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
