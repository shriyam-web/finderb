'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from 'react-icons/hi2';
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { Navigation, Tag } from 'lucide-react';
import StackedPhotoGallery from '@/components/business/StackedPhotoGallery';
import BusinessProfileOfferBanner from '@/components/business/BusinessProfileOfferBanner';
import { getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import BusinessLocationMap from '@/components/business/BusinessLocationMap';
import { directionsHref, mapEmbedSrc, phoneHref } from '@/lib/businessContact';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import { normalizeExternalHref } from '@/lib/validateProfileUrl';
import {
  getPublicReviewRating,
  parseBusinessReviewReply,
  parseBusinessReviews,
} from '@/lib/businessReviews';
import { getDiscountOfferDisplay } from '@/lib/discountOffer';
import { formatEstablishmentYearsLabel } from '@/lib/establishmentYear';
import { formatTimingRange12h } from '@/lib/formatBusinessHours';
import { parseBusinessServices } from '@/lib/parseBusinessServices';
import type { MissingProfileField } from '@/lib/dashboard/profileCompletion';
import { dashboard } from './dashboard-ui';

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

type ProfileData = {
  category?: string;
  about?: string;
  rating?: number;
  isFinderBVerified?: boolean;
  discountRange?: string;
  serviceCategory?: string;
  paymentModes?: string[];
  keywords?: string[];
  yearsInBusiness?: number;
  publicPhone?: string;
  email?: string;
  website?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
  timings?: Record<string, string | { open: string; close: string; isClosed?: boolean }>;
  review?: unknown;
  reviewReply?: unknown;
  latitude?: number | null;
  longitude?: number | null;
};

type MyListingTabProps = {
  businessId: string;
  businessProfilePath?: string;
  businessName: string;
  profileData: ProfileData;
  images: string[];
  profilePictureUrl: string | null;
  completionPercent: number;
  missingFields: MissingProfileField[];
  onEditProfile: () => void;
  onOpenSettingsField?: (settingsKey: string) => void;
  onOpenKyc?: () => void;
};

function getGalleryImages(profilePictureUrl: string | null, images: string[]) {
  const pool = [profilePictureUrl, ...images].filter(Boolean) as string[];
  return [...new Set(pool)];
}

export default function MyListingTab({
  businessId,
  businessProfilePath,
  businessName,
  profileData,
  images,
  profilePictureUrl,
  completionPercent,
  missingFields,
  onEditProfile,
  onOpenSettingsField,
  onOpenKyc,
}: MyListingTabProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('about');

  const galleryImages = useMemo(
    () => getGalleryImages(profilePictureUrl, images),
    [profilePictureUrl, images]
  );

  const services = useMemo(
    () => parseBusinessServices(profileData.serviceCategory),
    [profileData.serviceCategory]
  );

  const reviews = useMemo(() => parseBusinessReviews(profileData.review), [profileData.review]);
  const ownerReply = useMemo(
    () => parseBusinessReviewReply(profileData.reviewReply),
    [profileData.reviewReply]
  );
  const displayRating = getPublicReviewRating(reviews);

  const locationLabel = getBusinessLocationLabel({
    city: profileData.city ?? null,
    state: profileData.state ?? null,
    location: profileData.businessAddress ?? '',
  });

  const fullAddress =
    profileData.businessAddress?.trim() ||
    [profileData.city, profileData.state, profileData.country].filter(Boolean).join(', ') ||
    null;

  const directionsLink = directionsHref({
    latitude: profileData.latitude,
    longitude: profileData.longitude,
    address: profileData.businessAddress,
    location: fullAddress,
  });

  const embedSrc = mapEmbedSrc({
    latitude: profileData.latitude,
    longitude: profileData.longitude,
    address: profileData.businessAddress,
    location: fullAddress,
  });

  const openStatus = getBusinessOpenStatus(profileData.timings);
  const offerDisplay = getDiscountOfferDisplay(profileData.discountRange, businessName);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const telLink = phoneHref(profileData.publicPhone || '');

  const socialLinks = [
    { label: 'Instagram', href: profileData.instagramUrl },
    { label: 'Facebook', href: profileData.facebookUrl },
    { label: 'YouTube', href: profileData.youtubeUrl },
  ].filter((item) => Boolean(item.href));

  const checklist = [
    { label: 'Cover photo', done: images.length > 0, key: 'photos' },
    { label: 'Logo', done: Boolean(profilePictureUrl), key: 'logo' },
    { label: 'About text', done: Boolean(profileData.about?.trim()), key: 'about' },
    { label: 'Phone number', done: Boolean(profileData.publicPhone), key: 'publicPhone' },
    {
      label: 'Map pin',
      done: Boolean(
        profileData.latitude &&
          profileData.longitude &&
          (profileData.latitude !== 0 || profileData.longitude !== 0)
      ),
      key: 'location',
    },
    {
      label: 'Business hours',
      done: Boolean(profileData.timings && Object.keys(profileData.timings).length),
      key: 'timings',
    },
  ];

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(`listing-preview-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openReviewReplySettings = () => {
    if (onOpenSettingsField) {
      onOpenSettingsField('reviewReply');
      return;
    }
    onEditProfile();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#215481]">Public listing preview</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Matches live page
            </span>
          </div>
          <p className="mt-1 truncate text-lg font-bold text-zinc-900">{businessName}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            This is how customers see your business on FinderB — including map and location.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="relative h-9 w-9">
              <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e4e4e7" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#f9b864"
                  strokeWidth="3"
                  strokeDasharray={`${completionPercent} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#153551]">
                {completionPercent}%
              </span>
            </div>
            <span className="text-xs font-medium text-zinc-600">Complete</span>
          </div>
          <Link href={businessProfilePath ?? '#'} target="_blank" className={dashboard.btnSecondary}>
            View live
            <HiOutlineArrowTopRightOnSquare size={14} />
          </Link>
          <button type="button" onClick={onEditProfile} className={dashboard.btnPrimary}>
            <HiOutlinePencilSquare size={14} />
            Edit listing
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_248px]">
        <div className={`${dashboard.panel} overflow-hidden`}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/90 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="ml-2 truncate text-[11px] text-zinc-400">
              finderb.com{businessProfilePath ?? ''}
            </span>
          </div>

          {/* Hero — mirrors public profile */}
          <div className="border-b border-zinc-100 p-4 sm:p-6">
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
              <StackedPhotoGallery
                images={galleryImages}
                alt={businessName}
                activeIndex={activeImage}
                onSelect={setActiveImage}
              />

              <div className="flex flex-col gap-2 md:border-l md:border-zinc-100 md:pl-6">
                <h2 className="text-xl font-bold leading-snug text-[#153551] sm:text-2xl">{businessName}</h2>

                {profileData.category && (
                  <p className="text-sm font-medium text-[#215481]">{profileData.category}</p>
                )}

                {locationLabel && <p className="text-sm text-zinc-600">{locationLabel}</p>}

                {(() => {
                  const label = formatEstablishmentYearsLabel(profileData.yearsInBusiness);
                  return label ? <p className="text-sm text-zinc-600">{label}</p> : null;
                })()}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {profileData.isFinderBVerified && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#215481]/8 px-2 py-0.5 text-xs font-semibold text-[#215481]">
                      <HiOutlineShieldCheck size={13} />
                      FinderB Verified
                    </span>
                  )}
                  {openStatus && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${openStatus.colorClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${openStatus.dotClass}`} />
                      {openStatus.label}
                    </span>
                  )}
                  {displayRating != null && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <HiOutlineStar size={12} className="text-amber-500" />
                      {displayRating} · {reviews.length} review{reviews.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                {offerDisplay && (
                  <div className="mt-2">
                    <BusinessProfileOfferBanner
                      headline={offerDisplay.headline}
                      detail={offerDisplay.detail}
                      label={offerDisplay.label}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section nav */}
          <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-zinc-100 bg-white/95 px-4 backdrop-blur-sm sm:gap-0 sm:px-6">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:text-sm ${
                  activeSection === section.id
                    ? 'border-[#215481] text-[#215481]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div className="space-y-0 p-4 sm:p-6">
            {/* About */}
            <section id="listing-preview-about" className="scroll-mt-24 pb-8">
              <h3 className="text-sm font-bold text-[#153551]">About</h3>
              {profileData.about?.trim() ? (
                <p className="mt-3 text-sm leading-7 text-zinc-600">{profileData.about}</p>
              ) : (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="mt-3 text-sm text-zinc-400 hover:text-[#215481]"
                >
                  No description yet — add one in Settings
                </button>
              )}
              {profileData.keywords && profileData.keywords.length > 0 && (
                <p className="mt-4 text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-800">Known for:</span>{' '}
                  {profileData.keywords.join(', ')}
                </p>
              )}
            </section>

            {/* Services */}
            <section
              id="listing-preview-services"
              className="scroll-mt-24 border-t border-zinc-100 py-8"
            >
              <h3 className="text-sm font-bold text-[#153551]">Services</h3>
              {services.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <div
                      key={service}
                      className="flex items-start gap-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 px-3.5 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#215481]/8 text-[#215481]">
                        <Tag size={11} />
                      </span>
                      <span className="text-sm leading-snug text-zinc-700">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSettingsField?.('serviceCategory') ?? onEditProfile()}
                  className="mt-3 text-sm text-zinc-400 hover:text-[#215481]"
                >
                  No services listed — add service categories in Settings
                </button>
              )}
            </section>

            {/* Location & hours */}
            <section
              id="listing-preview-location"
              className="scroll-mt-24 border-t border-zinc-100 py-8"
            >
              <h3 className="text-sm font-bold text-[#153551]">Location & hours</h3>

              {fullAddress ? (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-white px-3.5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f9b864]/15 text-[#b45309]">
                    <HiOutlineMapPin size={16} />
                  </span>
                  <div className="min-w-0 space-y-2">
                    <p className="text-sm leading-relaxed text-zinc-700">{fullAddress}</p>
                    {(profileData.city || profileData.state) && profileData.businessAddress && (
                      <p className="text-xs text-zinc-500">
                        {[profileData.city, profileData.state, profileData.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {profileData.latitude != null && profileData.longitude != null && (
                      <p className="font-mono text-[11px] text-zinc-400">
                        {profileData.latitude.toFixed(5)}, {profileData.longitude.toFixed(5)}
                      </p>
                    )}
                    {directionsLink && (
                      <a
                        href={directionsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#215481] hover:underline"
                      >
                        <Navigation size={12} />
                        Get directions
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSettingsField?.('businessAddress') ?? onEditProfile()}
                  className="mt-4 flex w-full items-center gap-3 rounded-lg border border-dashed border-zinc-200 px-4 py-4 text-left text-sm text-zinc-500 hover:border-[#215481]/30 hover:bg-zinc-50"
                >
                  <HiOutlineMapPin size={18} className="shrink-0 text-zinc-300" />
                  <span>Add your business address and map pin in Settings</span>
                </button>
              )}

              {(embedSrc || directionsLink) && (
                <BusinessLocationMap
                  businessName={businessName}
                  embedSrc={embedSrc}
                  directionsHref={directionsLink}
                  address={fullAddress}
                  className="mt-4"
                />
              )}

              {!embedSrc && !directionsLink && (
                <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                  Map appears when address or coordinates are set
                </div>
              )}

              {profileData.timings && Object.keys(profileData.timings).length > 0 ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200/80 bg-white">
                  <div className="flex items-center gap-2 border-b border-zinc-100 px-3.5 py-2.5">
                    <HiOutlineClock size={14} className="text-[#215481]" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Opening hours
                    </span>
                  </div>
                  <ul className="divide-y divide-zinc-100">
                    {WEEKDAYS.map((day) => {
                      const timing = profileData.timings?.[day];
                      const isToday = day === todayName;
                      const isClosed =
                        !timing ||
                        timing === 'Closed' ||
                        (typeof timing === 'object' && timing.isClosed);
                      return (
                        <li
                          key={day}
                          className={`flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm ${
                            isToday ? 'bg-[#215481]/[0.04] font-medium text-zinc-900' : 'text-zinc-600'
                          }`}
                        >
                          <span>
                            {day}
                            {isToday && (
                              <span className="ml-2 rounded-full border border-[#215481]/20 bg-[#215481]/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#215481]">
                                Today
                              </span>
                            )}
                          </span>
                          <span className={isClosed ? 'text-rose-600' : 'text-zinc-700'}>
                            {formatTimingRange12h(timing)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSettingsField?.('timings') ?? onEditProfile()}
                  className="mt-4 text-sm text-zinc-400 hover:text-[#215481]"
                >
                  Hours not listed — set opening hours in Settings
                </button>
              )}
            </section>

            {/* Contact */}
            <section
              id="listing-preview-contact"
              className="scroll-mt-24 border-t border-zinc-100 py-8"
            >
              <h3 className="text-sm font-bold text-[#153551]">Contact</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Phone</p>
                  {telLink ? (
                    <a href={telLink} className="mt-1.5 flex items-center gap-2 text-sm font-medium text-[#215481]">
                      <HiOutlinePhone size={15} />
                      {profileData.publicPhone}
                    </a>
                  ) : (
                    <p className="mt-1.5 text-sm text-zinc-400">Not set</p>
                  )}
                </div>
                <div className="rounded-lg border border-zinc-200/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Email</p>
                  <p className="mt-1.5 flex items-start gap-2 break-all text-sm text-zinc-700">
                    <HiOutlineEnvelope size={15} className="mt-0.5 shrink-0 text-zinc-400" />
                    {profileData.email || 'Not set'}
                  </p>
                </div>
                {profileData.website && (
                  <div className="rounded-lg border border-zinc-200/80 p-4 sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Website</p>
                    <a
                      href={normalizeExternalHref(profileData.website) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 flex items-center gap-2 truncate text-sm font-medium text-[#215481]"
                    >
                      <HiOutlineGlobeAlt size={15} />
                      {profileData.website}
                    </a>
                  </div>
                )}
                {profileData.paymentModes && profileData.paymentModes.length > 0 && (
                  <div className="rounded-lg border border-zinc-200/80 p-4 sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      Payment accepted
                    </p>
                    <p className="mt-1.5 text-sm text-zinc-700">{profileData.paymentModes.join(' · ')}</p>
                  </div>
                )}
              </div>

              {(socialLinks.length > 0 || profileData.whatsappNumber) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profileData.instagramUrl && (
                    <a
                      href={normalizeExternalHref(profileData.instagramUrl) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-pink-600 hover:bg-zinc-50"
                    >
                      <FaInstagram size={14} />
                      Instagram
                    </a>
                  )}
                  {profileData.facebookUrl && (
                    <a
                      href={normalizeExternalHref(profileData.facebookUrl) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-zinc-50"
                    >
                      <FaFacebook size={14} />
                      Facebook
                    </a>
                  )}
                  {profileData.youtubeUrl && (
                    <a
                      href={normalizeExternalHref(profileData.youtubeUrl) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-zinc-50"
                    >
                      <FaYoutube size={14} />
                      YouTube
                    </a>
                  )}
                  {profileData.whatsappNumber && (
                    <a
                      href={`https://wa.me/${profileData.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-zinc-50"
                    >
                      <FaWhatsapp size={14} />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </section>

            {/* Reviews */}
            <section
              id="listing-preview-reviews"
              className="scroll-mt-24 border-t border-zinc-100 py-8"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold text-[#153551]">Reviews</h3>
                {displayRating != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    <HiOutlineStar size={10} className="text-amber-500" />
                    {displayRating} average
                  </span>
                )}
              </div>

              {reviews.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-lg border border-zinc-200/80 bg-zinc-50/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-800">{review.author}</p>
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-700">
                          <HiOutlineStar size={11} className="text-amber-500" />
                          {review.rating}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">&ldquo;{review.content}&rdquo;</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
                  No customer reviews yet — they will appear here as people rate your business.
                </p>
              )}

              {ownerReply ? (
                <button
                  type="button"
                  onClick={openReviewReplySettings}
                  className="mt-4 w-full rounded-lg border-l-[3px] border-[#215481] bg-[#215481]/5 px-4 py-3 text-left hover:bg-[#215481]/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#215481]">
                      Your default reply
                    </p>
                    <HiOutlinePencilSquare size={14} className="shrink-0 text-[#215481]/70" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-700">&ldquo;{ownerReply.content}&rdquo;</p>
                  <p className="mt-2 text-[11px] text-zinc-500">Tap to edit in Settings</p>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openReviewReplySettings}
                  className="mt-4 w-full rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-left text-xs text-zinc-500 hover:border-[#215481]/30 hover:bg-zinc-50"
                >
                  <span className="font-semibold text-zinc-700">Add a default review reply</span>
                  <span className="mt-0.5 block">Opens Settings — thank-you shown under reviews without a custom reply</span>
                </button>
              )}
            </section>
          </div>
        </div>

        {/* Sidebar checklist */}
        <aside className="space-y-4">
          <div className={`${dashboard.panel} p-4`}>
            <h3 className="text-sm font-bold text-zinc-900">Listing checklist</h3>
            <ul className="mt-3 space-y-2.5">
              {checklist.map(({ label, done, key }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => (onOpenSettingsField ? onOpenSettingsField(key) : onEditProfile())}
                    className="flex w-full items-center gap-2.5 text-left text-xs hover:opacity-80"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {done ? '✓' : '·'}
                    </span>
                    <span className={done ? 'text-zinc-600' : 'text-zinc-400'}>{label}</span>
                  </button>
                </li>
              ))}
            </ul>

            {missingFields.length > 0 && (
              <>
                <p className="mt-5 text-xs font-semibold text-zinc-500">Quick fixes</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {missingFields.slice(0, 8).map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => {
                        if (field.action === 'kyc') {
                          onOpenKyc?.();
                          return;
                        }
                        if (field.settingsKey && onOpenSettingsField) {
                          onOpenSettingsField(field.settingsKey);
                        } else {
                          onEditProfile();
                        }
                      }}
                      className="rounded-md border border-amber-200/80 bg-amber-50/60 px-2 py-1 text-[10px] font-semibold text-[#153551] hover:bg-amber-50"
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
