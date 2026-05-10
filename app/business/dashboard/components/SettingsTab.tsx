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
  HiOutlineShieldCheck
} from 'react-icons/hi2';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';
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
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Settings Sidebar */}
        <div className="lg:w-72 space-y-2">
          {[
            { id: 'media', label: 'Business Media', icon: HiOutlinePlus, desc: 'Photos & Profile Picture' },
            { id: 'identity', label: 'Business Identity', icon: HiOutlineBriefcase, desc: 'Name, Category & About' },
            { id: 'contact', label: 'Contact & Social', icon: HiOutlineEnvelope, desc: 'Email, Phone & Socials' },
            { id: 'location', label: 'Location Details', icon: HiOutlineMapPin, desc: 'Address & Coordinates' },
            { id: 'business', label: 'Business Details', icon: HiOutlineClock, desc: 'Timings & Services' },
          ].map((tab) => {
            const isSelected = settingsTab === tab.id;
            
            // Check if this category has missing required fields
            let hasMissing = false;
            if (tab.id === 'media') hasMissing = images.length === 0 || !profilePictureUrl;
            if (tab.id === 'identity') hasMissing = !profileData.businessName || !profileData.displayName || !profileData.category || !profileData.about || !profileData.keywords || profileData.keywords.length === 0;
            if (tab.id === 'contact') hasMissing = !profileData.email || !profileData.publicPhone;
            if (tab.id === 'location') hasMissing = !profileData.businessAddress || !profileData.city || !profileData.state || !profileData.country || !profileData.latitude || !profileData.longitude;
            if (tab.id === 'business') hasMissing = !profileData.serviceCategory || !profileData.timings || Object.keys(profileData.timings).length === 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsTab(tab.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[24px] transition-all text-left group ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-gray-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                }`}>
                  <tab.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[11px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {tab.label}
                    </p>
                    {hasMissing && (
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-sm"></div>
                    )}
                  </div>
                  <p className={`text-[10px] font-medium truncate ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                    {tab.desc}
                  </p>
                </div>
                <HiOutlineChevronRight 
                  size={14} 
                  className={`transition-transform duration-300 ${isSelected ? 'rotate-90 opacity-100' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} 
                />
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleUpdateProfile} className="space-y-8">
            {/* Media Section */}
            {settingsTab === 'media' && (
              <div className="bg-white rounded-[40px] shadow-sm p-8 lg:p-12 border border-gray-100 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Business Media</h3>
                  <p className="text-slate-500 text-sm font-medium">Visuals are the first thing customers see. Upload up to 5 high-quality photos.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                  {images.map((url, index) => (
                    <div 
                      key={index} 
                      onClick={() => setFocusedImage(focusedImage === index ? null : index)}
                      className="relative aspect-square rounded-[32px] overflow-hidden border border-gray-100 group shadow-sm cursor-pointer"
                    >
                      <Image 
                        src={url} 
                        alt={`Business ${index + 1}`} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] transition-opacity flex flex-col items-center justify-center gap-3 p-4 ${
                        focusedImage === index 
                          ? 'opacity-100 pointer-events-auto' 
                          : 'opacity-0 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto'
                      }`}>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetProfile(url);
                          }}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                            profilePictureUrl === url 
                              ? 'bg-indigo-600 text-white shadow-indigo-600/20' 
                              : 'bg-white text-slate-900 hover:bg-indigo-50'
                          }`}
                        >
                          {profilePictureUrl === url ? 'Profile Pic' : 'Set Profile'}
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageToDelete(url);
                            setShowDeleteModal(true);
                          }}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20"
                        >
                          Delete
                        </button>
                      </div>
                      {profilePictureUrl === url && (
                        <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <CldUploadWidget 
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={handleUploadSuccess}
                      options={{
                        maxFiles: 5 - images.length,
                        resourceType: 'image',
                        clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp'],
                        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                      }}
                    >
                      {({ open }) => (
                        <button 
                          type="button"
                          onClick={() => open()}
                          className={`aspect-square rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group ${
                            images.length === 0 ? 'border-rose-300 bg-rose-50/30 text-rose-500' : 'border-slate-200 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            images.length === 0 ? 'bg-rose-100' : 'bg-slate-50 group-hover:bg-indigo-100/50'
                          }`}>
                            <HiOutlinePlus size={28} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest">Add Photo</span>
                          {images.length === 0 && <span className="text-[9px] font-bold uppercase italic">* Required</span>}
                        </button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>

                {!profilePictureUrl && images.length > 0 && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600">
                    <HiOutlineExclamationCircle size={18} />
                    <p className="text-[11px] font-black uppercase tracking-widest">Please select a profile picture from your uploaded images.</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile Information Form - Identity Section */}
            {settingsTab === 'identity' && (
              <div className="bg-white rounded-[32px] shadow-sm p-8 border border-gray-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Business Identity</h3>
                    <p className="text-slate-500 text-sm font-medium">Manage your public name and category</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex flex-col items-center shadow-sm">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Rating</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-indigo-600">{profileData.rating || '0.0'}</span>
                        <HiOutlineStar size={16} className="text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Official Business Name</label>
                    <input 
                      type="text" 
                      value={profileData.businessName}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      className={`w-full px-5 py-3.5 rounded-2xl bg-white border ${!profileData.businessName ? 'border-red-500 bg-red-50/30' : 'border-slate-100'} text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none`}
                      placeholder="Official registered name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Display Name</label>
                    <input 
                      type="text" 
                      value={profileData.displayName}
                      onChange={(e) => updateField('displayName', e.target.value)}
                      className={`w-full px-5 py-3.5 rounded-2xl bg-white border ${!profileData.displayName ? 'border-red-500 bg-red-50/30' : 'border-slate-100'} text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none`}
                      placeholder="Public name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Business Category</label>
                    <input 
                      type="text" 
                      value={profileData.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className={`w-full px-5 py-3.5 rounded-2xl bg-white border ${!profileData.category ? 'border-red-500 bg-red-50/30' : 'border-slate-100'} text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none`}
                      placeholder="e.g. Plumber"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">About Business</label>
                    <textarea 
                      value={profileData.about}
                      onChange={(e) => updateField('about', e.target.value)}
                      rows={4}
                      className={`w-full px-5 py-3.5 rounded-2xl bg-white border ${!profileData.about ? 'border-red-500 bg-red-50/30' : 'border-slate-100'} text-slate-900 text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none resize-none`}
                      placeholder="Tell customers about your services..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Contact Section */}
            {settingsTab === 'contact' && (
              <div className="bg-white rounded-[32px] shadow-sm p-8 border border-gray-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Contact & Social</h3>
                  <p className="text-slate-500 text-sm font-medium">How customers can reach you online</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Public Email</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Public Phone</label>
                    <input 
                      type="text" 
                      value={profileData.publicPhone}
                      onChange={(e) => updateField('publicPhone', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">WhatsApp Number</label>
                    <input 
                      type="text" 
                      value={profileData.whatsappNumber}
                      onChange={(e) => updateField('whatsappNumber', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Instagram URL</label>
                    <input 
                      type="text" 
                      value={profileData.instagramUrl}
                      onChange={(e) => updateField('instagramUrl', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Facebook URL</label>
                    <input 
                      type="text" 
                      value={profileData.facebookUrl}
                      onChange={(e) => updateField('facebookUrl', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">YouTube URL</label>
                    <input 
                      type="text" 
                      value={profileData.youtubeUrl}
                      onChange={(e) => updateField('youtubeUrl', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Website URL</label>
                    <input 
                      type="text" 
                      value={profileData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Location Section */}
            {settingsTab === 'location' && (
              <div className="bg-white rounded-[32px] shadow-sm p-8 border border-gray-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Location Details</h3>
                  <p className="text-slate-500 text-sm font-medium">Set your physical address and map coordinates</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Business Address</label>
                    <input 
                      type="text" 
                      value={profileData.businessAddress}
                      onChange={(e) => updateField('businessAddress', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">City</label>
                    <input 
                      type="text" 
                      value={profileData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">State</label>
                    <input 
                      type="text" 
                      value={profileData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Country</label>
                    <input 
                      type="text" 
                      value={profileData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      value={profileData.latitude}
                      onChange={(e) => updateField('latitude', parseFloat(e.target.value))}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      value={profileData.longitude}
                      onChange={(e) => updateField('longitude', parseFloat(e.target.value))}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Business Details Section */}
            {settingsTab === 'business' && (
              <div className="bg-white rounded-[32px] shadow-sm p-8 border border-gray-100 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Business Details</h3>
                  <p className="text-slate-500 text-sm font-medium">Timings, discounts and services</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Service Category</label>
                    <input 
                      type="text" 
                      value={profileData.serviceCategory}
                      onChange={(e) => updateField('serviceCategory', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Discount Range</label>
                    <select 
                      value={profileData.discountRange}
                      onChange={(e) => updateField('discountRange', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none appearance-none"
                    >
                      <option value="">Select Discount Range</option>
                      {discountOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Profile QR Link</label>
                    <input 
                      type="text" 
                      value={profileData.profileQrLink}
                      onChange={(e) => updateField('profileQrLink', e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search Keywords (comma separated)</label>
                    <textarea 
                      value={Array.isArray(profileData.keywords) ? profileData.keywords.join(', ') : profileData.keywords}
                      onChange={(e) => updateField('keywords', e.target.value.split(',').map((k: string) => k.trim()))}
                      rows={3}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-sm font-medium focus:border-indigo-600 outline-none resize-none"
                      placeholder="e.g. plumber, home service, repair"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm relative overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600">
                <HiOutlineExclamationCircle size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Photo?</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Are you sure you want to remove this image? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setImageToDelete(null);
                  }}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteImage}
                  disabled={updating}
                  className="flex-1 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {updating ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {successMessage && (
        <div className="fixed bottom-24 lg:bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <HiOutlineShieldCheck size={14} className="text-white" />
            </div>
            <p className="text-xs font-bold tracking-wide">{successMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}
