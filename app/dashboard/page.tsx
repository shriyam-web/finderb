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
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('profile');

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-accent/30 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 hidden lg:flex flex-col sticky top-0 h-screen shadow-premium">
        <div className="p-10">
          <Link href="/">
            <Image src="/logo.png" alt="Boomb Logo" width={140} height={40} className="h-10 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all
                ${activeTab === item.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                  : 'text-gray-400 hover:bg-accent hover:text-primary'}
              `}
            >
              <item.icon size={22} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-gray-100">
          <Link href="/login" className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={22} />
            Log Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-primary tracking-tight capitalize">
              {activeTab === 'profile' ? 'My Dashboard' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-gray-500 font-medium">Manage your personal preferences and saved services.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary shadow-premium transition-all">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl shadow-premium border border-gray-50">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">JD</div>
              <div>
                <p className="text-sm font-black text-primary">John Doe</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Premium User</p>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Saved Businesses', value: '12', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Total Reviews', value: '8', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                { label: 'Active Quotes', value: '3', icon: MessageSquare, color: 'text-secondary', bg: 'bg-accent' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-8 rounded-[40px] shadow-premium border border-gray-50 space-y-4">
                  <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">{stat.label}</p>
                    <p className="text-4xl font-black text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-[40px] shadow-premium border border-gray-100 p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-primary">Recent Activity</h3>
                  <button className="text-secondary font-bold text-sm hover:underline">View All</button>
                </div>
                <div className="space-y-6">
                  {[
                    { title: 'Quoted by Precision Plumbers', time: '2 hours ago', icon: Clock },
                    { title: 'Saved Luxe Law Firm to Favorites', time: 'Yesterday', icon: Heart },
                    { title: 'Reviewed Bright Smiles Dental', time: '3 days ago', icon: Star },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-accent rounded-2xl transition-all group">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all">
                        <activity.icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-primary">{activity.title}</p>
                        <p className="text-xs text-gray-400 font-medium">{activity.time}</p>
                      </div>
                      <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-primary rounded-[40px] shadow-premium p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 space-y-8">
                  <h3 className="text-2xl font-black">Complete Your Profile</h3>
                  <p className="text-blue-100 font-medium leading-relaxed">Better profiles get personalized recommendations and faster support.</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Completion Rate</span>
                      <span>85%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary w-[85%] rounded-full shadow-lg shadow-secondary/50"></div>
                    </div>
                  </div>
                  <button className="w-full bg-white text-primary py-4 rounded-2xl font-black hover:bg-secondary hover:text-white transition-all">
                    Update Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'profile' && (
          <div className="bg-white rounded-[40px] shadow-premium border border-gray-100 p-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-primary mx-auto mb-8">
              <User size={48} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-4">No {activeTab} yet</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
              This section is currently empty. Explore Boomb to find services and populate your dashboard.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary transition-all shadow-xl shadow-primary/20">
              Start Exploring <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
