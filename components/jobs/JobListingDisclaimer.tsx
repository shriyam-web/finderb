import { JOB_LISTING_DISCLAIMER } from '@/lib/jobDisclaimer';

export default function JobListingDisclaimer() {
  return (
    <aside className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-stone-700">
      <p className="text-xs font-semibold text-stone-900">{JOB_LISTING_DISCLAIMER.title}</p>
      {JOB_LISTING_DISCLAIMER.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-2 text-xs leading-relaxed">
          {paragraph}
        </p>
      ))}
    </aside>
  );
}
