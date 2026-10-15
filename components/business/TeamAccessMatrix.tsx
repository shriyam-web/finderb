'use client';

import {
  TEAM_TABS,
  type TeamAccessMap,
  type TeamTabKey,
} from '@/lib/businessTeam/teamAccess';

export default function TeamAccessMatrix({
  access,
  onChange,
  disabled,
}: {
  access: TeamAccessMap;
  onChange: (next: TeamAccessMap) => void;
  disabled?: boolean;
}) {
  const setRight = (key: TeamTabKey, field: 'view' | 'edit', value: boolean) => {
    const tab = TEAM_TABS.find((item) => item.key === key);
    const current = access[key];
    const next = { ...access };
    if (field === 'edit') {
      next[key] = {
        view: value ? true : current.view,
        edit: Boolean(tab?.allowsEdit && value),
      };
    } else {
      next[key] = {
        view: value,
        edit: value ? current.edit : false,
      };
    }
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="grid grid-cols-[1fr_72px_72px] bg-[#153551] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
        <span>Tab</span>
        <span className="text-center">View</span>
        <span className="text-center">Edit</span>
      </div>
      {TEAM_TABS.map((tab) => {
        const row = access[tab.key];
        return (
          <label
            key={tab.key}
            className="grid grid-cols-[1fr_72px_72px] items-center border-t border-zinc-100 bg-white px-4 py-3"
          >
            <span>
              <span className="block text-sm font-semibold text-zinc-900">{tab.label}</span>
              <span className="mt-0.5 block text-xs text-zinc-500">{tab.hint}</span>
            </span>
            <span className="flex justify-center">
              <input
                type="checkbox"
                checked={row.view}
                disabled={disabled}
                onChange={(event) => setRight(tab.key, 'view', event.target.checked)}
                className="h-4 w-4 accent-[#215481]"
              />
            </span>
            <span className="flex justify-center">
              {tab.allowsEdit ? (
                <input
                  type="checkbox"
                  checked={row.edit}
                  disabled={disabled || !row.view}
                  onChange={(event) => setRight(tab.key, 'edit', event.target.checked)}
                  className="h-4 w-4 accent-[#E8873A]"
                />
              ) : (
                <span className="text-[11px] text-zinc-400">—</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
