'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FaGoogle, FaGithub } from 'react-icons/fa6';
import { loginUser } from '@/app/actions/user';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('signup') === 'success') {
      setSuccess('Account created successfully! Please sign in.');
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
    setSuccess('');

    try {
      const result = await loginUser(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30 px-4 pt-44 pb-24 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-50 rounded-full blur-[100px] opacity-70 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-[48px] shadow-2xl shadow-blue-100/50 overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <Link href="/" className="inline-flex items-center mb-8 group">
                <Image 
                  src="/logo1.png" 
                  alt="FinderB" 
                  width={150} 
                  height={50} 
                  className="h-11 w-auto object-contain transition-transform duration-500 group-hover:scale-105" 
                  priority 
                />
              </Link>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
              <p className="text-gray-500 mt-2 font-medium">Please enter your details to sign in</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold">
                <CheckCircle2 size={20} />
                {success}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-4 py-4.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Password</label>
                  <Link href="#" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-4 py-4.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none font-semibold text-gray-900 transition-all placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? 'Signing In...' : 'Sign In'}
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="relative my-12 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative px-6 bg-white text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-700 text-xs shadow-sm">
                <FaGoogle size={18} className="text-red-500" />
                Google
              </button>
              <button className="flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-700 text-xs shadow-sm">
                <FaGithub size={18} />
                Github
              </button>
            </div>

            <p className="mt-12 text-center text-gray-500 font-medium text-sm">
              Don't have an account? {' '}
              <Link href="/signup" className="text-blue-600 font-black hover:underline underline-offset-4">Create Account</Link>
            </p>
          </div>
        </div>
        
        <p className="mt-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} FinderB Local Search. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
