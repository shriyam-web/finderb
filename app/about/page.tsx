'use client';

import Link from 'next/link';
import { Target, Users, ShieldCheck, Zap, Award, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        {/* Hero Section */}
        <section className="px-4 mb-24">
          <div className="max-w-7xl mx-auto text-center space-y-8">
            <span className="bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm inline-block">Our Story</span>
            <h1 className="text-4xl md:text-7xl font-black text-primary tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Connecting India to <span className="text-secondary underline decoration-secondary/30 underline-offset-8">Local Excellence</span>
            </h1>
            <p className="text-gray-500 text-xl font-medium leading-relaxed max-w-3xl mx-auto">
              Boomb is India's premier discovery platform, dedicated to bridging the gap between quality local businesses and the people who need them.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary py-20 mb-24">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Active Users', value: '10M+' },
              { label: 'Verified Businesses', value: '6.2L+' },
              { label: 'Cities Covered', value: '500+' },
              { label: 'Daily Leads', value: '50K+' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-4xl md:text-5xl font-black text-white">{stat.value}</div>
                <div className="text-blue-200 text-sm font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="w-16 h-16 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary">
                <Target size={32} />
              </div>
              <h2 className="text-4xl font-black text-primary">Our Mission</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                To empower local businesses with the tools they need to thrive in a digital-first world while providing users with a reliable, verified, and seamless discovery experience.
              </p>
              <ul className="space-y-4">
                {[
                  'Democratizing digital visibility for small businesses',
                  'Ensuring quality through rigorous verification',
                  'Building community-driven trust through reviews',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-primary font-bold">
                    <Zap size={20} className="text-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-accent/30 rounded-[60px] p-12 aspect-square flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <Globe size={200} className="text-primary/10 animate-spin-slow" />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-primary mb-4">The Boomb Way</h2>
            <p className="text-gray-500 font-medium">The values that drive every decision we make.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'User First', 
                desc: 'Every feature we build is designed to make discovery easier and more reliable for our users.',
                icon: Users 
              },
              { 
                title: 'Trust & Safety', 
                desc: 'We maintain strict verification standards to ensure every business on Boomb is legitimate.',
                icon: ShieldCheck 
              },
              { 
                title: 'Innovation', 
                desc: 'We constantly evolve our technology to better serve the changing needs of Indian commerce.',
                icon: Award 
              },
            ].map((value, i) => (
              <div key={i} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-premium transition-all text-center space-y-6">
                <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mx-auto">
                  <value.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-primary">{value.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-secondary rounded-[50px] p-10 md:p-20 text-center space-y-8 relative overflow-hidden text-white shadow-2xl shadow-secondary/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Join the Movement
            </h2>
            <p className="text-blue-50 text-lg font-medium max-w-2xl mx-auto">
              Whether you're a business looking to grow or a user looking for the best services, Boomb is for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Link href="/business/register" className="bg-white text-secondary px-10 py-5 rounded-2xl font-black text-lg hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95">
                List Your Business
              </Link>
              <Link href="/signup" className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                Create User Account
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
