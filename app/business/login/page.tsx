'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Briefcase, ChevronRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { loginBusiness } from '@/app/actions/business';
import { useRouter } from 'next/navigation';

export default function BusinessLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with email:', email);
      const result = await loginBusiness(email, password);

      if (result.success) {
        console.log('Login successful, redirecting to dashboard...');
        router.push('/business/dashboard');
      } else {
        console.warn('Login failed:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/40 via-transparent to-transparent -z-10" />

      <div className="w-full max-w-sm">

        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 md:p-10">
          <div className="mb-10">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo1.png"
                alt="FinderB"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-sm font-medium">Business Partner Portal</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100/50 text-red-600 text-xs font-semibold rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Work Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none font-medium transition-all placeholder:text-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Link href="#" className="text-[11px] font-bold text-blue-600 hover:text-blue-700">Forgot?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none font-medium transition-all placeholder:text-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-400 text-xs font-medium mb-4">
              New to FinderB?
            </p>
            <Link
              href="/business/register"
              className="inline-flex items-center gap-2 text-slate-900 font-bold text-sm hover:text-blue-600 transition-colors"
            >
              Create Business Account
              <ArrowLeft size={14} className="rotate-180" />
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-slate-400 text-[11px] font-medium tracking-wide">
          &copy; {new Date().getFullYear()} FINDERB INDIA &bull; PARTNER PORTAL
        </p>
      </div>
    </div>
  );

}
