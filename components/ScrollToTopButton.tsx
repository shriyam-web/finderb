'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

type ScrollToTopButtonProps = {
  showBottomNav?: boolean;
};

const SCROLL_THRESHOLD = 320;

export default function ScrollToTopButton({ showBottomNav = false }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed right-4 z-[88] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-[#2563eb] shadow-[0_4px_16px_rgba(15,23,42,0.1)] backdrop-blur-sm transition-all duration-300 hover:border-[#2563eb]/25 hover:bg-white hover:shadow-[0_6px_20px_rgba(37,99,235,0.15)] active:scale-95 ${
        showBottomNav ? 'bottom-[5.75rem] lg:bottom-6' : 'bottom-6'
      } ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
    >
      <ChevronUp size={17} strokeWidth={2.5} />
    </button>
  );
}
