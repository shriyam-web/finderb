'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

type TrustItem = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  detail: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const TRUST_ITEMS: TrustItem[] = [
  {
    id: 'verified',
    title: 'Verified Businesses',
    shortTitle: 'Verified\nBusinesses',
    subtitle: 'Authentic & Verified Listings',
    detail:
      'Listings marked verified have passed FinderB checks for business identity and profile completeness. Look for the verified mark on merchant names to spot trusted partners faster.',
    icon: ShieldCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'reviews',
    title: 'Real Customer Reviews',
    shortTitle: 'Real Customer\nReviews',
    subtitle: 'Honest Reviews from Real People',
    detail:
      'Reviews are posted by signed-in FinderB users based on real experiences. Ratings and feedback help you compare merchants before you call or visit.',
    icon: MessageSquare,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'updated',
    title: 'Updated Daily',
    shortTitle: 'Updated\nDaily',
    subtitle: 'Latest Information Always',
    detail:
      'Business profiles, hours, offers, and job openings are refreshed regularly so search results stay current. Merchants can update details anytime from their dashboard.',
    icon: RefreshCw,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    id: 'contact',
    title: 'Instant Contact',
    shortTitle: 'Instant\nContact',
    subtitle: 'Call, Chat or Enquire Directly',
    detail:
      'Reach merchants in one tap — call, WhatsApp, or send an enquiry from the profile. No hunting for numbers across apps; contact options stay on the listing.',
    icon: Phone,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
];

type HomeTrustHighlightsProps = {
  variant?: 'desktop' | 'mobile';
};

function tooltipPositionClass(index: number, total: number) {
  if (index === 0) return 'left-0 translate-x-0';
  if (index === total - 1) return 'right-0 left-auto translate-x-0';
  return 'left-1/2 -translate-x-1/2';
}

function tooltipArrowClass(index: number, total: number) {
  if (index === 0) return 'left-6';
  if (index === total - 1) return 'right-6 left-auto';
  return 'left-1/2 -translate-x-1/2';
}

function TrustItemControl({
  item,
  index,
  total,
  variant,
  activeId,
  setActiveId,
}: {
  item: TrustItem;
  index: number;
  total: number;
  variant: 'desktop' | 'mobile';
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  const open = activeId === item.id;
  const rootRef = useRef<HTMLButtonElement>(null);
  const Icon = item.icon;
  const tooltipId = `trust-tooltip-${item.id}`;

  const show = () => setActiveId(item.id);
  const hide = () => setActiveId(null);
  const toggle = () => setActiveId(open ? null : item.id);

  const tooltip = open ? (
    <div
      id={tooltipId}
      role="tooltip"
      className={`absolute top-[calc(100%+0.4rem)] z-40 w-[min(17.5rem,calc(100vw-1.5rem))] rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-left shadow-md ${tooltipPositionClass(index, total)}`}
    >
      <p className="text-xs font-semibold text-[#153551]">{item.title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-600">{item.detail}</p>
      <span
        className={`absolute -top-1.5 h-2.5 w-2.5 rotate-45 border-l border-t border-stone-200 bg-white ${tooltipArrowClass(index, total)}`}
        aria-hidden
      />
    </div>
  ) : null;

  if (variant === 'mobile') {
    return (
      <div className="relative flex justify-center">
        <button
          ref={rootRef}
          type="button"
          onClick={toggle}
          className="flex w-full flex-col items-center rounded-lg px-0.5 py-1 text-center transition-colors hover:bg-stone-50 active:bg-stone-100"
          aria-label={`About ${item.title}`}
          aria-expanded={open}
          aria-describedby={open ? tooltipId : undefined}
        >
          <div
            className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full ${item.iconBg}`}
          >
            <Icon size={18} className={item.iconColor} />
          </div>
          <p className="whitespace-pre-line text-[9px] font-semibold leading-tight text-[#475569]">
            {item.shortTitle}
          </p>
        </button>
        {tooltip}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        ref={rootRef}
        type="button"
        onFocus={show}
        onBlur={hide}
        onClick={toggle}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none"
        aria-label={`About ${item.title}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}
        >
          <Icon size={20} className={item.iconColor} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#1e293b]">{item.title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#94a3b8]">{item.subtitle}</p>
        </div>
      </button>
      {tooltip}
    </div>
  );
}

export default function HomeTrustHighlights({ variant = 'desktop' }: HomeTrustHighlightsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!activeId) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (sectionRef.current && target && !sectionRef.current.contains(target)) {
        setActiveId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [activeId]);

  if (variant === 'mobile') {
    return (
      <section ref={sectionRef} className="relative z-10 bg-white px-4 pb-2 pt-2">
        <div className="grid grid-cols-4 gap-2">
          {TRUST_ITEMS.map((item, index) => (
            <TrustItemControl
              key={item.id}
              item={item}
              index={index}
              total={TRUST_ITEMS.length}
              variant="mobile"
              activeId={activeId}
              setActiveId={setActiveId}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative z-10 rounded-xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-4 divide-x divide-gray-100 overflow-visible rounded-xl">
        {TRUST_ITEMS.map((item, index) => (
          <TrustItemControl
            key={item.id}
            item={item}
            index={index}
            total={TRUST_ITEMS.length}
            variant="desktop"
            activeId={activeId}
            setActiveId={setActiveId}
          />
        ))}
      </div>
    </section>
  );
}
