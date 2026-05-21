'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, Briefcase, IndianRupee, Clock, Building2, Filter, X, ChevronRight, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import JobApplicationForm from './JobApplicationForm';
import { cities } from '@/lib/mockData';

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string | null;
  description: string;
  department: string | null;
  created_at: string;
  business: {
    id: string;
    businessName: string;
    city: string | null;
    profilePictureUrl: string | null;
    isVerified: boolean;
    latitude: number | null;
    longitude: number | null;
  };
}

// Haversine formula to calculate distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function JobPortalClient({ initialJobs }: { initialJobs: Job[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setSortByDistance(true);
      });
    }
  };

  const filteredJobs = useMemo(() => {
    let jobs = initialJobs.filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           job.business.businessName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
                             (job.business.city && job.business.city.toLowerCase().includes(locationFilter.toLowerCase()));
      const matchesType = typeFilter === 'All' || job.type === typeFilter;
      
      return matchesSearch && matchesLocation && matchesType;
    });

    if (sortByDistance && userLocation) {
      jobs = [...jobs].sort((a, b) => {
        if (!a.business.latitude || !a.business.longitude) return 1;
        if (!b.business.latitude || !b.business.longitude) return -1;
        
        const distA = getDistance(userLocation.lat, userLocation.lon, a.business.latitude, a.business.longitude);
        const distB = getDistance(userLocation.lat, userLocation.lon, b.business.latitude, b.business.longitude);
        return distA - distB;
      });
    }

    return jobs;
  }, [initialJobs, searchTerm, locationFilter, typeFilter, sortByDistance, userLocation]);

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-32">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Quick Filters
            </h3>
            <div className="flex gap-2">
              {sortByDistance && (
                <button 
                  onClick={() => setSortByDistance(false)}
                  className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase border border-red-100 px-2 py-1 rounded-lg"
                >
                  Clear Distance
                </button>
              )}
              {(searchTerm || locationFilter || typeFilter !== 'All') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setTypeFilter('All');
                    setSortByDistance(false);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <button
              onClick={handleGetLocation}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                sortByDistance 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <MapPin size={16} />
              {sortByDistance ? 'Sorting by Distance' : 'Find Near Me'}
            </button>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Search Role</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Job title or company..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div ref={locationRef} className="relative">
              <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  onFocus={() => setShowLocationSuggestions(true)}
                  placeholder="City or region..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {showLocationSuggestions && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div 
                    onClick={() => {
                      handleGetLocation();
                      setShowLocationSuggestions(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 mb-2 text-blue-600 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <MapPin size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Detect Current Location</span>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 px-3 pt-1 uppercase tracking-widest">Popular Cities</p>
                    <div className="space-y-1">
                      {cities
                        .filter(city => city.name.toLowerCase().includes(locationFilter.toLowerCase()))
                        .map((city) => (
                        <button
                          key={city.id}
                          onClick={() => {
                            setLocationFilter(city.name);
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-3 text-sm font-semibold text-slate-700"
                        >
                          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                            <MapPin size={12} />
                          </div>
                          {city.name}
                        </button>
                      ))}
                      {cities.filter(city => city.name.toLowerCase().includes(locationFilter.toLowerCase())).length === 0 && (
                        <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">No cities found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase mb-3 block">Job Type</label>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      typeFilter === type 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-500 font-bold">
            Showing <span className="text-blue-600">{filteredJobs.length}</span> active positions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => (
            <div 
              key={job.id}
              className="group bg-white p-4 md:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-5">
                {/* Logo/Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center relative">
                  {job.business.profilePictureUrl ? (
                    <Image 
                      src={job.business.profilePictureUrl} 
                      alt={job.business.businessName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="text-slate-300" size={24} />
                  )}
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {job.title}
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded-md border border-blue-100">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-bold text-slate-500 mb-3">
                    <Link 
                      href={`/business/${job.business.id}`}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Building2 size={14} className="text-slate-400" />
                      <span className="text-slate-800">{job.business.businessName}</span>
                      {job.business.isVerified && (
                        <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2 h-2">
                            <path d="M20 6L9 17L4 12" />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-1">
                        <IndianRupee size={14} className="text-slate-400" />
                        {job.salary}
                      </div>
                    )}
                    <div className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock size={14} className="text-slate-400" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm line-clamp-1 leading-relaxed mb-4">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-end">
                    <button 
                      onClick={() => {
                        setSelectedJob(job);
                        setIsFormOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2 rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-2 group/btn"
                    >
                      Apply Now
                      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No jobs found</h3>
              <p className="text-slate-500 font-medium">Try adjusting your filters or search keywords.</p>
            </div>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {isFormOpen && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm google-sans">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Apply for Position</h2>
                <p className="text-sm font-bold text-blue-600 uppercase mt-1">{selectedJob.title}</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-amber-700">
                  <AlertTriangle size={16} />
                  <span className="text-xs font-black uppercase">Safety Guidelines</span>
                </div>
                <ul className="space-y-1.5">
                  {[
                    "Never pay for job offers or interviews.",
                    "Do not share OTPs or bank details.",
                    "Verify the merchant on your own."
                  ].map((p, i) => (
                    <li key={i} className="text-[11px] font-bold text-amber-800 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <JobApplicationForm 
                job={selectedJob} 
                onSuccess={() => {
                  setTimeout(() => setIsFormOpen(false), 2000);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
