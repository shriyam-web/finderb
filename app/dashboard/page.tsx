'use client';

import { useState } from 'react';
import { 
  User, 
  Settings, 
  MessageSquare, 
  Heart, 
  LogOut, 
  Search, 
  Bell, 
  Star,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  History,
  Store,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'profile', label: 'My Dashboard', icon: User },
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'history', label: 'Service History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white p-4 flex items-center justify-between sticky top-0 z-[60] shadow-sm border-b border-gray-100">
        <Link href="/" className="group">
          <Image src="/logo-n.png" alt="Boomb Logo" width={100} height={30} className="h-8 w-auto" />
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-80 bg-white border-r border-gray-100 flex flex-col shadow-premium z-[58] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-10 hidden lg:block">
          <Link href="/" className="group">
            <Image src="/logo-n.png" alt="Boomb Logo" width={140} height={40} className="h-10 w-auto transition-transform group-hover:scale-105" />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full text-blue-600 font-black text-[10px] uppercase tracking-widest border border-blue-100/50">
            <ShieldCheck size={12} /> Personal Account
          </div>
        </div>

        {/* Mobile Sidebar Brand Info */}
        <div className="p-8 lg:hidden border-b border-gray-50">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full text-blue-600 font-black text-[10px] uppercase tracking-widest border border-blue-100/50">
            <ShieldCheck size={12} /> Personal Account
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
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <item.icon size={22} className={activeTab === item.id ? 'animate-pulse' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-gray-50 space-y-4">
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-blue-900 font-black text-sm mb-1">Need Help?</p>
              <p className="text-blue-600/70 text-xs font-bold mb-4">Our support team is online 24/7</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-600 hover:text-white transition-all">
                Contact Support
              </button>
            </div>
            <HelpCircle size={60} className="absolute -bottom-4 -right-4 text-blue-200/30 group-hover:scale-110 transition-transform" />
          </div>
          
          <Link href="/login" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all group">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            Log Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 relative overflow-x-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-50/50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 md:mb-16 relative z-10 pt-4 md:pt-0">
          <div className="space-y-2 md:space-y-3">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest border border-gray-100 shadow-sm">
              <Clock size={12} /> Last Login: 2 hours ago
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight capitalize">
              {activeTab === 'profile' ? 'Welcome Back, John' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-gray-500 text-sm md:text-lg font-medium">Explore elite local services and manage favorites.</p>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative group flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Find services..."
                className="bg-white border-none rounded-2xl pl-12 pr-4 py-4 w-full md:w-64 shadow-premium focus:ring-2 focus:ring-blue-600 transition-all font-bold text-sm"
              />
            </div>
            <button className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 shadow-premium transition-all relative border border-gray-50">
              <Bell size={22} />
              <span className="absolute top-3 right-3 md:top-4 md:right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 md:gap-4 bg-white p-1.5 md:p-2 pr-4 md:pr-6 rounded-2xl shadow-premium border border-gray-50 group cursor-pointer hover:border-blue-100 transition-all">
              <div className="w-9 h-9 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 text-xs md:text-base">JD</div>
              <div className="hidden sm:block">
                <p className="text-xs md:text-sm font-black text-gray-900 line-clamp-1">John Doe</p>
                <p className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest">Premium</p>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'profile' && (
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {[
                { label: 'Favorites', value: '12', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', trend: '+2 this week' },
                { label: 'Reviews', value: '8', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', trend: '4.9/5 Avg' },
                { label: 'Quotes', value: '3', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', trend: '2 Pending' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-premium border border-gray-50 space-y-4 md:space-y-6 group hover:scale-[1.02] transition-all duration-500">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 md:w-16 md:h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-sm`}>
                      <stat.icon size={24} className="md:w-8 md:h-8" />
                    </div>
                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{stat.trend}</span>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-[32px] md:rounded-[56px] shadow-premium border border-gray-100 p-6 md:p-12 space-y-8 md:space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900">Recent Activity</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium italic">Service updates</p>
                  </div>
                  <button className="bg-gray-50 text-blue-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest px-4 md:px-6 py-2.5 md:py-3 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">View All</button>
                </div>
                <div className="space-y-6 md:space-y-8">
                  {[
                    { title: 'New Quote Received', desc: 'Precision Plumbers sent a detailed quote', time: '2h ago', icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
                    { title: 'Added to Favorites', desc: 'You saved Luxe Law Firm to your list', time: '1d ago', icon: Heart, color: 'bg-red-50 text-red-500' },
                    { title: 'New Review Posted', desc: 'Your review for Bright Smiles Dental is live', time: '3d ago', icon: Star, color: 'bg-yellow-50 text-yellow-600' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-4 md:gap-6 group cursor-pointer">
                      <div className={`w-12 h-12 md:w-14 md:h-14 ${activity.color} rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shadow-sm`}>
                        <activity.icon size={20} className="md:w-[22px] md:h-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5 md:mb-1 gap-2">
                          <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors text-sm md:text-base truncate">{activity.title}</p>
                          <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{activity.time}</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 font-medium line-clamp-1">{activity.desc}</p>
                      </div>
                      <div className="hidden sm:flex w-10 h-10 rounded-full border border-gray-100 items-center justify-center text-gray-300 group-hover:border-blue-600 group-hover:text-blue-600 transition-all">
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended For You */}
              <div className="space-y-6 md:space-y-8">
                <div className="bg-gray-900 rounded-[32px] md:rounded-[56px] shadow-premium p-8 md:p-12 text-white relative overflow-hidden group">
                  <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-all"></div>
                  <div className="relative z-10 space-y-6 md:space-y-8">
                    <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/40">
                      <TrendingUp size={12} /> Personalized
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black leading-[1.1]">Recommended <br className="hidden md:block" /> For You</h3>
                    <div className="space-y-4 md:space-y-6">
                      {[
                        { name: 'Elite Car Wash', rating: 4.8, cat: 'Automobile' },
                        { name: 'Yoga Bliss Studio', rating: 4.9, cat: 'Health' },
                      ].map((item, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/item">
                          <div className="flex justify-between items-start mb-2 md:mb-3">
                            <p className="font-black text-white group-hover/item:text-blue-400 transition-colors text-sm md:text-base">{item.name}</p>
                            <div className="flex items-center gap-1 text-yellow-400 font-black text-[10px] md:text-xs">
                              <Star size={10} fill="currentColor" className="md:w-3 md:h-3" /> {item.rating}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.cat}</span>
                            <div className="text-white/30 group-hover/item:text-white transition-colors">
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full bg-white text-gray-900 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 text-[10px] md:text-xs uppercase tracking-widest">
                      Explore More
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-premium p-8 md:p-10 border border-gray-100 space-y-4 md:space-y-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-blue-600 rounded-2xl md:rounded-3xl flex items-center justify-center">
                    <History size={32} className="md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900">Track Your History</h3>
                  <p className="text-gray-500 font-medium text-xs md:text-sm leading-relaxed">View all your past bookings and quotes.</p>
                  <button className="text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-widest hover:underline">Open History</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'profile' && (
          <div className="bg-white rounded-[32px] md:rounded-[56px] shadow-premium border border-gray-100 p-12 md:p-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6 md:mb-10 border-4 border-white shadow-xl">
              {activeTab === 'history' ? <History size={40} className="md:w-16 md:h-16" /> : <Settings size={40} className="md:w-16 md:h-16" />}
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 md:mb-6 capitalize">{activeTab.replace('-', ' ')} coming soon</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8 md:mb-10 text-sm md:text-lg leading-relaxed">
              We're polishing this section to give you the best possible experience. Stay tuned!
            </p>
            <button 
              onClick={() => setActiveTab('profile')} 
              className="inline-flex items-center gap-2 md:gap-3 bg-gray-900 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/20 active:scale-95 uppercase tracking-widest text-[10px] md:text-xs"
            >
              Back to Overview <ArrowRight size={18} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
