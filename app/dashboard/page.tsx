'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  User as UserIcon,
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
import { useSearchParams, useRouter } from 'next/navigation';
import { getUser, getSession, logoutUser } from '@/app/actions/user';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('id');
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam && ['profile', 'favorites', 'messages', 'history', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getSession();
      if (result && result.success) {
        setUser(result.user);
      } else {
        // If not logged in, redirect to login
        router.push('/login');
      }
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const menuItems = [
    { id: 'profile', label: 'My Dashboard', icon: UserIcon },
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'history', label: 'Service History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'JD';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white p-3.5 flex items-center justify-between sticky top-0 z-[60] border-b border-gray-100/80 backdrop-blur-md">
        <Link href="/">
          <Image src="/logo1.png" alt="FinderB Logo" width={90} height={28} className="h-6 w-auto" />
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[55] transition-opacity duration-300
          ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-100/80 flex flex-col z-[58] transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-6 py-8 hidden lg:block">
          <Link href="/">
            <Image src="/logo1.png" alt="FinderB Logo" width={110} height={32} className="h-7 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] transition-all
                ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={18} strokeWidth={2} className="text-gray-400 group-hover:text-red-600" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 relative overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight capitalize">
              {activeTab === 'profile' ? `Hello, ${user?.fullName?.split(' ')[0] || 'User'}` : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-gray-500 text-xs">Overview of your account activities.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:flex-none group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 w-full md:w-48 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xs"
              />
            </div>
            <button className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all relative">
              <Bell size={14} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 bg-white p-1 pr-2.5 rounded-lg border border-gray-200">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px] shadow-sm shadow-blue-200">{userInitials}</div>
              <p className="hidden sm:block text-[11px] font-semibold text-gray-700">{user?.fullName || 'User Name'}</p>
            </div>
          </div>
        </header>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Favorites', value: user?.favorites?.length || '0', icon: Heart, color: 'text-rose-500' },
                { label: 'Reviews', value: '0', icon: Star, color: 'text-amber-500' },
                { label: 'Quotes', value: '0', icon: MessageSquare, color: 'text-blue-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-5 rounded-2xl border border-gray-100/80 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-blue-100/50 transition-all duration-300">
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`p-2 rounded-xl ${stat.color} bg-gray-50 group-hover:bg-white transition-colors duration-300 border border-transparent group-hover:border-gray-100 shadow-sm`}>
                      <stat.icon size={20} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest group-hover:text-gray-400 transition-colors">{stat.label}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <TrendingUp size={10} className="text-green-500" />
                        <span className="text-[10px] font-bold text-green-500">+0%</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-1">
                    <p className="text-3xl font-black text-gray-900 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">{stat.value}</p>
                    <p className="text-gray-400 text-[11px] font-medium mt-1">Total {stat.label.toLowerCase()} saved</p>
                  </div>
                  {/* Subtle background decoration */}
                  <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-500 ${stat.color.replace('text', 'bg')}`} />
                </div>
              ))}
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm shadow-black/5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                  <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                  <button className="text-blue-600 text-[11px] font-bold hover:text-blue-700 transition-colors uppercase tracking-tight">View All</button>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-3">
                    <History size={24} />
                  </div>
                  <p className="text-gray-400 text-xs font-medium">No recent activity recorded.</p>
                  <Link href="/" className="mt-4 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-all uppercase tracking-wider">
                    Explore Services
                  </Link>
                </div>
              </div>

              {/* Quick Links / Info */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm shadow-black/5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 pb-3 border-b border-gray-50">Quick Actions</h3>
                  <div className="space-y-1.5">
                    <Link href="/" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50 group transition-all">
                      <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">Find Services</span>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                    <Link href="/business" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50 group transition-all">
                      <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">Register Business</span>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>
                </div>

                <div className="bg-blue-600 border border-blue-500 rounded-xl p-5 shadow-lg shadow-blue-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle size={14} className="text-blue-100" />
                    <h4 className="text-xs font-bold text-white">Need Help?</h4>
                  </div>
                  <p className="text-blue-100 text-[11px] mb-4 leading-relaxed font-medium">Access our help center or speak with our support team.</p>
                  <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-2 rounded-lg text-[11px] font-bold text-white transition-all backdrop-blur-sm">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
