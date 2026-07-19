'use client';

import {
  HiOutlinePlus,
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineTag,
  HiOutlineInformationCircle,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineCalendar,
  HiOutlineMap,
  HiOutlinePhoto,
  HiOutlineUser,
  HiOutlineHashtag,
  HiOutlineXMark,
  HiOutlineQueueList,
  HiOutlineCreditCard,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import GoogleMapsLocationEditor from './GoogleMapsLocationEditor';
import { validateMapPinAgainstAddress } from '@/app/actions/location';
import ServiceCategoryTagInput from './ServiceCategoryTagInput';
import KeywordTagInput from './KeywordTagInput';
import CategoryChangeRequestPanel from './CategoryChangeRequestPanel';
import LegalBusinessNameChangeRequestPanel from './LegalBusinessNameChangeRequestPanel';
import {
  getPendingChangeRequest,
} from '@/app/actions/businessChangeRequests';
import {
  CATEGORY_CHANGE_FIELD,
  LEGAL_BUSINESS_NAME_FIELD,
  type BusinessChangeRequest,
} from '@/lib/businessChangeRequest';
import { normalizeSearchKeywords } from '@/lib/businessKeywords';
import { getDiscountVisibilityImpact } from '@/lib/discountOffer';
import {
  establishmentYearToDateValue,
  formatEstablishmentYearDisplay,
  getEstablishmentDateBounds,
  isValidEstablishmentYear,
  parseEstablishmentYearFromDate,
} from '@/lib/establishmentYear';
import { parseBusinessServices } from '@/lib/parseBusinessServices';
import {
  getReviewReplyDraft,
  normalizeReviewReplyForStorage,
  REVIEW_REPLY_MAX_LENGTH,
  validateReviewReplyContent,
} from '@/lib/businessReviews';
import { PROFILE_LINK_FIELDS, validateProfileLink } from '@/lib/validateProfileUrl';
import {
  ABOUT_BUSINESS_MAX_WORDS,
  countAboutWords,
  trimAboutToWordLimit,
} from '@/lib/businessAbout';
import IndianPhoneInput, { INDIAN_PHONE_FIELD_HINT } from '@/components/IndianPhoneInput';
import {
  formatIndianPhoneLabel,
  indianMobileValidationError,
  isValidIndianMobileDigits,
} from '@/lib/indianPhone';
import { dashboard } from './dashboard-ui';
import ListingHiddenNoPhotosBanner from './ListingHiddenNoPhotosBanner';
import { businessHasPublicPhoto } from '@/lib/businessMapping';
import ChangePasswordPanel from './ChangePasswordPanel';

const discountOptions = [
  '5% - 10% OFF',
  '10% - 20% OFF',
  '20% - 30% OFF',
  '30% - 40% OFF',
  'Up to 50% OFF',
  'Special Festive Discount',
];

const NO_DISCOUNT = 'No Discount';

const PAYMENT_MODE_OPTIONS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Wallet',
  'Cheque',
] as const;

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const MONDAY = WEEKDAYS[0];

type DayTiming = {
  open?: string;
  close?: string;
  isClosed?: boolean;
};

type TimingsMap = Record<string, DayTiming>;

function applyDayTimingsToAll(timings: TimingsMap, sourceDay: string): TimingsMap {
  const source = timings[sourceDay];
  if (!source?.open || !source?.close) return timings;

  const next: TimingsMap = { ...timings };
  for (const day of WEEKDAYS) {
    next[day] = {
      ...next[day],
      open: source.open,
      close: source.close,
      isClosed: next[day]?.isClosed ?? false,
    };
  }
  return next;
}

type FieldDef = {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type: string;
  significance?: string;
  options?: string[];
};

const LOCATION_FIELDS = new Set(['city', 'state', 'country']);
const PHONE_FIELDS = new Set(['publicPhone', 'whatsappNumber']);

function hasValidMapPin(latitude: unknown, longitude: unknown) {
  const lat = typeof latitude === 'number' ? latitude : Number(latitude);
  const lng = typeof longitude === 'number' ? longitude : Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

const SETTINGS_FIELDS: FieldDef[] = [
  { key: 'media', label: 'Business Photos', icon: HiOutlinePhoto, type: 'media' },
  { key: 'businessName', label: 'Legal Business Name', icon: HiOutlineBriefcase, type: 'legalNameRequest' },
  { key: 'displayName', label: 'Business Display Name', icon: HiOutlineUser, type: 'text' },
  { key: 'category', label: 'Business Category', icon: HiOutlineTag, type: 'categoryRequest' },
  { key: 'about', label: 'About Business', icon: HiOutlineInformationCircle, type: 'textarea' },
  { key: 'keywords', label: 'Search Keywords', icon: HiOutlineHashtag, type: 'keywords' },
  { key: 'email', label: 'Official Email', icon: HiOutlineEnvelope, type: 'text' },
  { key: 'ownerInfo', label: 'Owner Information', icon: HiOutlineUser, type: 'ownerInfo' },
  { key: 'publicPhone', label: 'Public Phone', icon: HiOutlinePhone, type: 'text' },
  { key: 'whatsappNumber', label: 'WhatsApp', icon: FaWhatsapp, type: 'text' },
  { key: 'website', label: 'Website URL', icon: HiOutlineGlobeAlt, type: 'link' },
  { key: 'instagramUrl', label: 'Instagram', icon: FaInstagram, type: 'link' },
  { key: 'facebookUrl', label: 'Facebook', icon: FaFacebook, type: 'link' },
  { key: 'youtubeUrl', label: 'YouTube', icon: FaYoutube, type: 'link' },
  { key: 'businessAddress', label: 'Street Address', icon: HiOutlineMapPin, type: 'text' },
  { key: 'city', label: 'City', icon: HiOutlineMapPin, type: 'text' },
  { key: 'state', label: 'State', icon: HiOutlineMapPin, type: 'text' },
  { key: 'country', label: 'Country', icon: HiOutlineGlobeAlt, type: 'text' },
  { key: 'mapLocation', label: 'Google Maps Location', icon: HiOutlineMap, type: 'googleMaps' },
  { key: 'serviceCategory', label: 'Service Category', icon: HiOutlineQueueList, type: 'serviceCategories' },
  { key: 'paymentModes', label: 'Payment Modes', icon: HiOutlineCreditCard, type: 'paymentModes' },
  { key: 'yearsInBusiness', label: 'Year of Establishment', icon: HiOutlineCalendar, type: 'establishmentYear' },
  { key: 'discountRange', label: 'Discount Offer', icon: HiOutlineTag, type: 'select', options: discountOptions },
  { key: 'timings', label: 'Business Hours', icon: HiOutlineClock, type: 'timings' },
  {
    key: 'reviewReply',
    label: 'Default Review Reply',
    icon: HiOutlineChatBubbleLeftRight,
    type: 'reviewReply',
  },
  {
    key: 'changePassword',
    label: 'Change Password',
    icon: HiOutlineLockClosed,
    type: 'changePassword',
  },
];

const FIELD_SECTIONS = [
  { id: 'brand', title: 'Brand & discovery', keys: ['media', 'businessName', 'displayName', 'category', 'about', 'keywords'] },
  { id: 'contact', title: 'Contact', keys: ['email', 'ownerInfo', 'publicPhone', 'whatsappNumber', 'website'] },
  { id: 'location', title: 'Location', keys: ['businessAddress', 'city', 'state', 'country', 'mapLocation'] },
  { id: 'social', title: 'Social media', keys: ['instagramUrl', 'facebookUrl', 'youtubeUrl'] },
  { id: 'operations', title: 'Operations', keys: ['serviceCategory', 'paymentModes', 'yearsInBusiness', 'discountRange', 'timings', 'reviewReply'] },
  { id: 'account', title: 'Account security', keys: ['changePassword'] },
];

interface SettingsTabProps {
  business: any;
  profileData: any;
  images: string[];
  profilePictureUrl: string | null;
  updating: boolean;
  successMessage: string | null;
  updateField: (field: string, value: any) => void;
  handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
  handleUploadSuccess: (result: any) => Promise<void>;
  handleSetProfile: (url: string) => Promise<void>;
  setImageToDelete: (url: string | null) => void;
  setShowDeleteModal: (show: boolean) => void;
  showDeleteModal: boolean;
  handleDeleteImage: () => Promise<void>;
  focusField?: string | null;
  onFocusHandled?: () => void;
  onNotifySuccess?: (message: string) => void;
}

export default function SettingsTab({
  business,
  profileData,
  images,
  profilePictureUrl,
  updating,
  successMessage,
  updateField,
  handleUpdateProfile,
  handleUploadSuccess,
  handleSetProfile,
  setImageToDelete,
  setShowDeleteModal,
  showDeleteModal,
  handleDeleteImage,
  focusField,
  onFocusHandled,
  onNotifySuccess,
}: SettingsTabProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [syncMondayToAll, setSyncMondayToAll] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [pendingCategoryRequest, setPendingCategoryRequest] = useState<BusinessChangeRequest | null>(null);
  const [pendingLegalNameRequest, setPendingLegalNameRequest] = useState<BusinessChangeRequest | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!business?.id) return;

    let cancelled = false;
    Promise.all([
      getPendingChangeRequest(business.id, CATEGORY_CHANGE_FIELD),
      getPendingChangeRequest(business.id, LEGAL_BUSINESS_NAME_FIELD),
    ]).then(([categoryResult, legalResult]) => {
      if (cancelled) return;
      if (categoryResult.success) setPendingCategoryRequest(categoryResult.request);
      if (legalResult.success) setPendingLegalNameRequest(legalResult.request);
    });

    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  useEffect(() => {
    if (activeModal !== 'timings') {
      setSyncMondayToAll(false);
    }
    setFieldError('');
  }, [activeModal]);

  useEffect(() => {
    if (!focusField) return;
    const exists = SETTINGS_FIELDS.some((f) => f.key === focusField);
    if (exists) {
      setActiveModal(focusField);
    }
    onFocusHandled?.();
  }, [focusField, onFocusHandled]);

  const checkIsMissing = (field: FieldDef) => {
    if (field.key === 'media') {
      return !businessHasPublicPhoto({ profilePictureUrl, images });
    }
    if (field.key === 'paymentModes') {
      return !profileData.paymentModes || profileData.paymentModes.length === 0;
    }
    if (field.key === 'timings') return !profileData.timings || Object.keys(profileData.timings).length === 0;
    if (field.key === 'yearsInBusiness') return !isValidEstablishmentYear(profileData.yearsInBusiness);
    if (field.key === 'serviceCategory') {
      return parseBusinessServices(profileData.serviceCategory).length === 0;
    }
    if (field.key === 'keywords') return !profileData.keywords || profileData.keywords.length === 0;
    if (field.key === 'displayName') {
      return !profileData.displayName?.trim();
    }
    if (field.key === 'businessName') {
      return !profileData.businessName?.trim();
    }
    if (field.key === 'ownerInfo') {
      const name = profileData.ownerName?.trim();
      const mobile = profileData.ownerMobile?.trim();
      return !name || !isValidIndianMobileDigits(mobile || '');
    }
    if (field.key === 'mapLocation') {
      const lat = profileData.latitude;
      const lng = profileData.longitude;
      return lat == null || lng == null || (lat === 0 && lng === 0);
    }
    if (field.key === 'reviewReply') {
      return !getReviewReplyDraft(profileData.reviewReply);
    }
    if (field.key === 'changePassword') {
      return false;
    }
    const value = profileData[field.key];
    return value === undefined || value === null || value === '' || value === 0;
  };

  const getDisplayValue = (field: FieldDef) => {
    if (field.key === 'media') return `${images.length} photo${images.length === 1 ? '' : 's'}`;
    if (field.key === 'timings') return Object.keys(profileData.timings || {}).length > 0 ? 'Set' : 'Not set';
    if (field.key === 'yearsInBusiness') {
      return formatEstablishmentYearDisplay(profileData.yearsInBusiness) || 'Not set';
    }
    if (field.key === 'serviceCategory') {
      const services = parseBusinessServices(profileData.serviceCategory);
      return services.length ? services.join(', ') : 'Not set';
    }
    if (field.key === 'keywords') {
      const keywords = normalizeSearchKeywords(profileData.keywords);
      return keywords.length ? keywords.join(', ') : 'Not set';
    }
    if (field.key === 'category') {
      const base = profileData.category || 'Not set';
      return pendingCategoryRequest ? `${base} · change pending` : base;
    }
    if (field.key === 'businessName') {
      const base = profileData.businessName || 'Not set';
      return pendingLegalNameRequest ? `${base} · change pending` : base;
    }
    if (field.key === 'displayName') {
      return profileData.displayName || profileData.businessName || 'Not set';
    }
    if (field.key === 'ownerInfo') {
      const name = profileData.ownerName?.trim();
      const mobile = profileData.ownerMobile?.trim();
      if (name && mobile) return `${name} · ${formatIndianPhoneLabel(mobile)}`;
      if (name) return name;
      if (mobile) return formatIndianPhoneLabel(mobile);
      return 'Not set';
    }
    if (field.key === 'reviewReply') {
      const content = getReviewReplyDraft(profileData.reviewReply);
      if (!content) return 'Not set';
      return content.length > 72 ? `${content.slice(0, 72)}…` : content;
    }
    if (field.key === 'changePassword') {
      return 'Update your login password';
    }
    if (field.key === 'paymentModes') {
      return profileData.paymentModes?.length
        ? profileData.paymentModes.join(', ')
        : 'Not set';
    }
    if (field.key === 'discountRange') {
      const value = profileData.discountRange;
      if (!value || value === NO_DISCOUNT || value === 'Seasonal Offer') return NO_DISCOUNT;
      return value;
    }
    if (field.key === 'mapLocation') {
      const lat = profileData.latitude;
      const lng = profileData.longitude;
      if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
        return profileData.googleMapsUrl ? 'Pin set' : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      return 'Not set';
    }
    if (field.key === 'publicPhone' || field.key === 'whatsappNumber') {
      return formatIndianPhoneLabel(profileData[field.key]) || 'Not set';
    }
    return profileData[field.key] || 'Not set';
  };

  const missingFields = SETTINGS_FIELDS.filter(checkIsMissing);
  const activeField = SETTINGS_FIELDS.find((f) => f.key === activeModal);
  const ActiveIcon = activeField?.icon;
  const selectedPaymentModes: string[] = Array.isArray(profileData.paymentModes)
    ? profileData.paymentModes
    : [];

  const updateDayTiming = (day: string, patch: Partial<DayTiming>) => {
    if (patch.isClosed && day === MONDAY) {
      setSyncMondayToAll(false);
    }

    const current = (profileData.timings?.[day] as DayTiming | undefined) ?? {};
    const nextTiming: DayTiming = { ...current, ...patch };
    const nextTimings: TimingsMap = {
      ...(profileData.timings || {}),
      [day]: nextTiming,
    };

    if (
      day === MONDAY &&
      syncMondayToAll &&
      nextTiming.open &&
      nextTiming.close &&
      !nextTiming.isClosed
    ) {
      updateField('timings', applyDayTimingsToAll(nextTimings, MONDAY));
      return;
    }

    updateField('timings', nextTimings);
  };

  const togglePaymentMode = (mode: string) => {
    if (selectedPaymentModes.includes(mode)) {
      updateField(
        'paymentModes',
        selectedPaymentModes.filter((item) => item !== mode),
      );
      return;
    }
    updateField('paymentModes', [...selectedPaymentModes, mode]);
  };

  const handleLinkFieldChange = (field: string, value: string) => {
    updateField(field, value);
    if (!value.trim()) {
      setFieldError('');
      return;
    }
    const result = validateProfileLink(field, value);
    setFieldError(result.ok ? '' : result.error);
  };

  const handleLinkFieldBlur = (field: string, value: string) => {
    const result = validateProfileLink(field, value);
    if (result.ok) {
      if (result.value !== value) {
        updateField(field, result.value);
      }
      setFieldError('');
      return;
    }
    setFieldError(result.error);
  };

  const validatePhoneField = (fieldKey: string): boolean => {
    const required = fieldKey === 'publicPhone';
    const error = indianMobileValidationError(String(profileData[fieldKey] ?? ''), { required });
    if (error) {
      setFieldError(error);
      return false;
    }
    return true;
  };

  const validateLocationAgainstMapPin = async (): Promise<boolean> => {
    if (!hasValidMapPin(profileData.latitude, profileData.longitude)) {
      return true;
    }

    const match = await validateMapPinAgainstAddress(profileData.latitude, profileData.longitude, {
      city: profileData.city,
      state: profileData.state,
      country: profileData.country,
    });

    if (!match.ok) {
      setFieldError(match.error);
      return false;
    }

    return true;
  };

  const validateActiveModalField = async (): Promise<boolean> => {
    if (!activeModal) return true;
    if (activeModal === 'about') {
      const words = countAboutWords(String(profileData.about ?? ''));
      if (words > ABOUT_BUSINESS_MAX_WORDS) {
        setFieldError(`About must be ${ABOUT_BUSINESS_MAX_WORDS} words or fewer.`);
        return false;
      }
    }
    if (PROFILE_LINK_FIELDS.has(activeModal)) {
      const result = validateProfileLink(activeModal, String(profileData[activeModal] ?? ''));
      if (!result.ok) {
        setFieldError(result.error);
        return false;
      }
      if (result.value !== String(profileData[activeModal] ?? '')) {
        updateField(activeModal, result.value);
      }
    }
    if (activeModal && LOCATION_FIELDS.has(activeModal)) {
      return validateLocationAgainstMapPin();
    }
    if (activeModal && PHONE_FIELDS.has(activeModal)) {
      return validatePhoneField(activeModal);
    }
    if (activeModal === 'ownerInfo') {
      const name = String(profileData.ownerName ?? '').trim();
      if (!name) {
        setFieldError('Enter the owner name.');
        return false;
      }
      const mobile = String(profileData.ownerMobile ?? '');
      const ownerMobileError = indianMobileValidationError(mobile);
      if (ownerMobileError) {
        setFieldError(ownerMobileError);
        return false;
      }
    }
    if (activeModal === 'reviewReply') {
      const replyError = validateReviewReplyContent(getReviewReplyDraft(profileData.reviewReply));
      if (replyError) {
        setFieldError(replyError);
        return false;
      }
    }
    return true;
  };

  const modal =
    mounted && activeModal && activeField
      ? createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-end justify-center bg-zinc-900/50 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-edit-title"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Close"
              onClick={() => setActiveModal(null)}
            />
            <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-xl">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    {ActiveIcon && <ActiveIcon size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h3 id="settings-edit-title" className="text-base font-semibold text-zinc-900">
                      {activeModal === 'mapLocation' ? 'Map location' : activeField.label}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
                  aria-label="Close dialog"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              {activeModal === 'changePassword' && business?.id ? (
                <ChangePasswordPanel
                  businessId={business.id}
                  onCancel={() => setActiveModal(null)}
                  onSuccess={() => {
                    setActiveModal(null);
                    onNotifySuccess?.('Password updated successfully');
                  }}
                />
              ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (activeModal === 'category' || activeModal === 'businessName') return;
                  if (!(await validateActiveModalField())) return;
                  await handleUpdateProfile(e);
                  setActiveModal(null);
                }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {activeModal === 'media' ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((url, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200">
                          <Image src={url} alt="" fill className="object-cover" />
                          <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => handleSetProfile(url)}
                              className="rounded bg-white py-1 text-[10px] font-semibold text-zinc-900"
                            >
                              {profilePictureUrl === url ? 'Cover' : 'Set cover'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setImageToDelete(url);
                                setShowDeleteModal(true);
                              }}
                              className="rounded bg-rose-600 py-1 text-[10px] font-semibold text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {images.length < 5 && (
                        <CldUploadWidget
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                          onSuccess={handleUploadSuccess}
                          options={{
                            maxFiles: 5 - images.length,
                            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                          }}
                        >
                          {({ open }) => (
                            <button
                              type="button"
                              onClick={() => open()}
                              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-400 hover:border-[#215481] hover:text-[#215481]"
                            >
                              <HiOutlinePlus size={22} />
                              <span className="text-[10px] font-medium">Add</span>
                            </button>
                          )}
                        </CldUploadWidget>
                      )}
                    </div>
                  ) : activeModal === 'about' ? (
                    <div className="space-y-2">
                      <textarea
                        value={profileData.about}
                        onChange={(e) => {
                          setFieldError('');
                          updateField('about', trimAboutToWordLimit(e.target.value));
                        }}
                        rows={8}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                        placeholder="Tell customers about your business, services, and what makes you different…"
                      />
                      {(() => {
                        const words = countAboutWords(profileData.about ?? '');
                        const atLimit = words >= ABOUT_BUSINESS_MAX_WORDS;
                        const nearLimit = words >= ABOUT_BUSINESS_MAX_WORDS - 50;
                        return (
                          <p
                            className={`text-xs ${
                              atLimit
                                ? 'text-rose-600'
                                : nearLimit
                                  ? 'text-amber-700'
                                  : 'text-zinc-500'
                            }`}
                          >
                            {words}/{ABOUT_BUSINESS_MAX_WORDS} words
                            {atLimit ? ' — limit reached' : ''}
                          </p>
                        );
                      })()}
                    </div>
                  ) : activeModal === 'reviewReply' ? (
                    <div className="space-y-2">
                      <p className="rounded-lg border border-[#215481]/15 bg-[#215481]/[0.04] px-3 py-2.5 text-xs leading-relaxed text-zinc-700">
                        Used as your thank-you under reviews that don’t have a custom reply yet. It
                        won’t appear when there are no reviews, and it won’t duplicate a reply you’ve
                        already posted on a review. You can update it anytime.
                      </p>
                      <textarea
                        value={getReviewReplyDraft(profileData.reviewReply)}
                        onChange={(e) => {
                          setFieldError('');
                          const normalized = normalizeReviewReplyForStorage(e.target.value);
                          updateField('reviewReply', normalized ?? {});
                        }}
                        rows={6}
                        maxLength={REVIEW_REPLY_MAX_LENGTH}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                            : 'border-zinc-200 focus:border-[#215481] focus:ring-[#215481]/10'
                        }`}
                        placeholder="Thank you for your feedback! We appreciate you taking the time to share your experience…"
                        autoFocus
                      />
                      {fieldError ? (
                        <p className="text-xs text-rose-600">{fieldError}</p>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          {getReviewReplyDraft(profileData.reviewReply).length}/{REVIEW_REPLY_MAX_LENGTH}{' '}
                          characters · leave blank to remove
                        </p>
                      )}
                    </div>
                  ) : activeModal === 'keywords' ? (
                    <KeywordTagInput
                      value={normalizeSearchKeywords(profileData.keywords)}
                      onChange={(nextKeywords) => updateField('keywords', nextKeywords)}
                    />
                  ) : activeModal === 'category' ? (
                    business?.id ? (
                      <CategoryChangeRequestPanel
                        businessId={business.id}
                        currentCategory={profileData.category || ''}
                        onPendingChange={setPendingCategoryRequest}
                      />
                    ) : (
                      <p className="text-sm text-zinc-500">Sign in again to request a category change.</p>
                    )
                  ) : activeModal === 'businessName' ? (
                    business?.id ? (
                      <LegalBusinessNameChangeRequestPanel
                        businessId={business.id}
                        currentLegalName={profileData.businessName || ''}
                        onPendingChange={setPendingLegalNameRequest}
                      />
                    ) : (
                      <p className="text-sm text-zinc-500">Sign in again to request a legal name change.</p>
                    )
                  ) : activeModal === 'displayName' ? (
                    <div className="space-y-3">
                      <p className="rounded-lg border border-[#215481]/15 bg-[#215481]/[0.04] px-3 py-2.5 text-xs leading-relaxed text-zinc-700">
                        This is the name customers see on your public FinderB profile, search results, and
                        listing cards. Your legal business name stays on record separately.
                      </p>
                      <input
                        type="text"
                        value={profileData.displayName ?? ''}
                        onChange={(e) => updateField('displayName', e.target.value)}
                        placeholder="e.g. Sharma Electronics"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                        autoFocus
                      />
                    </div>
                  ) : activeModal === 'ownerInfo' ? (
                    <div className="space-y-4">
                      <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-600">
                        For FinderB records only — not shown on your public profile. Helps our team reach the
                        business owner for verification, support, or urgent listing issues.
                      </p>
                      <div>
                        <label htmlFor="owner-name" className="mb-1 block text-xs font-medium text-zinc-600">
                          Owner name
                        </label>
                        <input
                          id="owner-name"
                          type="text"
                          value={profileData.ownerName ?? ''}
                          onChange={(e) => updateField('ownerName', e.target.value)}
                          placeholder="Full name of business owner"
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label htmlFor="owner-mobile" className="mb-1 block text-xs font-medium text-zinc-600">
                          Owner mobile
                        </label>
                        <IndianPhoneInput
                          id="owner-mobile"
                          value={String(profileData.ownerMobile ?? '')}
                          onChange={(digits) => {
                            updateField('ownerMobile', digits);
                            if (fieldError) setFieldError('');
                          }}
                          variant="dashboard"
                        />
                        {fieldError ? (
                          <p className="mt-2 text-xs text-rose-600">{fieldError}</p>
                        ) : (
                          <p className="mt-2 text-xs text-zinc-500">{INDIAN_PHONE_FIELD_HINT}</p>
                        )}
                      </div>
                    </div>
                  ) : activeModal === 'discountRange' ? (
                    <div className="space-y-3">
                      <select
                        value={
                          !profileData.discountRange ||
                          profileData.discountRange === NO_DISCOUNT ||
                          profileData.discountRange === 'Seasonal Offer'
                            ? NO_DISCOUNT
                            : profileData.discountRange
                        }
                        onChange={(e) => updateField('discountRange', e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481]"
                      >
                        <option value={NO_DISCOUNT}>{NO_DISCOUNT}</option>
                        {discountOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const impact = getDiscountVisibilityImpact(
                          profileData.discountRange || NO_DISCOUNT,
                        );
                        const toneClass =
                          impact.tier === 'none'
                            ? 'border-zinc-200 bg-zinc-50 text-zinc-700'
                            : impact.tier === 'light'
                              ? 'border-sky-200 bg-sky-50 text-sky-950'
                              : impact.tier === 'medium'
                                ? 'border-amber-200 bg-amber-50 text-amber-950'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-950';

                        return (
                          <div className={`rounded-lg border px-3 py-2.5 text-sm ${toneClass}`}>
                            <p className="font-medium">{impact.title}</p>
                            <p className="mt-1 text-xs leading-relaxed opacity-90">{impact.message}</p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : activeModal === 'yearsInBusiness' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500">
                        Pick any date in the year your business was established. Only the year is saved.
                      </p>
                      <input
                        type="date"
                        value={establishmentYearToDateValue(profileData.yearsInBusiness)}
                        min={getEstablishmentDateBounds().min}
                        max={getEstablishmentDateBounds().max}
                        onChange={(e) =>
                          updateField('yearsInBusiness', parseEstablishmentYearFromDate(e.target.value))
                        }
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                      />
                      {isValidEstablishmentYear(profileData.yearsInBusiness) && (
                        <p className="text-sm text-zinc-600">
                          Established in <span className="font-medium text-zinc-900">{profileData.yearsInBusiness}</span>
                        </p>
                      )}
                    </div>
                  ) : activeModal === 'mapLocation' ? (
                    <GoogleMapsLocationEditor
                      googleMapsUrl={profileData.googleMapsUrl || ''}
                      latitude={profileData.latitude}
                      longitude={profileData.longitude}
                      addressContext={{
                        city: profileData.city,
                        state: profileData.state,
                        country: profileData.country,
                      }}
                      onResolved={({ googleMapsUrl, latitude, longitude, city, state, country }) => {
                        updateField('googleMapsUrl', googleMapsUrl);
                        updateField('latitude', latitude);
                        updateField('longitude', longitude);
                        if (city) updateField('city', city);
                        if (state) updateField('state', state);
                        if (country) updateField('country', country);
                      }}
                    />
                  ) : activeModal === 'timings' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500">
                        Mark a day closed to disable its hours. On Monday, use &quot;Apply same to all days&quot; to
                        copy Monday&apos;s timings to the rest of the week.
                      </p>
                      {WEEKDAYS.map((day) => {
                        const dayTiming = profileData.timings?.[day] as DayTiming | undefined;
                        const isClosed = Boolean(dayTiming?.isClosed);
                        const mondayTiming = profileData.timings?.[MONDAY] as DayTiming | undefined;
                        const showMondaySyncToggle =
                          day === MONDAY &&
                          Boolean(mondayTiming?.open && mondayTiming?.close) &&
                          !isClosed;

                        return (
                          <div
                            key={day}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                          >
                            <span className="w-10 text-xs font-medium text-zinc-700">{day.slice(0, 3)}</span>
                            <input
                              type="time"
                              value={dayTiming?.open || ''}
                              disabled={isClosed}
                              onChange={(e) => updateDayTiming(day, { open: e.target.value, isClosed })}
                              className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-100 disabled:text-zinc-400"
                            />
                            <span className="text-xs text-zinc-400">–</span>
                            <input
                              type="time"
                              value={dayTiming?.close || ''}
                              disabled={isClosed}
                              onChange={(e) => updateDayTiming(day, { close: e.target.value, isClosed })}
                              className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-100 disabled:text-zinc-400"
                            />
                            <label className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
                              <input
                                type="checkbox"
                                checked={isClosed}
                                onChange={(e) => updateDayTiming(day, { isClosed: e.target.checked })}
                              />
                              Closed
                            </label>
                            {showMondaySyncToggle && (
                              <label className="flex w-full items-center gap-1.5 text-[11px] text-zinc-600 sm:ml-0 sm:w-auto">
                                <input
                                  type="checkbox"
                                  checked={syncMondayToAll}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSyncMondayToAll(true);
                                      updateField(
                                        'timings',
                                        applyDayTimingsToAll(profileData.timings || {}, MONDAY),
                                      );
                                      return;
                                    }
                                    setSyncMondayToAll(false);
                                  }}
                                  className="rounded border-zinc-300 text-[#215481] focus:ring-[#215481]/20"
                                />
                                Apply same to all days
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : activeModal === 'serviceCategory' ? (
                    <ServiceCategoryTagInput
                      value={profileData.serviceCategory || ''}
                      onChange={(nextValue) => updateField('serviceCategory', nextValue)}
                    />
                  ) : activeModal === 'paymentModes' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-600">
                        Select every payment method customers can use at your business.
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {PAYMENT_MODE_OPTIONS.map((mode) => {
                          const checked = selectedPaymentModes.includes(mode);
                          return (
                            <label
                              key={mode}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                checked
                                  ? 'border-[#215481] bg-[#215481]/5 text-[#153551]'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePaymentMode(mode)}
                                className="h-4 w-4 rounded border-zinc-300 text-[#215481] focus:ring-[#215481]/20"
                              />
                              {mode}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : PROFILE_LINK_FIELDS.has(activeModal) ? (
                    <div className="space-y-2">
                      <input
                        type="url"
                        inputMode="url"
                        value={profileData[activeModal] ?? ''}
                        onChange={(e) => handleLinkFieldChange(activeModal, e.target.value)}
                        onBlur={(e) => handleLinkFieldBlur(activeModal, e.target.value)}
                        placeholder={
                          activeModal === 'website'
                            ? 'https://yourbusiness.com'
                            : activeModal === 'instagramUrl'
                              ? 'https://instagram.com/yourpage'
                              : activeModal === 'facebookUrl'
                                ? 'https://facebook.com/yourpage'
                                : 'https://youtube.com/@yourchannel'
                        }
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                            : 'border-zinc-200 focus:border-[#215481] focus:ring-[#215481]/10'
                        }`}
                        autoFocus
                      />
                      {fieldError ? (
                        <p className="text-xs text-rose-600">{fieldError}</p>
                      ) : (
                        <p className="text-xs text-zinc-500">We&apos;ll check that this is a valid link before saving.</p>
                      )}
                    </div>
                  ) : activeModal && PHONE_FIELDS.has(activeModal) ? (
                    <div className="space-y-3">
                      <IndianPhoneInput
                        id={`settings-${activeModal}`}
                        value={String(profileData[activeModal] ?? '')}
                        onChange={(digits) => {
                          updateField(activeModal, digits);
                          if (fieldError) setFieldError('');
                        }}
                        autoFocus
                        variant="dashboard"
                      />
                      {fieldError ? (
                        <p className="text-xs text-rose-600">{fieldError}</p>
                      ) : (
                        <p className="text-xs text-zinc-500">{INDIAN_PHONE_FIELD_HINT}</p>
                      )}
                    </div>
                  ) : activeModal && LOCATION_FIELDS.has(activeModal) ? (
                    <div className="space-y-3">
                      {hasValidMapPin(profileData.latitude, profileData.longitude) && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                          Your map pin is set. {activeField.label} must match that location — use the map
                          editor to change the area.
                        </p>
                      )}
                      <input
                        type="text"
                        value={profileData[activeModal] ?? ''}
                        onChange={(e) => {
                          updateField(activeModal, e.target.value);
                          if (fieldError) setFieldError('');
                        }}
                        onBlur={() => {
                          void validateLocationAgainstMapPin();
                        }}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                          fieldError
                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                            : 'border-zinc-200 focus:border-[#215481] focus:ring-[#215481]/10'
                        }`}
                        autoFocus
                      />
                      {fieldError ? (
                        <p className="text-xs text-rose-600">{fieldError}</p>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          {hasValidMapPin(profileData.latitude, profileData.longitude)
                            ? 'This must match your verified map pin.'
                            : 'Set your map pin to auto-fill and lock city/state/country.'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type={activeField.type === 'number' ? 'number' : 'text'}
                      step={activeField.type === 'number' ? 'any' : undefined}
                      value={profileData[activeModal] ?? ''}
                      onChange={(e) =>
                        updateField(
                          activeModal,
                          e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                      autoFocus
                    />
                  )}
                </div>

                <div className="flex gap-2 border-t border-zinc-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className={`${activeModal === 'category' || activeModal === 'businessName' ? 'w-full' : 'flex-1'} ${dashboard.btnSecondary}`}
                  >
                    {activeModal === 'category' || activeModal === 'businessName' ? 'Close' : 'Cancel'}
                  </button>
                  {activeModal !== 'category' && activeModal !== 'businessName' && (
                  <button
                    type="submit"
                    disabled={
                      updating ||
                      Boolean(fieldError) ||
                      (activeModal === 'mapLocation' &&
                        checkIsMissing(SETTINGS_FIELDS.find((f) => f.key === 'mapLocation')!)) ||
                      (activeModal === 'paymentModes' && selectedPaymentModes.length === 0)
                    }
                    className={`flex-[2] ${dashboard.btnPrimary} disabled:opacity-50`}
                  >
                    {updating ? 'Saving…' : 'Save'}
                  </button>
                  )}
                </div>
              </form>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  const deleteModal =
    mounted && showDeleteModal
      ? createPortal(
          <div className="fixed inset-0 z-[310] flex items-center justify-center bg-zinc-900/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <div className="text-center">
                <HiOutlineExclamationCircle size={40} className="mx-auto text-rose-500" />
                <h3 className="mt-3 text-lg font-semibold text-zinc-900">Delete photo?</h3>
                <p className="mt-1 text-sm text-zinc-500">This cannot be undone.</p>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setImageToDelete(null);
                  }}
                  className={`flex-1 ${dashboard.btnSecondary}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDeleteImage();
                    setShowDeleteModal(false);
                  }}
                  disabled={updating}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-8 pb-24">
      {successMessage && (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <HiOutlineShieldCheck size={18} />
          {successMessage}
        </div>
      )}

      {!businessHasPublicPhoto({ profilePictureUrl, images }) && (
        <ListingHiddenNoPhotosBanner onAddPhotos={() => setActiveModal('media')} />
      )}

      {missingFields.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-600">Needs attention</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => setActiveModal(field.key)}
                className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-[#153551] hover:bg-amber-100"
              >
                {field.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {FIELD_SECTIONS.map((section) => {
        const sectionFields = section.keys
          .map((key) => SETTINGS_FIELDS.find((f) => f.key === key))
          .filter(Boolean) as FieldDef[];

        return (
          <section key={section.id}>
            <h2 className={dashboard.sectionTitle}>{section.title}</h2>
            <ul className={`mt-2 ${dashboard.surface}`}>
              {sectionFields.map((field) => {
                const isMissing = checkIsMissing(field);
                const Icon = field.icon;
                return (
                  <li key={field.key}>
                    <button
                      type="button"
                      onClick={() => setActiveModal(field.key)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                    >
                      <Icon size={18} className={isMissing ? 'text-amber-600' : 'text-zinc-400'} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900">{field.label}</p>
                        <p
                          className={`truncate text-xs ${isMissing ? 'text-amber-700' : 'text-zinc-500'}`}
                        >
                          {getDisplayValue(field)}
                        </p>
                      </div>
                      {isMissing ? (
                        <span className="shrink-0 text-[10px] font-medium text-amber-700">Add</span>
                      ) : (
                        <HiOutlineChevronRight size={16} className="shrink-0 text-zinc-300" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {modal}
      {deleteModal}
    </div>
  );
}
