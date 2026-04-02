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
  Clock,
  ShieldCheck,
  Briefcase,
  Search,
  ChevronRight,
  Target,
  Rocket,
  Star,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Performance', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: List },
    { id: 'leads', label: 'Lead Center', icon: Target },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Total Views', value: '1,284', change: '+12.5%', isUp: true, icon: Eye, sub: 'from last month' },
    { label: 'New Leads', value: '42', change: '+18.2%', isUp: true, icon: Users, sub: 'high intent buyers' },
    { label: 'Avg. Rating', value: '4.8', change: '-2.1%', isUp: false, icon: TrendingUp, sub: '840 reviews total' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-900 p-4 flex items-center justify-between sticky top-0 z-[60] shadow-xl">
        <Link href="/" className="group">
          <Image src="/logo-w2.png" alt="Boomb Logo" width={100} height={30} className="h-8 w-auto" />
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-white bg-white/10 rounded-xl"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-80 bg-gray-900 border-r border-white/5 flex flex-col shadow-2xl z-[58] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-10 hidden lg:block">
          <Link href="/" className="group">
            <Image src="/logo-w2.png" alt="Boomb Logo" width={140} height={40} className="h-10 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-600/20 px-4 py-1.5 rounded-full text-blue-400 font-black text-[10px] uppercase tracking-widest border border-blue-400/20">
            <ShieldCheck size={12} /> Verified Partner
          </div>
        </div>

        {/* Mobile Sidebar Brand Info */}
        <div className="p-8 lg:hidden border-b border-white/5">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 px-4 py-1.5 rounded-full text-blue-400 font-black text-[10px] uppercase tracking-widest border border-blue-400/20">
            <ShieldCheck size={12} /> Verified Partner
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon size={22} className={activeTab === item.id ? 'animate-pulse' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[28px] text-white relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                <Rocket size={16} />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest">Growth Plan</p>
                <p className="text-[10px] text-blue-100 font-bold">12 Days remaining</p>
              </div>
              <button className="w-full bg-white text-blue-600 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">
                Renew
              </button>
            </div>
          </div>
          
          <Link href="/business/login" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all group">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            Exit Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 md:mb-16 relative z-10 pt-4 md:pt-0">
          <div className="space-y-2 md:space-y-3">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] border border-gray-100 shadow-sm">
              <Briefcase size={12} className="text-blue-600" /> Professional Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight capitalize">
              {activeTab === 'overview' ? 'Overview' : activeTab}
            </h1>
            <p className="text-gray-500 text-sm md:text-lg font-medium">Tracking performance for <span className="text-blue-600 font-black">Precision Plumbers</span></p>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <button className="flex-1 md:flex-none bg-gray-900 text-white px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 active:scale-95 text-[10px] md:text-sm uppercase tracking-widest">
              <Plus size={20} />
              Add Listing
            </button>
            <button className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 shadow-premium transition-all relative group border border-gray-50">
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 md:top-4 md:right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-premium border border-gray-100 space-y-6 md:space-y-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl md:rounded-3xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <stat.icon size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className={`flex items-center gap-1.5 font-black text-[10px] md:text-xs px-2.5 py-1 md:px-3 md:py-1.5 rounded-full ${stat.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
              {/* Recent Leads */}
              <div className="lg:col-span-2 bg-white rounded-[32px] md:rounded-[56px] shadow-premium border border-gray-100 p-6 md:p-12 space-y-8 md:space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900">Lead Center</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium italic">Recent inquiries</p>
                  </div>
                  <button className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline self-start sm:self-auto">Manage All</button>
                </div>
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-6 md:pb-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Customer</th>
                        <th className="pb-6 md:pb-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Service</th>
                        <th className="pb-6 md:pb-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em]">Status</th>
                        <th className="pb-6 md:pb-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.25em] text-right">Options</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { name: 'Amit Sharma', service: 'Leak Repair', status: 'New Lead', color: 'bg-blue-600', time: '14 min ago' },
                        { name: 'Priya Patel', service: 'House Inspection', status: 'Contacted', color: 'bg-amber-500', time: '2 hours ago' },
                        { name: 'Rahul Varma', service: 'Pipe Installation', status: 'Completed', color: 'bg-green-500', time: 'Yesterday' },
                        { name: 'Sneha Gupta', service: 'Drain Cleaning', status: 'New Lead', color: 'bg-blue-600', time: '3 days ago' },
                      ].map((lead, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-6 md:py-8">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-black text-gray-900 text-sm md:text-base">{lead.name}</p>
                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lead.time}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 md:py-8 font-bold text-gray-500 text-xs md:text-sm">{lead.service}</td>
                          <td className="py-6 md:py-8">
                            <span className={`${lead.color} text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-md`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-6 md:py-8 text-right">
                            <button className="p-2 md:p-3 hover:bg-white hover:shadow-premium rounded-xl md:rounded-2xl transition-all text-gray-300 hover:text-blue-600">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions & Insight */}
              <div className="space-y-6 md:space-y-8">
                <div className="bg-white rounded-[32px] md:rounded-[48px] shadow-premium p-8 md:p-12 border border-gray-100 space-y-8 md:space-y-10 group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Lead Capture</h3>
                    <TrendingUp className="text-green-500" size={18} />
                  </div>
                  
                  <div className="space-y-6 md:space-y-8">
                    {[
                      { label: 'Profile Traffic', value: 85, color: 'bg-blue-600' },
                      { label: 'Conversion Rate', value: 34, color: 'bg-green-500' },
                      { label: 'Response Time', value: 92, color: 'bg-amber-500' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-3">
                        <div className="flex justify-between text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span>{item.label}</span>
                          <span className="text-gray-900">{item.value}%</span>
                        </div>
                        <div className="h-2 md:h-2.5 bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100 shadow-inner">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(37,99,235,0.3)]`} 
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full bg-blue-50 text-blue-600 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                    View Full Analytics
                  </button>
                </div>

                <div className="bg-gray-900 rounded-[32px] md:rounded-[48px] shadow-premium p-8 md:p-12 text-white space-y-6 md:space-y-8 relative overflow-hidden group">
                  <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-blue-600/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                  <h3 className="text-xl md:text-2xl font-black relative z-10">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10">
                    {[
                      { label: 'Edit Info', icon: Settings },
                      { label: 'Ad Center', icon: Rocket },
                      { label: 'Support', icon: MessageSquare },
                      { label: 'Reviews', icon: Star },
                    ].map((btn, i) => (
                      <button key={i} className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl hover:bg-blue-600 transition-all group/btn flex flex-col items-center gap-2 md:gap-3">
                        <btn.icon size={18} className="text-blue-400 group-hover/btn:text-white transition-colors md:w-5 md:h-5" />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest group-hover/btn:text-white text-center">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="bg-white rounded-[32px] md:rounded-[56px] shadow-premium border border-gray-100 p-10 md:p-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6 md:mb-10 border-4 border-white shadow-xl">
              <Clock size={40} className="md:w-16 md:h-16" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 md:mb-6 capitalize">{activeTab} section coming soon</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8 md:mb-10 text-sm md:text-lg leading-relaxed">
              We are working hard to integrate advanced {activeTab} tools into your portal.
            </p>
            <button 
              onClick={() => setActiveTab('overview')} 
              className="inline-flex items-center gap-2 md:gap-3 bg-gray-900 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/20 active:scale-95 uppercase tracking-widest text-[10px] md:text-xs"
            >
              Back to Overview <ChevronRight size={18} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
