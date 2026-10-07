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
    <div className="h-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <HiOutlineClipboardDocumentList size={20} className="mt-0.5 shrink-0 text-violet-700" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Your business profile is {completionPercent}% complete</p>
            <p className="mt-0.5 text-xs leading-relaxed text-violet-900/90">
              {fields.length} detail{fields.length > 1 ? 's are' : ' is'} missing. Complete profiles get more
              enquiries.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {fields.slice(0, VISIBLE_FIELDS).map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => field.settingsKey && onOpenField(field.settingsKey)}
                  className="rounded-md border border-violet-200 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-violet-900 hover:bg-white"
                >
                  {field.label}
                </button>
              ))}
              {hidden > 0 ? (
                <span className="px-1 py-0.5 text-[11px] font-medium text-violet-800">+{hidden} more</span>
              ) : null}
            </div>
          </div>
        </div>
        {first?.settingsKey ? (
          <button
            type="button"
            onClick={() => onOpenField(first.settingsKey as string)}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#153551] px-4 py-2 text-sm font-semibold text-white hover:bg-[#215481]"
          >
            Complete profile
          </button>
        ) : null}
      </div>
    </div>
  );
}
