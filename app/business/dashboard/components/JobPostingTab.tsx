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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      {message && (
        <div className={`fixed top-4 right-4 z-[110] p-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 ${
          message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          <p className="font-bold text-sm">{message.text}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 lg:p-10 rounded-[40px] border border-gray-100 shadow-premium">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Job Postings</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isLimitReached ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {activeJobsCount}/3 Active
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage your business's open positions and find the best talent.</p>
          {isLimitReached && (
            <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
              <HiOutlineExclamationCircle size={14} /> You have reached the maximum limit of 3 active job postings.
            </p>
          )}
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={isLimitReached}
          className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
            isLimitReached 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
          }`}
        >
          <HiOutlinePlus size={20} />
          Post a New Job
        </button>
      </div>

      {/* Jobs List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="bg-white p-20 rounded-[40px] border border-gray-100 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] border border-dashed border-gray-200 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto">
              <HiOutlineBriefcase size={40} />
            </div>
            <div>
              <p className="text-slate-900 font-black text-xl">No active job postings</p>
              <p className="text-slate-500 font-medium">Post your first job to start receiving applications.</p>
            </div>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="group bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 hover:border-indigo-100 hover:shadow-premium transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-500">
                  <HiOutlineBriefcase size={28} />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{job.type}</span>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{job.status}</span>
                    {job.department && (
                      <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{job.department}</span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">{job.title}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><HiOutlineMapPin size={14} className="text-indigo-500" /> {job.location}</span>
                    {job.salary && (
                      <span className="flex items-center gap-1.5"><HiOutlineCurrencyRupee size={14} className="text-emerald-500" /> {job.salary}</span>
                    )}
                    <span className="flex items-center gap-1.5"><HiOutlineClock size={14} /> {formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleOpenModal(job)}
                  className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                >
                  <HiOutlinePencilSquare size={20} />
                </button>
                <button 
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <HiOutlineTrash size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post/Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 font-sans">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 lg:p-10 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingJob ? 'Update Job Posting' : 'Post a New Job'}</h3>
                <p className="text-slate-500 text-sm font-medium">Fill in the details for your job opening.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-gray-100 shadow-sm">
                <HiOutlineXMark size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                  <div className="relative group">
                    <HiOutlineBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Sales Executive"
                      className="w-full bg-slate-50 border border-gray-100 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <div className="relative group">
                    <HiOutlineMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Mumbai, Hybrid"
                      className="w-full bg-slate-50 border border-gray-100 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salary Range</label>
                  <div className="relative group">
                    <HiOutlineCurrencyRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="e.g. ₹5L - ₹8L"
                      className="w-full bg-slate-50 border border-gray-100 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <div className="relative group">
                    <HiOutlineBuildingOffice2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="e.g. Engineering"
                      className="w-full bg-slate-50 border border-gray-100 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the roles, responsibilities, and requirements..."
                  className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-5 px-10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>{editingJob ? 'Update Job' : 'Publish Job'}</>
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
