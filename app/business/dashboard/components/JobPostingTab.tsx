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
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle
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
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: '',
    department: ''
  });

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJobsByBusiness(businessId);
      if (res.success && res.jobs) {
        setJobs(res.jobs as any);
      }
    } catch (error) {
      showToast('error', 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const activeJobsCount = jobs.filter(j => j.status === 'active').length;
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
        department: job.department || ''
      });
      setIsModalOpen(true);
    } else {
      if (isLimitReached) {
        showToast('error', `You've reached the maximum limit of ${MAX_ACTIVE_JOBS} active jobs.`);
        return;
      }
      setEditingJob(null);
      setFormData({ 
        title: '', 
        type: 'Full-time', 
        location: '', 
        salary: '', 
        description: '', 
        department: '' 
      });
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = editingJob 
        ? await updateJob(editingJob.id, formData)
        : await createJob({ ...formData, businessId });

      if (res.success) {
        showToast('success', editingJob ? 'Job updated successfully!' : 'Job posted successfully!');
        setIsModalOpen(false);
        fetchJobs();
      } else {
        showToast('error', res.error || 'Something went wrong');
      }
    } catch (error) {
      showToast('error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
    
    try {
      const res = await deleteJob(id);
      if (res.success) {
        showToast('success', 'Job posting deleted');
        fetchJobs();
      } else {
        showToast('error', res.error || 'Failed to delete job');
      }
    } catch (error) {
      showToast('error', 'An unexpected error occurred');
    }
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'inactive' : 'active';
    
    if (newStatus === 'active' && isLimitReached) {
      showToast('error', `Cannot activate. Maximum limit of ${MAX_ACTIVE_JOBS} active jobs reached.`);
      return;
    }

    try {
      const res = await updateJob(job.id, { status: newStatus });
      if (res.success) {
        showToast('success', `Job marked as ${newStatus}`);
        fetchJobs();
      }
    } catch (error) {
      showToast('error', 'Failed to update job status');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' 
          ? 'bg-emerald-500/90 border-emerald-400/20 text-white' 
          : 'bg-rose-500/90 border-rose-400/20 text-white'
        }`}>
          {toast.type === 'success' ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationCircle size={20} />}
          <p className="font-bold text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* Hero Stats Card */}
      <div className="relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm group">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl group-hover:bg-indigo-100/40 transition-colors duration-1000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100/50">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLimitReached ? 'bg-amber-400' : 'bg-indigo-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLimitReached ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{activeJobsCount} / {MAX_ACTIVE_JOBS} ACTIVE SLOTS USED</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Talent Acquisition</h1>
              <p className="text-slate-500 font-medium mt-1">Recruit top professionals to scale your business operations.</p>
            </div>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            disabled={isLimitReached}
            className={`group/btn relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-95 ${
              isLimitReached 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 hover:shadow-indigo-200 hover:-translate-y-0.5'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${isLimitReached ? 'bg-slate-200' : 'bg-white/10 group-hover/btn:bg-white/20'}`}>
              <HiOutlinePlus size={16} />
            </div>
            Post Opening
          </button>
        </div>
      </div>

      {/* Jobs Grid/List */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-slate-50 rounded-[2rem] border border-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-50/50 py-24 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-200">
              <HiOutlineBriefcase size={40} strokeWidth={1.5} />
            </div>
            <div className="max-w-sm px-6">
              <h3 className="text-xl font-bold text-slate-900">No active postings found</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed font-medium">Your job dashboard is currently empty. Start by listing your first career opportunity.</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="px-8 py-3.5 bg-white border border-slate-200 text-slate-900 font-bold text-sm rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              Post First Job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="group relative bg-white p-6 rounded-[2rem] border border-slate-200/70 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center gap-6">
                    <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                      job.status === 'active' 
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 grayscale'
                    }`}>
                      <HiOutlineBriefcase size={28} />
                    </div>
                    
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100">{job.type}</span>
                        <button 
                          onClick={() => toggleJobStatus(job)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            job.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                          }`}
                        >
                          {job.status}
                        </button>
                        {job.department && (
                          <span className="px-2.5 py-1 bg-indigo-50/50 text-indigo-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-100/30">{job.department}</span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                        {job.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-5 text-[13px] font-semibold text-slate-500">
                        <span className="flex items-center gap-2"><HiOutlineMapPin size={16} className="text-slate-400" /> {job.location}</span>
                        {job.salary && (
                          <span className="flex items-center gap-2 text-slate-900"><HiOutlineCurrencyRupee size={16} className="text-slate-400" /> {job.salary}</span>
                        )}
                        <span className="flex items-center gap-2"><HiOutlineClock size={16} className="text-slate-400" /> {formatDate(job.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                    <button 
                      onClick={() => handleOpenModal(job)}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-3 bg-white text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 hover:border-indigo-100 font-bold text-sm shadow-sm"
                    >
                      <HiOutlinePencilSquare size={18} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-200 hover:border-rose-100 shadow-sm"
                      title="Delete Posting"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  {editingJob ? 'Refine Posting' : 'Create New Opportunity'}
                </h2>
                <p className="text-slate-500 text-sm font-medium">Define the role and expectations for your new hire.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200 shadow-sm active:scale-90"
              >
                <HiOutlineXMark size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                  <div className="relative group">
                    <HiOutlineBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Senior Backend Architect"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Employment Type</label>
                  <div className="relative">
                    <HiOutlineClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      {JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Work Location</label>
                  <div className="relative group">
                    <HiOutlineMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Remote / Bangalore"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                {/* Salary */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Annual Compensation</label>
                  <div className="relative group">
                    <HiOutlineCurrencyRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="e.g. ₹12L - ₹18L"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Department / Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Engineering, Sales, Human Resources"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role Description & Requirements</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Tell candidates about the role, key responsibilities, and must-have skills..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] relative px-8 py-4 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 overflow-hidden"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span>{editingJob ? 'Update Posting' : 'Publish Opportunity'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
