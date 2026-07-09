'use client';

import { useMemo, useState } from 'react';

const COLLAPSED_LINE_COUNT = 4;

type BusinessProfileAboutSectionProps = {
  description: string;
  keywords?: string[];
};

export default function BusinessProfileAboutSection({
  description,
  keywords = [],
}: BusinessProfileAboutSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const trimmedDescription = description.trim();
  const shouldCollapse = useMemo(() => {
    if (!trimmedDescription) return false;
    const lineBreaks = trimmedDescription.split('\n').length;
    return trimmedDescription.length > 220 || lineBreaks > COLLAPSED_LINE_COUNT;
  }, [trimmedDescription]);

  return (
    <section id="about" className="scroll-mt-40 border-t border-stone-200/60 pt-5 lg:border-t-0 lg:pt-0">
      <h2 className="text-base font-semibold text-[#153551]">About</h2>
      {trimmedDescription ? (
        <div className="mt-3">
          <p
            className="text-[15px] leading-7 text-stone-600 whitespace-pre-line"
            style={
              !expanded && shouldCollapse
                ? {
                    display: '-webkit-box',
                    WebkitLineClamp: COLLAPSED_LINE_COUNT,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }
                : undefined
            }
          >
            {trimmedDescription}
          </p>
          {shouldCollapse ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mt-2 text-sm font-medium text-[#215481] hover:underline"
            >
              {expanded ? 'Show less' : '…read more'}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-400">No description added.</p>
      )}
      {keywords.length > 0 ? (
        <p className="mt-4 text-sm text-stone-600">
          <span className="font-medium text-stone-800">Known for:</span> {keywords.join(', ')}
        </p>
      ) : null}
    </section>
  );
}
