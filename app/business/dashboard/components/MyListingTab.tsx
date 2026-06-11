'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlinePencilSquare,
} from 'react-icons/hi2';
import { FaFacebook, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  businessName: string;
  profileData: ProfileData;
  images: string[];
  profilePictureUrl: string | null;
  completionPercent: number;
  missingFields: string[];
  onEditProfile: () => void;
};

function hasReview(review: unknown) {
  if (!review) return false;
  if (typeof review === 'string') return review.trim().length > 0;
  if (typeof review === 'object') return Object.keys(review as object).length > 0;
  return false;
}

function reviewText(review: unknown) {
  if (typeof review === 'string') return review;
  if (review && typeof review === 'object') {
    const r = review as { content?: string; text?: string; author?: string };
    return r.content || r.text || '';
  }
  return '';
}

function replyText(reply: unknown) {
  if (typeof reply === 'string') return reply;
  if (reply && typeof reply === 'object') {
    return (reply as { content?: string }).content || '';
  }
  return '';
}

export default function MyListingTab({
  businessId,
  businessName,
  profileData,
  images,
  profilePictureUrl,
  completionPercent,
  missingFields,
  onEditProfile,
}: MyListingTabProps) {
  const locationLine = [profileData.city, profileData.state, profileData.country]
    .filter(Boolean)
    .join(', ');

  const checklist = [
    { label: 'Cover photo', done: images.length > 0 },
    { label: 'Logo', done: Boolean(profilePictureUrl) },
    { label: 'About text', done: Boolean(profileData.about?.trim()) },
    { label: 'Phone number', done: Boolean(profileData.publicPhone) },
    { label: 'Map pin (Google Maps)', done: Boolean(profileData.latitude && profileData.longitude && (profileData.latitude !== 0 || profileData.longitude !== 0)) },
    { label: 'Business hours', done: Boolean(profileData.timings && Object.keys(profileData.timings).length) },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">How customers see you on FinderB</p>
          <h2 className="mt-0.5 truncate text-lg font-semibold text-slate-900">{businessName}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="relative h-8 w-8">
              <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#215481"
                  strokeWidth="3"
                  strokeDasharray={`${completionPercent} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                {completionPercent}%
              </span>
            </div>
            <span className="text-xs font-medium text-slate-600">Profile complete</span>
          </div>
          <Link
            href={`/business/${businessId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-primary-200 hover:text-primary-700"
          >
            View live
            <HiOutlineArrowTopRightOnSquare size={14} />
          </Link>
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
          >
            <HiOutlinePencilSquare size={14} />
            Edit listing
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Preview */}
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="ml-2 truncate text-[11px] text-slate-400">
              finderb.com/business/{businessId.slice(0, 8)}…
            </span>
          </div>

          {/* Cover */}
          <div className="relative h-44 bg-slate-100 sm:h-52">
            {images[0] ? (
              <Image src={images[0]} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 70vw" />
            ) : (
              <button
                type="button"
                onClick={onEditProfile}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-primary-600"
              >
                <HiOutlinePhoto size={28} strokeWidth={1.5} />
                <span className="text-xs font-medium">Add a cover photo</span>
              </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Identity row */}
          <div className="relative px-4 pb-5 sm:px-6">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-white bg-slate-100 shadow-md sm:h-24 sm:w-24">
                {profilePictureUrl ? (
                  <Image src={profilePictureUrl} alt="" fill className="object-cover" sizes="96px" />
                ) : (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="flex h-full w-full items-center justify-center text-slate-400 hover:text-primary-600"
                  >
                    <HiOutlinePlus size={24} />
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{businessName}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {profileData.category && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {profileData.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-600">
                    <HiOutlineStar size={13} className="text-amber-500" />
                    {(profileData.rating ?? 0).toFixed(1)}
                  </span>
                  {profileData.isFinderBVerified && (
                    <span className="flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      <HiOutlineShieldCheck size={13} />
                      Verified
                    </span>
                  )}
                  {profileData.discountRange && profileData.discountRange !== 'No Discount' && (
                    <span className="rounded-md bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-800">
                      {profileData.discountRange}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body sections */}
            <div className="mt-6 space-y-6 border-t border-slate-100 pt-6">
              <section>
                <h4 className="text-sm font-semibold text-slate-900">About</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {profileData.about?.trim() ||
                    'No description yet. Add a short intro so customers know what you offer.'}
                </p>
              </section>

              {(profileData.serviceCategory ||
                (profileData.paymentModes && profileData.paymentModes.length > 0) ||
                (profileData.keywords && profileData.keywords.length > 0)) && (
                <section className="grid gap-4 sm:grid-cols-2">
                  {profileData.serviceCategory && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Services</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{profileData.serviceCategory}</p>
                    </div>
                  )}
                  {profileData.paymentModes && profileData.paymentModes.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Payment</p>
                      <p className="mt-1 text-sm text-slate-700">{profileData.paymentModes.join(' · ')}</p>
                    </div>
                  )}
                  {profileData.keywords && profileData.keywords.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Tags</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profileData.keywords.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Photos</h4>
                  <span className="text-xs text-slate-400">{images.length}/5</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {images.length > 0
                    ? images.map((img, i) => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                          <Image src={img} alt="" fill className="object-cover" sizes="120px" />
                        </div>
                      ))
                    : null}
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 text-slate-400 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-600"
                    >
                      <HiOutlinePlus size={18} />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  )}
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-slate-100 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Contact</h4>
                  <div className="space-y-2.5 text-sm">
                    <p className="flex items-start gap-2 text-slate-600">
                      <HiOutlinePhone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      {profileData.publicPhone || '—'}
                    </p>
                    <p className="flex items-start gap-2 text-slate-600">
                      <HiOutlineEnvelope size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="break-all">{profileData.email || '—'}</span>
                    </p>
                    {profileData.website && (
                      <p className="flex items-start gap-2 text-primary-700">
                        <HiOutlineGlobeAlt size={16} className="mt-0.5 shrink-0" />
                        <span className="truncate">{profileData.website}</span>
                      </p>
                    )}
                    <p className="flex items-start gap-2 text-slate-600">
                      <HiOutlineMapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>
                        {profileData.businessAddress || 'No address'}
                        {locationLine && (
                          <span className="block text-xs text-slate-400">{locationLine}</span>
                        )}
                      </span>
                    </p>
                  </div>
                  {(profileData.instagramUrl ||
                    profileData.facebookUrl ||
                    profileData.youtubeUrl ||
                    profileData.whatsappNumber) && (
                    <div className="flex gap-2 pt-2">
                      {profileData.instagramUrl && (
                        <a
                          href={profileData.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-pink-600 hover:bg-slate-50"
                        >
                          <FaInstagram size={16} />
                        </a>
                      )}
                      {profileData.facebookUrl && (
                        <a
                          href={profileData.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-blue-600 hover:bg-slate-50"
                        >
                          <FaFacebook size={16} />
                        </a>
                      )}
                      {profileData.youtubeUrl && (
                        <a
                          href={profileData.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-slate-50"
                        >
                          <FaYoutube size={16} />
                        </a>
                      )}
                      {profileData.whatsappNumber && (
                        <a
                          href={`https://wa.me/${profileData.whatsappNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-emerald-600 hover:bg-slate-50"
                        >
                          <FaWhatsapp size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Hours</h4>
                    <HiOutlineClock size={16} className="text-slate-300" />
                  </div>
                  <ul className="space-y-1.5">
                    {DAYS.map((day) => {
                      const timing = profileData.timings?.[day];
                      const isClosed =
                        !timing || timing === 'Closed' || (typeof timing === 'object' && timing.isClosed);
                      return (
                        <li key={day} className="flex justify-between text-xs">
                          <span className="text-slate-500">{day.slice(0, 3)}</span>
                          <span className={isClosed ? 'text-red-500' : 'font-medium text-slate-800'}>
                            {isClosed
                              ? 'Closed'
                              : typeof timing === 'string'
                                ? timing
                                : `${timing.open} – ${timing.close}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>

              {/* Reviews */}
              <section className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-semibold text-slate-900">Reviews</h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {hasReview(profileData.review) ? (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">Latest review</p>
                      <p className="mt-2 text-sm italic text-slate-700">&ldquo;{reviewText(profileData.review)}&rdquo;</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      No reviews yet
                    </div>
                  )}
                  {replyText(profileData.reviewReply) ? (
                    <div className="rounded-lg bg-primary-700 p-4 text-white">
                      <p className="text-xs font-medium text-white/70">Your reply</p>
                      <p className="mt-2 text-sm leading-relaxed">&ldquo;{replyText(profileData.reviewReply)}&rdquo;</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="rounded-lg border border-dashed border-slate-200 p-4 text-left text-xs text-slate-500 transition-colors hover:border-primary-200 hover:bg-primary-50/30"
                    >
                      <span className="font-medium text-slate-700">Add a default reply</span>
                      <span className="mt-1 block">Respond faster to new reviews</span>
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Listing checklist</h3>
            <ul className="mt-3 space-y-2">
              {checklist.map(({ label, done }) => (
                <li key={label} className="flex items-center gap-2 text-xs">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? '✓' : '·'}
                  </span>
                  <span className={done ? 'text-slate-600' : 'text-slate-400'}>{label}</span>
                </li>
              ))}
            </ul>
            {missingFields.length > 0 && (
              <button
                type="button"
                onClick={onEditProfile}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Complete missing fields
              </button>
            )}
          </div>

          {profileData.yearsInBusiness != null && profileData.yearsInBusiness > 0 && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-xs text-slate-500">Experience</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{profileData.yearsInBusiness}+</p>
              <p className="text-xs text-slate-500">years in business</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
