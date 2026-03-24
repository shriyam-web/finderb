import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Briefcase } from 'lucide-react';

export default function BusinessLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-accent px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Briefcase size={20} className="text-white" />
              </div>
              <span className="text-2xl font-black text-primary">Boomb <span className="text-blue-600">Business</span></span>
            </Link>
            <h2 className="text-3xl font-black text-gray-900">Partner Login</h2>
            <p className="text-gray-500 mt-2 font-medium">Manage your listings and leads</p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="email" 
                  placeholder="name@business.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
              Login to Dashboard
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 font-medium">
            New to Boomb? {' '}
            <Link href="/business/register" className="text-blue-600 font-black hover:text-blue-700">Register Business</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
