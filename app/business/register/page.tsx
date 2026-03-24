'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Briefcase, MapPin, Phone, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { categories } from '@/lib/mockData';

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-accent py-12 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-400 border border-gray-200'}`}>
                  {step > i + 1 ? <CheckCircle2 size={20} /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {['Account', 'Business', 'Contact', 'Review'][i]}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 min-h-[500px] flex flex-col">
          <div className="p-8 md:p-12 flex-grow">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-500 mb-8 font-medium">Let's start with your account details</p>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Work Email</label>
                      <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="john@business.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                    <input type="password" className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="••••••••" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Business Details</h2>
                <p className="text-gray-500 mb-8 font-medium">Tell us about your business</p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Business Name</label>
                    <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Acme Services Ltd" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                      <select className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium appearance-none">
                        <option>Select Category</option>
                        {categories.map(c => <option key={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Location</label>
                      <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Mumbai, Maharashtra" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Contact Info</h2>
                <p className="text-gray-500 mb-8 font-medium">How should customers reach you?</p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                    <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Business Address</label>
                    <textarea className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" rows={3} placeholder="Full address of your business"></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Ready to Submit</h2>
                <p className="text-gray-500 mb-8 font-medium max-w-md mx-auto">Please review your information. By clicking submit, you agree to Boomb's Business Terms & Conditions.</p>
                <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-3 mb-8">
                  <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Business:</span> <span className="font-bold">Acme Services Ltd</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Category:</span> <span className="font-bold">Plumbers</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-bold text-sm">Location:</span> <span className="font-bold">Mumbai</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <button 
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}`}
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <button 
              onClick={step === totalSteps ? undefined : nextStep}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              {step === totalSteps ? 'Complete Registration' : 'Next Step'}
              {step !== totalSteps && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
