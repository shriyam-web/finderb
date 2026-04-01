'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Briefcase, ChevronRight, ArrowLeft } from 'lucide-react';

export default function BusinessLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-accent px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-50 translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full relative z-10">
        <Link href="/business/register" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Registration
        </Link>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50/50">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                <Image 
                  src="/logo-n.png" 
                  alt="Boomb Logo" 
                  width={150} 
                  height={50} 
                  className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">Business</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900">Partner Login</h2>
              <p className="text-gray-500 mt-2 font-medium">Manage your listings and leads</p>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-widest">Work Email</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="name@business.com"
                    className="w-full pl-14 pr-4 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Password</label>
                  <Link href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot Password?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-14 pr-4 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-medium transition-all"
                  />
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                Login to Dashboard
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-12 text-center pt-8 border-t border-gray-50">
              <p className="text-gray-500 font-medium mb-4">
                Not listed on Boomb yet?
              </p>
              <Link href="/business/register" className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 font-black px-8 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                List Business for FREE
              </Link>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-gray-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} Boomb Local Search. All rights reserved.
        </p>
      </div>
    </div>
  );
}
