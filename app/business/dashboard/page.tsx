'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  HiOutlineSquares2X2,
  HiOutlineQueueList,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog8Tooth,
  HiOutlineBell,
  HiOutlineArrowTrendingUp,
  HiOutlineUsers,
  HiOutlineEye,
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
import { getBusinessSession, updateBusinessImages, logoutBusiness, updateBusinessProfile } from '@/app/actions/business';
import { getBusinessLeads } from '@/app/actions/leads';
import SettingsTab from './components/SettingsTab';
import JobPostingTab from './components/JobPostingTab';
import MessagesTab from './components/MessagesTab';
import LeadsSection from './components/LeadsSection';
import DashboardSidebar from './components/DashboardSidebar';
import MyListingTab from './components/MyListingTab';
import { CldUploadWidget } from 'next-cloudinary';
import { createClient } from '@/utils/supabase/client';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLocation';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    googleMapsUrl:
      business?.latitude && business?.longitude
        ? buildGoogleMapsUrl(business.latitude, business.longitude)
        : '',
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
      const sessionRes = await getBusinessSession();
      if (sessionRes?.success && sessionRes.business) {
        const resBusiness = sessionRes.business;
        setBusiness(resBusiness);
        setImages(resBusiness.images || []);
        setprofilePictureUrl(resBusiness.profilePictureUrl || null);
        setProfileData({
          rating: resBusiness.rating || 0,
          yearsInBusiness: resBusiness.yearsInBusiness || 0,
          displayName: resBusiness.displayName || '',
          businessName: resBusiness.businessName || '',
          category: resBusiness.category || '',
          publicPhone: resBusiness.publicPhone || '',
          businessAddress: resBusiness.businessAddress || '',
          city: resBusiness.city || '',
          state: resBusiness.state || '',
          country: resBusiness.country || '',
          isFinderBVerified: resBusiness.isFinderBVerified || false,
          review: resBusiness.review || {},
          reviewReply: resBusiness.reviewReply || {},
          latitude: resBusiness.latitude || 0,
          longitude: resBusiness.longitude || 0,
          googleMapsUrl:
            resBusiness.latitude && resBusiness.longitude
              ? buildGoogleMapsUrl(resBusiness.latitude, resBusiness.longitude)
              : '',
          website: resBusiness.website || '',
          instagramUrl: resBusiness.instagramUrl || '',
          facebookUrl: resBusiness.facebookUrl || '',
          whatsappNumber: resBusiness.whatsappNumber || '',
          youtubeUrl: resBusiness.youtubeUrl || '',
          about: resBusiness.about || '',
          keywords: resBusiness.keywords || [],
          email: resBusiness.email || '',
          timings: resBusiness.timings || {},
          discountRange: resBusiness.discountRange || '',
          serviceCategory: resBusiness.serviceCategory || '',
          paymentModes: resBusiness.paymentModes || [],
          profileQrLink: resBusiness.profileQrLink || '',
        });
      } else {
        router.push('/business/login');
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [router]);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setSuccessMessage('Payment successful! Your Growth Pro plan is now active.');
      router.replace('/business/dashboard');
    }
  }, [searchParams, router]);

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

  const businessId = business?.id;

  useEffect(() => {
    if (!businessId) return;
    getBusinessLeads(businessId).then((res) => {
      if (res.success) setLeadCount(res.leads.length);
    });
  }, [businessId]);

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

  const [leadCount, setLeadCount] = useState(0);

  const menuItems = [
    { id: 'overview', label: 'Performance', hint: 'Stats & insights', icon: HiOutlineSquares2X2, activeIcon: RiDashboardFill },
    { id: 'listings', label: 'My Listings', hint: 'Public profile preview', icon: HiOutlineQueueList, activeIcon: RiListCheck },
    { id: 'leads', label: 'Lead Center', hint: 'Customer enquiries', icon: HiOutlineCursorArrowRays, activeIcon: HiOutlineCursorArrowRays, badge: leadCount },
    { id: 'jobs', label: 'Jobs', hint: 'Post & manage roles', icon: HiOutlineBriefcase, activeIcon: HiOutlineBriefcase },
    { id: 'messages', label: 'Messages', hint: 'Customer conversations', icon: HiOutlineChatBubbleLeftRight, activeIcon: RiMessage3Line },
    { id: 'settings', label: 'Settings', hint: 'Profile & verification', icon: HiOutlineCog8Tooth, activeIcon: RiSettings4Line },
  ];

  const stats = [
    { label: 'Total Views', value: '1,284', change: '+12.5%', isUp: true, icon: HiOutlineEye, sub: 'from last month' },
    { label: 'New Leads', value: String(leadCount), change: leadCount > 0 ? 'Live' : '—', isUp: true, icon: HiOutlineUsers, sub: 'from FinderB enquiries' },
    { label: 'Avg. Rating', value: (business?.rating ?? 4.5).toFixed(1), change: '-2.1%', isUp: false, icon: HiOutlineArrowTrendingUp, sub: 'customer reviews' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
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
      { key: 'mapLocation', label: 'Google Maps Location' },
    ];

    const missingFields: string[] = [];
    let completedCount = 0;

    fields.forEach(field => {
      if (field.key === 'mapLocation') {
        const lat = business?.latitude;
        const lng = business?.longitude;
        const isCompleted = lat != null && lng != null && !(lat === 0 && lng === 0);
        if (isCompleted) {
          completedCount++;
        } else {
          missingFields.push(field.label);
        }
        return;
      }

      const value = business?.[field.key as keyof typeof business];
      const isCompleted = value !== undefined && value !== null && value !== '' && 
        (typeof value !== 'object' || Object.keys(value).length > 0);

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

  return (
    <div className="relative flex min-h-screen flex-col bg-[#faf9f7] selection:bg-secondary-400/30 lg:flex-row">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 90% 0%, rgba(249,184,100,0.12) 0%, transparent 35%), radial-gradient(circle at 0% 50%, rgba(33,84,129,0.06) 0%, transparent 40%)',
        }}
      />

      <DashboardSidebar
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
        onClose={() => setIsSidebarOpen(false)}
        businessName={businessName}
        businessCategory={business?.category || profileData.category}
        businessId={businessId}
        isVerified={Boolean(business?.isFinderBVerified || business?.isVerified)}
        isPaymentPending={isPaymentPending}
        profileImageUrl={profilePictureUrl}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="relative z-10 min-w-0 flex-1 overflow-x-hidden p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-8 lg:p-10 lg:pb-8">
        <header className="relative z-[30] mb-6 flex items-start justify-between gap-4 md:mb-8">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Partner dashboard
            </p>
            <h1 className="mt-1 text-xl font-semibold capitalize tracking-tight text-slate-900 md:text-2xl">
              {activeTab === 'overview' ? 'Overview' : activeTab === 'leads' ? 'Lead center' : activeTab === 'listings' ? 'My listing' : activeTab}
            </h1>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">{businessName}</p>
          </div>

          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 shadow-sm transition-colors hover:border-primary-200 hover:text-primary-600"
            >
              <HiOutlineBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white py-4 shadow-lg sm:w-96">
                  <div className="mb-3 flex items-center justify-between px-4">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="rounded-md bg-[#215481]/10 px-2 py-0.5 text-xs font-medium text-[#215481]">
                        {notifications.length} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto px-2">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div key={i} className="rounded-lg px-3 py-3 transition-colors hover:bg-slate-50">
                          <div className="flex gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#215481]/10 text-[#215481]">
                              <HiOutlineBell size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{n.title}</p>
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{n.message}</p>
                              <p className="mt-1 text-xs text-slate-400">
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
                      <div className="py-10 text-center">
                        <p className="text-sm text-slate-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {(activeTab === 'overview' || activeTab === 'leads') && (
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
                      <p className="text-sm md:text-base font-semibold text-slate-900 tracking-tight">Payment Pending</p>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded-full uppercase tracking-widest">Urgent</span>
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
                <div className="group bg-white border border-[#215481]/15 rounded-[24px] p-4 md:p-6 flex items-start gap-3 md:gap-5 shadow-sm hover:shadow-xl hover:shadow-[#215481]/10 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#215481]/10 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#215481]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#215481]/15 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <HiOutlineClipboardDocumentCheck className="text-[#215481] animate-pulse" size={20} />
                  </div>
                  <div className="space-y-1.5 md:space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 md:text-base">KYC verification</p>
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">Incomplete</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Your KYC isn&apos;t completed yet. Kindly{' '}
                      <span className="font-semibold text-primary-600">submit your documents to get full access and higher visibility</span>{' '}
                      for your business.
                    </p>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                      Verify now <HiOutlineChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Completion Meter - Premium Redesign */}
            {activeTab === 'overview' && completionPercent < 100 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden group hover:shadow-premium-hover transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <HiOutlineRocketLaunch size={120} className="-rotate-12" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4 max-w-xl">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Complete your profile</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Boost your visibility and trust score. Businesses with 100% profile completion receive{' '}
                        <span className="font-semibold text-primary-600">3x more inquiries</span>.
                      </p>
                    </div>

                    {missingFields.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-500">
                          Next steps to reach 100%
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingFields.slice(0, 4).map((field) => (
                            <span key={field} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                              + {field}
                            </span>
                          ))}
                          {missingFields.length > 4 && (
                            <span className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">
                              + {missingFields.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
                    >
                      Finish setup <HiOutlineChevronRight size={16} />
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
                          className="text-[#215481] transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <span className="absolute text-2xl font-semibold text-slate-900">{completionPercent}%</span>
                    </div>
                    <p className="text-sm text-slate-500">Strength score</p>
                  </div>
                </div>
              </div>
            )}

            {/* Merchant Info Card - Premium Look */}
            {activeTab === 'overview' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-premium-hover">
                <button 
                  onClick={() => toggleAccordion('merchant')}
                  className="w-full bg-white px-6 md:px-8 py-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#215481]/10 text-[#215481] rounded-lg flex items-center justify-center">
                      <HiOutlineBriefcase size={18} />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">Merchant information</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link 
                      href={`/business/${businessId}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
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
                    <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Merchant ID</p>
                        <div className="flex items-center gap-2">
                          <p className="rounded-md bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-900">{business?.registrationNumber || 'Not Generated'}</p>
                          {business?.registrationNumber && (
                            <button 
                              onClick={() => handleCopyId(business.registrationNumber)}
                              className="p-1 text-slate-400 hover:text-[#215481] transition-colors"
                            >
                              {copiedId ? <HiOutlineClipboardDocumentCheck size={16} className="text-emerald-500" /> : <HiOutlineClipboardDocument size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Profile name</p>
                        <p className="text-sm font-semibold text-slate-900">{business?.businessName || business?.displayName || 'Not Set'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Email address</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{business?.email || business?.workEmail || 'Not Set'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Phone number</p>
                        <p className="text-sm font-semibold text-slate-900">{business?.publicPhone || business?.mobile || 'Not Set'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">Payment status</p>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            business?.paymentStatus === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${business?.paymentStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {business?.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">KYC status</p>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            business?.kycStatus === 'verified' || business?.kycStatus === 'approved'
                              ? 'bg-primary-50 text-primary-700 border border-primary-100' 
                              : business?.kycStatus === 'submitted'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              business?.kycStatus === 'verified' || business?.kycStatus === 'approved' ? 'bg-primary-500' : 
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
                  <div className="flex-1 bg-white border border-[#215481]/15 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-[#215481]/25 group">
                    <div className="w-10 h-10 bg-[#215481]/10 text-[#215481] rounded-xl flex items-center justify-center shrink-0 border border-[#215481]/15 group-hover:bg-[#215481]/15 transition-colors">
                      <HiOutlineCreditCard size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">Leads Inactive</h4>
                      <p className="text-slate-500 text-[10px] truncate">Activate to see customer details.</p>
                    </div>
                    <Link href={`/business/payment/${businessId}`} className="shrink-0 bg-[#215481] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#1a4367] transition-all shadow-sm">
                      Activate
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Stats - Only on Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <stat.icon size={18} />
                      </div>
                      <span
                        className={`flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                          stat.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {stat.isUp ? <HiOutlineArrowUpRight size={12} /> : <HiOutlineArrowDownRight size={12} />}
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">{stat.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {(activeTab === 'overview' || activeTab === 'leads') && businessId && (
              <div className={`grid grid-cols-1 ${activeTab === 'overview' ? 'lg:grid-cols-3' : ''} gap-8 md:gap-10`}>
                <div className={`${activeTab === 'overview' ? 'lg:col-span-2' : ''}`}>
                  <LeadsSection
                    businessId={businessId}
                    isPaymentPending={isPaymentPending}
                    variant={activeTab === 'leads' ? 'leads' : 'overview'}
                    onCountChange={setLeadCount}
                  />
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Performance</h3>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <HiOutlineArrowTrendingUp size={18} />
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        {[
                          { label: 'Profile traffic', value: 85, color: 'bg-primary-500' },
                          { label: 'Lead response', value: leadCount > 0 ? 72 : 24, color: 'bg-secondary-400' },
                          { label: 'Profile completion', value: completionPercent, color: 'bg-emerald-500' },
                        ].map((item) => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="font-semibold text-slate-900">{item.value}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div 
                                className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f9b864] via-[#f5c078] to-[#e8a045] p-6 shadow-xl shadow-[#f9b864]/20">
                      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/25 blur-xl" />
                      <div className="relative space-y-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#153551]/15">
                          <HiOutlineStar size={22} className="text-[#153551]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold tracking-tight text-[#153551]">Grow faster</h4>
                          <p className="mt-1 text-sm font-medium leading-relaxed text-[#153551]/80">
                            Complete your profile and respond to leads within 30 minutes to rank higher in search.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('settings')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#153551] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1a4367]"
                        >
                          Complete profile <HiOutlineChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'listings' && businessId && (
          <MyListingTab
            businessId={businessId}
            businessName={businessName}
            profileData={profileData}
            images={images}
            profilePictureUrl={profilePictureUrl}
            completionPercent={completionPercent}
            missingFields={missingFields}
            onEditProfile={() => setActiveTab('settings')}
          />
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
