import { getAllJobs } from '@/app/actions/job';
import JobPortalClient from './JobPortalClient';

export const metadata = {
  title: 'Jobs',
  description: 'Find jobs posted by verified local businesses on FinderB.',
};

export default async function JobPortalPage() {
  const { success, jobs } = await getAllJobs();

  if (!success || !jobs) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#fafaf9] px-4 pt-28">
        <p className="text-sm text-neutral-600">Could not load jobs. Please try again later.</p>
      </div>
    );
  }

  return <JobPortalClient initialJobs={jobs} />;
}
