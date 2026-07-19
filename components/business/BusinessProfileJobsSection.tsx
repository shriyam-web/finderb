'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Briefcase, MapPin, X } from 'lucide-react';
import JobApplicationForm from '@/app/categories/job/JobApplicationForm';

export type ProfileJob = {
  id: string;
  business_id: string;
  title: string;
  type: string;
  location: string;
  salary: string | null;
  description: string;
  department: string | null;
  created_at: string;
};

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function salaryLabel(salary: string) {
  return salary.replace(/^₹\s*/, '').trim();
}

export default function BusinessProfileJobsSection({ jobs }: { jobs: ProfileJob[] }) {
  const [selectedJob, setSelectedJob] = useState<ProfileJob | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false);
        setSelectedJob(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFormOpen]);

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedJob(null);
  };

  if (jobs.length === 0) return null;

  const applicationModal =
    isFormOpen && selectedJob && portalMounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[10100] flex items-end justify-center bg-black/50 p-0 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4 sm:pb-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-job-apply-title"
            onClick={closeForm}
          >
            <div
              className="flex max-h-[min(88vh,720px)] w-full flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white sm:max-w-lg sm:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative shrink-0 overflow-hidden border-b border-stone-200 px-4 py-3.5 sm:px-5 sm:py-4">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                  style={{
                    background:
                      'linear-gradient(90deg, #153551 0%, #215481 42%, #f9b864 78%, #153551 100%)',
                  }}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#215481]/70">
                      Application
                    </p>
                    <h3
                      id="profile-job-apply-title"
                      className="mt-1 text-base font-bold leading-snug text-[#153551] sm:text-lg"
                    >
                      {selectedJob.title}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      {[selectedJob.department, selectedJob.type, selectedJob.location]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    aria-label="Close application form"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <JobApplicationForm
                  job={selectedJob}
                  onSuccess={() => {
                    window.setTimeout(closeForm, 1800);
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <section id="jobs" className="scroll-mt-40 border-t border-stone-200/60 pt-5 lg:border-t-0 lg:pt-0">
        <div className="profile-careers-board overflow-hidden rounded-[1.35rem] border border-[#153551]/10 bg-[#fbfaf7]">
          <div className="relative border-b border-[#153551]/8 px-4 py-4 sm:px-5">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
              style={{
                background:
                  'linear-gradient(90deg, #153551 0%, #215481 42%, #f9b864 78%, #153551 100%)',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-[#f9b864]/15 blur-2xl"
              aria-hidden
            />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#153551] text-white">
                  <Briefcase size={16} strokeWidth={2.25} aria-hidden />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#fbfaf7] bg-emerald-400" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#215481]/75">
                    Careers
                  </p>
                  <h2 className="text-lg font-bold tracking-tight text-[#153551]">
                    Open positions
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Live
                </p>
                <p className="text-sm font-bold tabular-nums text-[#153551]">
                  {String(jobs.length).padStart(2, '0')}{' '}
                  <span className="font-medium text-stone-500">
                    {jobs.length === 1 ? 'role' : 'roles'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-3 p-3 sm:p-4">
            {jobs.map((job, index) => (
              <li key={job.id}>
                <article className="profile-job-pass group relative overflow-hidden rounded-2xl border border-[#153551]/10 bg-white">
                  <div className="profile-job-pass__shine pointer-events-none absolute inset-0" aria-hidden />

                  <div className="relative flex">
                    <div className="profile-job-pass__rail relative flex w-11 shrink-0 flex-col items-center justify-between border-r border-dashed border-[#153551]/15 bg-gradient-to-b from-[#153551] to-[#215481] py-3 text-white sm:w-12">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                        Role
                      </span>
                      <span
                        className="select-none text-[11px] font-black uppercase tracking-[0.35em] text-white/90"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        Hiring
                      </span>
                      <span className="text-sm font-black tabular-nums text-[#f9b864]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 p-3.5 sm:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {job.department ? (
                            <p className="mb-1 text-[11px] font-medium text-stone-500">
                              {job.department}
                            </p>
                          ) : null}
                          <h3 className="text-[1.05rem] font-extrabold leading-snug tracking-tight text-[#153551] sm:text-[1.15rem]">
                            {job.title}
                          </h3>
                        </div>

                        <span
                          className="shrink-0 text-[11px] font-medium text-stone-400"
                          suppressHydrationWarning
                        >
                          {timeAgo(job.created_at)}
                        </span>
                      </div>

                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-[#215481]" aria-hidden />
                          {job.location}
                        </span>
                        <span className="text-stone-300" aria-hidden>
                          ·
                        </span>
                        <span>
                          {job.salary ? `₹${salaryLabel(job.salary)}` : 'Pay on discussion'}
                        </span>
                        <span className="text-stone-300" aria-hidden>
                          ·
                        </span>
                        <span>{job.type}</span>
                      </p>

                      {job.description ? (
                        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-stone-600">
                          {job.description}
                        </p>
                      ) : null}

                      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-dashed border-stone-200/90 pt-3">
                        <div
                          className="profile-job-pass__barcode hidden h-7 flex-1 max-w-[7.5rem] opacity-40 sm:block"
                          aria-hidden
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJob(job);
                            setIsFormOpen(true);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#153551] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#215481] active:scale-[0.99] sm:flex-none"
                        >
                          Apply now
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#f9b864] text-[#153551] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <ArrowUpRight size={14} strokeWidth={2.75} aria-hidden />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {applicationModal}
    </>
  );
}
