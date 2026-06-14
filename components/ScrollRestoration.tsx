'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const scrollStore = new Map<string, number>();
let pendingPopState = false;

function buildScrollKey(pathname: string, search: string, hash: string) {
  return `${pathname}${search ? `?${search}` : ''}${hash}`;
}

function persistScroll(key: string, y: number) {
  scrollStore.set(key, y);
  try {
    sessionStorage.setItem(`finderb-scroll:${key}`, String(Math.round(y)));
  } catch {
    // sessionStorage may be unavailable in private mode
  }
}

function readScroll(key: string): number | undefined {
  if (scrollStore.has(key)) {
    return scrollStore.get(key);
  }
  try {
    const stored = sessionStorage.getItem(`finderb-scroll:${key}`);
    if (stored != null) {
      const y = Number.parseInt(stored, 10);
      if (!Number.isNaN(y)) {
        scrollStore.set(key, y);
        return y;
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function restoreScrollPosition(y: number) {
  const attempt = (retries = 0) => {
    window.scrollTo({ top: y, left: 0, behavior: 'auto' });

    if (retries < 8 && Math.abs(window.scrollY - y) > 2) {
      window.setTimeout(() => attempt(retries + 1), 50 * (retries + 1));
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => attempt());
  });
}

function scrollToHash(hash: string) {
  if (!hash || hash === '#') return;
  const id = hash.slice(1);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ block: 'start' });
  }
}

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKeyRef = useRef('');

  useEffect(() => {
    const onPopState = () => {
      pendingPopState = true;
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const key = buildScrollKey(pathname, search, window.location.hash);
      persistScroll(key, window.scrollY);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const key = buildScrollKey(pathname, search, window.location.hash);
      persistScroll(key, window.scrollY);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, search]);

  useLayoutEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const key = buildScrollKey(pathname, search, hash);
    const previousKey = routeKeyRef.current;

    if (previousKey && previousKey !== key) {
      persistScroll(previousKey, window.scrollY);
    }

    if (pendingPopState) {
      const saved = readScroll(key);
      if (saved != null && saved > 0) {
        restoreScrollPosition(saved);
      } else if (hash) {
        scrollToHash(hash);
      }
      pendingPopState = false;
    } else if (hash) {
      scrollToHash(hash);
    }

    routeKeyRef.current = key;

    return () => {
      persistScroll(key, window.scrollY);
    };
  }, [pathname, search]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const hash = window.location.hash;
      const key = buildScrollKey(pathname, search, hash);
      const saved = readScroll(key);
      if (saved != null && saved > 0) {
        restoreScrollPosition(saved);
      } else if (hash) {
        scrollToHash(hash);
      }
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [pathname, search]);

  return null;
}
