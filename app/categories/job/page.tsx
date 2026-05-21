import { getAllJobs } from '@/app/actions/job';
import { getCategories } from '@/app/actions/category';
import { Filter, MapPin, Briefcase, IndianRupee, Clock, AlertTriangle, Search, Building2, Info } from 'lucide-react';
import JobPortalClient from './JobPortalClient';

export default async function JobPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const { success, jobs } = await getAllJobs();
  const { categories } = await getCategories();

  if (!success || !jobs) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-gray-500 font-bold">Failed to load jobs. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-12 lg:pt-32 font-sans selection:bg-blue-100 selection:text-blue-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        .google-sans { font-family: 'Outfit', 'Google Sans', sans-serif; }
      `}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 google-sans">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
            Find Your <span className="text-blue-600">Dream Job</span>
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-2xl mx-auto">
            Discover opportunities from verified merchants in your city.
          </p>
        </div>

        {/* Disclaimer Notice - Point by point */}
        <div className="mb-8 bg-amber-50 border border-amber-100 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <h4 className="font-bold text-amber-900 text-sm">Safety & Transparency Notice</h4>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {[
              "FinderB is a discovery platform; we don't verify individual job conditions.",
              "Jobs are posted directly by independent merchants.",
              "Never pay any amount for a job offer or interview.",
              "Do not share OTPs, bank details, or personal sensitive info."
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-amber-800 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <JobPortalClient initialJobs={jobs} />
      </div>
    </div>
  );
}
