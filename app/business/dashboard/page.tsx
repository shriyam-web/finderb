'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  List, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Bell, 
  TrendingUp, 
  Users, 
  Eye, 
  MoreVertical, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: List },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Total Views', value: '1,284', change: '+12%', isUp: true, icon: Eye },
    { label: 'New Leads', value: '42', change: '+18%', isUp: true, icon: Users },
    { label: 'Avg. Rating', value: '4.8', change: '-2%', isUp: false, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-accent/30 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-primary border-r border-white/10 hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-10">
          <Link href="/">
            <Image src="/logo.png" alt="Boomb Logo" width={140} height={40} className="h-10 w-auto brightness-0 invert" />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-secondary font-bold text-[10px] uppercase tracking-widest">
            Business Portal
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all
                ${activeTab === item.id 
                  ? 'bg-secondary text-white shadow-xl shadow-secondary/30' 
                  : 'text-blue-100 hover:bg-white/10'}
              `}
            >
              <item.icon size={22} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/10">
          <Link href="/business/login" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={22} />
            Exit Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-primary tracking-tight capitalize">
              {activeTab === 'overview' ? 'Business Overview' : activeTab}
            </h1>
            <p className="text-gray-500 font-medium">Tracking performance for <span className="text-primary font-bold">Precision Plumbers</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="bg-primary text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-secondary transition-all shadow-xl shadow-primary/20">
              <Plus size={20} />
              Add New Listing
            </button>
            <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary shadow-premium transition-all">
              <Bell size={24} />
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white p-8 rounded-[40px] shadow-premium border border-gray-50 space-y-6 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-accent text-secondary rounded-2xl flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                      <stat.icon size={28} />
                    </div>
                    <div className={`flex items-center gap-1 font-black text-sm ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">{stat.label}</p>
                    <p className="text-4xl font-black text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Leads */}
              <div className="lg:col-span-2 bg-white rounded-[40px] shadow-premium border border-gray-100 p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-primary">Recent Leads</h3>
                  <button className="text-secondary font-bold text-sm hover:underline">View All Leads</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="pb-6 font-black text-gray-400 text-xs uppercase tracking-widest">Customer</th>
                        <th className="pb-6 font-black text-gray-400 text-xs uppercase tracking-widest">Service</th>
                        <th className="pb-6 font-black text-gray-400 text-xs uppercase tracking-widest">Status</th>
                        <th className="pb-6 font-black text-gray-400 text-xs uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { name: 'Amit Sharma', service: 'Leak Repair', status: 'New', color: 'bg-secondary' },
                        { name: 'Priya Patel', service: 'Full House Inspection', status: 'Contacted', color: 'bg-yellow-500' },
                        { name: 'Rahul Varma', service: 'Pipe Installation', status: 'Closed', color: 'bg-green-500' },
                      ].map((lead, i) => (
                        <tr key={i} className="group">
                          <td className="py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-primary font-bold text-xs">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-bold text-primary">{lead.name}</span>
                            </div>
                          </td>
                          <td className="py-6 font-medium text-gray-500">{lead.service}</td>
                          <td className="py-6">
                            <span className={`${lead.color} text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-6 text-right">
                            <button className="p-2 hover:bg-accent rounded-xl transition-all text-gray-400 hover:text-primary">
                              <MoreVertical size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions / Plan */}
              <div className="space-y-8">
                <div className="bg-primary rounded-[40px] p-10 text-white space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <h3 className="text-xl font-black">Standard Plan</h3>
                  <p className="text-blue-100 text-sm font-medium leading-relaxed">Your plan expires in 12 days. Renew now to keep priority placement.</p>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-2/3 rounded-full"></div>
                  </div>
                  <button className="w-full bg-secondary text-white py-4 rounded-2xl font-black hover:bg-opacity-90 transition-all shadow-lg">
                    Renew Plan
                  </button>
                </div>

                <div className="bg-white rounded-[40px] shadow-premium p-10 border border-gray-100 space-y-6">
                  <h3 className="text-xl font-black text-primary">Performance</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Profile Completeness', value: 85, color: 'bg-secondary' },
                      { label: 'Response Rate', value: 92, color: 'bg-green-500' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                          <span>{item.label}</span>
                          <span className="text-primary">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="bg-white rounded-[40px] shadow-premium border border-gray-100 p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-primary mx-auto mb-8">
              <Clock size={48} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-4">{activeTab} coming soon</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
              We are working hard to bring the {activeTab} section to your business portal.
            </p>
            <button onClick={() => setActiveTab('overview')} className="bg-primary text-white px-10 py-4 rounded-2xl font-black hover:bg-secondary transition-all shadow-xl active:scale-95">
              Back to Overview
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
