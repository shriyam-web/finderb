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
        <section className="px-4 mb-24 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10"></div>

          <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              We're Hiring
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-primary tracking-tight leading-[1] max-w-5xl mx-auto">
              Design the <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-orange-500">Future</span> of <br className="hidden md:block" />
              Local Discovery
            </h1>
            <p className="text-gray-500 text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto">
              Join a team of passionate innovators dedicated to empowering millions of local businesses across India.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a href="#positions" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-secondary transition-all shadow-xl shadow-primary/20 active:scale-95">
                View Openings
              </a>
              <Link href="/about" className="bg-gray-50 text-primary px-8 py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all active:scale-95 border border-gray-100">
                Our Culture
              </Link>
            </div>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Impact at Scale', 
                desc: 'Your work will directly influence how 10M+ users discover and interact with local services every day.',
                icon: Zap,
                color: 'text-orange-500',
                bg: 'bg-orange-50'
              },
              { 
                title: 'Culture of Ownership', 
                desc: 'We value initiative and give you the autonomy to drive projects from conception to completion.',
                icon: Users,
                color: 'text-blue-500',
                bg: 'bg-blue-50'
              },
              { 
                title: 'Infinite Growth', 
                desc: 'With a fast-paced environment and challenging problems, your learning curve will be vertical.',
                icon: Trophy,
                color: 'text-secondary',
                bg: 'bg-secondary/10'
              },
            ].map((value, i) => (
              <div key={i} className="group bg-white p-12 rounded-[40px] border border-gray-100 hover:border-secondary/20 hover:shadow-premium transition-all duration-500 space-y-6">
                <div className={`w-20 h-20 ${value.bg} rounded-3xl flex items-center justify-center ${value.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <value.icon size={36} />
                </div>
                <h3 className="text-3xl font-black text-primary group-hover:text-secondary transition-colors tracking-tight">{value.title}</h3>
                <p className="text-gray-500 text-lg font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Listings Section */}
        <section id="positions" className="max-w-5xl mx-auto px-4 mb-32 scroll-mt-32">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-5xl font-black text-primary tracking-tight">Open Positions</h2>
              <p className="text-gray-500 text-lg font-medium">Be part of something bigger. Find your next challenge.</p>
            </div>
            <div className="flex w-full md:w-auto">
              <div className="relative w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by role or department..." 
                  className="w-full md:w-80 pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:bg-white focus:border-secondary/30 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="group bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 hover:border-secondary/30 hover:shadow-premium transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-sm border border-white">
                    {job.icon}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{job.department}</span>
                      <span className="bg-primary/5 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{job.type}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-primary group-hover:text-secondary transition-colors tracking-tight">{job.title}</h3>
                    <div className="flex items-center gap-6 text-sm font-bold text-gray-400">
                      <span className="flex items-center gap-2"><MapPin size={16} className="text-secondary" /> {job.location}</span>
                      <span className="flex items-center gap-2"><Clock size={16} /> {job.posted}</span>
                    </div>
                  </div>
                </div>
                <button className="flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white rounded-[20px] font-black text-base hover:bg-secondary hover:shadow-xl hover:shadow-secondary/20 transition-all active:scale-95 group/btn">
                  Apply Now 
                  <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-20 p-12 bg-gray-50 rounded-[40px] text-center border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black text-primary">Don't see a role that fits?</h3>
              <p className="text-gray-500 text-lg font-medium max-w-xl mx-auto mb-6">
                We're always looking for talented individuals. Send us your CV and we'll keep you in mind for future openings.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 text-secondary font-black text-xl hover:underline underline-offset-8">
                Send your CV <ArrowRight size={24} />
              </Link>
            </div>
          </div>
        </section>

        {/* Perks Section */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="bg-primary py-24 px-8 md:px-20 rounded-[60px] overflow-hidden relative shadow-2xl shadow-primary/30">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="text-center relative z-10 space-y-20">
              <div className="space-y-4">
                <span className="text-secondary font-black uppercase tracking-[0.3em] text-xs">Perks & Benefits</span>
                <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight">Life at Boomb</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                {[
                  { label: 'Work from Anywhere', icon: '🌍', desc: 'Remote-first culture with global opportunities' },
                  { label: 'Comprehensive Health', icon: '🏥', desc: 'Top-tier insurance for you and your family' },
                  { label: 'Learning Budget', icon: '📚', desc: 'Annual stipend for courses, books, and conferences' },
                  { label: 'Unlimited Leave', icon: '🏝️', desc: 'Trust-based leave policy because results matter' },
                ].map((perk, i) => (
                  <div key={i} className="group space-y-6 p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-center">
                    <div className="text-6xl group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 mb-4">{perk.icon}</div>
                    <div className="space-y-2">
                      <div className="text-white font-black text-xl tracking-tight leading-tight">{perk.label}</div>
                      <p className="text-blue-100/60 text-sm font-medium leading-relaxed">{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <Link href="/about" className="text-white/60 font-bold hover:text-white transition-colors border-b-2 border-white/20 hover:border-white pb-1">
                  Learn more about our core values
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
