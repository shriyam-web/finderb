'use client';

import { Briefcase, MapPin, Clock, Search, Filter, ArrowRight, Zap, Users, Trophy } from 'lucide-react';
import Link from 'next/link';

const jobs = [
  {
    id: 1,
    title: 'Senior Product Designer',
    department: 'Design',
    location: 'Bangalore, India',
    type: 'Full-time',
    posted: '2 days ago',
    icon: '🎨'
  },
  {
    id: 2,
    title: 'Full Stack Developer',
    department: 'Engineering',
    location: 'Remote / Mumbai',
    type: 'Full-time',
    posted: '1 week ago',
    icon: '💻'
  },
  {
    id: 3,
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Delhi, India',
    type: 'Full-time',
    posted: '3 days ago',
    icon: '📈'
  },
  {
    id: 4,
    title: 'Customer Success Lead',
    department: 'Operations',
    location: 'Hyderabad, India',
    type: 'Full-time',
    posted: '5 days ago',
    icon: '🤝'
  }
];

export default function HiringsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        {/* Hero Section */}
        <section className="px-4 mb-24">
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <span className="bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm inline-block">Careers at Boomb</span>
            <h1 className="text-4xl md:text-7xl font-black text-primary tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Build the Future of <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Local Discovery</span>
            </h1>
            <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-3xl mx-auto">
              Join a team of passionate innovators dedicated to empowering millions of local businesses across India.
            </p>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Impact at Scale', 
                desc: 'Your work will directly influence how 10M+ users discover and interact with local services every day.',
                icon: Zap 
              },
              { 
                title: 'Culture of Ownership', 
                desc: 'We value initiative and give you the autonomy to drive projects from conception to completion.',
                icon: Users 
              },
              { 
                title: 'Infinite Growth', 
                desc: 'With a fast-paced environment and challenging problems, your learning curve will be vertical.',
                icon: Trophy 
              },
            ].map((value, i) => (
              <div key={i} className="bg-accent/10 p-10 rounded-[40px] border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-premium transition-all text-center space-y-6">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary mx-auto shadow-sm">
                  <value.icon size={32} className="text-secondary" />
                </div>
                <h3 className="text-2xl font-black text-primary">{value.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Listings Section */}
        <section className="max-w-5xl mx-auto px-4 mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-primary">Open Positions</h2>
              <p className="text-gray-500 font-medium">Explore roles across all departments.</p>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search roles..." 
                  className="pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all w-64"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="group bg-white p-8 rounded-3xl border border-gray-100 hover:border-secondary/30 hover:shadow-premium transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {job.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-primary group-hover:text-secondary transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-400">
                      <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.department}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {job.type}</span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-secondary transition-all self-start md:self-auto">
                  Apply Now <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 font-medium">
              Don't see a role that fits? <Link href="/contact" className="text-secondary font-black hover:underline">Send us your CV</Link> and we'll keep you in mind.
            </p>
          </div>
        </section>

        {/* Perks Section */}
        <section className="bg-primary py-24 rounded-[60px] mx-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-16">Life at Boomb</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Work from Anywhere', icon: '🌍' },
                { label: 'Health Insurance', icon: '🏥' },
                { label: 'Learning Budget', icon: '📚' },
                { label: 'Flexible Leave', icon: '🏝️' },
              ].map((perk, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-5xl">{perk.icon}</div>
                  <div className="text-blue-100 font-black uppercase tracking-widest text-xs">{perk.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
