'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineArrowDownTray, HiOutlineShare, HiOutlineXMark } from 'react-icons/hi2';
import { buildReviewInviteUrl } from '@/lib/reviewInvite';

type FinderBQrStudioProps = {
  businessName: string;
  category?: string | null;
  city?: string | null;
  business: {
    id: string;
    slug?: string | null;
    name?: string | null;
    businessName?: string | null;
    displayName?: string | null;
    city?: string | null;
  };
  onClose: () => void;
};

const CARD_W = 1080;
const CARD_H = 1350;

export default function FinderBQrStudio({
  businessName,
  category,
  city,
  business,
  onClose,
}: FinderBQrStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const reviewUrl = useMemo(() => buildReviewInviteUrl(business), [business]);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=8&data=${encodeURIComponent(reviewUrl)}`;

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = CARD_W;
      canvas.height = CARD_H;

      const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      bg.addColorStop(0, '#0b1f33');
      bg.addColorStop(0.45, '#153551');
      bg.addColorStop(1, '#215481');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      ctx.fillStyle = 'rgba(249, 212, 138, 0.14)';
      ctx.beginPath();
      ctx.arc(980, 120, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(80, 1280, 260, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f9d48a';
      ctx.font = '700 28px Inter, Arial, sans-serif';
      ctx.fillText('FINDERB', 80, 110);
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = '500 22px Inter, Arial, sans-serif';
      ctx.fillText('Trusted local businesses of India', 80, 148);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 64px Inter, Arial, sans-serif';
      wrapText(ctx, businessName, 80, 280, 920, 72);

      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = '600 28px Inter, Arial, sans-serif';
      ctx.fillText([category, city].filter(Boolean).join('  ·  ') || 'On FinderB', 80, 430);

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 90, 500, 900, 620, 36);
      ctx.fill();

      const qr = await loadImage(qrUrl);
      if (cancelled) return;
      ctx.drawImage(qr, 290, 540, 500, 500);

      ctx.fillStyle = '#153551';
      ctx.font = '700 30px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to review us on FinderB', CARD_W / 2, 1080);
      ctx.textAlign = 'left';

      ctx.fillStyle = 'rgba(255,255,255,0.86)';
      ctx.font = '600 26px Inter, Arial, sans-serif';
      ctx.fillText('This business is live on FinderB', 80, 1220);
      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      ctx.font = '500 22px Inter, Arial, sans-serif';
      ctx.fillText('finderb.com', 80, 1260);

      if (!cancelled) setReady(true);
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [businessName, category, city, qrUrl]);

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    const href = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = href;
    a.download = `${slugify(businessName)}-finderb-review-qr.png`;
    a.click();
    setBusy(false);
  };

  const share = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'finderb-qr.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `${businessName} on FinderB`,
          text: `Please review ${businessName} on FinderB: ${reviewUrl}`,
          url: reviewUrl,
          files: [new File([blob], 'finderb-qr.png', { type: 'image/png' })],
        });
      } else {
        await navigator.clipboard.writeText(`Please review ${businessName} on FinderB: ${reviewUrl}`);
        window.alert('Review link copied. Share it on WhatsApp or SMS.');
      }
    } catch {
      await navigator.clipboard.writeText(reviewUrl);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">FinderB review card</h3>
            <p className="mt-0.5 text-xs text-zinc-500">High-quality 1080×1350 image. Print it or send the review link.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
            <HiOutlineXMark size={18} />
          </button>
        </div>
        <div className="px-4 py-4">
          <canvas ref={canvasRef} className="mx-auto h-auto w-full max-w-[340px] rounded-xl border border-zinc-200 bg-[#12324c]" />
          <p className="mt-3 break-all text-center text-[11px] text-zinc-500">{reviewUrl}</p>
        </div>
        <div className="flex gap-2 border-t border-zinc-100 px-4 py-3">
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => void share()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-semibold text-zinc-800 disabled:opacity-50"
          >
            <HiOutlineShare size={16} />
            Share link
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => void download()}
            className="flex flex-[1.2] items-center justify-center gap-2 rounded-lg bg-[#215481] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <HiOutlineArrowDownTray size={16} />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let top = y;
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, top);
      line = word;
      top += lineHeight;
      lines += 1;
      if (lines >= 2) {
        ctx.fillText(`${word}…`, x, top);
        return;
      }
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, top);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
}
