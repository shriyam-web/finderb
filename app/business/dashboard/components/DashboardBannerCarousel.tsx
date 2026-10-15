'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export type DashboardBanner = { id: string; label: string; node: ReactNode };

const ROTATE_MS = 7000;

export default function DashboardBannerCarousel({ banners }: { banners: DashboardBanner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const active = count ? index % count : 0;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;
  if (count === 1) return <div className="mb-6">{banners[0].node}</div>;

  const go = (next: number) => setIndex((next + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Account alerts"
      className="mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Slides share one grid cell so the carousel keeps the height of the tallest banner. */}
      <div className="grid">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${banner.label}`}
            aria-hidden={i !== active}
            inert={i !== active}
            className={`col-start-1 row-start-1 transition-opacity duration-500 ${
              i === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {banner.node}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Previous alert"
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <HiOutlineChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show alert ${i + 1}: ${banner.label}`}
              aria-current={i === active ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-5 bg-zinc-800' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Next alert"
          className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
        >
          <HiOutlineChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
