'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Briefcase,
  IndianRupee,
  Building2,
  X,
  ChevronRight,
  Navigation,
  ArrowLeft,
} from 'lucide-react';
import JobApplicationForm from './JobApplicationForm';
import { cities } from '@/lib/mockData';
import { getBusinessProfilePath } from '@/lib/businessSlug';

interface Job {
  id: string;
  business_id: string;
  title: string;
  type: string;
  location: string;
  salary: string | null;
  description: string;
  department: string | null;
  created_at: string;
  business: {
    id: string;
    slug?: string | null;
    businessName: string;
    city: string | null;
    profilePictureUrl: string | null;
    isVerified: boolean;
    latitude: number | null;
    longitude: number | null;
  };
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

export default function JobPortalClient({ initialJobs }: { initialJobs: Job[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setSortByDistance(true);
    });
  };

  const filteredJobs = useMemo(() => {
    let jobs = initialJobs.filter((job) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.business.businessName.toLowerCase().includes(q);
      const loc = locationFilter.toLowerCase();
      const matchesLocation =
        !loc ||
        job.location.toLowerCase().includes(loc) ||
        (job.business.city?.toLowerCase().includes(loc) ?? false);
      const matchesType = typeFilter === 'All' || job.type === typeFilter;
      return matchesSearch && matchesLocation && matchesType;
    });

    if (sortByDistance && userLocation) {
      jobs = [...jobs].sort((a, b) => {
        if (!a.business.latitude || !a.business.longitude) return 1;
        if (!b.business.latitude || !b.business.longitude) return -1;
        return (
          getDistance(
            userLocation.lat,
            userLocation.lon,
            a.business.latitude,
            a.business.longitude
          ) -
          getDistance(userLocation.lat, userLocation.lon, b.business.latitude, b.business.longitude)
        );
      });
    }

    return jobs;
  }, [initialJobs, searchTerm, locationFilter, typeFilter, sortByDistance, userLocation]);

  const hasFilters = searchTerm || locationFilter || typeFilter !== 'All' || sortByDistance;

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('All');
    setSortByDistance(false);
    setUserLocation(null);
  };

  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#f8fafc] pb-24 lg:min-h-screen lg:pb-12 font-sans">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b] sm:text-3xl">
            FinderB <span className="text-[#2563eb]">Jobs</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            Positions posted directly by local businesses on FinderB. Always verify the employer
            before sharing personal details.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Job title or company"
                className="w-full rounded-md border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb]"
              />
            </div>
            <div ref={locationRef} className="relative flex-1">
              <MapPin
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#94a3b8]"
              />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setShowCitySuggestions(true);
                }}
                onFocus={() => setShowCitySuggestions(true)}
                placeholder="City or area"
                className="w-full rounded-md border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb]"
              />
              {showCitySuggestions && (
                <div className="absolute top-[calc(100%+4px)] z-30 max-h-56 w-full overflow-y-auto rounded-md border border-gray-100 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      handleGetLocation();
                      setShowCitySuggestions(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1e293b] hover:bg-slate-50"
                  >
                    <Navigation size={14} className="text-[#64748b]" />
                    Use my location
                  </button>
                  {cities
                    .filter((c) => c.name.toLowerCase().includes(locationFilter.toLowerCase()))
                    .slice(0, 8)
                    .map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => {
                          setLocationFilter(city.name);
                          setShowCitySuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-[#64748b] hover:bg-slate-50"
                      >
                        {city.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {JOB_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === type
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : 'border-gray-200 bg-white text-[#64748b] hover:border-[#2563eb]/30 hover:text-[#2563eb]'
                }`}
              >
                {type}
              </button>
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 text-xs font-medium text-[#64748b] underline underline-offset-2 hover:text-[#2563eb]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-sm text-[#64748b]">
          <span className="font-semibold text-[#1e293b]">{filteredJobs.length}</span> open{' '}
          {filteredJobs.length === 1 ? 'role' : 'roles'}
          {sortByDistance ? ' · sorted by distance' : ''}
        </p>

        <ul className="mt-4 space-y-3">
          {filteredJobs.map((job) => (
            <li
              key={job.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all hover:border-[#2563eb]/20 hover:shadow-md sm:p-5"
            >
              <div className="flex gap-4">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-slate-50">
                  {job.business.profilePictureUrl ? (
                    <Image
                      src={job.business.profilePictureUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#94a3b8]">
                      <Building2 size={18} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-[#1e293b]">
                        {job.title}
                      </h2>
                      <Link
                        href={getBusinessProfilePath(job.business)}
                        className="mt-0.5 inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#2563eb] hover:underline"
                      >
                        {job.business.businessName}
                        {job.business.isVerified && (
                          <span className="text-[10px] font-medium text-[#94a3b8]">· Verified</span>
                        )}
                      </Link>
                    </div>
                    <span className="shrink-0 rounded-full border border-gray-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-[#64748b]">
                      {job.type}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748b]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee size={12} />
                        {job.salary}
                      </span>
                    )}
                    <span suppressHydrationWarning>{timeAgo(job.created_at)}</span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#64748b]">
                    {job.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(job);
                      setIsFormOpen(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1d4ed8]"
                  >
                    Apply
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredJobs.length === 0 && (
          <div className="mt-8 rounded-xl border border-gray-100 bg-white px-6 py-14 text-center">
            <Briefcase size={28} className="mx-auto text-[#cbd5e1]" />
            <p className="mt-3 text-base font-semibold text-[#1e293b]">No matching jobs</p>
            <p className="mt-1 text-sm text-[#64748b]">Try a different city or job type.</p>
          </div>
        )}

        <p className="mt-10 border-t border-gray-100 pt-6 text-xs leading-relaxed text-[#64748b]">
          FinderB lists jobs posted by merchants on our platform. We do not guarantee hiring outcomes.
          Never pay for a job offer, interview slot, or training. Report suspicious listings to{' '}
          <a href="mailto:support@finderb.com" className="text-[#2563eb] hover:underline">
            support@finderb.com
          </a>
          .
        </p>
      </div>

      {isFormOpen && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-xl bg-white sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <p className="text-xs text-neutral-500">Apply for</p>
                <h2 className="font-[family-name:var(--font-outfit)] text-lg font-semibold text-neutral-900">
                  {selectedJob.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-5 py-5">
              <p className="mb-5 text-xs leading-relaxed text-neutral-500">
                Do not share OTPs, bank details, or upfront payments. Verify the employer
                independently.
              </p>
              <JobApplicationForm
                job={selectedJob}
                onSuccess={() => setTimeout(() => setIsFormOpen(false), 2000)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
