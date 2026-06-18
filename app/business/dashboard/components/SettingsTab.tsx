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
} from 'react-icons/hi2';
import { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import GoogleMapsLocationEditor from './GoogleMapsLocationEditor';
import { dashboard } from './dashboard-ui';

const discountOptions = [
  'No Discount',
  '5% - 10% OFF',
  '10% - 20% OFF',
  '20% - 30% OFF',
  '30% - 40% OFF',
  'Up to 50% OFF',
  'Special Festive Discount',
  'Seasonal Offer',
];

type FieldDef = {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type: string;
  significance?: string;
  options?: string[];
};

const SETTINGS_FIELDS: FieldDef[] = [
  { key: 'media', label: 'Business Photos', icon: HiOutlinePhoto, type: 'media' },
  { key: 'businessName', label: 'Business Name', icon: HiOutlineBriefcase, type: 'text' },
  { key: 'displayName', label: 'Display Name', icon: HiOutlineUser, type: 'text' },
  { key: 'category', label: 'Business Category', icon: HiOutlineTag, type: 'text' },
  { key: 'about', label: 'About Business', icon: HiOutlineInformationCircle, type: 'textarea' },
  { key: 'keywords', label: 'Search Keywords', icon: HiOutlineHashtag, type: 'keywords' },
  { key: 'email', label: 'Official Email', icon: HiOutlineEnvelope, type: 'text' },
  { key: 'publicPhone', label: 'Public Phone', icon: HiOutlinePhone, type: 'text' },
  { key: 'whatsappNumber', label: 'WhatsApp', icon: FaWhatsapp, type: 'text' },
  { key: 'website', label: 'Website URL', icon: HiOutlineGlobeAlt, type: 'text' },
  { key: 'instagramUrl', label: 'Instagram', icon: FaInstagram, type: 'text' },
  { key: 'facebookUrl', label: 'Facebook', icon: FaFacebook, type: 'text' },
  { key: 'youtubeUrl', label: 'YouTube', icon: FaYoutube, type: 'text' },
  { key: 'businessAddress', label: 'Street Address', icon: HiOutlineMapPin, type: 'text' },
  { key: 'city', label: 'City', icon: HiOutlineMapPin, type: 'text' },
  { key: 'state', label: 'State', icon: HiOutlineMapPin, type: 'text' },
  { key: 'country', label: 'Country', icon: HiOutlineGlobeAlt, type: 'text' },
  { key: 'mapLocation', label: 'Google Maps Location', icon: HiOutlineMap, type: 'googleMaps' },
  { key: 'serviceCategory', label: 'Service Category', icon: HiOutlineQueueList, type: 'text' },
  { key: 'yearsInBusiness', label: 'Years Active', icon: HiOutlineCalendar, type: 'number' },
  { key: 'discountRange', label: 'Discount Offer', icon: HiOutlineTag, type: 'select', options: discountOptions },
  { key: 'timings', label: 'Business Hours', icon: HiOutlineClock, type: 'timings' },
];

const FIELD_SECTIONS = [
  { id: 'brand', title: 'Brand & discovery', keys: ['media', 'businessName', 'displayName', 'category', 'about', 'keywords'] },
  { id: 'contact', title: 'Contact', keys: ['email', 'publicPhone', 'whatsappNumber', 'website'] },
  { id: 'location', title: 'Location', keys: ['businessAddress', 'city', 'state', 'country', 'mapLocation'] },
  { id: 'social', title: 'Social media', keys: ['instagramUrl', 'facebookUrl', 'youtubeUrl'] },
  { id: 'operations', title: 'Operations', keys: ['serviceCategory', 'yearsInBusiness', 'discountRange', 'timings'] },
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
}

export default function SettingsTab({
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
}: SettingsTabProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!focusField) return;
    const exists = SETTINGS_FIELDS.some((f) => f.key === focusField);
    if (exists) {
      setActiveModal(focusField);
    }
    onFocusHandled?.();
  }, [focusField, onFocusHandled]);

  const checkIsMissing = (field: FieldDef) => {
    if (field.key === 'media') return images.length === 0 || !profilePictureUrl;
    if (field.key === 'timings') return !profileData.timings || Object.keys(profileData.timings).length === 0;
    if (field.key === 'keywords') return !profileData.keywords || profileData.keywords.length === 0;
    if (field.key === 'mapLocation') {
      const lat = profileData.latitude;
      const lng = profileData.longitude;
      return lat == null || lng == null || (lat === 0 && lng === 0);
    }
    const value = profileData[field.key];
    return value === undefined || value === null || value === '' || value === 0;
  };

  const getDisplayValue = (field: FieldDef) => {
    if (field.key === 'media') return `${images.length} photo${images.length === 1 ? '' : 's'}`;
    if (field.key === 'timings') return Object.keys(profileData.timings || {}).length > 0 ? 'Set' : 'Not set';
    if (field.key === 'keywords') {
      return Array.isArray(profileData.keywords) && profileData.keywords.length
        ? profileData.keywords.join(', ')
        : 'Not set';
    }
    if (field.key === 'mapLocation') {
      const lat = profileData.latitude;
      const lng = profileData.longitude;
      if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
        return profileData.googleMapsUrl ? 'Pin set' : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      return 'Not set';
    }
    return profileData[field.key] || 'Not set';
  };

  const missingFields = SETTINGS_FIELDS.filter(checkIsMissing);
  const activeField = SETTINGS_FIELDS.find((f) => f.key === activeModal);
  const ActiveIcon = activeField?.icon;

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

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
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
                    <textarea
                      value={profileData.about}
                      onChange={(e) => updateField('about', e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                      placeholder="Tell customers about your business..."
                    />
                  ) : activeModal === 'keywords' ? (
                    <textarea
                      value={
                        Array.isArray(profileData.keywords)
                          ? profileData.keywords.join(', ')
                          : profileData.keywords || ''
                      }
                      onChange={(e) =>
                        updateField(
                          'keywords',
                          e.target.value.split(',').map((k: string) => k.trim())
                        )
                      }
                      rows={4}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
                      placeholder="e.g. plumber, repair"
                    />
                  ) : activeModal === 'discountRange' ? (
                    <select
                      value={profileData.discountRange}
                      onChange={(e) => updateField('discountRange', e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#215481]"
                    >
                      <option value="">No Discount</option>
                      {discountOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : activeModal === 'mapLocation' ? (
                    <GoogleMapsLocationEditor
                      googleMapsUrl={profileData.googleMapsUrl || ''}
                      latitude={profileData.latitude}
                      longitude={profileData.longitude}
                      onResolved={({ googleMapsUrl, latitude, longitude }) => {
                        updateField('googleMapsUrl', googleMapsUrl);
                        updateField('latitude', latitude);
                        updateField('longitude', longitude);
                      }}
                    />
                  ) : activeModal === 'timings' ? (
                    <div className="space-y-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                        (day) => (
                          <div
                            key={day}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                          >
                            <span className="w-10 text-xs font-medium text-zinc-700">{day.slice(0, 3)}</span>
                            <input
                              type="time"
                              value={profileData.timings?.[day]?.open || ''}
                              onChange={(e) =>
                                updateField('timings', {
                                  ...profileData.timings,
                                  [day]: { ...profileData.timings?.[day], open: e.target.value },
                                })
                              }
                              className="rounded border border-zinc-200 px-2 py-1 text-xs"
                            />
                            <span className="text-xs text-zinc-400">–</span>
                            <input
                              type="time"
                              value={profileData.timings?.[day]?.close || ''}
                              onChange={(e) =>
                                updateField('timings', {
                                  ...profileData.timings,
                                  [day]: { ...profileData.timings?.[day], close: e.target.value },
                                })
                              }
                              className="rounded border border-zinc-200 px-2 py-1 text-xs"
                            />
                            <label className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
                              <input
                                type="checkbox"
                                checked={profileData.timings?.[day]?.isClosed}
                                onChange={(e) =>
                                  updateField('timings', {
                                    ...profileData.timings,
                                    [day]: { ...profileData.timings?.[day], isClosed: e.target.checked },
                                  })
                                }
                              />
                              Closed
                            </label>
                          </div>
                        )
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
                    className={`flex-1 ${dashboard.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      updating ||
                      (activeModal === 'mapLocation' &&
                        checkIsMissing(SETTINGS_FIELDS.find((f) => f.key === 'mapLocation')!))
                    }
                    className={`flex-[2] ${dashboard.btnPrimary} disabled:opacity-50`}
                  >
                    {updating ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
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
