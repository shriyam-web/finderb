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
} from 'react-icons/hi2';
import { RiDashboardFill, RiListCheck, RiMessage3Line, RiSettings4Line } from 'react-icons/ri';
import { getBusinessSession, updateBusinessImages, logoutBusiness, updateBusinessProfile } from '@/app/actions/business';
import { getBusinessLeads } from '@/app/actions/leads';
import SettingsTab from './components/SettingsTab';
import JobPostingTab from './components/JobPostingTab';
import MessagesTab from './components/MessagesTab';
import LeadsSection from './components/LeadsSection';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardTopBar from './components/DashboardTopBar';
import AccountHealthPanel from './components/AccountHealthPanel';
import DashboardKpiRow, { buildDefaultKpis } from './components/DashboardKpiRow';
import DashboardQuickActions from './components/DashboardQuickActions';
import DashboardTabShell from './components/DashboardShell';
import BusinessWorkspaceLoader from '@/components/business/BusinessWorkspaceLoader';
import BusinessOnboardingLoader from '@/components/business/BusinessOnboardingLoader';
import { consumeNewBusinessOnboarding } from '@/lib/businessOnboarding';
import { getAccountHealth } from '@/lib/dashboard/accountHealth';
import { getProfileCompletion, getAccountMissingFields } from '@/lib/dashboard/profileCompletion';
import { getJobsByBusiness } from '@/app/actions/job';
import { getBusinessProfileViewStats } from '@/app/actions/analytics';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import DashboardAtAGlance from './components/DashboardAtAGlance';
import TrustBadgeCallout from './components/TrustBadgeCallout';
import MyListingTab from './components/MyListingTab';
import SubscriptionTab from './components/SubscriptionTab';
import SubscriptionExpiryAlert from './components/SubscriptionExpiryAlert';
import { getMerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';
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
    const welcome = searchParams.get('welcome') === '1';
    const stored = consumeNewBusinessOnboarding();
    if (welcome || stored) {
      setShowOnboarding(true);
      if (welcome) {
        router.replace('/business/dashboard', { scroll: false });
      }
    }
  }, [searchParams, router]);

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
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'listings', 'leads', 'jobs', 'subscription', 'messages', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setSuccessMessage('Payment successful! Your Growth Pro plan is now active.');
      setActiveTab('subscription');
      router.replace('/business/dashboard?tab=subscription');
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
  const businessProfilePath = business ? getBusinessProfilePath(business) : undefined;

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
    { id: 'overview', label: 'Overview', icon: HiOutlineSquares2X2, activeIcon: RiDashboardFill },
    { id: 'listings', label: 'Listing', icon: HiOutlineQueueList, activeIcon: RiListCheck },
    { id: 'leads', label: 'Leads', icon: HiOutlineCursorArrowRays, activeIcon: HiOutlineCursorArrowRays, badge: leadCount },
    { id: 'jobs', label: 'Jobs', icon: HiOutlineBriefcase, activeIcon: HiOutlineBriefcase },
    { id: 'subscription', label: 'Subscription', icon: HiOutlineCreditCard, activeIcon: HiOutlineCreditCard },
    { id: 'messages', label: 'Messages', icon: HiOutlineChatBubbleLeftRight, activeIcon: RiMessage3Line },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog8Tooth, activeIcon: RiSettings4Line },
  ];

  if (showOnboarding) {
    return <BusinessOnboardingLoader onComplete={() => setShowOnboarding(false)} />;
  }

  if (loading) {
    return <BusinessWorkspaceLoader />;
  }

  const businessName = business?.businessName || 'Your Business';
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
  const isVerified = Boolean(business?.isFinderBVerified || business?.isVerified);

  const { percentage: completionPercent, missingFields: profileMissingFields } =
    getProfileCompletion(business);
  const listingMissingFields = getAccountMissingFields(business);
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

  const openKycPortal = () => {
    if (businessId) router.push(`/business/kyc/${businessId}`);
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
        profileImageUrl={profilePictureUrl}
        onLogout={handleLogout}
      />

      <main className="min-h-screen px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pt-6 lg:ml-72 lg:max-w-[1200px] lg:px-10 lg:pb-8 lg:pt-8 xl:max-w-[1280px]">
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
          onNotificationsToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
          onNotificationsClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
        />

        {successMessage && (
          <div className="mb-6 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600" aria-hidden />
            <p className="px-4 py-3 text-sm font-medium text-emerald-900">{successMessage}</p>
          </div>
        )}

        {activeTab === 'overview' && (
          <DashboardTabShell>
            <DashboardKpiRow kpis={kpis} />

            <DashboardAtAGlance
              isPaymentActive={isPlanActive}
              newLeadCount={newLeadCount}
              activeJobsCount={activeJobsCount}
              onOpenLeads={() => setActiveTab('leads')}
              onOpenJobs={() => setActiveTab('jobs')}
              onOpenListing={() => setActiveTab('listings')}
              onOpenBilling={() => setActiveTab('subscription')}
            />

            {isVerified && <TrustBadgeCallout isVerified />}

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
                  paymentError={paymentError}
                  onPaymentError={setPaymentError}
                  onOpenSettingsField={openSettingsField}
                  onOpenKyc={openKycPortal}
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
                            label: 'Subscription & billing',
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
            onOpenKyc={openKycPortal}
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
