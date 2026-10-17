import { Fragment } from 'react';
import { Leaf, ShieldCheck, Star, TrendingUp, Zap } from 'lucide-react';
import { LivingFire } from '@/components/business/LivingFire';
import { BADGE_HINT, BADGE_LABEL, isBadgeId, type BadgeId, type PublicBadge } from '@/lib/businessBadges';

const MARK: Record<Exclude<BadgeId, 'trusted' | 'bestInCategory'>, { icon: typeof Zap; iconClass: string; delay: string }> = {
  quickReply: { icon: Zap, iconClass: 'text-emerald-600', delay: '0ms' },
  highlyRated: { icon: Star, iconClass: 'fill-amber-400 text-amber-500', delay: '0.45s' },
  popularMonth: { icon: TrendingUp, iconClass: 'text-rose-600', delay: '0.9s' },
  newOnFinderB: { icon: Leaf, iconClass: 'text-teal-700', delay: '1.35s' },
};

export function PublicBadgeChip({ id, large = false }: { id: BadgeId; large?: boolean }) {
  if (id === 'trusted') {
    return (
      <span
        title={BADGE_HINT.trusted}
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#12263A] text-white ${
          large ? 'py-1 pl-1 pr-3 text-[13px]' : 'py-[3px] pl-[3px] pr-2.5 text-[12px]'
        }`}
      >
        <span
          className={`flex items-center justify-center rounded-full bg-[#C6A15B] text-[#12263A] ${
            large ? 'h-5 w-5' : 'h-[18px] w-[18px]'
          }`}
        >
          <ShieldCheck size={large ? 13 : 11} strokeWidth={2.6} aria-hidden />
        </span>
        <span className="font-semibold tracking-tight">
          FinderB <span className="font-medium text-[#F3E2B3]">Trusted</span>
        </span>
      </span>
    );
  }

  if (id === 'bestInCategory') {
    return (
      <span
        title={BADGE_HINT.bestInCategory}
        className={`inline-flex items-center gap-1 font-semibold tracking-tight text-stone-700 ${
          large ? 'text-[13px]' : 'text-[12px]'
        }`}
      >
        <LivingFire />
        {BADGE_LABEL.bestInCategory}
      </span>
    );
  }

  const mark = MARK[id];
  const Icon = mark.icon;
  return (
    <span
      title={BADGE_HINT[id]}
      className={`inline-flex items-center gap-1 font-semibold tracking-tight text-stone-700 ${
        large ? 'text-[13px]' : 'text-[12px]'
      }`}
    >
      <Icon size={large ? 15 : 13} className={mark.iconClass} strokeWidth={2.25} aria-hidden />
      <span className="badge-shine" style={{ animationDelay: mark.delay }}>
        {BADGE_LABEL[id]}
      </span>
    </span>
  );
}

export function PublicBadgeRow({ badges }: { badges?: PublicBadge[] | null }) {
  const visible = (badges || []).filter((badge) => isBadgeId(badge.id) && badge.id !== 'bestInCategory');
  if (!visible.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {visible.map((badge, index) => (
        <Fragment key={badge.id}>
          {index > 0 ? (
            <span className="select-none text-[11px] font-light leading-none text-stone-300" aria-hidden>
              |
            </span>
          ) : null}
          <PublicBadgeChip id={badge.id} />
        </Fragment>
      ))}
    </div>
  );
}
