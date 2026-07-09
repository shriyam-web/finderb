'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Clock,
  MapPin,
  Phone,
  Share2,
  Star,
  X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import type { Business } from '@/lib/mockData';
import { findCategoryForBreadcrumb, type CategoryBreadcrumb } from '@/app/actions/category';
import { getBusiness, getBusinessesByCategory, getBusinessSession } from '@/app/actions/business';
import { submitBusinessReview } from '@/app/actions/reviews';
import { getSession } from '@/app/actions/user';
import { recordDirectLead } from '@/app/actions/leads';
import ConnectMerchantModal from '@/components/ConnectMerchantModal';
import BusinessCard from '@/components/BusinessCard';
import StackedPhotoGallery from '@/components/business/StackedPhotoGallery';
import BusinessProfileBackdrop from '@/components/business/BusinessProfileBackdrop';
import BusinessProfileBreadcrumb from '@/components/business/BusinessProfileBreadcrumb';
import BusinessProfileServicesSection from '@/components/business/BusinessProfileServicesSection';
import BusinessProfileHeroBadges from '@/components/business/BusinessProfileHeroBadges';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import BusinessProfileContactAside from '@/components/business/BusinessProfileContactAside';
import BusinessProfileOfferBanner from '@/components/business/BusinessProfileOfferBanner';
import BusinessProfileAboutSection from '@/components/business/BusinessProfileAboutSection';
import BusinessProfileReviewCard from '@/components/business/BusinessProfileReviewCard';
import BusinessProfileReviewItem from '@/components/business/BusinessProfileReviewItem';
import DistanceBadge from '@/components/business/DistanceBadge';
import { getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import {
  getPublicReviewRating,
  parseBusinessReviewReply,
  parseBusinessReviews,
  type BusinessReview,
} from '@/lib/businessReviews';
import { getDiscountOfferDisplay } from '@/lib/discountOffer';
import {
  directionsHref,
  phoneHref,
  shareBusinessPage,
  whatsAppHref,
} from '@/lib/businessContact';
import { formatEstablishmentYearsLabel } from '@/lib/establishmentYear';
import { formatTimingRange12h } from '@/lib/formatBusinessHours';
import { buildLoginHref } from '@/lib/authRedirect';
import {
  buildProfileIntentPath,
  isContactIntent,
  type ContactIntent,
} from '@/lib/directLead';
import { getBusinessShareUrl } from '@/lib/businessSeo';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { formatDistanceFromUser } from '@/lib/geo';
import { useUserCoords } from '@/hooks/useUserCoords';
import { resolveClientSearchQuery, setLastSearchQuery } from '@/lib/lastSearchQuery';
import Loader, { MERCHANT_PROFILE_LOADER_MESSAGES } from '@/components/Loader';
import {
  getProfileViewSessionHash,
  shouldRecordProfileViewToday,
} from '@/lib/profileViews';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const SECTIONS = [
  { id: 'services', label: 'Services' },
  { id: 'hours', label: 'Hours' },
  { id: 'contact', label: 'Contact' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'about', label: 'About' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
};

type SessionBusiness = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

function getGalleryImages(business: Business): string[] {
  const pool = [business.profilePictureUrl, business.image, ...(business.images || [])].filter(
    Boolean
  ) as string[];
  return [...new Set(pool)];
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className="p-0.5"
            aria-label={`Rate ${starValue} stars`}
          >
            <Star
              size={20}
              className={starValue <= value ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function BusinessProfilePage({
  slugOrId,
  initialBusiness = null,
  initialCategoryBreadcrumb = null,
  initialRelatedCategory = [],
  initialRelatedCity = [],
}: {
  slugOrId: string;
  initialBusiness?: Business | null;
  initialCategoryBreadcrumb?: CategoryBreadcrumb | null;
  initialRelatedCategory?: Business[];
  initialRelatedCity?: Business[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const intentHandledRef = useRef(false);
  const [business, setBusiness] = useState<Business | null>(initialBusiness);
  const [related, setRelated] = useState<Business[]>(
    initialRelatedCategory.length > 0 ? initialRelatedCategory : initialRelatedCity
  );
  const [reviews, setReviews] = useState<BusinessReview[]>(
    initialBusiness ? parseBusinessReviews(initialBusiness.review) : []
  );
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionBusiness, setSessionBusiness] = useState<SessionBusiness | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialBusiness);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectModalInitialStep, setConnectModalInitialStep] = useState<'options' | 'form'>('options');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('services');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [showManageToast, setShowManageToast] = useState(false);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState<CategoryBreadcrumb | null>(
    initialCategoryBreadcrumb
  );
  const userCoords = useUserCoords();
  const businessId = business?.id ?? slugOrId;

  useEffect(() => {
    // Always open merchant profile from top unless an explicit hash is present.
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [slugOrId]);

  useEffect(() => {
    if (initialBusiness) {
      setBusiness(initialBusiness);
      setReviews(parseBusinessReviews(initialBusiness.review));
      setCategoryBreadcrumb(initialCategoryBreadcrumb);
      setRelated(
        initialRelatedCategory.length > 0 ? initialRelatedCategory : initialRelatedCity
      );
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      setNotFound(false);

      const [result, sessionResult, businessSessionResult] = await Promise.all([
        getBusiness(slugOrId),
        getSession(),
        getBusinessSession(),
      ]);

      if (result.success && result.business) {
        const record = result.business as Business;
        setBusiness(record);
        setReviews(parseBusinessReviews(record.review));

        const categoryResult = await findCategoryForBreadcrumb(record.category);
        setCategoryBreadcrumb(categoryResult.category);

        const relatedResult = await getBusinessesByCategory(record.category, {
          page: 1,
          pageSize: 5,
        });
        if (relatedResult.success && relatedResult.businesses) {
          setRelated(
            relatedResult.businesses
              .filter((item) => item.id !== record.id)
              .slice(0, 4) as Business[]
          );
        } else {
          setRelated([]);
        }
      } else {
        setNotFound(true);
        setCategoryBreadcrumb(null);
      }

      if (sessionResult?.success && sessionResult.user) {
        setSessionUser({
          id: sessionResult.user.id,
          fullName: sessionResult.user.fullName,
          email: sessionResult.user.email,
        });
      } else {
        setSessionUser(null);
      }

      if (businessSessionResult?.success && businessSessionResult.business) {
        const owned = businessSessionResult.business;
        setSessionBusiness({
          id: owned.id,
          name: owned.displayName || owned.name || owned.businessName || 'My Business',
          email: owned.email || '',
          phone: (owned.mobile || owned.publicPhone || '').trim() || null,
        });
      } else {
        setSessionBusiness(null);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [slugOrId, initialBusiness, initialCategoryBreadcrumb, initialRelatedCategory, initialRelatedCity]);

  useEffect(() => {
    if (!initialBusiness) return;

    async function fetchSession() {
      const [sessionResult, businessSessionResult] = await Promise.all([
        getSession(),
        getBusinessSession(),
      ]);
      if (sessionResult?.success && sessionResult.user) {
        setSessionUser({
          id: sessionResult.user.id,
          fullName: sessionResult.user.fullName,
          email: sessionResult.user.email,
        });
      } else {
        setSessionUser(null);
      }

      if (businessSessionResult?.success && businessSessionResult.business) {
        const owned = businessSessionResult.business;
        setSessionBusiness({
          id: owned.id,
          name: owned.displayName || owned.name || owned.businessName || 'My Business',
          email: owned.email || '',
          phone: (owned.mobile || owned.publicPhone || '').trim() || null,
        });
      } else {
        setSessionBusiness(null);
      }
    }

    fetchSession();
  }, [initialBusiness]);

  useEffect(() => {
    const q = resolveClientSearchQuery(searchParams.get('q') ?? searchParams.get('search'));
    setClientSearchQuery(q);
    if (q) setLastSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setConnectModalOpen(false);
    setConnectModalInitialStep('options');
    intentHandledRef.current = false;
    setActiveImage(0);
    setReviewError(null);
    setReviewSuccess(null);
    setReviewContent('');
  }, [slugOrId]);

  useEffect(() => {
    if (isLoading || !business) return;
    if (!shouldRecordProfileViewToday(businessId)) return;

    const sessionHash = getProfileViewSessionHash();
    void fetch(`/api/business/${businessId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionHash }),
    }).catch(() => undefined);
  }, [business, businessId, isLoading]);

  useEffect(() => {
    if (isLoading || !business) return;

    const timer = window.setTimeout(() => {
      setConnectModalOpen(true);
    }, 10_000);

    return () => window.clearTimeout(timer);
  }, [isLoading, business?.id]);

  useEffect(() => {
    if (!shareMessage) return;
    const timer = window.setTimeout(() => setShareMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  const scrollToSection = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const galleryImages = useMemo(() => (business ? getGalleryImages(business) : []), [business]);
  const openStatus = useMemo(
    () => (business ? getBusinessOpenStatus(business.timings) : null),
    [business]
  );
  const ownerReply = useMemo(
    () => (business ? parseBusinessReviewReply(business.reviewReply) : null),
    [business]
  );
  const displayRating = useMemo(() => getPublicReviewRating(reviews), [reviews]);
  const offerDisplay = useMemo(
    () => (business ? getDiscountOfferDisplay(business.discountRange, business.name) : null),
    [business]
  );
  const userHasReviewed = useMemo(
    () => Boolean(sessionUser && reviews.some((review) => review.userId === sessionUser.id)),
    [reviews, sessionUser]
  );

  const phoneLink = useMemo(
    () => (business?.contact ? phoneHref(business.contact) : null),
    [business?.contact],
  );
  const whatsappLink = useMemo(
    () =>
      business
        ? whatsAppHref(business.whatsappNumber || business.contact, business.name)
        : null,
    [business],
  );
  const profileRedirectPath = useMemo(
    () => (business ? getBusinessProfilePath(business) : ''),
    [business],
  );
  const contactRevealed = Boolean(sessionUser || sessionBusiness);
  const managesThisProfile = Boolean(sessionBusiness?.id && business?.id === sessionBusiness.id);

  useEffect(() => {
    if (!managesThisProfile || !business?.id) {
      setShowManageToast(false);
      return;
    }

    const dismissed = sessionStorage.getItem(`finderb-manage-profile-toast-${business.id}`) === '1';
    setShowManageToast(!dismissed);
  }, [managesThisProfile, business?.id]);

  const dismissManageToast = useCallback(() => {
    if (business?.id) {
      sessionStorage.setItem(`finderb-manage-profile-toast-${business.id}`, '1');
    }
    setShowManageToast(false);
  }, [business?.id]);

  const handleRequestContact = useCallback(
    (intent: ContactIntent) => {
      if (!business) return;
      router.push(buildLoginHref(buildProfileIntentPath(getBusinessProfilePath(business), intent)));
    },
    [business, router],
  );

  const handleContactAction = useCallback(
    async (intent: ContactIntent) => {
      if (!business) return;
      if (!sessionUser && !sessionBusiness) {
        handleRequestContact(intent);
        return;
      }

      await recordDirectLead({ businessId: business.id, channel: intent });

      if (intent === 'call' && phoneLink) {
        window.location.href = phoneLink;
        return;
      }
      if (intent === 'whatsapp' && whatsappLink) {
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
        return;
      }
      if (intent === 'enquire') {
        setConnectModalInitialStep('form');
        setConnectModalOpen(true);
      }
    },
    [business, sessionUser, phoneLink, whatsappLink, handleRequestContact],
  );

  useEffect(() => {
    const intent = searchParams.get('intent');
    if (!business || !sessionUser || !isContactIntent(intent) || intentHandledRef.current) return;

    intentHandledRef.current = true;

    void (async () => {
      await recordDirectLead({ businessId: business.id, channel: intent });

      const params = new URLSearchParams(searchParams.toString());
      params.delete('intent');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

      if (intent === 'call' && phoneLink) {
        window.location.href = phoneLink;
      } else if (intent === 'whatsapp' && whatsappLink) {
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      } else if (intent === 'enquire') {
        setConnectModalInitialStep('form');
        setConnectModalOpen(true);
      }
    })();
  }, [
    business,
    sessionUser,
    searchParams,
    pathname,
    router,
    phoneLink,
    whatsappLink,
  ]);

  const handleShare = async () => {
    if (!business || typeof window === 'undefined') return;

    try {
      const url = getBusinessShareUrl(business, window.location.origin);
      const result = await shareBusinessPage(business.name, url);

      if (result === 'copied') setShareMessage('Link copied to clipboard');
      else if (result === 'shared') setShareMessage('Shared successfully');
      else if (result === 'unsupported') {
        setShareMessage('Copy blocked — use your browser share menu');
      }
    } catch {
      setShareMessage('Could not share this listing');
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!business || !sessionUser) return;

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);

    const result = await submitBusinessReview({
      businessId: business.id,
      rating: reviewRating,
      content: reviewContent,
    });

    if (result.success) {
      setReviews(result.reviews);
      setBusiness((current) =>
        current ? { ...current, rating: result.rating, reviewsCount: result.reviews.length } : current
      );
      setReviewContent('');
      setReviewSuccess('Your review was posted.');
    } else {
      setReviewError(result.error);
    }

    setReviewSubmitting(false);
  };

  if (isLoading) {
    return (
      <Loader
        tagline="Loading profile"
        messages={MERCHANT_PROFILE_LOADER_MESSAGES}
      />
    );
  }

  if (notFound || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 pt-20">
        <div className="max-w-sm space-y-5 text-center">
          <Building2 className="mx-auto text-stone-300" size={40} />
          <h1 className="text-xl font-semibold text-stone-900">Business not found</h1>
          <p className="text-sm text-stone-500">This listing may have been removed.</p>
          <Link href="/" className="inline-block text-sm font-medium text-[#215481] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const locationLabel = getBusinessLocationLabel(business);
  const isVerified = Boolean(business.isFinderBVerified || business.hasVerifiedBadge);
  const directionsLink = directionsHref({
    latitude: business.latitude,
    longitude: business.longitude,
    address: business.businessAddress,
    location: business.location,
  });
  const distanceLabel = formatDistanceFromUser(
    userCoords,
    business.latitude,
    business.longitude
  );
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const socialLinks = [
    { label: 'Instagram', href: business.instagramUrl },
    { label: 'Facebook', href: business.facebookUrl },
    { label: 'YouTube', href: business.youtubeUrl },
  ].filter((item) => Boolean(item.href));

  return (
    <div className="relative min-h-screen bg-white pb-36 lg:pb-10 pt-[4.25rem] sm:pt-24">
      <BusinessProfileBackdrop />

      <header className="sticky top-[4.25rem] z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md sm:top-24">
        {showManageToast && (
          <div
            className="mx-auto max-w-6xl px-4 pt-2 sm:px-6 lg:max-w-7xl"
            role="status"
            aria-live="polite"
          >
            <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
              <p className="font-medium">You manage this profile</p>
              <button
                type="button"
                onClick={dismissManageToast}
                className="shrink-0 rounded-md p-1 text-emerald-700/80 hover:bg-emerald-100 hover:text-emerald-900"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 lg:max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#57534e] hover:text-[#215481]"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#57534e] hover:text-[#215481]"
          >
            <Share2 size={15} />
            Share
          </button>
        </div>
      </header>

      {shareMessage && (
        <div className="fixed left-1/2 top-28 z-[70] -translate-x-1/2 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs text-[#57534e] sm:top-32">
          {shareMessage}
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:max-w-7xl">
        <section className="border-b border-stone-200/80 py-4 md:py-6">
          <div className="md:grid md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
            <StackedPhotoGallery
              images={galleryImages}
              alt={business.name}
              activeIndex={activeImage}
              onSelect={setActiveImage}
            />

            <div className="mt-5 flex flex-col gap-1.5 md:mt-0 md:border-l md:border-stone-200/70 md:pl-10 lg:gap-2 lg:pl-12">
            <h1 className="flex items-start gap-2 text-[1.65rem] font-semibold leading-tight text-[#153551] sm:text-[1.85rem] lg:text-[2rem]">
              <span className="min-w-0">{business.name}</span>
              {isVerified ? <VerifiedNameTick size={22} className="mt-0.5 shrink-0 sm:mt-1" /> : null}
            </h1>

            {business.category && (
              <p className="text-sm font-medium leading-tight text-[#215481]">{business.category}</p>
            )}

            <BusinessProfileHeroBadges category={business.category} />

            {locationLabel && (
              <p className="flex items-start gap-1.5 text-sm leading-tight text-stone-600">
                <MapPin size={14} className="mt-px shrink-0 text-stone-400" aria-hidden />
                <span>{locationLabel}</span>
              </p>
            )}

            {distanceLabel && directionsLink && (
              <DistanceBadge label={distanceLabel} mapsHref={directionsLink} />
            )}

            {(() => {
              const label = formatEstablishmentYearsLabel(business.yearsInBusiness);
              return label ? (
                <p className="text-sm leading-tight text-stone-600">{label}</p>
              ) : null;
            })()}

            {openStatus && (
              <p className={`flex items-center gap-1.5 text-sm leading-tight ${openStatus.colorClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${openStatus.dotClass}`} />
                {openStatus.label}
              </p>
            )}

            <BusinessProfileReviewCard
              displayRating={displayRating}
              reviewCount={reviews.length}
            />

            {offerDisplay && (
              <BusinessProfileOfferBanner
                headline={offerDisplay.headline}
                detail={offerDisplay.detail}
                label={offerDisplay.label}
              />
            )}

            <div className="mt-2 hidden gap-2 md:grid md:grid-cols-2">
              {phoneLink && (
                <button
                  type="button"
                  onClick={() => {
                    if (contactRevealed) void handleContactAction('call');
                    else handleRequestContact('call');
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#215481] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367]"
                >
                  <Phone size={15} />
                  Call
                </button>
              )}
              {whatsappLink && (
                <button
                  type="button"
                  onClick={() => {
                    if (contactRevealed) void handleContactAction('whatsapp');
                    else handleRequestContact('whatsapp');
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fa855]"
                >
                  <FaWhatsapp size={16} className="shrink-0" aria-hidden />
                  WhatsApp
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (contactRevealed) void handleContactAction('enquire');
                else handleRequestContact('enquire');
              }}
              className="hidden w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#215481] hover:bg-[#fffdf8] md:block"
            >
              {contactRevealed ? 'Send enquiry' : 'Sign in to send enquiry'}
            </button>
            </div>
          </div>
        </section>

        <nav className="sticky top-[calc(4.25rem+2.75rem)] z-30 -mx-4 flex gap-5 overflow-x-auto border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-md sm:top-[calc(6rem+2.75rem)] sm:-mx-6 sm:px-6">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`shrink-0 border-b-2 py-3 text-sm ${
                activeSection === section.id
                  ? 'border-[#215481] font-semibold text-[#215481]'
                  : 'border-transparent text-[#78716c] hover:text-[#153551]'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-5 py-5 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-8 xl:grid-cols-[1fr_340px]">
            <section id="services" className="scroll-mt-40 order-1 lg:col-start-1 lg:row-start-1">
              <h2 className="text-base font-semibold text-[#153551]">Services</h2>
              <BusinessProfileServicesSection services={business.services ?? []} />
            </section>

            <section id="hours" className="scroll-mt-40 order-2 border-t border-stone-200/60 pt-5 lg:col-start-1 lg:row-start-3">
              <h2 className="text-base font-semibold text-[#153551]">Hours</h2>

              {business.timings ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-stone-200/80 bg-white">
                  <div className="flex items-center gap-2 border-b border-stone-100 px-3.5 py-2.5">
                    <Clock size={14} className="text-[#215481]" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Opening hours
                    </span>
                  </div>
                  <ul className="divide-y divide-stone-100">
                    {WEEKDAYS.map((day) => {
                      const timing = business.timings?.[day];
                      const isToday = day === todayName;
                      const isClosed =
                        !timing ||
                        timing === 'Closed' ||
                        (typeof timing === 'object' && timing.isClosed);
                      return (
                        <li
                          key={day}
                          className={`flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm ${
                            isToday ? 'bg-[#215481]/[0.04] font-medium text-stone-900' : 'text-stone-600'
                          }`}
                        >
                          <span>
                            {day}
                            {isToday ? (
                              <span className="ml-2 rounded-full border border-[#215481]/20 bg-[#215481]/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#215481]">
                                Today
                              </span>
                            ) : null}
                          </span>
                          <span className={isClosed ? 'text-rose-600' : 'text-stone-700'}>
                            {formatTimingRange12h(timing)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-400">Hours not listed.</p>
              )}
            </section>

          <section
            id="contact"
            className="scroll-mt-40 order-3 border-t border-stone-200/60 pt-5 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-32 lg:self-start lg:border-t-0 lg:pt-0"
          >
            <BusinessProfileContactAside
              contactRevealed={contactRevealed}
              profileRedirectPath={profileRedirectPath}
              phoneLink={phoneLink}
              phone={business.contact}
              email={business.email}
              website={business.website}
              paymentModes={business.paymentModes ?? []}
              socialLinks={socialLinks}
              onCall={() => void handleContactAction('call')}
              onEnquire={() => {
                if (contactRevealed) void handleContactAction('enquire');
                else handleRequestContact('enquire');
              }}
            />
          </section>

          <section id="reviews" className="scroll-mt-40 order-4 border-t border-stone-200/60 pt-5 lg:col-start-1 lg:row-start-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-[#153551]">Reviews</h2>
              {displayRating != null ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  {displayRating} · {reviews.length} total
                </span>
              ) : (
                <span className="text-xs text-stone-400">No reviews yet</span>
              )}
            </div>

            {!sessionUser ? (
              <div className="mt-4 rounded-lg border border-[#f9b864]/30 bg-[#fff8ef] px-4 py-3 text-sm text-stone-600">
                <Link
                  href={buildLoginHref(`${getBusinessProfilePath(business)}#reviews`)}
                  className="font-medium text-[#215481] hover:underline"
                >
                  Log in as a user
                </Link>{' '}
                to write a review.
              </div>
            ) : userHasReviewed ? (
              <p className="mt-4 text-sm text-stone-500">You have already reviewed this business.</p>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-sm text-stone-700">
                  Posting as <span className="font-medium text-stone-900">{sessionUser.fullName}</span>
                </p>
                <div className="mt-3">
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewContent}
                  onChange={(event) => setReviewContent(event.target.value)}
                  placeholder="What was your experience?"
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#215481]"
                  required
                  minLength={10}
                />
                {reviewError && <p className="mt-2 text-xs text-red-600">{reviewError}</p>}
                {reviewSuccess && <p className="mt-2 text-xs text-emerald-700">{reviewSuccess}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="mt-3 rounded-lg bg-[#215481] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4367] disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Posting…' : 'Post review'}
                </button>
              </form>
            )}

            <div className="mt-6 space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-stone-400">No reviews yet.</p>
              ) : (
                reviews.map((review) => (
                  <BusinessProfileReviewItem
                    key={review.id}
                    review={review}
                    businessId={business.id}
                    businessName={business.name}
                    contactRevealed={contactRevealed}
                    profileRedirectPath={profileRedirectPath}
                  />
                ))
              )}
            </div>

            {ownerReply && (
              <div className="mt-5 border-l-2 border-stone-300 pl-4">
                <p className="text-xs font-medium text-stone-500">{business.name}</p>
                <p className="mt-1 text-sm text-stone-700">{ownerReply.content}</p>
              </div>
            )}
          </section>

          <div className="order-5 lg:col-start-2 lg:row-start-2">
            <BusinessProfileAboutSection
              description={business.description}
              keywords={business.keywords}
            />
          </div>

          {related.length > 0 && (
            <section className="order-6 scroll-mt-40 border-t border-stone-200/60 pt-5 lg:col-start-2 lg:row-start-3 lg:self-start lg:pt-4">
              <h2 className="text-base font-semibold text-[#153551]">Similar listings</h2>
              <div className="mt-3 grid items-start gap-3">
                {related.map((item) => (
                  <BusinessCard
                    key={item.id}
                    business={item}
                    variant="profile"
                    distanceLabel={formatDistanceFromUser(userCoords, item.latitude, item.longitude)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="border-t border-stone-200/80 pt-4">
          <BusinessProfileBreadcrumb business={business} categoryBreadcrumb={categoryBreadcrumb} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-[5.75rem] z-[9990] border-t border-stone-200 bg-white px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          {phoneLink && (
            <button
              type="button"
              onClick={() => {
                if (contactRevealed) void handleContactAction('call');
                else handleRequestContact('call');
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#215481] py-2.5 text-sm font-semibold text-white"
            >
              <Phone size={15} />
              Call
            </button>
          )}
          {whatsappLink && (
            <button
              type="button"
              onClick={() => {
                if (contactRevealed) void handleContactAction('whatsapp');
                else handleRequestContact('whatsapp');
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-white"
            >
              <FaWhatsapp size={16} className="shrink-0" aria-hidden />
              WhatsApp
            </button>
          )}
        </div>
      </div>

      <ConnectMerchantModal
        business={{
          id: business.id,
          name: business.name,
          category: business.category,
          contact: business.contact,
          whatsappNumber: business.whatsappNumber,
          city: business.city,
          location: business.location,
        }}
        isOpen={connectModalOpen}
        onClose={() => {
          setConnectModalOpen(false);
          setConnectModalInitialStep('options');
        }}
        initialLookingFor={clientSearchQuery}
        contactRevealed={contactRevealed}
        profileRedirectPath={profileRedirectPath}
        userName={sessionUser?.fullName || sessionBusiness?.name || ''}
        userEmail={sessionUser?.email || sessionBusiness?.email || ''}
        userPhone={sessionBusiness?.phone || ''}
        onContactAction={handleContactAction}
        initialStep={connectModalInitialStep}
      />
    </div>
  );
}
