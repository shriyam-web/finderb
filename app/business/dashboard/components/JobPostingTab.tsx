'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSignal,
} from 'react-icons/hi2';
import { createJob, getJobsByBusiness, deleteJob, updateJob } from '@/app/actions/job';
import { getHrContact, updateHrContact } from '@/app/actions/jobBoard';
import { parseSalaryRange, salaryFromInputs, type SalaryPeriod } from '@/lib/jobSalary';
import { dashboard } from './dashboard-ui';
import JobApplicationsPanel from './JobApplicationsPanel';

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string | null;
  description: string;
  department: string | null;
  status: string;
  created_at: Date;
}

interface JobPostingTabProps {
  businessId: string;
  canEdit?: boolean;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const MAX_ACTIVE_JOBS = 3;

function formatDate(date: Date) {
  const d = new Date(date);
  const diffDays = Math.floor(Math.abs(Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  if (diffDays < 7) return `Posted ${diffDays}d ago`;
  return `Posted ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export default function JobPostingTab({ businessId, canEdit = true }: JobPostingTabProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salaryMin: '',
    salaryMax: '',
    salaryPeriod: 'month' as SalaryPeriod,
    description: '',
    department: '',
  });
  const [hr, setHr] = useState({ email: '', mobile: '' });
  const [applicationsFor, setApplicationsFor] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJobsByBusiness(businessId);
      if (res.success && res.jobs) {
        setJobs(res.jobs as Job[]);
      }
    } catch {
      showToast('error', 'Could not load job posts');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchJobs();
    void getHrContact(businessId).then((result) => {
      if (result.success) setHr(result.hr);
    });
  }, [fetchJobs, businessId]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;
  const pausedCount = jobs.length - activeJobsCount;
  const isLimitReached = activeJobsCount >= MAX_ACTIVE_JOBS;
  const slotPercent = Math.round((activeJobsCount / MAX_ACTIVE_JOBS) * 100);

  const handleOpenModal = (job: Job | null = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        type: job.type,
        location: job.location,
        salaryMin: parseSalaryRange(job.salary).min,
        salaryMax: parseSalaryRange(job.salary).max,
        salaryPeriod: parseSalaryRange(job.salary).period,
        description: job.description,
        department: job.department || '',
      });
      setIsModalOpen(true);
      return;
    }

    if (isLimitReached) {
      showToast('error', `You can have up to ${MAX_ACTIVE_JOBS} active jobs. Pause or delete one first.`);
      return;
    }

    setEditingJob(null);
    setFormData({
      title: '',
      type: 'Full-time',
      location: '',
      salaryMin: '',
      salaryMax: '',
      salaryPeriod: 'month',
      description: '',
      department: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const salary = salaryFromInputs(formData.salaryMin, formData.salaryMax, formData.salaryPeriod);
      const payload = {
        title: formData.title,
        type: formData.type,
        location: formData.location,
        salary,
        description: formData.description,
        department: formData.department,
      };
      const res = editingJob
        ? await updateJob(editingJob.id, payload)
        : await createJob({ ...payload, businessId });

      if (res.success) {
        showToast('success', editingJob ? 'Job updated' : 'Job posted');
        setIsModalOpen(false);
        fetchJobs();
      } else {
        showToast('error', res.error || 'Something went wrong');
      }
    } catch {
      showToast('error', 'Unexpected error — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Delete this job post? This cannot be undone.')) return;

    try {
      const res = await deleteJob(id);
      if (res.success) {
        showToast('success', 'Job deleted');
        fetchJobs();
      } else {
        showToast('error', res.error || 'Could not delete');
      }
    } catch {
      showToast('error', 'Unexpected error');
    }
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'inactive' : 'active';

    if (newStatus === 'active' && isLimitReached) {
      showToast('error', `Maximum ${MAX_ACTIVE_JOBS} active jobs reached`);
      return;
    }

    try {
      const res = await updateJob(job.id, { status: newStatus });
      if (res.success) {
        showToast('success', newStatus === 'active' ? 'Job is live on FinderB' : 'Job paused');
        fetchJobs();
      }
    } catch {
      showToast('error', 'Could not update status');
    }
  };

      return (
    <div className="space-y-5">
      <form
        className="rounded-xl border border-zinc-200 bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            const result = await updateHrContact(businessId, hr.email, hr.mobile);
            if (!result.success) {
              showToast('error', result.error || 'Could not save HR contact');
              return;
            }
            if ('hr' in result && result.hr) setHr(result.hr);
            showToast('success', 'HR contact saved');
          })();
        }}
      >
        <p className="text-sm font-semibold text-zinc-900">HR contact</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Set this before posting a job. Shortlisted candidates receive the HR email and mobile by email and notification.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            type="email"
            required
            value={hr.email}
            onChange={(event) => setHr((current) => ({ ...current, email: event.target.value }))}
            placeholder="HR email"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            inputMode="numeric"
            required
            value={hr.mobile}
            onChange={(event) => setHr((current) => ({ ...current, mobile: event.target.value.replace(/[^\d]/g, '').slice(0, 10) }))}
            placeholder="HR mobile"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        {canEdit ? (
          <button type="submit" className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white">
            Save HR contact
          </button>
        ) : null}
      </form>
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 z-[200] max-w-sm -translate-x-1/2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg lg:bottom-8 ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header + slots */}
      <div className={`${dashboard.panel} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#3F3F46]">Job postings</p>
            <p className="mt-1 text-sm text-zinc-600">
              Live roles appear on FinderB Jobs — applications flow into your Leads tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            disabled={!canEdit || isLimitReached}
            className={`${dashboard.btnPrimary} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <HiOutlinePlus size={18} />
            Post a job
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Live slots</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#27272A]">
              {activeJobsCount}
              <span className="text-base font-medium text-zinc-400"> / {MAX_ACTIVE_JOBS}</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3F3F46] to-[#f9b864] transition-all duration-500"
                style={{ width: `${slotPercent}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">Live now</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{activeJobsCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Paused</p>
            <p className="mt-1 text-2xl font-bold text-zinc-700">{pausedCount}</p>
          </div>
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-zinc-100 bg-white" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className={`${dashboard.panel} ${dashboard.emptyState} py-14`}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#27272A] to-[#3F3F46] text-[#f9b864] shadow-lg">
            <HiOutlineBriefcase size={30} />
          </div>
          <h3 className="mt-5 text-lg font-bold text-zinc-900">No jobs posted yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Post up to {MAX_ACTIVE_JOBS} live roles at a time. Candidates apply through FinderB and you manage
            applications in Leads.
          </p>
          {canEdit ? (
          <button type="button" onClick={() => handleOpenModal()} className={`mt-6 ${dashboard.btnPrimary}`}>
            <HiOutlinePlus size={16} />
            Post your first job
          </button>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">You can view jobs, but only a teammate with edit rights can post them.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isLive = job.status === 'active';
            const isExpanded = expandedId === job.id;

            return (
              <article
                key={job.id}
                className={`overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-sm ${
                  isLive ? 'border-emerald-200/80 ring-1 ring-emerald-100' : 'border-zinc-200'
                }`}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-900">{job.title}</h3>
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                        {job.type}
                      </span>
                      {job.department && (
                        <span className="rounded-md bg-[#3F3F46]/8 px-2 py-0.5 text-[11px] font-semibold text-[#3F3F46]">
                          {job.department}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleJobStatus(job)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isLive
                            ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200'
                        }`}
                      >
                        <HiOutlineSignal size={11} />
                        {isLive ? 'Live' : 'Paused'}
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineMapPin size={13} className="text-zinc-400" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineCurrencyRupee size={13} className="text-zinc-400" />
                          {job.salary}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineClock size={13} className="text-zinc-400" />
                        {formatDate(job.created_at)}
                      </span>
                    </div>

                    <p className={`mt-3 text-sm leading-relaxed text-zinc-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {job.description}
                    </p>

                    {job.description.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : job.id)}
                        className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-[#3F3F46] hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            Show less <HiOutlineChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            Read full description <HiOutlineChevronDown size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {canEdit ? (
                  <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
                    <button
                      type="button"
                      onClick={() => setApplicationsFor(applicationsFor === job.id ? '' : job.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 sm:flex-none"
                    >
                      Applications
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(job)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-[#3F3F46]/30 hover:bg-zinc-50 sm:flex-none"
                    >
                      <HiOutlinePencilSquare size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete job"
                    >
                      <HiOutlineTrash size={15} />
                    </button>
                  </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApplicationsFor(applicationsFor === job.id ? '' : job.id)}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700"
                    >
                      Applications
                    </button>
                  )}
                </div>
                {applicationsFor === job.id ? (
                  <JobApplicationsPanel businessId={businessId} jobId={job.id} canEdit={canEdit} />
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
            aria-hidden
          />
          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-xl">
            <div className="border-b border-zinc-100 bg-gradient-to-r from-[#27272A]/5 to-transparent px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    {editingJob ? 'Edit job posting' : 'New job posting'}
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">Visible on FinderB Jobs when status is Live</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-zinc-600">Job title</span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Sales Executive"
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-zinc-600">Type</span>
                    <select
                      className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-zinc-600">Department</span>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-zinc-600">Location</span>
                  <input
                    required
                    type="text"
                    placeholder="City or Remote"
                    className="mt-1.5 w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </label>

                <div>
                  <span className="text-xs font-semibold text-zinc-600">Salary range</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    <input
                      inputMode="numeric"
                      placeholder="Minimum ₹"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46]"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value.replace(/[^\d]/g, '') })}
                    />
                    <input
                      inputMode="numeric"
                      placeholder="Maximum ₹"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#3F3F46]"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value.replace(/[^\d]/g, '') })}
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {(['month', 'year'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setFormData({ ...formData, salaryPeriod: period })}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          formData.salaryPeriod === period ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {period === 'month' ? 'Per month' : 'Per year'}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {salaryFromInputs(formData.salaryMin, formData.salaryMax, formData.salaryPeriod) ||
                      'Leave blank if pay is not disclosed. This is how the public listing will read it.'}
                  </p>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-zinc-600">Description</span>
                  <textarea
                    required
                    rows={5}
                    placeholder="Role, requirements, how to apply…"
                    className="mt-1.5 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#3F3F46] focus:ring-2 focus:ring-[#3F3F46]/10"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                  />
                </label>
              </div>

              <div className="mt-6 flex gap-3 border-t border-zinc-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-[2] ${dashboard.btnPrimary} disabled:opacity-60`}
                >
                  {submitting ? 'Saving…' : editingJob ? 'Save changes' : 'Publish job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
