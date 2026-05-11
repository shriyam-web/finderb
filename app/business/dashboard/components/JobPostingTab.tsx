'use client';

import { useState, useEffect } from 'react';
import { 
  HiOutlineBriefcase, 
  HiOutlinePlus, 
  HiOutlineMapPin, 
  HiOutlineClock, 
  HiOutlineCurrencyRupee,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineBuildingOffice2,
  HiOutlineExclamationCircle
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
  createdAt: Date;
}

interface JobPostingTabProps {
  businessId: string;
}

export default function JobPostingTab({ businessId }: JobPostingTabProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: '',
    department: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [businessId]);

  const fetchJobs = async () => {
    setLoading(true);
    const res = await getJobsByBusiness(businessId);
    if (res.success && res.jobs) {
      setJobs(res.jobs as any);
    }
    setLoading(false);
  };

  const activeJobsCount = jobs.filter(j => j.status === 'active').length;
  const isLimitReached = activeJobsCount >= 3;

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
    } else if (!isLimitReached) {
      setEditingJob(null);
      setFormData({ title: '', type: 'Full-time', location: '', salary: '', description: '', department: '' });
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    let res;
    if (editingJob) {
      res = await updateJob(editingJob.id, formData);
    } else {
      res = await createJob({
        ...formData,
        businessId
      });
    }

    if (res.success) {
      setMessage({ type: 'success', text: editingJob ? 'Job updated successfully!' : 'Job posted successfully!' });
      setIsModalOpen(false);
      fetchJobs();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to process job' });
    }
    setSubmitting(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    const res = await deleteJob(id);
    if (res.success) {
      setMessage({ type: 'success', text: 'Job deleted successfully' });
      fetchJobs();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to delete job' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {message && (
        <div className={`fixed top-6 right-6 z-[110] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 backdrop-blur-md ${
          message.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            ) : (
              <HiOutlineExclamationCircle size={18} />
            )}
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Job Postings</h3>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isLimitReached ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLimitReached ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`}></span>
              {activeJobsCount}/3 Active
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage your openings and find great talent.</p>
          {isLimitReached && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-50/50 rounded-lg border border-amber-100/50">
              <HiOutlineExclamationCircle size={14} className="text-amber-500" />
              <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wider">
                Max limit of 3 active jobs reached
              </p>
            </div>
          )}
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={isLimitReached}
          className={`relative z-10 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
            isLimitReached 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200'
          }`}
        >
          <HiOutlinePlus size={18} />
          Post a New Job
        </button>
      </div>

      {/* Jobs List */}
      <div className="grid gap-4 md:gap-5">
        {loading ? (
          <div className="bg-white p-20 rounded-3xl border border-slate-200/60 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Fetching your jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-50/50 p-12 md:p-20 rounded-3xl border border-dashed border-slate-300 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <HiOutlineBriefcase size={36} />
            </div>
            <div className="max-w-xs mx-auto">
              <p className="text-slate-900 font-bold text-lg">No active job postings</p>
              <p className="text-slate-500 text-sm font-medium mt-1">Ready to expand your team? Post your first job opening today.</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
              Get Started
            </button>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="group bg-white p-5 md:p-6 rounded-3xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="shrink-0 w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300 border border-slate-100">
                  <HiOutlineBriefcase size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="bg-indigo-50/50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-indigo-100/50">{job.type}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      job.status === 'active' 
                      ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' 
                      : 'bg-slate-50/50 text-slate-500 border-slate-100/50'
                    }`}>{job.status}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight truncate group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1 text-[12px] font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><HiOutlineMapPin size={14} className="text-slate-400" /> {job.location}</span>
                    {job.salary && (
                      <span className="flex items-center gap-1.5"><HiOutlineCurrencyRupee size={14} className="text-slate-400" /> {job.salary}</span>
                    )}
                    <span className="flex items-center gap-1.5"><HiOutlineClock size={14} className="text-slate-400" /> {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:self-center">
                <button 
                  onClick={() => handleOpenModal(job)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 hover:border-indigo-100 font-semibold text-sm"
                >
                  <HiOutlinePencilSquare size={18} />
                  <span className="sm:hidden lg:inline">Edit</span>
                </button>
                <button 
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 hover:border-rose-100"
                  title="Delete Job"
                >
                  <HiOutlineTrash size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post/Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white h-full md:h-auto md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300 flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{editingJob ? 'Update Job Posting' : 'Post a New Job'}</h3>
                <p className="text-slate-500 text-sm font-medium">Fill in the details for your job opening.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-100 shadow-sm active:scale-95">
                <HiOutlineXMark size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] md:max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Job Title</label>
                  <div className="relative group">
                    <HiOutlineBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Sales Executive"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Job Type</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                    </select>
                    <HiOutlineClock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Location</label>
                  <div className="relative group">
                    <HiOutlineMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Mumbai, Hybrid"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Salary Range</label>
                  <div className="relative group">
                    <HiOutlineCurrencyRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. ₹5L - ₹8L"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                  <div className="relative group">
                    <HiOutlineBuildingOffice2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. Engineering, Sales, Marketing"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the roles, responsibilities, and requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all resize-none min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              
              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm transition-all active:scale-[0.98] border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] px-6 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>{editingJob ? 'Save Changes' : 'Publish Job Opening'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
