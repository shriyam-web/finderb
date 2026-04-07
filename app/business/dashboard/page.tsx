'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  X,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getBusiness } from '@/app/actions/business';

function DashboardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (id) {
        const res = await getBusiness(id);
        if (res.success) {
          setBusiness(res.business);
        }
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const businessName = business?.businessName || 'Your Business';
  const isKycPending = business?.kycStatus === 'pending';
  const isPaymentPending = business?.paymentStatus === 'pending';

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
            <ShieldCheck size={12} /> {business?.isVerified ? 'Verified Partner' : 'Standard Partner'}
          </div>
        </div>

        {/* Mobile Sidebar Brand Info */}
        <div className="p-8 lg:hidden border-b border-white/5">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 px-4 py-1.5 rounded-full text-blue-400 font-black text-[10px] uppercase tracking-widest border border-blue-400/20">
            <ShieldCheck size={12} /> {business?.isVerified ? 'Verified Partner' : 'Standard Partner'}
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
                <p className="text-[10px] text-blue-100 font-bold">{isPaymentPending ? 'Action Required' : 'Active'}</p>
              </div>
              {isPaymentPending ? (
                <Link href={`/business/payment/${id}`} className="block w-full text-center bg-white text-blue-600 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">
                  Upgrade Now
                </Link>
              ) : (
                <button className="w-full bg-white text-blue-600 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg">
                  Manage Plan
                </button>
              )}
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
            <p className="text-gray-500 text-sm md:text-lg font-medium">Tracking performance for <span className="text-blue-600 font-black">{businessName}</span></p>
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
            {/* Urgent Actions */}
            {(isKycPending || isPaymentPending) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isKycPending && (
                  <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div className="flex-grow space-y-2">
                      <h4 className="font-black text-amber-900 text-sm uppercase tracking-wider">KYC Verification Pending</h4>
                      <p className="text-amber-700 text-xs font-medium">Your business is not yet verified. Submit documents to get the verified badge.</p>
                      <Link href={`/business/kyc/${id}`} className="inline-flex items-center gap-2 text-amber-900 font-black text-[10px] uppercase tracking-widest hover:underline pt-2">
                        Complete KYC <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
                {isPaymentPending && (
                  <div className="bg-blue-50 border border-blue-100 rounded-[32px] p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <CreditCard size={24} />
                    </div>
                    <div className="flex-grow space-y-2">
                      <h4 className="font-black text-blue-900 text-sm uppercase tracking-wider">Payment Required</h4>
                      <p className="text-blue-700 text-xs font-medium">Activate your Growth Pro plan to unlock all premium features and leads.</p>
                      <Link href={`/business/payment/${id}`} className="inline-flex items-center gap-2 text-blue-900 font-black text-[10px] uppercase tracking-widest hover:underline pt-2">
                        Process Payment <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  <div className="relative z-10 space-y-6">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                      <Star className="text-amber-400 fill-amber-400" size={28} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black italic tracking-tight">Pro Insights</h4>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Boost your conversion by 40% with optimized profile images.</p>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                      Learn More <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BusinessDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
