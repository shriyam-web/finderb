'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { HiOutlineSquares2X2,
  HiOutlineQueueList,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog8Tooth,
  HiOutlineBriefcase,
  HiOutlineCursorArrowRays,
  HiOutlineCreditCard,
  HiOutlineStar,
} from 'react-icons/hi2';
import { RiDashboardFill, RiListCheck, RiMessage3Line, RiSettings4Line, RiStarFill } from 'react-icons/ri';
import {
  getBusinessSession,
  touchBusinessSupportSession,
  updateBusinessImages,
  logoutBusiness,
  updateBusinessProfile,
} from '@/app/actions/business';
import { getBusinessLeads } from '@/app/actions/leads';
import SettingsTab from './components/SettingsTab';
import JobPostingTab from './components/JobPostingTab';
import MessagesTab from './components/MessagesTab';
import LeadsSection from './components/LeadsSection';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardTopBar from './components/DashboardTopBar';
import SupportSessionBanner from '@/components/business/SupportSessionBanner';
import AccountHealthPanel from './components/AccountHealthPanel';
import DashboardKpiRow, { buildDefaultKpis } from './components/DashboardKpiRow';
import DashboardQuickActions from './components/DashboardQuickActions';
import DashboardTabShell from './components/DashboardShell';
import BusinessWorkspaceLoader from '@/components/business/BusinessWorkspaceLoader';
import BusinessOnboardingLoader from '@/components/business/BusinessOnboardingLoader';
import {
  hasPendingBusinessOnboarding,
  hasCompletedBusinessOnboarding,
  markBusinessOnboardingComplete,
  markNewBusinessOnboarding,
  beginBusinessOnboardingThisLoad,
  isBusinessOnboardingActiveThisLoad,
} from '@/lib/businessOnboarding';
import { getAccountHealth } from '@/lib/dashboard/accountHealth';
import { getProfileCompletion, getAccountMissingFields } from '@/lib/dashboard/profileCompletion';
import { hasPublicTrustBadge, isListingLive, KYC_OUTSOURCED_MESSAGE } from '@/lib/businessVerification';
import { getJobsByBusiness } from '@/app/actions/job';
import { getBusinessProfileViewStats } from '@/app/actions/analytics';
import { getBusinessPublicRatingStats, parseBusinessReviews } from '@/lib/businessReviews';
import DashboardAtAGlance from './components/DashboardAtAGlance';
import TrustBadgeCallout from './components/TrustBadgeCallout';
import MyListingTab from './components/MyListingTab';
import SubscriptionTab from './components/SubscriptionTab';
import SubscriptionExpiryAlert from './components/SubscriptionExpiryAlert';
import SubscriptionExpiryBanner from './components/SubscriptionExpiryBanner';
import ReviewsTab from './components/ReviewsTab';
import { getMerchantNotifications, markMerchantNotificationsRead } from '@/app/actions/merchantNotifications';
import { broadcastTargetsMerchants } from '@/lib/broadcastAudience';
import { getMerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';
import {
  businessHasPublicPhoto,
  syncBusinessImagesWithCover,
} from '@/lib/businessMapping';
import { CldUploadWidget } from 'next-cloudinary';
import { createClient } from '@/utils/supabase/client';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLocation';
import ListingHiddenNoPhotosBanner from './components/ListingHiddenNoPhotosBanner';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [business, setBusiness] = useState<any>(null);
  const [supportSession, setSupportSession] = useState(false);
  const [supportIdleDeadline, setSupportIdleDeadline] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [profilePictureUrl, setprofilePictureUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [newLeadCount, setNewLeadCount] = useState(0);
  const [profileViews30d, setProfileViews30d] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [settingsFocusField, setSettingsFocusField] = useState<string | null>(null);
  const [merchantAlertCount, setMerchantAlertCount] = useState(0);

  const handleSettingsFocusHandled = useCallback(() => {
    setSettingsFocusField(null);
  }, []);

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
  ];
  
  // New Profile Fields State
  const [profileData, setProfileData] = useState({
    yearsInBusiness: business?.yearsInBusiness || 0,
    displayName: business?.displayName || '',
    businessName: business?.businessName || '',
    ownerName: business?.ownerName || '',
    ownerMobile: business?.ownerMobile || '',
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
    discountRange:
      !business?.discountRange || business?.discountRange === 'Seasonal Offer'
        ? ''
        : business.discountRange,
    serviceCategory: business?.serviceCategory || '',
    paymentModes: business?.paymentModes || [],
    profileQrLink: business?.profileQrLink || '',
    review: business?.review || {},
    reviewReply: business?.reviewReply || {},
    rating: business?.rating || 0,
    isFinderBVerified: business?.isFinderBVerified || false,
  });

  const businessId = business?.id;
  const businessProfilePath = business ? getBusinessProfilePath(business) : undefined;

  // If registration sent ?welcome=1, keep a session flag and strip it from the URL
  // immediately so refresh never re-triggers via the query string.
  useEffect(() => {
    if (!searchParams.has('welcome')) return;

    if (searchParams.get('welcome') === '1') {
      markNewBusinessOnboarding();
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('welcome');
    const qs = params.toString();
    router.replace(qs ? `/business/dashboard?${qs}` : '/business/dashboard', {
      scroll: false,
    });
  }, [searchParams, router]);

  // Show the one-time welcome splash when registration/login set a pending flag
  // and this business has never completed onboarding on this browser.
  useEffect(() => {
    if (!businessId) return;

    // Strict Mode remount: restore the in-progress splash for this page load only.
    if (isBusinessOnboardingActiveThisLoad(businessId)) {
      setShowOnboarding(true);
      return;
    }

    if (hasCompletedBusinessOnboarding(businessId)) return;
    if (!hasPendingBusinessOnboarding()) return;

    beginBusinessOnboardingThisLoad(businessId);
    markBusinessOnboardingComplete(businessId);
    setShowOnboarding(true);
  }, [businessId]);

  const handleOnboardingComplete = useCallback(() => {
    if (businessId) {
      markBusinessOnboardingComplete(businessId);
    }
    setShowOnboarding(false);
  }, [businessId]);

  useEffect(() => {
    const fetchBusiness = async () => {
      const sessionRes = await getBusinessSession();
      if (sessionRes?.success && sessionRes.business) {
        const resBusiness = sessionRes.business;
        setSupportSession(Boolean(sessionRes.supportSession));
        setSupportIdleDeadline(
          typeof sessionRes.supportIdleDeadline === 'number'
            ? sessionRes.supportIdleDeadline
            : null,
        );
        const cover = resBusiness.profilePictureUrl || null;
        const syncedImages = syncBusinessImagesWithCover(resBusiness.images, cover);
        setBusiness(resBusiness);
        setImages(syncedImages);
        setprofilePictureUrl(cover);
        setProfileData({
          rating: resBusiness.rating || 0,
          yearsInBusiness: resBusiness.yearsInBusiness || 0,
          displayName: resBusiness.displayName || '',
          businessName: resBusiness.businessName || '',
          ownerName: resBusiness.ownerName || '',
          ownerMobile: resBusiness.ownerMobile || '',
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
          discountRange:
            !resBusiness.discountRange || resBusiness.discountRange === 'Seasonal Offer'
              ? 'No Discount'
              : resBusiness.discountRange,
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

  // Reset idle timer on real activity; poll only to detect expiry.
  useEffect(() => {
    if (!supportSession) return;

    let disposed = false;
    let lastTouchAt = 0;
    let touchInFlight = false;
    const TOUCH_THROTTLE_MS = 15_000;

    const expire = () => {
      if (disposed) return;
      router.push('/business/login?error=support_session_expired');
    };

    const touch = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastTouchAt < TOUCH_THROTTLE_MS) return;
      if (touchInFlight) return;
      touchInFlight = true;
      lastTouchAt = now;
      try {
        const result = await touchBusinessSupportSession();
        if (disposed) return;
        if (!result.ok) {
          expire();
          return;
        }
        setSupportIdleDeadline(result.idleDeadlineMs);
      } finally {
        touchInFlight = false;
      }
    };

    const checkStillValid = async () => {
      const sessionRes = await getBusinessSession();
      if (disposed) return;
      if (!sessionRes?.success || !sessionRes.business || !sessionRes.supportSession) {
        expire();
      }
    };

    const onActivity = () => {
      void touch(false);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void touch(true);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'mousemove',
      'wheel',
    ];
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Immediate touch so opening the panel starts a clean 15m window.
    void touch(true);
    const id = window.setInterval(() => {
      void checkStillValid();
    }, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(id);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, onActivity);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [supportSession, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'listings', 'leads', 'reviews', 'jobs', 'subscription', 'messages', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'reviews' && businessId) {
      void markMerchantNotificationsRead(businessId);
      setMerchantAlertCount(0);
    }
  }, [activeTab, businessId]);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setSuccessMessage('Payment successful! Your plan is now active.');
      setActiveTab('subscription');
      router.replace('/business/dashboard?tab=subscription');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const supabase = createClient();
      const [broadcastResult, merchantResult] = await Promise.all([
        supabase.from('broadcasts').select('*').order('created_at', { ascending: false }),
        businessId ? getMerchantNotifications(businessId) : Promise.resolve(null),
      ]);

        const broadcastItems =
          broadcastResult.data?.filter((n: { target_audience: string[] }) =>
            broadcastTargetsMerchants(n.target_audience, business?.category)
          ) ?? [];

      const merchantItems =
        merchantResult?.success
          ? merchantResult.notifications.map((item) => ({
              id: item.id,
              title: item.title || 'Alert',
              message: item.body,
              created_at: item.created_at,
              source: 'merchant' as const,
              read: Boolean(item.read_at),
            }))
          : [];

      const broadcastNotifications = broadcastItems.map(
        (item: {
          id?: string;
          title?: string;
          message: string;
          created_at: string;
          cta_url?: string | null;
          cta_label?: string | null;
          show_datetime?: boolean | null;
        }) => ({
          id: item.id || `broadcast-${item.created_at}`,
          title: item.title || 'FinderB update',
          message: item.message,
          created_at: item.created_at,
          cta_url: item.cta_url || null,
          cta_label: item.cta_label || null,
          show_datetime: item.show_datetime !== false,
          source: 'broadcast' as const,
          read: false,
        }),
      );

      const merged = [...merchantItems, ...broadcastNotifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(merged);
      const unreadMerchant = merchantResult?.success ? merchantResult.unreadCount : 0;
      setMerchantAlertCount(unreadMerchant);
      setUnreadCount(unreadMerchant + broadcastNotifications.length);
    };

    if (business) {
      void fetchNotifications();
    }
  }, [business, businessId]);

  useEffect(() => {
    if (!businessId) return;
    getBusinessProfileViewStats(businessId).then((res) => {
      if (res.success) {
        setProfileViews30d(res.viewsLast30Days);
      }
    });
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    getBusinessLeads(businessId).then((res) => {
      if (res.success) {
        setLeadCount(res.leads.length);
        setNewLeadCount(
          res.leads.filter((l) => l.status === 'New' || l.status === 'New Lead').length
        );
      }
    });
    getJobsByBusiness(businessId).then((res) => {
      if (res.success && res.jobs) {
        setActiveJobsCount(res.jobs.filter((j) => j.status === 'active').length);
      }
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
      
      // Auto set first uploaded photo as profile if none exists
      let newProfilePic = (profilePictureUrl || '').trim() || null;
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
    { id: 'overview', label: 'Overview', icon: HiOutlineSquares2X2, activeIcon: RiDashboardFill },
    { id: 'listings', label: 'My Listing', icon: HiOutlineQueueList, activeIcon: RiListCheck },
    { id: 'leads', label: 'Leads', icon: HiOutlineCursorArrowRays, activeIcon: HiOutlineCursorArrowRays, badge: leadCount },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: HiOutlineStar,
      activeIcon: RiStarFill,
      badge:
        parseBusinessReviews(profileData.review).filter(
          (review) => !review.merchantReply?.content?.trim()
        ).length || undefined,
    },
    { id: 'jobs', label: 'Jobs', icon: HiOutlineBriefcase, activeIcon: HiOutlineBriefcase },
    { id: 'subscription', label: 'My Subscription', icon: HiOutlineCreditCard, activeIcon: HiOutlineCreditCard },
    { id: 'messages', label: 'Messages', icon: HiOutlineChatBubbleLeftRight, activeIcon: RiMessage3Line },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog8Tooth, activeIcon: RiSettings4Line },
  ];

  if (showOnboarding) {
    return <BusinessOnboardingLoader onComplete={handleOnboardingComplete} />;
  }

  if (loading) {
    return <BusinessWorkspaceLoader />;
  }

  const businessName =
    business?.displayName || business?.name || business?.businessName || 'Your Business';
  const subscriptionStatus = getMerchantSubscriptionStatus({
    paymentStatus: business?.paymentStatus,
    selectedPlan: business?.selectedPlan,
    billingCycle: business?.billingCycle,
    planStartedAt: business?.planStartedAt,
    planExpiresAt: business?.planExpiresAt,
    updatedAt: business?.updatedAt,
    createdAt: business?.createdAt,
    autoRenewEnabled: business?.autoRenewEnabled,
    mandateStatus: business?.mandateStatus,
    subscriptionStatus: business?.subscriptionStatus,
    razorpaySubscriptionId: business?.razorpaySubscriptionId,
  });
  const isPlanActive = subscriptionStatus.isActive;
  const isPaymentPending = !isPlanActive;
  const hasTrustBadge = hasPublicTrustBadge({
    isFinderBVerified: business?.isFinderBVerified,
    hasVerifiedBadge: business?.hasVerifiedBadge,
  });
  const listingStatus = String(business?.status || 'Pending');
  const isListingLiveOnPlatform = isListingLive(listingStatus);
  const hasPublicPhotos = businessHasPublicPhoto({
    profilePictureUrl,
    images,
  });

  const { percentage: completionPercent, missingFields: profileMissingFields } =
    getProfileCompletion({
      ...(business || {}),
      profilePictureUrl,
      images,
    });
  const listingMissingFields = getAccountMissingFields({
    ...(business || {}),
    profilePictureUrl,
    images,
  });
  const accountHealth = getAccountHealth({
    paymentStatus: business?.paymentStatus,
    kycStatus: business?.kycStatus,
    completionPercent,
    subscription: subscriptionStatus,
  });
  const ratingStats = getBusinessPublicRatingStats(business?.review);
  const kpis = buildDefaultKpis(leadCount, profileViews30d, ratingStats);

  const openSettingsField = (fieldKey: string) => {
    setSettingsFocusField(fieldKey);
    setActiveTab('settings');
  };

  const openKycInfo = () => {
    if (businessId) {
      router.push(`/business/kyc/${businessId}`);
      return;
    }
    alert(KYC_OUTSOURCED_MESSAGE);
  };

  return (
    <div className="merchant-dashboard-canvas min-h-screen">
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
        businessProfilePath={businessProfilePath}
        businessEmail={business?.email || business?.workEmail}
        businessMobile={business?.mobile || business?.publicPhone}
        businessFullName={business?.fullName}
        registrationNumber={business?.registrationNumber}
        copiedId={copiedId}
        onCopyMerchantId={handleCopyId}
        isPaymentPending={isPaymentPending}
        showRenewalCta={subscriptionStatus.canRenew && isPlanActive}
        planName={subscriptionStatus.planName}
        profileImageUrl={profilePictureUrl}
        onLogout={handleLogout}
      />

      <main className="min-h-screen px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pt-6 lg:ml-72 lg:max-w-[1200px] lg:px-10 lg:pb-8 lg:pt-8 xl:max-w-[1280px]">
        {supportSession ? (
          <SupportSessionBanner
            idleDeadlineMs={supportIdleDeadline}
            onExpired={() => {
              void logoutBusiness().then(() => {
                router.push('/business/login?error=support_session_expired');
              });
            }}
          />
        ) : null}
        {businessId && subscriptionStatus.alertLevel !== 'none' && (
          <SubscriptionExpiryAlert
            businessId={businessId}
            businessName={businessName}
            fullName={business?.fullName}
            email={business?.email || business?.workEmail}
            mobile={business?.mobile || business?.publicPhone}
            subscription={subscriptionStatus}
            onOpenSubscription={() => setActiveTab('subscription')}
          />
        )}

        <DashboardTopBar
          activeTab={activeTab}
          unreadCount={unreadCount}
          isNotificationsOpen={isNotificationsOpen}
          onNotificationsToggle={async () => {
            const nextOpen = !isNotificationsOpen;
            setIsNotificationsOpen(nextOpen);
            if (nextOpen && businessId) {
              await markMerchantNotificationsRead(businessId);
              setMerchantAlertCount(0);
              setUnreadCount((count) => Math.max(0, count - merchantAlertCount));
              const broadcastIds = notifications
                .filter((n) => n.source === 'broadcast' && n.id && !String(n.id).startsWith('broadcast-'))
                .map((n) => n.id);
              if (broadcastIds.length) {
                void fetch('/api/notifications/read', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                  body: JSON.stringify({ ids: broadcastIds }),
                });
              }
            }
          }}
          onNotificationsClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
        />

        {businessId && subscriptionStatus.alertLevel !== 'none' && (
          <SubscriptionExpiryBanner
            businessId={businessId}
            businessName={businessName}
            fullName={business?.fullName}
            email={business?.email || business?.workEmail}
            mobile={business?.mobile || business?.publicPhone}
            subscription={subscriptionStatus}
            onOpenSubscription={() => setActiveTab('subscription')}
          />
        )}

        {successMessage && (
          <div className="mb-6 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600" aria-hidden />
            <p className="px-4 py-3 text-sm font-medium text-emerald-900">{successMessage}</p>
          </div>
        )}

        {!hasPublicPhotos && (
          <div className="mb-6">
            <ListingHiddenNoPhotosBanner onAddPhotos={() => openSettingsField('media')} />
          </div>
        )}

        {activeTab === 'overview' && (
          <DashboardTabShell>
            <DashboardKpiRow kpis={kpis} />

            <DashboardAtAGlance
              isPaymentActive={isPlanActive}
              planName={subscriptionStatus.planName}
              newLeadCount={newLeadCount}
              activeJobsCount={activeJobsCount}
              onOpenLeads={() => setActiveTab('leads')}
              onOpenJobs={() => setActiveTab('jobs')}
              onOpenListing={() => setActiveTab('listings')}
              onOpenBilling={() => setActiveTab('subscription')}
            />

            {!isListingLiveOnPlatform && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold">Your listing is not public yet</p>
                <p className="mt-1 leading-relaxed text-amber-900/90">
                  FinderB admin approval is required before your business appears in search and on public
                  profile URLs. Complete your profile while you wait — this is separate from identity
                  verification (KYC).
                </p>
              </div>
            )}

            {hasTrustBadge && <TrustBadgeCallout isVerified />}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <AccountHealthPanel
                  health={accountHealth}
                  businessId={businessId}
                  businessProfilePath={businessProfilePath}
                  businessName={businessName}
                  fullName={business?.fullName}
                  email={business?.email || business?.workEmail}
                  mobile={business?.mobile || business?.publicPhone}
                  missingFields={profileMissingFields}
                  hasPublicPhotos={hasPublicPhotos}
                  paymentError={paymentError}
                  onPaymentError={setPaymentError}
                  onOpenSettingsField={openSettingsField}
                  onOpenKyc={openKycInfo}
                />

                {businessId && (
                  <LeadsSection
                    businessId={businessId}
                    businessProfilePath={businessProfilePath}
                    isPaymentPending={isPaymentPending}
                    variant="overview"
                    onCountChange={setLeadCount}
                  />
                )}
              </div>

              <div className="xl:col-span-4">
                <DashboardQuickActions
                  actions={[
                    {
                      label: 'Edit public listing',
                      description: 'Update photos, hours, and business description.',
                      onClick: () => setActiveTab('listings'),
                    },
                    {
                      label: 'Post a job opening',
                      description: 'Reach candidates through FinderB job listings.',
                      onClick: () => setActiveTab('jobs'),
                    },
                    {
                      label: 'Account & verification',
                      description: 'Documents, contact details, and preferences.',
                      onClick: () => setActiveTab('settings'),
                    },
                    ...(businessId
                      ? [
                          {
                            label: 'My Subscription',
                            description: 'Plan status, renewal dates, and payment history.',
                            onClick: () => setActiveTab('subscription'),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </div>
          </DashboardTabShell>
        )}

        {activeTab === 'leads' && businessId && (
          <DashboardTabShell>
            <LeadsSection
              businessId={businessId}
              businessProfilePath={businessProfilePath}
              isPaymentPending={isPaymentPending}
              variant="leads"
              onCountChange={setLeadCount}
            />
          </DashboardTabShell>
        )}

        {activeTab === 'reviews' && businessId && (
          <DashboardTabShell>
            <ReviewsTab
              businessId={businessId}
              reviewData={profileData.review}
              onReviewsChange={(reviews) => {
                setProfileData((prev) => ({ ...prev, review: reviews }));
                setBusiness((prev: typeof business) => (prev ? { ...prev, review: reviews } : prev));
              }}
            />
          </DashboardTabShell>
        )}

        {activeTab === 'listings' && businessId && (
          <DashboardTabShell>
            <MyListingTab
            businessId={businessId}
            businessProfilePath={businessProfilePath}
            businessName={businessName}
            profileData={profileData}
            images={images}
            profilePictureUrl={profilePictureUrl}
            completionPercent={completionPercent}
            missingFields={listingMissingFields}
            onEditProfile={() => setActiveTab('settings')}
            onOpenSettingsField={openSettingsField}
            onOpenKyc={openKycInfo}
          />
          </DashboardTabShell>
        )}

        {activeTab === 'jobs' && businessId && (
          <DashboardTabShell>
            <JobPostingTab businessId={businessId} />
          </DashboardTabShell>
        )}

        {activeTab === 'subscription' && businessId && (
          <DashboardTabShell>
            <SubscriptionTab
              businessId={businessId}
              businessName={businessName}
              fullName={business?.fullName}
              email={business?.email || business?.workEmail}
              mobile={business?.mobile || business?.publicPhone}
              onPaymentError={setPaymentError}
            />
          </DashboardTabShell>
        )}

        {activeTab === 'messages' && businessId && (
          <DashboardTabShell>
            <MessagesTab businessId={businessId} />
          </DashboardTabShell>
        )}

        {activeTab === 'settings' && (
          <DashboardTabShell>
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
            focusField={settingsFocusField}
            onFocusHandled={handleSettingsFocusHandled}
            onNotifySuccess={(message) => {
              setSuccessMessage(message);
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
          />
          </DashboardTabShell>
        )}
      </main>
    </div>
  );
}

export default function BusinessDashboard() {
  return <DashboardContent />;
}
