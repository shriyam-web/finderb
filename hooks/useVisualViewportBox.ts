'use client';

import { useSyncExternalStore } from 'react';

export type VisualViewportBox = { top: number; height: number };

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener('resize', onChange);
  viewport.addEventListener('scroll', onChange);
  return () => {
    viewport.removeEventListener('resize', onChange);
    viewport.removeEventListener('scroll', onChange);
  };
}

function idle() {
  return () => {};
}

function snapshot() {
  const viewport = window.visualViewport;
  return viewport ? `${viewport.offsetTop}:${viewport.height}` : '';
}

function serverSnapshot() {
  return '';
}

/**
 * The part of the screen the user can actually see. Mobile browsers keep
 * `position: fixed` layers full height when the on-screen keyboard opens,
 * so bottom sheets must be sized to this box to stay above the keyboard.
 */
export function useVisualViewportBox(active: boolean): VisualViewportBox | null {
  const value = useSyncExternalStore(active ? subscribe : idle, snapshot, serverSnapshot);
  if (!active || !value) return null;
  const [top, height] = value.split(':').map(Number);
  return { top, height };
}
