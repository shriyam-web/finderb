import { getAllJobs } from '@/app/actions/job';
import JobPortalClient from './JobPortalClient';
import { buildPageMetadata } from '@/lib/seoUtils';

/** Public job list refreshes within 15 minutes. A business posting from the site still updates it immediately. */
export const revalidate = 900;

export const metadata = buildPageMetadata({
  title: 'Jobs',
  description: 'Find jobs posted by verified local businesses on FinderB.',
  canonicalPath: '/categories/job',
});

export default async function JobPortalPage() {
  const { success, jobs } = await getAllJobs();

  if (!success || !jobs) {
    return (
      <div className="min-h-[calc(100dvh-6.75rem)] bg-[#f8fafc] pb-24 lg:min-h-screen lg:pb-12">
        <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-sm text-[#64748b]">Could not load jobs. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return <JobPortalClient initialJobs={jobs} />;
}
