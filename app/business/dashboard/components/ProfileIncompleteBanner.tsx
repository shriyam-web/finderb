'use client';

import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import type { MissingProfileField } from '@/lib/dashboard/profileCompletion';

const VISIBLE_FIELDS = 4;

type ProfileIncompleteBannerProps = {
  fields: MissingProfileField[];
  completionPercent: number;
  onOpenField: (settingsKey: string) => void;
};

export default function ProfileIncompleteBanner({
  fields,
  completionPercent,
  onOpenField,
}: ProfileIncompleteBannerProps) {
  const first = fields.find((field) => field.settingsKey);
  const hidden = fields.length - VISIBLE_FIELDS;

  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-violet-300/70 bg-gradient-to-br from-[#EDE4FF] via-[#C4B0F5] to-[#A78BFA] px-4 py-3 text-violet-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div className="pointer-events-none absolute right-8 top-[-30px] h-24 w-24 rotate-45 rounded-2xl bg-white/25" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/20" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HiOutlineClipboardDocumentList size={20} className="mt-0.5 shrink-0 text-violet-800" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Your business profile is {completionPercent}% complete</p>
            <p className="mt-0.5 text-xs leading-relaxed text-violet-950/80">
              {fields.length} detail{fields.length > 1 ? 's are' : ' is'} missing. Complete profiles get more
              enquiries.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {fields.slice(0, VISIBLE_FIELDS).map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => field.settingsKey && onOpenField(field.settingsKey)}
                  className="rounded-md border border-violet-800/15 bg-white/55 px-2 py-0.5 text-[11px] font-medium text-violet-950 hover:bg-white"
                >
                  {field.label}
                </button>
              ))}
              {hidden > 0 ? (
                <span className="px-1 py-0.5 text-[11px] font-medium text-violet-900">+{hidden} more</span>
              ) : null}
            </div>
          </div>
        </div>
        {first?.settingsKey ? (
          <button
            type="button"
            onClick={() => onOpenField(first.settingsKey as string)}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Complete profile
          </button>
        ) : null}
      </div>
    </div>
  );
}
