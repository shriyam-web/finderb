'use client';

import { useMemo, useState } from 'react';
import FormattedAbout from '@/components/business/FormattedAbout';
import { previewAboutMarkup } from '@/lib/businessAbout';

type BusinessProfileAboutSectionProps = {
  description: string;
  keywords?: string[];
  withTopRule?: boolean;
};

export default function BusinessProfileAboutSection({
  description,
  keywords = [],
}: BusinessProfileAboutSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const trimmedDescription = description.trim();
  const preview = previewAboutMarkup(trimmedDescription);
  const aboutLong = preview.truncated;
  const shown = expanded || !aboutLong ? trimmedDescription : preview.text;

  const tags = useMemo(
    () => keywords.map((keyword) => keyword.trim()).filter(Boolean).slice(0, 6),
    [keywords]
  );

  if (!trimmedDescription && tags.length === 0) return null;

  return (
    <section id="about" className="scroll-mt-40 px-4 pt-6">
      <h2 className="text-[20px] font-extrabold tracking-tight text-[#153551]">About</h2>
      <div className="mt-3 rounded-2xl border border-stone-200/90 bg-stone-50 p-4">
        {trimmedDescription ? (
          <>
            <p className="-mb-2 text-[42px] font-extrabold leading-none text-[#d4a017]">“</p>
            <p className="text-[15px] leading-6 text-stone-600">
              <FormattedAbout text={shown} />
            </p>
            {aboutLong ? (
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="mt-2 text-sm font-semibold text-[#215481]"
              >
                {expanded ? 'Show less' : 'Continue reading'}
              </button>
            ) : null}
          </>
        ) : null}
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((keyword) => (
              <span key={keyword} className="text-xs font-medium text-amber-800">
                #{keyword.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
