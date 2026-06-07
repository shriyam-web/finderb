'use client';

import { useState } from 'react';
import { submitJobApplication } from '@/app/actions/job';
import { Send, User, Mail, Phone, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';

interface Job {
  id: string;
  business_id: string;
  title: string;
}

export default function JobApplicationForm({ job, onSuccess }: { job: Job; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      jobId: job.id,
      businessId: job.business_id,
      jobTitle: job.title,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
    };

    const result = await submitJobApplication(data);

    if (result.success) {
      setSuccess(true);
      onSuccess();
    } else {
      setError(result.error || 'Something went wrong');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Application Sent!</h3>
        <p className="text-slate-500 font-medium">Your application for {job.title} has been submitted successfully. The employer will contact you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              required
              name="fullName"
              type="text"
              placeholder="John Doe"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                name="email"
                type="email"
                placeholder="john@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                name="phone"
                type="tel"
                placeholder="+91 00000 00000"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Short Message / Experience</label>
          <div className="relative">
            <MessageSquare size={18} className="absolute left-4 top-4 text-slate-400" />
            <textarea
              name="message"
              rows={4}
              placeholder="Tell the employer why you're a good fit..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Submit Application
              <Send size={20} />
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-4 font-bold uppercase tracking-wider">
          By applying, you agree to our terms and safety guidelines.
        </p>
      </div>
    </form>
  );
}
