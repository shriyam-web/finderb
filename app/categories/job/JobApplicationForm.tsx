'use client';

import { useState } from 'react';
import { submitJobApplicationForm } from '@/app/actions/job';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Job {
  id: string;
  business_id: string;
  title: string;
}

export default function JobApplicationForm({
  job,
  onSuccess,
}: {
  job: Job;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('jobId', job.id);
    formData.set('businessId', job.business_id);
    formData.set('jobTitle', job.title);
    const result = await submitJobApplicationForm(formData);

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
      <div className="py-8 text-center">
        <CheckCircle2 size={40} className="mx-auto text-neutral-700" />
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">Application sent</h3>
        <p className="mt-2 text-sm text-neutral-600">
          The employer for {job.title} will reach out if you&apos;re shortlisted.
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">Full name</label>
        <input required name="fullName" type="text" placeholder="Your name" className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Email</label>
          <input
            required
            name="email"
            type="email"
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Phone</label>
          <input
            required
            name="phone"
            type="tel"
            placeholder="10-digit mobile"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          CV <span className="font-normal text-neutral-400">(PDF, DOC, or DOCX)</span>
        </label>
        <input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Message <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="Brief intro or relevant experience"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending…
          </>
        ) : (
          'Submit application'
        )}
      </button>
    </form>
  );
}
