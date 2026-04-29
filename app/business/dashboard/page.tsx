'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  HiOutlineSquares2X2,
  HiOutlineQueueList,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog8Tooth,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBell,
  HiOutlineArrowTrendingUp,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineEllipsisVertical,
  HiOutlinePlus,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownRight,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineBriefcase,
  HiOutlineChevronRight,
  HiOutlineCursorArrowRays,
  HiOutlineRocketLaunch,
  HiOutlineStar,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineExclamationCircle,
  HiOutlineCreditCard
} from 'react-icons/hi2';
import { RiDashboardFill, RiListCheck, RiMessage3Line, RiSettings4Line } from 'react-icons/ri';
import Link from 'next/link';
import Image from 'next/image';
import { getBusiness, updateBusinessImages } from '@/app/actions/business';
import { CldUploadWidget } from 'next-cloudinary';

function DashboardContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [profilePictureUrl, setprofilePictureUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (id) {
        const res = await getBusiness(id);
        if (res.success) {
          setBusiness(res.business);
          setImages(res.business.images || []);
          setprofilePictureUrl(res.business.profilePictureUrl || null);
        }
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [id]);

  const handleUploadSuccess = async (result: any) => {
    console.log('Upload result:', result);
    if (result.event === 'success') {
      const newImageUrl = result.info.secure_url;
      const updatedImages = [...images, newImageUrl].slice(0, 5);
      setImages(updatedImages);
      
      // Auto set as profile if none exists
      let newProfilePic = profilePictureUrl;
      if (!newProfilePic) {
        newProfilePic = newImageUrl;
        setprofilePictureUrl(newImageUrl);
      }

      if (id) {
        setUpdating(true);
        const res = await updateBusinessImages(id, updatedImages, newProfilePic || undefined);
        setUpdating(false);
        if (!res.success) {
          alert('Failed to update business images: ' + res.error);
        }
      }
    }
  };

  const handleDeleteImage = async (urlToDelete: string) => {
    const updatedImages = images.filter(url => url !== urlToDelete);
    let newProfilePic = profilePictureUrl;
    if (profilePictureUrl === urlToDelete) {
      newProfilePic = updatedImages.length > 0 ? updatedImages[0] : null;
    }
    
    const prevImages = [...images];
    const prevProfile = profilePictureUrl;

    setImages(updatedImages);
    setprofilePictureUrl(newProfilePic);

    if (id) {
      setUpdating(true);
      const res = await updateBusinessImages(id, updatedImages, newProfilePic || undefined);
      setUpdating(false);
      if (!res.success) {
        setImages(prevImages);
        setprofilePictureUrl(prevProfile);
        alert('Failed to delete image: ' + res.error);
      }
    }
  };

  const handleSetProfile = async (url: string) => {
    const prevProfile = profilePictureUrl;
    setprofilePictureUrl(url);
    if (id) {
      setUpdating(true);
      const res = await updateBusinessImages(id, images, url);
      setUpdating(false);
      if (!res.success) {
        setprofilePictureUrl(prevProfile);
        alert('Failed to set profile picture: ' + res.error);
      }
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Performance', icon: HiOutlineSquares2X2, activeIcon: RiDashboardFill },
    { id: 'listings', label: 'My Listings', icon: HiOutlineQueueList, activeIcon: RiListCheck },
    { id: 'leads', label: 'Lead Center', icon: HiOutlineCursorArrowRays, activeIcon: HiOutlineCursorArrowRays },
    { id: 'messages', label: 'Messages', icon: HiOutlineChatBubbleLeftRight, activeIcon: RiMessage3Line },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog8Tooth, activeIcon: RiSettings4Line },
  ];

  const stats = [
    { label: 'Total Views', value: '1,284', change: '+12.5%', isUp: true, icon: HiOutlineEye, sub: 'from last month' },
    { label: 'New Leads', value: '42', change: '+18.2%', isUp: true, icon: HiOutlineUsers, sub: 'high intent buyers' },
    { label: 'Avg. Rating', value: '4.8', change: '-2.1%', isUp: false, icon: HiOutlineArrowTrendingUp, sub: '840 reviews total' },
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
  
  // Calculate Profile Completion
  const calculateCompletion = () => {
    let score = 40; // Base score for registration
    if (business?.panNumber) score += 15;
    if (business?.aadharNumber) score += 15;
    if (business?.paymentStatus === 'completed') score += 30;
    return score;
  };
  const completionPercent = calculateCompletion();

  const mockSearchCount = Math.floor(Math.random() * 500) + 100;

  const mockLeads = [
    { name: 'Amit Sharma', service: 'Leak Repair', status: 'New Lead', color: 'bg-blue-600', time: '14 min ago' },
    { name: 'Priya Patel', service: 'House Inspection', status: 'Contacted', color: 'bg-amber-500', time: '2 hours ago' },
    { name: 'Rahul Varma', service: 'Pipe Installation', status: 'Completed', color: 'bg-green-500', time: 'Yesterday' },
    { name: 'Sneha Gupta', service: 'Drain Cleaning', status: 'New Lead', color: 'bg-blue-600', time: '3 days ago' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans selection:bg-indigo-100">
      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex items-center justify-between z-[60] shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {menuItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            {activeTab === item.id ? <item.activeIcon size={22} /> : <item.icon size={22} />}
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`flex flex-col items-center gap-1 transition-all ${
            isSidebarOpen ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          <HiOutlineBars3 size={22} />
          <span className="text-[10px] font-bold tracking-tight">More</span>
        </button>
      </nav>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white p-4 flex items-center justify-between sticky top-0 z-[60] border-b border-gray-100">
        <Link href="/" className="group">
          <Image src="/logo1.png" alt="FinderB Logo" width={100} height={30} className="h-8 w-auto" />
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-900 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          {isSidebarOpen ? <HiOutlineXMark size={24} /> : <HiOutlineBars3 size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[55] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-[58] transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 hidden lg:block">
          <Link href="/" className="group flex items-center gap-3">
            <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">F</span>
            </div>
            <Image src="/logo1.png" alt="FinderB Logo" width={110} height={32} className="h-8 w-auto" />
          </Link>
          <div className="mt-6 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
            <HiOutlineShieldCheck size={14} /> {business?.isVerified ? 'Verified Partner' : 'Standard Partner'}
          </div>
        </div>

        {/* Mobile Sidebar Brand Info */}
        <div className="p-6 lg:hidden border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
            <HiOutlineShieldCheck size={14} /> {business?.isVerified ? 'Verified Partner' : 'Standard Partner'}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-900">
            <HiOutlineXMark size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <div className={`transition-all duration-300 ${activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}>
                {activeTab === item.id ? <item.activeIcon size={20} /> : <item.icon size={20} />}
              </div>
              <span className="tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1 h-5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Profile Completion Meter */}
        <div className="px-6 mb-4 mt-4 hidden lg:block">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Profile Status</span>
              <span className="text-[10px] font-black text-indigo-600">{completionPercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
            {completionPercent < 100 && (
              <Link 
                href={isKycPending ? `/business/kyc/${id}` : isPaymentPending ? `/business/payment/${id}` : '#'}
                className="flex items-center justify-between group/btn pt-1"
              >
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest group-hover/btn:text-indigo-600 transition-colors">Finish Setup</span>
                <HiOutlineChevronRight size={12} className="text-slate-400 group-hover/btn:text-indigo-600 group-hover/btn:translate-x-0.5 transition-all" />
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 space-y-4">
          <div className="bg-slate-900 p-5 rounded-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                <HiOutlineRocketLaunch size={14} className="text-indigo-300" />
              </div>
              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Plan Status</p>
                <p className="text-xs text-white font-semibold">{isPaymentPending ? 'Free Listing' : 'Premium Partner'}</p>
              </div>
              {isPaymentPending ? (
                <Link href={`/business/payment/${id}`} className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                  Activate Leads
                </Link>
              ) : (
                <button className="w-full bg-white/10 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all">
                  Details
                </button>
              )}
            </div>
          </div>
          
          <Link href="/business/login" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all group">
            <HiOutlineArrowLeftOnRectangle size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 relative overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 md:mb-14 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-lg text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100/50">
              <HiOutlineBriefcase size={14} /> Professional Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab === 'overview' ? 'Performance' : activeTab === 'leads' ? 'Lead Center' : activeTab}
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">Monitoring <span className="text-indigo-600 font-bold">{businessName}</span></p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] text-xs uppercase tracking-wider">
              <HiOutlinePlus size={18} />
              New Listing
            </button>
            <button className="w-11 h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm transition-all relative group border border-gray-100">
              <HiOutlineBell size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {(activeTab === 'overview' || activeTab === 'leads') && (
          <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Urgent Actions */}
            {(isKycPending || isPaymentPending) && (activeTab === 'overview' || activeTab === 'leads') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                {isKycPending && (
                  <div className="bg-white border border-amber-100 rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100/50">
                      <HiOutlineExclamationCircle size={24} />
                    </div>
                    <div className="flex-grow space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">KYC Required</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">Verification is pending. Submit documents to unlock your verified badge.</p>
                      <Link href={`/business/kyc/${id}`} className="inline-flex items-center gap-1 text-indigo-600 font-bold text-[10px] uppercase tracking-wider hover:text-indigo-700 pt-1.5 transition-colors group/link">
                        Verify Now <HiOutlineChevronRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
                {isPaymentPending && (
                  <div className="bg-white border border-indigo-100 rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-sm">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <HiOutlineCreditCard size={24} />
                    </div>
                    <div className="flex-grow space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">Lead Activation Needed</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">Your business is listed for free! Activate leads to see customer details.</p>
                      <Link href={`/business/payment/${id}`} className="inline-flex items-center gap-1 text-indigo-600 font-bold text-[10px] uppercase tracking-wider hover:text-indigo-700 pt-1.5 transition-colors group/link">
                        Activate Now <HiOutlineChevronRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats - Only on Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <stat.icon size={22} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${
                          stat.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                        }`}>
                          {stat.isUp ? <HiOutlineArrowUpRight size={12} /> : <HiOutlineArrowDownRight size={12} />}
                          {stat.change}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">{stat.value}</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <HiOutlineClock size={12} />
                        {stat.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`grid grid-cols-1 ${activeTab === 'overview' ? 'lg:grid-cols-3' : ''} gap-8 md:gap-12`}>
              {/* Leads Table Section */}
              <div className={`${activeTab === 'overview' ? 'lg:col-span-2' : ''} space-y-6`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeTab === 'overview' ? 'Recent Activity' : 'Lead Activity'}</h2>
                  <button className="text-indigo-600 font-bold text-xs hover:underline flex items-center gap-1">
                    View All <HiOutlineChevronRight size={14} />
                  </button>
                </div>
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {isPaymentPending ? (
                    <div className="p-12 text-center space-y-6">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                        <HiOutlineCursorArrowRays size={32} className="animate-pulse" />
                      </div>
                      <div className="max-w-sm mx-auto space-y-2">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">
                          <span className="text-indigo-600">{mockSearchCount}</span> Active Leads Found
                        </h4>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          Customers are searching for your expertise. Activate leads to unlock direct contact details.
                        </p>
                      </div>
                      <Link 
                        href={`/business/payment/${id}`}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
                      >
                        <HiOutlineRocketLaunch size={18} /> Activate to View
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-gray-100">
                              <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                              <th className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inquiry</th>
                              <th className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                              <th className="px-8 py-5 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {mockLeads.map((lead, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors group/row">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                                      {lead.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                                      <p className="text-slate-400 text-[10px] font-medium">{lead.time}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6">
                                  <span className="text-slate-600 font-semibold text-sm">{lead.service}</span>
                                </td>
                                <td className="py-6">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                    lead.status === 'New Lead' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                    lead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  }`}>
                                    {lead.status}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                                    <HiOutlineEllipsisVertical size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card Layout */}
                      <div className="md:hidden divide-y divide-gray-100">
                        {mockLeads.map((lead, i) => (
                          <div key={i} className="p-5 flex items-center justify-between group bg-white active:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-medium text-slate-400">{lead.time}</span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className="text-[9px] font-bold text-indigo-600">{lead.service}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider border ${
                                lead.status === 'New Lead' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                lead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {lead.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions & Insight - Only on Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-[32px] shadow-sm p-8 border border-gray-100 space-y-8 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Analytics</h3>
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <HiOutlineArrowTrendingUp size={16} />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {[
                        { label: 'Profile Traffic', value: 85, color: 'bg-indigo-600' },
                        { label: 'Conversion Rate', value: 34, color: 'bg-emerald-500' },
                        { label: 'Response Time', value: 92, color: 'bg-amber-500' },
                      ].map((item) => (
                        <div key={item.label} className="space-y-2.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>{item.label}</span>
                            <span className="text-slate-900">{item.value}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color} rounded-full transition-all duration-1000 group-hover:opacity-80`} 
                              style={{ width: `${item.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full bg-slate-50 text-slate-900 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all active:scale-95 border border-slate-100">
                      Detailed Report
                    </button>
                  </div>

                  <div className="bg-slate-900 rounded-[32px] shadow-premium p-8 text-white space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="relative z-10 space-y-6">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <HiOutlineStar size={24} className="text-amber-400" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold tracking-tight">Pro Tip</h4>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">Optimization can boost your visibility by up to 40%. Start now.</p>
                      </div>
                      <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors group/link">
                        Get Started <HiOutlineChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-[32px] shadow-sm p-8 border border-gray-100 space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Business Media</h3>
                <p className="text-slate-500 text-sm">Manage your business photos. You can upload up to 5 images and select one as your profile picture.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
                    <Image 
                      src={url} 
                      alt={`Business ${index + 1}`} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button 
                        onClick={() => handleSetProfile(url)}
                        className={`p-2 rounded-lg text-white transition-all ${profilePictureUrl === url ? 'bg-indigo-600' : 'bg-white/20 hover:bg-white/40'}`}
                        title="Set as Profile Picture"
                      >
                        <HiOutlineStar size={18} fill={profilePictureUrl === url ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => handleDeleteImage(url)}
                        className="p-2 bg-rose-600/80 hover:bg-rose-600 rounded-lg text-white transition-all"
                        title="Delete Image"
                      >
                        <HiOutlineXMark size={18} />
                      </button>
                    </div>
                    {profilePictureUrl === url && (
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                        Profile
                      </div>
                    )}
                  </div>
                ))}
                
                {images.length < 5 && (
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={handleUploadSuccess}
                    options={{
                      maxFiles: 5 - images.length,
                      resourceType: 'image',
                      clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp'],
                      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                    }}
                  >
                    {({ open }) => (
                      <button 
                        onClick={() => open()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-100/50 transition-colors">
                          <HiOutlinePlus size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              {images.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <HiOutlineBriefcase size={32} />
                  </div>
                  <h4 className="text-slate-900 font-bold mb-1">No Photos Yet</h4>
                  <p className="text-slate-500 text-xs">Add photos of your business to attract more customers.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

export default function BusinessDashboard() {
  return <DashboardContent />;
}
