'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

const COPY: Record<Mode, { title: string; line: string; business: string; businessHref: string }> = {
  login: {
    title: 'Sign in to FinderB',
    line: 'Use your own account to save places, reviews, and messages.',
    business: 'Sign in as a business',
    businessHref: '/business/login',
  },
  signup: {
    title: 'Create your FinderB account',
    line: 'Your own profile is for finding places and keeping them saved.',
    business: 'Register a business',
    businessHref: '/business/register',
  },
};

export default function AuthIntentModal({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-end justify-center bg-[#0f273b]/45 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-intent-title"
        className="w-full max-w-[380px] rounded-[1.35rem] border border-white/80 bg-white px-6 pb-6 pt-7 shadow-[0_28px_80px_-36px_rgba(15,39,59,0.55)]"
      >
        <Image
          src="/brands/finderb-logo.png"
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 object-contain"
        />
        <h2 id="auth-intent-title" className="mt-4 text-[1.55rem] font-bold leading-tight tracking-tight text-[#0f273b]">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{copy.line}</p>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-6 w-full rounded-full bg-[#215481] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1a4367]"
        >
          Continue as User
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={() => router.push(copy.businessHref)}
            className="font-semibold text-[#215481] hover:text-[#1a4367]"
          >
            {copy.business}
          </button>
        </p>
      </div>
    </div>,
    document.body,
  );
}
