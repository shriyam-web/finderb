'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Clock,
  MapPin,
  Tag,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
} from 'lucide-react';
import type { Business } from '@/lib/mockData';
import { findCategoryForBreadcrumb, type CategoryBreadcrumb } from '@/app/actions/category';
import { getBusiness, getBusinessesByCategory } from '@/app/actions/business';
import { submitBusinessReview } from '@/app/actions/reviews';
import { getSession } from '@/app/actions/user';
import ConnectMerchantModal from '@/components/ConnectMerchantModal';
import BusinessCard from '@/components/BusinessCard';
import StackedPhotoGallery from '@/components/business/StackedPhotoGallery';
import BusinessProfileBackdrop from '@/components/business/BusinessProfileBackdrop';
import BusinessProfileBreadcrumb from '@/components/business/BusinessProfileBreadcrumb';
import BusinessProfileHeroBadges from '@/components/business/BusinessProfileHeroBadges';
import BusinessProfileContactAside from '@/components/business/BusinessProfileContactAside';
import BusinessProfileOfferBanner from '@/components/business/BusinessProfileOfferBanner';
import BusinessProfileReviewCard from '@/components/business/BusinessProfileReviewCard';
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
  mapEmbedSrc,
  phoneHref,
  shareBusinessPage,
  whatsAppHref,
} from '@/lib/businessContact';
import { formatTimingRange12h } from '@/lib/formatBusinessHours';
import { buildLoginHref } from '@/lib/authRedirect';
import { getBusinessShareUrl } from '@/lib/businessSeo';
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
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'location', label: 'Location' },
  { id: 'contact', label: 'Contact' },
  { id: 'reviews', label: 'Reviews' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

type SessionUser = {
  id: string;
  fullName: string;
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

export default function BusinessProfilePage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [related, setRelated] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('about');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState<CategoryBreadcrumb | null>(null);
  const userCoords = useUserCoords();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setNotFound(false);

      const [result, sessionResult] = await Promise.all([getBusiness(id), getSession()]);

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
            relatedResult.businesses.filter((item) => item.id !== id).slice(0, 4) as Business[]
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
        });
      } else {
        setSessionUser(null);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    const q = resolveClientSearchQuery(searchParams.get('q') ?? searchParams.get('search'));
    setClientSearchQuery(q);
    if (q) setLastSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setConnectModalOpen(false);
    setActiveImage(0);
    setReviewError(null);
    setReviewSuccess(null);
    setReviewContent('');
  }, [id]);

  useEffect(() => {
    if (isLoading || !business) return;
    if (!shouldRecordProfileViewToday(id)) return;

    const sessionHash = getProfileViewSessionHash();
    void fetch(`/api/business/${id}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionHash }),
    }).catch(() => undefined);
  }, [business, id, isLoading]);

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

  const handleShare = async () => {
    if (!business || typeof window === 'undefined') return;

    try {
      const url = getBusinessShareUrl(business.id, window.location.origin);
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

  const isVerified = Boolean(business.isFinderBVerified || business.hasVerifiedBadge);
  const phoneLink = phoneHref(business.contact);
  const whatsappLink = whatsAppHref(business.whatsappNumber || business.contact, business.name);
  const directionsLink = directionsHref({
    latitude: business.latitude,
    longitude: business.longitude,
    address: business.businessAddress,
    location: business.location,
  });
  const embedSrc = mapEmbedSrc({
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
    <div className="relative min-h-screen pb-36 lg:pb-10 pt-[4.25rem] sm:pt-24">
      <BusinessProfileBackdrop />

      <header className="sticky top-[4.25rem] z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md sm:top-24">
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
        <BusinessProfileBreadcrumb business={business} categoryBreadcrumb={categoryBreadcrumb} />

        <section className="border-b border-stone-200/80 py-5 md:py-8">
          <div className="md:grid md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
            <StackedPhotoGallery
              images={galleryImages}
              alt={business.name}
              activeIndex={activeImage}
              onSelect={setActiveImage}
            />

            <div className="mt-5 flex flex-col gap-2.5 md:mt-0 md:border-l md:border-stone-200/70 md:pl-10 lg:gap-3 lg:pl-12">
            <h1 className="text-[1.65rem] font-semibold leading-snug text-[#153551] sm:text-[1.85rem] lg:text-[2rem]">
              {business.name}
            </h1>

            {business.category && (
              <p className="text-sm font-medium text-[#215481]">{business.category}</p>
            )}

            {getBusinessLocationLabel(business) && (
              <p className="text-sm text-stone-600">{getBusinessLocationLabel(business)}</p>
            )}

            {distanceLabel && directionsLink && (
              <DistanceBadge label={distanceLabel} mapsHref={directionsLink} />
            )}

            {business.yearsInBusiness != null && (
              <p className="text-sm text-stone-600">
                {business.yearsInBusiness} years in business
              </p>
            )}

            <BusinessProfileHeroBadges category={business.category} isVerified={isVerified} />

            {openStatus && (
              <p className={`flex items-center gap-1.5 text-sm ${openStatus.colorClass}`}>
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
                <a
                  href={phoneLink}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#215481] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367]"
                >
                  <Phone size={15} />
                  Call
                </a>
              )}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fa855]"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="hidden w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#215481] hover:bg-[#fffdf8] md:block"
            >
              Send enquiry
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

        <div className="grid gap-10 py-8 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-12 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-1">
            <section id="about" className="scroll-mt-40">
              <h2 className="text-base font-semibold text-[#153551]">About</h2>
              {business.description ? (
                <p className="mt-3 text-[15px] leading-7 text-stone-600">{business.description}</p>
              ) : (
                <p className="mt-3 text-sm text-stone-400">No description added.</p>
              )}
              {business.keywords && business.keywords.length > 0 && (
                <p className="mt-4 text-sm text-stone-600">
                  <span className="font-medium text-stone-800">Known for:</span>{' '}
                  {business.keywords.join(', ')}
                </p>
              )}
            </section>

            <section id="services" className="scroll-mt-40 border-t border-stone-200/60 pt-8">
              <h2 className="text-base font-semibold text-[#153551]">Services</h2>
              {business.services && business.services.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {business.services.map((service) => (
                    <div
                      key={service}
                      className="flex items-start gap-2.5 rounded-lg border border-stone-200/80 bg-white px-3.5 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#215481]/8 text-[#215481]">
                        <Tag size={11} />
                      </span>
                      <span className="text-sm leading-snug text-stone-700">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-400">No services listed.</p>
              )}
            </section>

            <section id="location" className="scroll-mt-40 border-t border-stone-200/60 pt-8">
              <h2 className="text-base font-semibold text-[#153551]">Location & hours</h2>

              {(business.businessAddress || business.location) && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-stone-200/80 bg-white px-3.5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f9b864]/15 text-[#b45309]">
                    <MapPin size={15} />
                  </span>
                  <div className="min-w-0 space-y-2">
                    {distanceLabel && directionsLink && (
                      <DistanceBadge label={distanceLabel} mapsHref={directionsLink} />
                    )}
                    <p className="text-sm leading-relaxed text-stone-700">
                      {business.businessAddress || business.location}
                    </p>
                    {directionsLink && !distanceLabel && (
                      <a
                        href={directionsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#215481] hover:underline"
                      >
                        <Navigation size={12} />
                        Get directions
                      </a>
                    )}
                  </div>
                </div>
              )}

              {embedSrc && (
                <div className="mt-4 overflow-hidden rounded-lg border border-stone-200/80">
                  <iframe
                    title={`Map for ${business.name}`}
                    src={embedSrc}
                    className="h-52 w-full sm:h-60 lg:h-72"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}

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
          </div>

          <section
            id="contact"
            className="scroll-mt-40 border-t border-stone-200/60 pt-8 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-32 lg:self-start lg:border-t-0 lg:pt-0"
          >
            <BusinessProfileContactAside
              phoneLink={phoneLink}
              phone={business.contact}
              email={business.email}
              website={business.website}
              paymentModes={business.paymentModes ?? []}
              socialLinks={socialLinks}
              onEnquire={() => setConnectModalOpen(true)}
            />
          </section>

          <section id="reviews" className="scroll-mt-40 border-t border-stone-200/60 pt-8 lg:col-start-1 lg:row-start-2">
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
                  href={buildLoginHref(`/business/${id}#reviews`)}
                  className="font-medium text-[#215481] hover:underline"
                >
                  Log in
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
                  <article key={review.id} className="border-b border-stone-100 pb-5 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-stone-900">{review.author}</p>
                        {review.date && <p className="text-xs text-stone-400">{review.date}</p>}
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={
                              i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.content}</p>
                  </article>
                ))
              )}
            </div>

            {ownerReply && (
              <div className="mt-5 border-l-2 border-stone-300 pl-4">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Owner reply</p>
                <p className="mt-1 text-sm text-stone-700">{ownerReply.content}</p>
              </div>
            )}
          </section>
        </div>

        {related.length > 0 && (
          <section className="border-t border-stone-200 py-10">
            <h2 className="text-base font-semibold text-[#153551]">Similar listings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <BusinessCard
                  key={item.id}
                  business={item}
                  compact
                  distanceLabel={formatDistanceFromUser(userCoords, item.latitude, item.longitude)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-[5.75rem] z-[9990] border-t border-stone-200 bg-white px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          {phoneLink && (
            <a
              href={phoneLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#215481] py-2.5 text-sm font-semibold text-white"
            >
              <Phone size={15} />
              Call
            </a>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-white"
            >
              <MessageCircle size={15} />
              Chat
            </a>
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
        onClose={() => setConnectModalOpen(false)}
        initialLookingFor={clientSearchQuery}
      />
    </div>
  );
}
