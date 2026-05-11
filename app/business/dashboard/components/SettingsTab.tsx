'use client';

import { 
  HiOutlinePlus, 
  HiOutlineBriefcase, 
  HiOutlineEnvelope, 
  HiOutlineMapPin, 
  HiOutlineClock, 
  HiOutlineChevronRight,
  HiOutlineExclamationCircle,
  HiOutlineStar,
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
  HiOutlineLink,
  HiOutlineXMark,
  HiOutlineQueueList
} from 'react-icons/hi2';
import { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { useState } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';

interface SettingsTabProps {
  business: any;
  profileData: any;
  images: string[];
  profilePictureUrl: string | null;
  updating: boolean;
  successMessage: string | null;
  settingsTab: string;
  setSettingsTab: (tab: string) => void;
  openAccordions: string[];
  toggleAccordion: (id: string) => void;
  updateField: (field: string, value: any) => void;
  handleUpdateProfile: (e: React.FormEvent) => Promise<void>;
  handleUploadSuccess: (result: any) => Promise<void>;
  handleSetProfile: (url: string) => Promise<void>;
  setImageToDelete: (url: string | null) => void;
  setShowDeleteModal: (show: boolean) => void;
  focusedImage: number | null;
  setFocusedImage: (index: number | null) => void;
  showDeleteModal: boolean;
  handleDeleteImage: () => Promise<void>;
}

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

export default function SettingsTab({
  business,
  profileData,
  images,
  profilePictureUrl,
  updating,
  successMessage,
  settingsTab,
  setSettingsTab,
  openAccordions,
  toggleAccordion,
  updateField,
  handleUpdateProfile,
  handleUploadSuccess,
  handleSetProfile,
  setImageToDelete,
  setShowDeleteModal,
  focusedImage,
  setFocusedImage,
  showDeleteModal,
  handleDeleteImage
}: SettingsTabProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const fields = [
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
    { key: 'latitude', label: 'Latitude', icon: HiOutlineMap, type: 'number' },
    { key: 'longitude', label: 'Longitude', icon: HiOutlineMap, type: 'number' },
    { key: 'serviceCategory', label: 'Service Category', icon: HiOutlineQueueList, type: 'text' },
    { key: 'yearsInBusiness', label: 'Years Active', icon: HiOutlineCalendar, type: 'number' },
    { key: 'discountRange', label: 'Discount Offer', icon: HiOutlineTag, type: 'select', options: discountOptions },
    { key: 'timings', label: 'Business Hours', icon: HiOutlineClock, type: 'timings' },
  ];

  const checkIsMissing = (field: any) => {
    if (field.key === 'media') return images.length === 0 || !profilePictureUrl;
    if (field.key === 'timings') return !profileData.timings || Object.keys(profileData.timings).length === 0;
    if (field.key === 'keywords') return !profileData.keywords || profileData.keywords.length === 0;
    
    const value = profileData[field.key];
    return value === undefined || value === null || value === '' || value === 0;
  };

  const getDisplayValue = (field: any) => {
    if (field.key === 'media') return `${images.length} Photos`;
    if (field.key === 'timings') return Object.keys(profileData.timings || {}).length > 0 ? 'Hours Set' : 'Not Set';
    if (field.key === 'keywords') return Array.isArray(profileData.keywords) ? profileData.keywords.join(', ') : profileData.keywords || 'Not Set';
    
    return profileData[field.key] || 'Not Set';
  };

  const InfoCard = ({ field }: { field: any }) => {
    const isMissing = checkIsMissing(field);
    const displayValue = getDisplayValue(field);
    const Icon = field.icon;

    return (
      <button
        type="button"
        onClick={() => setActiveModal(field.key)}
        className={`group p-5 rounded-[28px] border transition-all text-left flex flex-col gap-4 relative overflow-hidden ${
          isMissing 
            ? 'bg-rose-50/30 border-rose-100 hover:border-rose-200' 
            : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5'
        }`}
      >
        <div className="flex items-center justify-between relative z-10">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
            isMissing 
              ? 'bg-rose-100 text-rose-600' 
              : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
          }`}>
            <Icon size={22} />
          </div>
          {isMissing ? (
            <div className="flex items-center gap-1.5 bg-rose-100 px-2.5 py-1 rounded-full">
              <div className="w-1 h-1 rounded-full bg-rose-600 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">Missing</span>
            </div>
          ) : (
            <HiOutlineChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
        
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.label}</p>
          <p className={`text-sm font-black truncate ${isMissing ? 'text-rose-400 italic' : 'text-slate-900'}`}>
            {displayValue}
          </p>
        </div>

        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full transition-opacity duration-500 ${
          isMissing ? 'bg-rose-50 opacity-50' : 'bg-indigo-50/30 opacity-0 group-hover:opacity-100'
        }`}></div>
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Business Profile</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage all your business information in one place</p>
        </div>
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 animate-in zoom-in-95">
            <HiOutlineShieldCheck size={18} />
            <span className="text-xs font-black uppercase tracking-wider">{successMessage}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {fields.map((field) => (
          <InfoCard key={field.key} field={field} />
        ))}
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900">
                  {fields.find(f => f.key === activeModal)?.icon({ size: 24 })}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Edit {fields.find(f => f.key === activeModal)?.label}
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Update Information</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center"
              >
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={async (e) => {
                await handleUpdateProfile(e);
                setActiveModal(null);
              }} className="space-y-6">
                {activeModal === 'media' ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {images.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-[24px] overflow-hidden group border border-slate-100">
                          <Image src={url} alt="" fill className="object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                            <button 
                              type="button"
                              onClick={() => handleSetProfile(url)}
                              className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                profilePictureUrl === url ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 hover:bg-indigo-50'
                              }`}
                            >
                              {profilePictureUrl === url ? 'Cover' : 'Set Cover'}
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setImageToDelete(url);
                                setShowDeleteModal(true);
                              }}
                              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              Delete
                            </button>
                          </div>
                          {profilePictureUrl === url && (
                            <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                      {images.length < 5 && (
                        <CldUploadWidget 
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                          onSuccess={handleUploadSuccess}
                          options={{ maxFiles: 5 - images.length, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
                        >
                          {({ open }) => (
                            <button 
                              type="button"
                              onClick={() => open()}
                              className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all text-slate-400 hover:text-indigo-600"
                            >
                              <HiOutlinePlus size={24} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                            </button>
                          )}
                        </CldUploadWidget>
                      )}
                    </div>
                  </div>
                ) : activeModal === 'about' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">About Business</label>
                    <textarea 
                      value={profileData.about}
                      onChange={(e) => updateField('about', e.target.value)}
                      rows={6}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none resize-none"
                      placeholder="Tell customers about your business..."
                    />
                  </div>
                ) : activeModal === 'keywords' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Keywords (comma separated)</label>
                    <textarea 
                      value={Array.isArray(profileData.keywords) ? profileData.keywords.join(', ') : profileData.keywords}
                      onChange={(e) => updateField('keywords', e.target.value.split(',').map((k: string) => k.trim()))}
                      rows={4}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none resize-none"
                      placeholder="e.g. plumber, repair, maintenance"
                    />
                  </div>
                ) : activeModal === 'discountRange' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Select Discount Range</label>
                    <select 
                      value={profileData.discountRange}
                      onChange={(e) => updateField('discountRange', e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">No Discount</option>
                      {discountOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                ) : activeModal === 'timings' ? (
                  <div className="space-y-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-black text-slate-900 w-24">{day}</span>
                        <div className="flex items-center gap-3">
                          <input 
                            type="time" 
                            value={profileData.timings?.[day]?.open || ''}
                            onChange={(e) => updateField('timings', { 
                              ...profileData.timings, 
                              [day]: { ...profileData.timings?.[day], open: e.target.value }
                            })}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-xs font-bold outline-none focus:border-indigo-600"
                          />
                          <span className="text-slate-400 text-[10px] font-black uppercase">to</span>
                          <input 
                            type="time" 
                            value={profileData.timings?.[day]?.close || ''}
                            onChange={(e) => updateField('timings', { 
                              ...profileData.timings, 
                              [day]: { ...profileData.timings?.[day], close: e.target.value }
                            })}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-xs font-bold outline-none focus:border-indigo-600"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={profileData.timings?.[day]?.isClosed}
                            onChange={(e) => updateField('timings', { 
                              ...profileData.timings, 
                              [day]: { ...profileData.timings?.[day], isClosed: e.target.checked }
                            })}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20"
                          />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closed</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                      {fields.find(f => f.key === activeModal)?.label}
                    </label>
                    <input 
                      type={fields.find(f => f.key === activeModal)?.type === 'number' ? 'number' : 'text'}
                      step={fields.find(f => f.key === activeModal)?.type === 'number' ? 'any' : undefined}
                      value={profileData[activeModal] || ''}
                      onChange={(e) => updateField(activeModal, e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none"
                      autoFocus
                    />
                  </div>
                )}

                <div className="pt-6 border-t border-slate-50 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-[2] px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600">
                <HiOutlineExclamationCircle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Photo?</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Are you sure? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => { setShowDeleteModal(false); setImageToDelete(null); }}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => { await handleDeleteImage(); setShowDeleteModal(false); }}
                  disabled={updating}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {updating ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
