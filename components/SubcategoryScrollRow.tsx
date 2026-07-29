'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryIcon from '@/components/CategoryIcon';
import { categoryBrowseHref } from '@/lib/categoryDisplay';

export interface SubcategoryScrollItem {
  id?: string;
  name: string;
  href: string;
  icon: string | null;
}

interface SubcategoryScrollRowProps {
  parent?: { slug?: string | null; name?: string | null };
  /** @deprecated Prefer `parent` + `sub.href` */
  parentId?: string;
  subcategories: SubcategoryScrollItem[];
}

export default function SubcategoryScrollRow({
  parent,
  subcategories,
}: SubcategoryScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [subcategories, updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.65, 120);
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  const scrollButtonClass =
    'md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/30 hover:text-primary';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scroll('left')}
          className={scrollButtonClass}
          aria-label="Scroll subcategories left"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className="min-w-0 flex-1 overflow-x-auto scrollbar-hide"
      >
        <div className="flex flex-nowrap gap-3 sm:gap-4 pb-1">
          {subcategories.map((sub) => {
            const href =
              sub.href ||
              (parent ? categoryBrowseHref(parent, sub) : '/categories');

            return (
              <Link
                key={sub.id ?? sub.name}
                href={href}
                className="group flex w-[4.25rem] sm:w-[5.25rem] shrink-0 flex-col items-center text-center space-y-2"
              >
                <CategoryIcon
                  icon={sub.icon}
                  name={sub.name}
                  size={40}
                  className="h-10 w-10 text-slate-500 transition-colors group-hover:text-primary sm:h-11 sm:w-11"
                  imageClassName="object-contain"
                />
                <span className="line-clamp-2 w-full text-[10px] font-semibold leading-tight text-gray-600 transition-colors group-hover:text-primary sm:text-[11px]">
                  {sub.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scroll('right')}
          className={scrollButtonClass}
          aria-label="Scroll subcategories right"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
