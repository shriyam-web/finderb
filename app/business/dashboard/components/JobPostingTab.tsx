'use client';

import { useState } from 'react';
import { 
  HiOutlineBriefcase, 
  HiOutlinePlus, 
  HiOutlineMapPin, 
  HiOutlineClock, 
  HiOutlineCurrencyRupee,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlinePencilSquare
} from 'react-icons/hi2';

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string;
  description: string;
  status: 'active' | 'closed';
  postedAt: string;
}

interface JobPostingTabProps {
  businessId: string;
}

export default function JobPostingTab({ businessId }: JobPostingTabProps) {
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Full Stack Developer',
      type: 'Full-time',
      location: 'Remote',
      salary: '₹8L - ₹12L',
      description: 'We are looking for a Full Stack Developer to join our team.',
      status: 'active',
      postedAt: '2 days ago'
    },
    {
      id: '2',
      title: 'UI/UX Designer',
      type: 'Part-time',
      location: 'Hybrid',
      salary: '₹4L - ₹6L',
      description: 'Looking for a creative designer with 2+ years of experience.',
      status: 'active',
      postedAt: '5 days ago'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: ''
  });

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    const job: Job = {
      id: Math.random().toString(36).substring(2, 9),
      ...newJob,
      status: 'active',
      postedAt: 'Just now'
    };
    setJobs([job, ...jobs]);
    setIsModalOpen(false);
    setNewJob({ title: '', type: 'Full-time', location: '', salary: '', description: '' });
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 lg:p-10 rounded-[40px] border border-gray-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Job Postings</h3>
          <p className="text-slate-500 text-sm font-medium">Manage your business's open positions and find the best talent.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <HiOutlinePlus size={20} />
          Post a New Job
        </button>
      </div>

      {/* Jobs List */}
      <div className="grid gap-6">
        {jobs.length === 0 ? (
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
                  </div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">{job.title}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><HiOutlineMapPin size={14} className="text-indigo-500" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><HiOutlineCurrencyRupee size={14} className="text-emerald-500" /> {job.salary}</span>
                    <span className="flex items-center gap-1.5"><HiOutlineClock size={14} /> {job.postedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                  <HiOutlinePencilSquare size={20} />
                </button>
                <button 
                  onClick={() => deleteJob(job.id)}
                  className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <HiOutlineTrash size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 lg:p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Post a New Job</h3>
                <p className="text-slate-500 text-sm font-medium">Fill in the details for your job opening.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
                <HiOutlineXMark size={24} />
              </button>
            </div>
            
            <form onSubmit={handlePostJob} className="p-8 lg:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Sales Executive"
                    className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all appearance-none"
                    value={newJob.type}
                    onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Mumbai, Hybrid"
                    className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                    value={newJob.location}
                    onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salary Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ₹5L - ₹8L"
                    className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the roles, responsibilities, and requirements..."
                  className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all resize-none"
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
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
                  className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white py-5 px-10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
