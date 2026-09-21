'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

type Props = {
  idleDeadlineMs: number | null;
  onExpired?: () => void;
};

export default function SupportSessionBanner({ idleDeadlineMs, onExpired }: Props) {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    if (!idleDeadlineMs) {
      setRemainingSec(null);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.floor((idleDeadlineMs - Date.now()) / 1000));
      setRemainingSec(left);
      if (left <= 0) onExpired?.();
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [idleDeadlineMs, onExpired]);

  if (remainingSec === null) return null;

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timerLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-amber-950">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={2.25} />
      <div className="min-w-0 text-sm leading-relaxed">
        <p className="font-semibold">Support session active</p>
        <p className="mt-0.5 text-amber-900/80">
          This merchant panel was opened by FinderB Admin. It ends after{' '}
          <strong>15 minutes of inactivity</strong>. Idle timer:{' '}
          <span className="font-mono font-semibold tabular-nums">{timerLabel}</span>
        </p>
      </div>
    </div>
  );
}
