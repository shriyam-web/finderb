'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  ChevronLeft,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import type { Business } from '@/lib/mockData';
import { findCategoryForBreadcrumb, type CategoryBreadcrumb } from '@/app/actions/category';
import { getBusiness, getBusinessesByCategory, getBusinessSession } from '@/app/actions/business';
import { submitBusinessReview } from '@/app/actions/reviews';
import { getSession, toggleFavorite } from '@/app/actions/user';
import { recordDirectLead } from '@/app/actions/leads';
import ConnectMerchantModal from '@/components/ConnectMerchantModal';
import OpenInAppPrefer from '@/components/business/OpenInAppPrefer';
import BusinessProfileHeroGallery, {
  type BusinessProfileHeroGalleryHandle,
} from '@/components/business/BusinessProfileHeroGallery';
import BusinessProfileBreadcrumb from '@/components/business/BusinessProfileBreadcrumb';
import BusinessProfileServicesSection from '@/components/business/BusinessProfileServicesSection';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import BusinessProfileContactAside from '@/components/business/BusinessProfileContactAside';
import BusinessProfileOfferBanner from '@/components/business/BusinessProfileOfferBanner';
import BusinessProfileAboutSection from '@/components/business/BusinessProfileAboutSection';
import BusinessProfileJobsSection, {
  type ProfileJob,
} from '@/components/business/BusinessProfileJobsSection';
import BusinessProfileReviewItem from '@/components/business/BusinessProfileReviewItem';
import BusinessProfileRelatedRail from '@/components/business/BusinessProfileRelatedRail';
import { getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import { getBusinessOpenStatus, getWeeklyHours } from '@/lib/businessHours';
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
import { isValidEstablishmentYear } from '@/lib/establishmentYear';
import { getBusinessGalleryImages } from '@/lib/businessMapping';
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
import { getActiveJobsByBusiness } from '@/app/actions/job';

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

function categoryYearsLine(category: string, year: number | null | undefined) {
  const cat = category.trim() || 'Business';
  if (!isValidEstablishmentYear(year)) return cat;
  const years = new Date().getFullYear() - year;
  if (years <= 0) return cat;
  return `${cat} · ${years}+ yrs`;
}

type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  favorites: string[];
};

type SessionBusiness = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

function toFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id || '').trim()).filter(Boolean);
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
  const heroRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<BusinessProfileHeroGalleryHandle>(null);
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
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState<CategoryBreadcrumb | null>(
    initialCategoryBreadcrumb
  );
  const [jobs, setJobs] = useState<ProfileJob[]>([]);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [compactVisible, setCompactVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const userCoords = useUserCoords();
  const businessId = business?.id ?? slugOrId;

  useEffect(() => {
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
          pageSize: 8,
        });
        if (relatedResult.success && relatedResult.businesses) {
          setRelated(
            relatedResult.businesses
              .filter((item) => item.id !== record.id)
              .slice(0, 6) as Business[]
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
          favorites: toFavoriteIds(sessionResult.user.favorites),
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
          favorites: toFavoriteIds(sessionResult.user.favorites),
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
    setReviewError(null);
    setReviewSuccess(null);
    setReviewContent('');
    setHoursExpanded(false);
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
    if (!business?.id) {
      setJobs([]);
      return;
    }

    let cancelled = false;

    async function loadJobs() {
      const result = await getActiveJobsByBusiness(business!.id);
      if (cancelled) return;
      if (result.success && result.jobs) {
        setJobs(result.jobs as ProfileJob[]);
      } else {
        setJobs([]);
      }
    }

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  useEffect(() => {
    if (!shareMessage) return;
    const timer = window.setTimeout(() => setShareMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCompactVisible(!entry.isIntersecting),
      { threshold: 0.12, rootMargin: '-72px 0px 0px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [business?.id, isLoading]);

  const galleryImages = useMemo(() => (business ? getBusinessGalleryImages(business) : []), [business]);
  const openStatus = useMemo(
    () => (business ? getBusinessOpenStatus(business.timings) : null),
    [business]
  );
  const weeklyHours = useMemo(
    () => (business ? getWeeklyHours(business.timings) : []),
    [business]
  );
  const todayHours = weeklyHours.find((row) => row.isToday);
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
  const ratingBars = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const review of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(review.rating)));
      counts[star - 1] += 1;
    }
    const total = Math.max(1, counts.reduce((sum, count) => sum + count, 0));
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      ratio: counts[star - 1] / total,
      count: counts[star - 1],
    }));
  }, [reviews]);

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
    if (!sessionUser || !business?.id) {
      setSaved(false);
      return;
    }
    setSaved(sessionUser.favorites.includes(business.id));
  }, [sessionUser, business?.id]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  }, [router]);

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
    [business, sessionUser, sessionBusiness, phoneLink, whatsappLink, handleRequestContact],
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

      if (result === 'copied') setShareMessage('Link copied');
      else if (result === 'shared') setShareMessage('Shared successfully');
      else if (result === 'unsupported') {
        setShareMessage('Copy blocked — use your browser share menu');
      }
    } catch {
      setShareMessage('Could not share this listing');
    }
  };

  const handleSave = async () => {
    if (!business) return;
    if (!sessionUser) {
      router.push(buildLoginHref(getBusinessProfilePath(business)));
      return;
    }
    if (saving) return;
    setSaving(true);
    const result = await toggleFavorite(business.id);
    setSaving(false);
    if (result.success) {
      setSaved(result.saved);
      setSessionUser((current) =>
        current ? { ...current, favorites: result.favoriteIds } : current
      );
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

  const locationLabel = business.businessAddress?.trim() || getBusinessLocationLabel(business);
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
  const socialLinks = [
    { label: 'Instagram', href: business.instagramUrl },
    { label: 'Facebook', href: business.facebookUrl },
    { label: 'YouTube', href: business.youtubeUrl },
  ].filter((item) => Boolean(item.href));
  const showHoursStatus = Boolean(openStatus && openStatus.label !== 'Hours not listed');
  const ratingValue = displayRating ?? (reviews.length === 0 ? 5 : null);
  const avatarSrc = galleryImages[0];

  return (
    <div className="relative min-h-screen bg-[#fafaf9] pt-[4.25rem] sm:pt-24">
      <OpenInAppPrefer slug={slugOrId} />

      <div
        className={`fixed inset-x-0 top-[4.25rem] z-40 border-b border-stone-200 bg-white/95 backdrop-blur-md transition-opacity sm:top-24 ${
          compactVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-3 py-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50"
            aria-label="Go back"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#153551]">{business.name}</p>
            <p className="truncate text-[11px] text-stone-500">
              {business.category || 'Business'}
              {showHoursStatus ? ` · ${openStatus?.label}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50"
            aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
          >
            <Heart size={16} className={saved ? 'fill-rose-600 text-rose-600' : ''} />
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50"
            aria-label="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        {managesThisProfile ? (
          <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5" role="status">
            <p className="text-center text-sm font-semibold text-emerald-800">
              You manage this profile
            </p>
          </div>
        ) : null}
        <div ref={heroRef}>
          <BusinessProfileHeroGallery
            ref={galleryRef}
            images={galleryImages}
            alt={business.name}
            saved={saved}
            onBack={handleBack}
            onShare={() => void handleShare()}
            onSave={() => void handleSave()}
          />
        </div>

        <div className="relative z-10 -mt-[18px] rounded-t-[22px] bg-[#fafaf9] pt-[18px]">
          <div className="relative px-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                disabled={!avatarSrc}
                onClick={() => galleryRef.current?.openPhoto(0)}
                className="relative -mt-8 h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[20px] border-2 border-[#fafaf9] bg-stone-200 shadow-[0_4px_10px_rgba(0,0,0,0.12)]"
                aria-label="View profile photo"
              >
                {avatarSrc ? (
                  <Image src={avatarSrc} alt="" fill className="object-cover" sizes="72px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[#215481] text-2xl font-bold text-white">
                    {business.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1 pr-[108px]">
                <h1 className="text-[22px] font-extrabold leading-7 tracking-tight text-[#153551]">
                  {business.name}
                  {isVerified ? (
                    <VerifiedNameTick size={18} className="ml-1 inline-flex translate-y-[1px] align-text-bottom" />
                  ) : null}
                </h1>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5 rounded-[5px] bg-[#E6A800] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    <Star size={11} className="fill-white text-white" />
                    {ratingValue != null ? ratingValue.toFixed(1) : '5.0'}
                  </span>
                  {reviews.length > 0 ? (
                    <span className="text-xs font-medium text-stone-400">({reviews.length})</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-stone-400">New</span>
                  )}
                </div>
              </div>

              <div className="absolute right-0 top-0 flex w-[96px] flex-col gap-1.5">
                {phoneLink ? (
                  <button
                    type="button"
                    onClick={() => void handleContactAction('call')}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-[#15803D] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <Phone size={14} />
                    Call
                  </button>
                ) : null}
                {whatsappLink || business.contact ? (
                  <button
                    type="button"
                    onClick={() => void handleContactAction('whatsapp')}
                    className="inline-flex items-center justify-center gap-1 rounded-full bg-[#128C7E] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <FaWhatsapp size={14} />
                    WhatsApp
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-2.5 space-y-2">
              <p className="text-[13px] font-medium text-stone-500">
                {categoryYearsLine(business.category, business.yearsInBusiness)}
              </p>

              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <span className="animate-fire-flicker" aria-hidden>🔥</span>
                Best in Category
              </p>

              {locationLabel || distanceLabel || directionsLink ? (
                <div>
                  {locationLabel ? (
                    <p className="flex items-start gap-1 text-xs leading-[17px] text-stone-500">
                      <MapPin size={13} className="mt-px shrink-0 text-amber-800" />
                      <span>{locationLabel}</span>
                    </p>
                  ) : null}
                  {(distanceLabel || directionsLink) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-[17px] text-xs">
                      {distanceLabel ? (
                        <span className="font-medium text-stone-400">
                          {distanceLabel.replace(/\s*away$/i, '')}
                        </span>
                      ) : null}
                      {distanceLabel && directionsLink ? (
                        <span className="text-stone-300">·</span>
                      ) : null}
                      {directionsLink ? (
                        <a
                          href={directionsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-700"
                        >
                          <Navigation size={13} />
                          Get Direction
                        </a>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {showHoursStatus ? (
                <p className="flex flex-wrap items-center gap-1.5 text-[13px]">
                  <span className={`h-[7px] w-[7px] rounded-full ${openStatus?.dotClass}`} />
                  <span className={`font-semibold ${openStatus?.colorClass}`}>
                    {openStatus?.status === 'Open' ? 'Open now' : 'Closed'}
                  </span>
                  {todayHours?.hours || openStatus?.label ? (
                    <>
                      <span className="text-stone-300">·</span>
                      <span className="font-medium text-stone-500">
                        {todayHours?.hours || openStatus?.label}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleContactAction('enquire')}
                className="inline-flex items-center gap-1.5 self-start rounded-full border border-stone-300 bg-white px-3 py-2 text-[13px] font-semibold text-stone-500"
              >
                <MessageCircle size={13} />
                Make enquiry
              </button>

              {offerDisplay ? (
                <BusinessProfileOfferBanner
                  headline={offerDisplay.headline}
                  detail={offerDisplay.detail}
                  label={offerDisplay.label}
                />
              ) : null}
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-amber-800">
                <Briefcase size={14} />
              </span>
              <p className="min-w-0 flex-1 text-xs font-medium text-[#153551]">
                Hiring now · {jobs.length} open role{jobs.length === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                onClick={() => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs font-semibold text-amber-800"
              >
                View
              </button>
            </div>
          ) : null}

          {business.services?.length ? (
            <section id="services" className="scroll-mt-40 px-4 pt-6">
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#153551]">Services</h2>
              <BusinessProfileServicesSection services={business.services} />
            </section>
          ) : null}

          <BusinessProfileContactAside
            contactRevealed={contactRevealed}
            profileRedirectPath={profileRedirectPath}
            phoneLink={phoneLink}
            phone={business.contact}
            email={business.email}
            website={business.website}
            address={business.businessAddress}
            paymentModes={business.paymentModes ?? []}
            socialLinks={socialLinks}
            onCall={() => void handleContactAction('call')}
            onEnquire={() => {
              if (contactRevealed) void handleContactAction('enquire');
              else handleRequestContact('enquire');
            }}
          />

          <BusinessProfileAboutSection
            description={business.description || business.about || ''}
            keywords={business.keywords}
          />

          {weeklyHours.length > 0 ? (
            <section id="hours" className="scroll-mt-40 px-4 pt-6">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[20px] font-extrabold tracking-tight text-[#153551]">Hours</h2>
                <button
                  type="button"
                  onClick={() => setHoursExpanded((open) => !open)}
                  className="pb-0.5 text-xs font-semibold text-[#215481]"
                >
                  {hoursExpanded ? 'Less' : 'Full week'}
                </button>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200/90 bg-white">
                <div className="flex items-center justify-between gap-3 bg-stone-50 p-3.5">
                  <div>
                    <p className="text-[11px] font-medium text-stone-400">Today</p>
                    <p className="mt-0.5 text-[15px] font-semibold text-[#153551]">
                      {todayHours?.hours || openStatus?.label || 'See full week'}
                    </p>
                  </div>
                  {showHoursStatus ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${
                        openStatus?.status === 'Open'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${openStatus?.dotClass}`} />
                      {openStatus?.label || openStatus?.status}
                    </span>
                  ) : null}
                </div>
                {hoursExpanded
                  ? weeklyHours.map((row) => (
                      <div
                        key={row.day}
                        className={`flex items-center justify-between border-t border-stone-100 px-3.5 py-2.5 text-[13px] ${
                          row.isToday ? 'bg-amber-50 font-semibold text-amber-900' : 'text-stone-600'
                        }`}
                      >
                        <span>{row.day}</span>
                        <span>{row.hours}</span>
                      </div>
                    ))
                  : null}
              </div>
            </section>
          ) : null}

          <section id="reviews" className="scroll-mt-40 px-4 pt-6">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#153551]">Reviews</h2>
              {displayRating != null ? (
                <span className="text-xs font-medium text-stone-400">{displayRating.toFixed(1)} avg</span>
              ) : null}
            </div>

            {reviews.length > 0 ? (
              <div className="mt-3 flex gap-3.5 rounded-2xl border border-stone-200/90 bg-stone-50 p-3.5">
                <div className="flex w-[92px] shrink-0 flex-col items-center justify-center gap-1">
                  <p className="text-[34px] font-extrabold leading-none tracking-tight text-[#153551]">
                    {displayRating != null ? displayRating.toFixed(1) : '—'}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        className={
                          index < Math.round(displayRating || 0)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-stone-300'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-center text-[11px] font-medium text-stone-400">
                    {reviews.length} reviews
                  </p>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                  {ratingBars.map((row) => (
                    <div key={row.star} className="flex items-center gap-1.5">
                      <span className="w-2.5 text-[10px] font-medium text-stone-400">{row.star}</span>
                      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${Math.round(row.ratio * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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
              <form onSubmit={handleReviewSubmit} className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
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

            <div className="mt-4 space-y-2.5">
              {reviews.length === 0 ? (
                <div className="rounded-[14px] border border-stone-200 bg-stone-50 px-4 py-6 text-center">
                  <p className="text-sm text-stone-500">
                    No public reviews yet. Be the first to share your experience.
                  </p>
                </div>
              ) : (
                reviews.slice(0, 8).map((review) => (
                  <BusinessProfileReviewItem
                    key={review.id}
                    review={review}
                    businessId={business.id}
                    businessName={business.name}
                    contactRevealed={contactRevealed}
                    profileRedirectPath={profileRedirectPath}
                    defaultReply={ownerReply?.content}
                  />
                ))
              )}
            </div>
          </section>

          <div className="px-4 pt-2">
            <BusinessProfileJobsSection jobs={jobs} />
          </div>

          <BusinessProfileRelatedRail businesses={related} userCoords={userCoords} />

          <div className="border-t border-stone-200/80 px-4 pb-8 pt-4">
            <BusinessProfileBreadcrumb business={business} categoryBreadcrumb={categoryBreadcrumb} />
          </div>
        </div>
      </div>

      {shareMessage ? (
        <div className="pointer-events-none fixed inset-x-6 bottom-24 z-[70] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-full bg-black/90 px-4 py-3 text-sm font-semibold text-white">
          {shareMessage}
        </div>
      ) : null}

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
