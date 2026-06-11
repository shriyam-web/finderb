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
} from 'react-icons/hi2';
import { createJob, getJobsByBusiness, deleteJob, updateJob } from '@/app/actions/job';

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
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const MAX_ACTIVE_JOBS = 3;

export default function JobPostingTab({ businessId }: JobPostingTabProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: '',
    department: '',
  });

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
  }, [fetchJobs]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;
  const isLimitReached = activeJobsCount >= MAX_ACTIVE_JOBS;

  const handleOpenModal = (job: Job | null = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        type: job.type,
        location: job.location,
        salary: job.salary || '',
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
      salary: '',
      description: '',
      department: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = editingJob
        ? await updateJob(editingJob.id, formData)
        : await createJob({ ...formData, businessId });

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
        showToast('success', newStatus === 'active' ? 'Job is live' : 'Job paused');
        fetchJobs();
      }
    } catch {
      showToast('error', 'Could not update status');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const diffDays = Math.floor(Math.abs(Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-5">
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

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Job openings</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Post roles on FinderB Jobs.{' '}
            <span className="font-medium text-slate-700">
              {activeJobsCount}/{MAX_ACTIVE_JOBS} slots in use
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          disabled={isLimitReached}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HiOutlinePlus size={18} />
          Post a job
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-100 bg-white" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <HiOutlineBriefcase size={24} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No jobs posted yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
            When you post a role, it shows up on FinderB Jobs and applications land in your Lead center.
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Post your first job
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
            <span>Role</span>
            <span className="w-24 text-center">Status</span>
            <span className="w-28 text-center">Posted</span>
            <span className="w-24 text-right">Actions</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-col gap-3 p-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {job.type}
                    </span>
                    {job.department && (
                      <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                        {job.department}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <HiOutlineMapPin size={13} />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="inline-flex items-center gap-1">
                        <HiOutlineCurrencyRupee size={13} />
                        {job.salary}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 sm:hidden">
                      <HiOutlineClock size={13} />
                      {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>

                <div className="sm:w-24 sm:text-center">
                  <button
                    type="button"
                    onClick={() => toggleJobStatus(job)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      job.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                    }`}
                  >
                    {job.status === 'active' ? 'Live' : 'Paused'}
                  </button>
                </div>

                <div className="hidden text-center text-xs text-slate-400 sm:block sm:w-28">
                  {formatDate(job.created_at)}
                </div>

                <div className="flex gap-2 sm:w-24 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(job)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none"
                  >
                    <HiOutlinePencilSquare size={15} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job.id)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete job"
                  >
                    <HiOutlineTrash size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setIsModalOpen(false)}
            aria-hidden
          />
          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingJob ? 'Edit job' : 'New job post'}
                </h2>
                <p className="text-xs text-slate-500">Visible on FinderB Jobs when status is Live</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-5">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Job title</span>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Sales Executive"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600">Type</span>
                    <select
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
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
                    <span className="text-xs font-medium text-slate-600">Department</span>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Location</span>
                  <input
                    required
                    type="text"
                    placeholder="City or Remote"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Salary range</span>
                  <input
                    type="text"
                    placeholder="e.g. ₹3L – ₹5L per year"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Description</span>
                  <textarea
                    required
                    rows={5}
                    placeholder="Role, requirements, how to apply…"
                    className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </label>
              </div>

              <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] rounded-lg bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
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
