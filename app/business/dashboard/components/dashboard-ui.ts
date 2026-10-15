/** Shared FinderB merchant dashboard surface tokens */
export const dashboard = {
  canvas: 'merchant-dashboard-canvas',
  /** Primary content block — use sparingly (one per major area) */
  panel: 'rounded-lg border border-zinc-200 bg-white',
  panelHover: 'transition-colors hover:border-zinc-300',
  /** List / table container */
  surface: 'overflow-hidden rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100',
  accentBar: 'h-0.5 w-full bg-gradient-to-r from-[#f9b864] via-zinc-500 to-zinc-400',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 active:scale-[0.98]',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50',
  tabEnter: 'merchant-dashboard-tab-enter',
  segmentGroup: 'inline-flex gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5',
  segmentBtn: 'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
  segmentActive: 'bg-white text-zinc-800 shadow-sm',
  segmentInactive: 'text-zinc-500 hover:text-zinc-800',
  sectionTitle: 'text-sm font-semibold text-zinc-900',
  sectionDesc: 'mt-0.5 text-xs text-zinc-500',
  emptyState: 'flex flex-col items-center justify-center px-6 py-12 text-center',
} as const;
