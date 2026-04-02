'use client';

import Link from 'next/link';
import { Target, Users, ShieldCheck, Zap, Award, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        {/* Hero Section */}
        <section className="px-4 mb-32 relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
          <div className="max-w-7xl mx-auto text-center space-y-10 relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
              Our Journey
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-primary tracking-tight leading-[0.95] max-w-5xl mx-auto">
              Connecting India to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-orange-500">Local Excellence</span>
            </h1>
            <p className="text-gray-500 text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto">
              Boomb is India's premier discovery platform, dedicated to bridging the gap between quality local businesses and the people who need them.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-4 mb-32">
          <div className="bg-primary rounded-[60px] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
              {[
                { label: 'Active Users', value: '10M+', icon: Users },
                { label: 'Verified Businesses', value: '6.2L+', icon: ShieldCheck },
                { label: 'Cities Covered', value: '500+', icon: Globe },
                { label: 'Daily Leads', value: '50K+', icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-secondary mx-auto mb-6">
                    <stat.icon size={24} />
                  </div>
                  <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">{stat.value}</div>
                  <div className="text-blue-100/60 text-xs font-black uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="max-w-7xl mx-auto px-4 mb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-secondary/10 rounded-[32px] flex items-center justify-center text-secondary mb-8">
                  <Target size={40} />
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-primary tracking-tight">Our Mission</h2>
                <p className="text-gray-500 text-xl md:text-2xl font-medium leading-relaxed">
                  To empower local businesses with the tools they need to thrive in a digital-first world while providing users with a reliable, verified, and seamless discovery experience.
                </p>
              </div>
              
              <ul className="grid gap-6">
                {[
                  'Democratizing digital visibility for small businesses',
                  'Ensuring quality through rigorous verification',
                  'Building community-driven trust through reviews',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-primary font-black text-lg bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:border-secondary/20 transition-all">
                    <div className="w-8 h-8 bg-secondary text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap size={18} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-accent/20 rounded-[80px] flex items-center justify-center relative overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-700">
                <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <Globe size={300} className="text-primary/10 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 bg-white rounded-full shadow-2xl flex items-center justify-center p-8">
                    <img src="/logo.png" alt="Boomb Logo" className="w-full h-auto" />
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-3xl shadow-premium flex items-center justify-center text-4xl animate-bounce">
                🚀
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-[40px] shadow-premium flex items-center justify-center p-6 animate-pulse">
                <div className="space-y-2 w-full">
                  <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                  <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                  <div className="h-2 w-1/2 bg-secondary/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-7xl mx-auto px-4 mb-40">
          <div className="text-center space-y-4 mb-20">
            <span className="text-secondary font-black uppercase tracking-[0.3em] text-xs">Core Values</span>
            <h2 className="text-5xl md:text-6xl font-black text-primary tracking-tight">The Boomb Way</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                title: 'User First', 
                desc: 'Every feature we build is designed to make discovery easier and more reliable for our users.',
                icon: Users,
                bg: 'bg-orange-50',
                color: 'text-orange-500'
              },
              { 
                title: 'Trust & Safety', 
                desc: 'We maintain strict verification standards to ensure every business on Boomb is legitimate.',
                icon: ShieldCheck,
                bg: 'bg-blue-50',
                color: 'text-blue-500'
              },
              { 
                title: 'Innovation', 
                desc: 'We constantly evolve our technology to better serve the changing needs of Indian commerce.',
                icon: Award,
                bg: 'bg-secondary/10',
                color: 'text-secondary'
              },
            ].map((value, i) => (
              <div key={i} className="group bg-white p-12 rounded-[50px] border border-gray-100 shadow-sm hover:border-secondary/20 hover:shadow-premium transition-all duration-500 text-center space-y-8">
                <div className={`w-24 h-24 ${value.bg} ${value.color} rounded-[36px] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <value.icon size={48} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-primary tracking-tight">{value.title}</h3>
                  <p className="text-gray-500 text-lg font-medium leading-relaxed">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-secondary rounded-[60px] p-12 md:p-24 text-center space-y-12 relative overflow-hidden text-white shadow-2xl shadow-secondary/30">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[1] text-white">
                Be part of the <br />
                <span className="text-primary-foreground underline decoration-white/30 underline-offset-8">local revolution</span>
              </h2>
              <p className="text-blue-50 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                Whether you're a business looking to grow or a user looking for excellence, Boomb is your partner.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Link href="/business/register" className="bg-white text-secondary px-12 py-6 rounded-2xl font-black text-xl hover:bg-primary hover:text-white transition-all shadow-2xl active:scale-95">
                  List Your Business
                </Link>
                <Link href="/signup" className="bg-transparent border-2 border-white/30 text-white px-12 py-6 rounded-2xl font-black text-xl hover:bg-white/10 transition-all active:scale-95">
                  Join as a User
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
