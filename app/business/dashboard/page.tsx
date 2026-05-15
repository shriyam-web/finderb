'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  HiOutlineCreditCard,
  HiOutlineClipboardDocumentCheck,
  HiOutlineClipboardDocument,
  HiChevronDown,
  HiChevronUp,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile
} from 'react-icons/hi2';
import { RiDashboardFill, RiListCheck, RiMessage3Line, RiSettings4Line } from 'react-icons/ri';
import { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { getBusiness, updateBusinessImages, getBusinessSession, logoutBusiness, updateBusinessProfile } from '@/app/actions/business';
import SettingsTab from './components/SettingsTab';
import JobPostingTab from './components/JobPostingTab';
import MessagesTab from './components/MessagesTab';
import { CldUploadWidget } from 'next-cloudinary';
import { createClient } from '@/utils/supabase/client';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [profilePictureUrl, setprofilePictureUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>(['merchant']);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const discountOptions = [
    'No Discount',
    '5% - 10% OFF',
    '10% - 20% OFF',
    '20% - 30% OFF',
    '30% - 40% OFF',
    'Up to 50% OFF',
    'Special Festive Discount',
    'Seasonal Offer'
  ];
  
  // New Profile Fields State
  const [profileData, setProfileData] = useState({
    yearsInBusiness: business?.yearsInBusiness || 0,
    displayName: business?.displayName || '',
    businessName: business?.businessName || '',
    category: business?.category || '',
    publicPhone: business?.publicPhone || '',
    businessAddress: business?.businessAddress || '',
    city: business?.city || '',
    state: business?.state || '',
    country: business?.country || '',
    latitude: business?.latitude || 0,
    longitude: business?.longitude || 0,
    website: business?.website || '',
    instagramUrl: business?.instagramUrl || '',
    facebookUrl: business?.facebookUrl || '',
    whatsappNumber: business?.whatsappNumber || '',
    youtubeUrl: business?.youtubeUrl || '',
    about: business?.about || '',
    keywords: business?.keywords || [],
    email: business?.email || '',
    timings: business?.timings || {},
    discountRange: business?.discountRange || '',
    serviceCategory: business?.serviceCategory || '',
    paymentModes: business?.paymentModes || [],
    profileQrLink: business?.profileQrLink || '',
    review: business?.review || {},
    reviewReply: business?.reviewReply || {},
    rating: business?.rating || 0,
    isFinderBVerified: business?.isFinderBVerified || false,
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      let currentId = id;

      if (!currentId) {
        const sessionRes = await getBusinessSession();
        if (sessionRes && sessionRes.success && sessionRes.business) {
          currentId = sessionRes.business.id;
        }
      }

      if (currentId) {
        const res = await getBusiness(currentId);
        if (res.success && res.business) {
          setBusiness(res.business);
          setImages(res.business.images || []);
          setprofilePictureUrl(res.business.profilePictureUrl || null);
            setProfileData({
            rating: res.business.rating || 0,
            yearsInBusiness: res.business.yearsInBusiness || 0,
            displayName: res.business.displayName || '',
            businessName: res.business.businessName || '',
            category: res.business.category || '',
            publicPhone: res.business.publicPhone || '',
            businessAddress: res.business.businessAddress || '',
            city: res.business.city || '',
            state: res.business.state || '',
            country: res.business.country || '',
            isFinderBVerified: res.business.isFinderBVerified || false,
            review: res.business.review || {},
            reviewReply: res.business.reviewReply || {},
            latitude: res.business.latitude || 0,
            longitude: res.business.longitude || 0,
            website: res.business.website || '',
            instagramUrl: res.business.instagramUrl || '',
            facebookUrl: res.business.facebookUrl || '',
            whatsappNumber: res.business.whatsappNumber || '',
            youtubeUrl: res.business.youtubeUrl || '',
            about: res.business.about || '',
            keywords: res.business.keywords || [],
            email: res.business.email || '',
            timings: res.business.timings || {},
            discountRange: res.business.discountRange || '',
            serviceCategory: res.business.serviceCategory || '',
            paymentModes: res.business.paymentModes || [],
            profileQrLink: res.business.profileQrLink || '',
          });
        } else if (!id) {
          router.push('/business/login');
        }
      } else {
        router.push('/business/login');
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [id, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const merchantNotifications = data.filter((n: any) => 
          n.target_audience.includes('merchants') || 
          n.target_audience.includes('all') ||
          (business?.category && n.target_audience.includes(business.category))
        );
        setNotifications(merchantNotifications);
        setUnreadCount(merchantNotifications.length);
      }
    };

    if (business) {
      fetchNotifications();
    }
  }, [business]);

  const businessId = id || business?.id;

  const handleLogout = async () => {
    const res = await logoutBusiness();
    if (res.success) {
      router.push('/business/login');
    } else {
      alert('Failed to logout');
    }
  };

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

      if (businessId) {
        setUpdating(true);
        const res = await updateBusinessImages(businessId, updatedImages, newProfilePic || undefined);
        setUpdating(false);
        if (res.success) {
          setSuccessMessage('Image uploaded successfully');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          alert('Failed to update business images: ' + res.error);
        }
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    
    const urlToDelete = imageToDelete;
    const updatedImages = images.filter(url => url !== urlToDelete);
    let newProfilePic = profilePictureUrl;
    if (profilePictureUrl === urlToDelete) {
      newProfilePic = updatedImages.length > 0 ? updatedImages[0] : null;
    }
    
    const prevImages = [...images];
    const prevProfile = profilePictureUrl;

    setImages(updatedImages);
    setprofilePictureUrl(newProfilePic);
    setShowDeleteModal(false);
    setImageToDelete(null);

    if (businessId) {
      setUpdating(true);
      const res = await updateBusinessImages(businessId, updatedImages, newProfilePic || undefined);
      setUpdating(false);
      if (res.success) {
        setSuccessMessage('Image deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setImages(prevImages);
        setprofilePictureUrl(prevProfile);
        alert('Failed to delete image: ' + res.error);
      }
    }
  };

  const handleSetProfile = async (url: string) => {
    const prevProfile = profilePictureUrl;
    setprofilePictureUrl(url);
    if (businessId) {
      setUpdating(true);
      const res = await updateBusinessImages(businessId, images, url);
      setUpdating(false);
      if (res.success) {
        setSuccessMessage('Profile picture updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setprofilePictureUrl(prevProfile);
        alert('Failed to set profile picture: ' + res.error);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    setUpdating(true);
    const res = await updateBusinessProfile(businessId, profileData);
    setUpdating(false);

    if (res.success) {
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setBusiness(res.business);
    } else {
      alert('Failed to update profile: ' + res.error);
    }
  };

  const updateField = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const menuItems = [
    { id: 'overview', label: 'Performance', icon: HiOutlineSquares2X2, activeIcon: RiDashboardFill },
    { id: 'listings', label: 'My Listings', icon: HiOutlineQueueList, activeIcon: RiListCheck },
    { id: 'leads', label: 'Lead Center', icon: HiOutlineCursorArrowRays, activeIcon: HiOutlineCursorArrowRays },
    { id: 'jobs', label: 'Jobs', icon: HiOutlineBriefcase, activeIcon: HiOutlineBriefcase },
    { id: 'messages', label: 'Messages', icon: HiOutlineChatBubbleLeftRight, activeIcon: RiMessage3Line },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog8Tooth, activeIcon: RiSettings4Line },
  ];

  const stats = [
    { label: 'Total Views', value: '1,284', change: '+12.5%', isUp: true, icon: HiOutlineEye, sub: 'from last month' },
    { label: 'New Leads', value: '42', change: '+18.2%', isUp: true, icon: HiOutlineUsers, sub: 'high intent buyers' },
    { label: 'Avg. Rating', value: '4.8', change: '-2.1%', isUp: false, icon: HiOutlineArrowTrendingUp, sub: '840 reviews total' },
  ];

  const [mockSearchCount, setMockSearchCount] = useState(0);

  useEffect(() => {
    setMockSearchCount(Math.floor(Math.random() * 500) + 100);
  }, []);

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
  const isKycNotApproved = business?.kycStatus !== 'approved';
  const isPaymentNotCompleted = business?.paymentStatus !== 'completed';
  
  // Calculate Profile Completion
  const getProfileCompletion = () => {
    const fields = [
      { key: 'businessName', label: 'Business Name' },
      { key: 'category', label: 'Business Category' },
      { key: 'publicPhone', label: 'Public Phone' },
      { key: 'businessAddress', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'country', label: 'Country' },
      { key: 'about', label: 'About Business' },
      { key: 'profilePictureUrl', label: 'Profile Picture' },
      { key: 'panNumber', label: 'PAN Number' },
      { key: 'aadharNumber', label: 'Aadhar Number' },
      { key: 'panUrl', label: 'PAN Document' },
      { key: 'aadharUrl', label: 'Aadhar Document' },
      { key: 'msmeGstUrl', label: 'MSME/GST Document' },
      { key: 'registrationNumber', label: 'Registration Number' },
      { key: 'timings', label: 'Business Timings' },
      { key: 'yearsInBusiness', label: 'Years in Business' },
      { key: 'serviceCategory', label: 'Service Category' },
      { key: 'website', label: 'Website' },
      { key: 'facebookUrl', label: 'Facebook URL' },
      { key: 'instagramUrl', label: 'Instagram URL' },
      { key: 'youtubeUrl', label: 'Youtube URL' },
      { key: 'whatsappNumber', label: 'Whatsapp Number' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
    ];

    const missingFields: string[] = [];
    let completedCount = 0;

    fields.forEach(field => {
      const value = business?.[field.key as keyof any];
      const isCompleted = value !== undefined && value !== null && value !== '' && 
        (typeof value !== 'object' || Object.keys(value).length > 0) &&
        (field.key !== 'latitude' || value !== 0) &&
        (field.key !== 'longitude' || value !== 0);

      if (isCompleted) {
        completedCount++;
      } else {
        missingFields.push(field.label);
      }
    });

    if (business?.images && business.images.length > 0) {
      completedCount++;
    } else {
      missingFields.push('Business Images');
    }
    
    if (business?.paymentModes && business.paymentModes.length > 0) {
      completedCount++;
    } else {
      missingFields.push('Payment Modes');
    }

    const totalFields = fields.length + 2;
    const percentage = Math.round((completedCount / totalFields) * 100);

    return { percentage, missingFields };
  };
  const { percentage: completionPercent, missingFields } = getProfileCompletion();

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
          <Image src="/businesslogo.png" alt="FinderB Logo" width={100} height={30} className="h-8 w-auto" />
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
        fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-[58] transition-all duration-300 ease-in-out pt-20 lg:pt-0 pb-32 lg:pb-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 hidden lg:block">
          <Link href="/" className="group flex items-center gap-3">
            {/* <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">F</span>
            </div> */}
            <Image src="/businesslogo.png" alt="FinderB Logo" width={130} height={40} className="h-9 w-auto" />
          </Link>
          {/* <div className="mt-6 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
            <HiOutlineShieldCheck size={14} /> {business?.isVerified ? 'Verified Partner' : 'Standard Partner'}
          </div> */}
        </div>

        {/* Mobile Sidebar Brand Info */}
        {/* <div className="p-6 lg:hidden border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
            <HiOutlineShieldCheck size={14} /> {business?.isVerified ? 'Verified Partner' : 'Standard Partner'}
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-900">
            <HiOutlineXMark size={24} />
          </button>
        </div> */}

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

        <div className="px-6 mb-4">
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
                <Link href={`/business/payment/${businessId}`} className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                  Activate Leads
                </Link>
              ) : (
                <button className="w-full bg-white/10 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all">
                  Details
                </button>
              )}
            </div>
          </div>
        </div>


        <div className="p-6 border-t border-gray-100 space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all group"
          >
            <HiOutlineArrowLeftOnRectangle size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 relative overflow-x-hidden">
        <header className="flex items-center justify-between gap-4 mb-8 md:mb-14 relative z-[30]">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab === 'overview' ? 'Performance' : activeTab === 'leads' ? 'Lead Center' : activeTab}
            </h1>
            <p className="text-slate-500 text-xs md:text-base font-medium hidden sm:block">Monitoring <span className="text-indigo-600 font-bold">{businessName}</span></p>
          </div>
          
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm transition-all relative group border border-gray-100"
            >
              <HiOutlineBell size={22} className="group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl py-6 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-6 mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h3>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wider">{notifications.length} New</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto px-2">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div key={i} className="px-4 py-4 hover:bg-slate-50 rounded-2xl transition-all border-b border-slate-50 last:border-0 group">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                              <HiOutlineBell className="text-indigo-600" size={20} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-900 leading-tight">{n.title}</p>
                              <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-slate-400 font-medium pt-1">
                                {new Date(n.created_at).toLocaleDateString(undefined, { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HiOutlineBell className="text-slate-200" size={32} />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {(activeTab === 'overview' || activeTab === 'leads' || activeTab === 'listings') && (
          <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Alerts for Merchant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isPaymentNotCompleted && (
                <div className="group bg-white border border-amber-100 rounded-[24px] p-4 md:p-6 flex items-start gap-3 md:gap-5 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <HiOutlineCreditCard className="text-amber-600 animate-pulse" size={20} />
                  </div>
                  <div className="space-y-1.5 md:space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-sm md:text-base font-black text-slate-900 tracking-tight">Payment Pending</p>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full uppercase tracking-widest">Urgent</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                      Your payment is pending. With this status, <span className="text-amber-700 font-bold">you might not be getting business.</span>
                    </p>
                    <Link 
                      href={`/business/payment/${businessId}`} 
                      className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95 mt-1 md:mt-2"
                    >
                      Complete Payment <HiOutlineChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
              {isKycNotApproved && (
                <div className="group bg-white border border-indigo-100 rounded-[24px] p-4 md:p-6 flex items-start gap-3 md:gap-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <HiOutlineClipboardDocumentCheck className="text-indigo-600 animate-pulse" size={20} />
                  </div>
                  <div className="space-y-1.5 md:space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-sm md:text-base font-black text-slate-900 tracking-tight">KYC Verification</p>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-full uppercase tracking-widest">Incomplete</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                      Your KYC isn't completed yet. Kindly <span className="text-indigo-600 font-bold">submit your documents to get full access and higher visibility</span> for your business.
                    </p>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 mt-1 md:mt-2"
                    >
                      Verify Now <HiOutlineChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* My Listing Preview Section */}
            {activeTab === 'listings' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profile Preview</h2>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">This is how your business profile appears to potential customers on FinderB.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link 
                      href={`/business/${businessId}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                    >
                      <HiOutlineEye size={18} /> View Public Profile
                    </Link>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                      <HiOutlineCog8Tooth size={18} /> Edit Profile
                    </button>
                  </div>
                </div>

                {/* Simulated Profile Preview Card */}
                <div className="border border-slate-100 rounded-[40px] overflow-hidden bg-white shadow-premium relative">
                  {/* Hero Cover */}
                  <div className="relative h-64 md:h-80 bg-slate-200">
                    {images && images.length > 0 ? (
                      <Image 
                        src={images[0]} 
                        alt="Profile Cover" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                        <HiOutlinePlus size={48} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                    
                    <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-3xl border-4 border-white shadow-2xl overflow-hidden relative shrink-0">
                          {profilePictureUrl ? (
                            <Image 
                              src={profilePictureUrl} 
                              alt="Logo" 
                              fill 
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-300">
                              <HiOutlineUsers size={40} />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5 pb-2">
                          <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{businessName}</h1>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                            <span className="text-[9px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                              {profileData.category || 'General Business'}
                            </span>
                            <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                              <HiOutlineStar size={14} className="text-amber-400 fill-amber-400" />
                              <span className="text-xs font-black text-white">{profileData.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                            {profileData.isFinderBVerified && (
                              <div className="flex items-center gap-1.5 bg-indigo-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-400/30">
                                <HiOutlineShieldCheck size={14} className="text-indigo-300" />
                                <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Verified</span>
                              </div>
                            )}
                            {profileData.discountRange && profileData.discountRange !== 'No Discount' && (
                              <div className="flex items-center gap-1.5 bg-rose-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-rose-400/30">
                                <HiOutlineStar size={14} className="text-rose-300" />
                                <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">{profileData.discountRange}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="p-4 sm:p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: About & Media */}
                    <div className="md:col-span-7 space-y-10 md:space-y-12">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                          About the Business
                        </h4>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                          {profileData.about || "No description provided yet. Update your profile to tell customers about your expertise and services."}
                        </p>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                          Business Highlights
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {profileData.serviceCategory && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Category</p>
                              <p className="text-sm font-bold text-slate-900">{profileData.serviceCategory}</p>
                            </div>
                          )}
                          {profileData.paymentModes && profileData.paymentModes.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accepted Payments</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData.paymentModes.map((mode: string, idx: number) => (
                                  <span key={idx} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{mode}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {profileData.keywords && profileData.keywords.length > 0 && (
                            <div className="space-y-2 md:col-span-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Keywords / Tags</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData.keywords.map((tag: string, idx: number) => (
                                  <span key={idx} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">#{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {profileData.yearsInBusiness > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                               <HiOutlineBriefcase size={20} />
                             </div>
                             <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                               <p className="text-sm font-bold text-slate-900">{profileData.yearsInBusiness} Years+</p>
                             </div>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                               <HiOutlineClock size={20} />
                             </div>
                             <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Response</p>
                               <p className="text-sm font-bold text-slate-900">Quick Reply</p>
                             </div>
                           </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                            Business Gallery
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">{images?.length || 0}/5 Photos</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {images && images.length > 0 ? images.map((img, i) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm relative group">
                              <Image src={img} alt={`Business ${i}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                          )) : (
                            <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActiveTab('settings')}>
                              <HiOutlinePlus size={24} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Add Photos</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Contact & Info */}
                    <div className="md:col-span-5 space-y-8">
                      {/* Contact Card */}
                      <div className="bg-slate-50 rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-8">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">Contact Details</h4>
                        
                        <div className="space-y-6">
                          <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <HiOutlineDevicePhoneMobile size={20} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile Number</p>
                              <p className="text-sm font-bold text-slate-900">{profileData.publicPhone || 'Not Provided'}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <HiOutlineEnvelope size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                              <p className="text-sm font-bold text-slate-900 break-all">{profileData.email || 'Not Provided'}</p>
                            </div>
                          </div>

                          {profileData.website && (
                            <div className="flex items-start gap-4 group">
                              <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <HiOutlineGlobeAlt size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Official Website</p>
                                <p className="text-sm font-bold text-indigo-600 truncate">{profileData.website}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <HiOutlineMapPin size={20} />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Business Address</p>
                              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                                {profileData.businessAddress || 'No address added'}
                                {(profileData.city || profileData.state) && (
                                  <span className="block text-slate-500 font-medium">
                                    {[profileData.city, profileData.state, profileData.country].filter(Boolean).join(', ')}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="pt-8 border-t border-slate-200">
                          <div className="flex gap-4">
                            {profileData.instagramUrl && (
                              <a href={profileData.instagramUrl} target="_blank" className="w-10 h-10 bg-white text-pink-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                                <FaInstagram size={20} />
                              </a>
                            )}
                            {profileData.facebookUrl && (
                              <a href={profileData.facebookUrl} target="_blank" className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                                <FaFacebook size={20} />
                              </a>
                            )}
                            {profileData.youtubeUrl && (
                              <a href={profileData.youtubeUrl} target="_blank" className="w-10 h-10 bg-white text-red-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                                <FaYoutube size={20} />
                              </a>
                            )}
                            {profileData.whatsappNumber && (
                              <a href={`https://wa.me/${profileData.whatsappNumber.replace(/\D/g, '')}`} target="_blank" className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                                <FaWhatsapp size={20} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timings Card */}
                      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Business Timings</h4>
                          <HiOutlineClock className="text-slate-300" size={18} />
                        </div>
                        <div className="space-y-3">
                          {days.map((day) => {
                            const timing = profileData.timings?.[day];
                            const isClosed = !timing || timing === 'Closed' || timing.isClosed;
                            return (
                              <div key={day} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                                <span className="text-xs font-bold text-slate-500">{day}</span>
                                <span className={`text-xs font-black ${isClosed ? 'text-rose-500' : 'text-slate-900'}`}>
                                  {isClosed ? 'Closed' : (typeof timing === 'string' ? timing : `${timing.open} - ${timing.close}`)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Reviews & Replies */}
                    <div className="lg:col-span-12 pt-10 border-t border-slate-100 space-y-8">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                          Customer Reviews & Feedback
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {profileData.review && (typeof profileData.review === 'object' ? Object.keys(profileData.review).length > 0 : profileData.review.length > 0) ? (
                            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Featured Review</p>
                                  <div className="flex text-amber-400 gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <HiOutlineStar key={i} size={14} fill={i < (profileData.rating || 5) ? "currentColor" : "none"} />
                                    ))}
                                  </div>
                                </div>
                                {typeof profileData.review === 'object' && (profileData.review as any).date && (
                                  <span className="text-[10px] font-bold text-slate-400">{(profileData.review as any).date}</span>
                                )}
                              </div>
                              <p className="text-slate-700 text-sm italic leading-relaxed">
                                "{typeof profileData.review === 'object' ? (profileData.review as any).content || (profileData.review as any).text || '' : profileData.review}"
                              </p>
                              {typeof profileData.review === 'object' && (profileData.review as any).author && (
                                <p className="text-xs font-black text-slate-900">— {(profileData.review as any).author}</p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-8 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300">
                                <HiOutlineChatBubbleLeftRight size={24} />
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No reviews yet</p>
                            </div>
                          )}

                          {profileData.reviewReply && (typeof profileData.reviewReply === 'object' ? (profileData.reviewReply as any).content : profileData.reviewReply) ? (
                            <div className="bg-indigo-600 p-6 rounded-[32px] text-white space-y-4 shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                <HiOutlineChatBubbleLeftRight size={80} />
                              </div>
                              <div className="relative z-10 space-y-4">
                                <div>
                                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Owner's Response</p>
                                  <h5 className="font-black text-white text-sm">Thank you for your feedback!</h5>
                                </div>
                                <p className="text-indigo-50 text-sm leading-relaxed italic">
                                  "{typeof profileData.reviewReply === 'object' ? (profileData.reviewReply as any).content || '' : profileData.reviewReply}"
                                </p>
                                <div className="flex items-center gap-2 pt-2">
                                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <HiOutlineShieldCheck size={12} />
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Verified Merchant</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-900 p-8 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:bg-slate-800 transition-all" onClick={() => setActiveTab('settings')}>
                              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <HiOutlinePlus size={24} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-white uppercase tracking-widest">Set Default Reply</p>
                                <p className="text-[10px] text-slate-400 font-medium">Automatic response for new reviews</p>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Profile Completion Meter - Premium Redesign */}
            {activeTab === 'overview' && completionPercent < 100 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden group hover:shadow-premium-hover transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <HiOutlineRocketLaunch size={120} className="-rotate-12" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4 max-w-xl">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Complete Your Profile</h3>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed font-medium">
                        Boost your visibility and trust score. Businesses with 100% profile completion receive <span className="text-indigo-600 font-bold">3x more inquiries</span>.
                      </p>
                    </div>

                    {missingFields.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          Next Steps to reach 100%
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingFields.slice(0, 4).map((field) => (
                            <span key={field} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-100 hover:bg-white transition-colors">
                              + {field}
                            </span>
                          ))}
                          {missingFields.length > 4 && (
                            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
                              + {missingFields.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 group/btn"
                    >
                      Finish Setup <HiOutlineChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="shrink-0 flex flex-col items-center gap-4 bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 min-w-[200px]">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-slate-200"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={263.89}
                          strokeDashoffset={263.89 - (263.89 * completionPercent) / 100}
                          className="text-indigo-600 transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="absolute text-2xl font-black text-slate-900">{completionPercent}%</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strength Score</p>
                  </div>
                </div>
              </div>
            )}
{/* hello */}
            {/* Merchant Info Card - Premium Look */}
            {activeTab === 'overview' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-premium-hover">
                <button 
                  onClick={() => toggleAccordion('merchant')}
                  className="w-full bg-white px-6 md:px-8 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <HiOutlineBriefcase size={18} />
                    </div>
                    <h3 className="text-slate-900 font-bold text-base tracking-tight">Merchant Information</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link 
                      href={`/business/${businessId}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                      <HiOutlineEye size={16} />
                      <span className="hidden sm:inline">View Profile</span>
                    </Link>
                    <div className="h-4 w-px bg-slate-100 hidden sm:block"></div>
                    {openAccordions.includes('merchant') ? <HiChevronUp size={20} className="text-slate-400" /> : <HiChevronDown size={20} className="text-slate-400" />}
                  </div>
                </button>
                
                {openAccordions.includes('merchant') && (
                  <div className="px-6 md:px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchant ID</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded-md">{business?.registrationNumber || 'Not Generated'}</p>
                          {business?.registrationNumber && (
                            <button 
                              onClick={() => handleCopyId(business.registrationNumber)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              {copiedId ? <HiOutlineClipboardDocumentCheck size={16} className="text-emerald-500" /> : <HiOutlineClipboardDocument size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Name</p>
                        <p className="text-sm font-bold text-slate-900">{business?.businessName || business?.displayName || 'Not Set'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{business?.email || business?.workEmail || 'Not Set'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                        <p className="text-sm font-bold text-slate-900">{business?.publicPhone || business?.mobile || 'Not Set'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Status</p>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            business?.paymentStatus === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${business?.paymentStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {business?.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KYC Status</p>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            business?.kycStatus === 'verified' || business?.kycStatus === 'approved'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : business?.kycStatus === 'submitted'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              business?.kycStatus === 'verified' || business?.kycStatus === 'approved' ? 'bg-indigo-500' : 
                              business?.kycStatus === 'submitted' ? 'bg-blue-500' : 'bg-rose-500'
                            }`} />
                            {business?.kycStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Urgent Actions - Compact & Premium */}
            {(isKycPending || isPaymentPending) && (activeTab === 'overview' || activeTab === 'leads') && (
              <div className="flex flex-col sm:flex-row gap-4">
                {isKycPending && (
                  <div className="flex-1 bg-white border border-amber-100 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-amber-200 group">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-100 transition-colors">
                      <HiOutlineShieldCheck size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">KYC Pending</h4>
                      <p className="text-slate-500 text-[10px] truncate">Submit documents to verify identity.</p>
                    </div>
                    <Link href={`/business/kyc/${businessId}`} className="shrink-0 bg-amber-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-all shadow-sm">
                      Verify
                    </Link>
                  </div>
                )}
                {isPaymentPending && (
                  <div className="flex-1 bg-white border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-indigo-200 group">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                      <HiOutlineCreditCard size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Leads Inactive</h4>
                      <p className="text-slate-500 text-[10px] truncate">Activate to see customer details.</p>
                    </div>
                    <Link href={`/business/payment/${businessId}`} className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm">
                      Activate
                    </Link>
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

            {(activeTab === 'overview' || activeTab === 'leads') && (
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
                          href={`/business/payment/${businessId}`}
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
            )}
          </div>
        )}

        {activeTab === 'jobs' && businessId && (
          <JobPostingTab businessId={businessId} />
        )}

        {activeTab === 'messages' && businessId && (
          <MessagesTab businessId={businessId} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            business={business}
            profileData={profileData}
            images={images}
            profilePictureUrl={profilePictureUrl}
            updating={updating}
            successMessage={successMessage}
            updateField={updateField}
            handleUpdateProfile={handleUpdateProfile}
            handleUploadSuccess={handleUploadSuccess}
            handleSetProfile={handleSetProfile}
            setImageToDelete={setImageToDelete}
            setShowDeleteModal={setShowDeleteModal}
            showDeleteModal={showDeleteModal}
            handleDeleteImage={handleDeleteImage}
          />
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
