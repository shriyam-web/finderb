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
const CARD_H = 1920;
const FONT = 'Inter';
const BLUE = '#153551';
const BLUE_MID = '#215481';
const ORANGE = '#E8873A';
const MUTED = '#5E6E80';
const LINE = '#E7EEF5';

function drawLockup(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  y: number,
  mark: number,
  wordSize: number,
) {
  const label = 'Business';
  const pipe = '|';
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `500 ${Math.round(wordSize * 0.92)}px ${FONT}`;
  const pipeW = ctx.measureText(pipe).width;
  ctx.font = `700 ${wordSize}px ${FONT}`;
  const wordW = ctx.measureText(label).width;
  const gap = Math.round(mark * 0.14);
  const logoW = logo ? mark : 0;
  const x = (CARD_W - (logoW + gap + pipeW + gap + wordW)) / 2;
  if (logo) ctx.drawImage(logo, x, y, mark, mark);
  const mid = y + mark / 2;
  ctx.fillStyle = '#8AA0B5';
  ctx.font = `500 ${Math.round(wordSize * 0.92)}px ${FONT}`;
  ctx.fillText(pipe, x + logoW + gap, mid);
  ctx.fillStyle = BLUE;
  ctx.font = `700 ${wordSize}px ${FONT}`;
  ctx.fillText(label, x + logoW + gap + pipeW + gap, mid);
  ctx.restore();
}

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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=720x720&margin=10&data=${encodeURIComponent(reviewUrl)}`;

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = CARD_W;
      canvas.height = CARD_H;
      await readyFonts();
      if (cancelled) return;

      const wash = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      wash.addColorStop(0, '#D7E7F6');
      wash.addColorStop(0.45, '#FFFFFF');
      wash.addColorStop(1, '#FFE4C4');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      ctx.fillStyle = BLUE;
      ctx.fillRect(0, 0, CARD_W, 22);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(0, 22, CARD_W, 12);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(0, CARD_H - 34, CARD_W, 12);
      ctx.fillStyle = BLUE;
      ctx.fillRect(0, CARD_H - 22, CARD_W, 22);

      let logoHeight = 110;
      try {
        const logo = await loadImage('/brands/fb-mark-240.png');
        if (cancelled) return;
        drawLockup(ctx, logo, 96, 122, 54);
        logoHeight = 122;
      } catch {
        ctx.fillStyle = BLUE;
        ctx.font = `700 40px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('FinderB Business', CARD_W / 2, 150);
      }

      const ruleY = 78 + logoHeight + 38;
      ctx.fillStyle = BLUE;
      ctx.fillRect(CARD_W / 2 - 72, ruleY, 72, 4);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(CARD_W / 2, ruleY, 72, 4);

      ctx.textAlign = 'center';
      ctx.fillStyle = BLUE;
      ctx.font = `700 64px ${FONT}`;
      wrapCentered(ctx, businessName, CARD_W / 2, ruleY + 132, 860, 74);

      ctx.fillStyle = MUTED;
      ctx.font = `500 30px ${FONT}`;
      ctx.fillText([category, city].filter(Boolean).join('  ·  ') || 'On FinderB', CARD_W / 2, ruleY + 278);

      const plate = 680;
      const plateX = (CARD_W - plate) / 2;
      const plateY = 690;
      ctx.fillStyle = '#F6F9FC';
      roundRect(ctx, plateX, plateY, plate, plate, 36);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, plateX + 18, plateY + 18, plate - 36, plate - 36, 28);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      roundRect(ctx, plateX + 18, plateY + 18, plate - 36, plate - 36, 28);
      ctx.stroke();
      drawTicks(ctx, plateX + 38, plateY + 38, plate - 76);

      try {
        const qr = await loadImage(qrUrl);
        if (cancelled) return;
        ctx.drawImage(qr, plateX + 70, plateY + 70, plate - 140, plate - 140);
      } catch {
        ctx.fillStyle = MUTED;
        ctx.font = `500 24px ${FONT}`;
        ctx.fillText('QR unavailable', CARD_W / 2, plateY + plate / 2);
      }

      ctx.fillStyle = BLUE;
      ctx.font = `600 36px ${FONT}`;
      ctx.fillText('Scan to leave a review', CARD_W / 2, plateY + plate + 82);
      ctx.fillStyle = MUTED;
      ctx.font = `500 26px ${FONT}`;
      ctx.fillText('Takes less than a minute', CARD_W / 2, plateY + plate + 122);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(180, CARD_H - 210);
      ctx.lineTo(CARD_W - 180, CARD_H - 210);
      ctx.stroke();

      try {
        const footerLogo = await loadImage('/brands/fb-mark-240.png');
        if (cancelled) return;
        drawLockup(ctx, footerLogo, CARD_H - 160, 57, 32);
      } catch {
        ctx.fillStyle = BLUE;
        ctx.font = `600 18px ${FONT}`;
        ctx.fillText('FinderB Business', CARD_W / 2, CARD_H - 92);
      }
      ctx.fillStyle = MUTED;
      ctx.font = `500 24px ${FONT}`;
      ctx.fillText('Verified reviews  ·  finderb.com', CARD_W / 2, CARD_H - 48);
      ctx.textAlign = 'left';

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
            <p className="mt-0.5 text-xs text-zinc-500">Tall 1080×1920 print card. White field, Inter only, FinderB mark.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
            <HiOutlineXMark size={18} />
          </button>
        </div>
        <div className="bg-[#F7F9FC] px-4 py-5">
          <canvas
            ref={canvasRef}
            className="mx-auto h-auto w-full max-w-[300px] rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(21,53,81,0.12)]"
          />
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
            className="flex-[1.2] flex items-center justify-center gap-2 rounded-lg bg-[#215481] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <HiOutlineArrowDownTray size={16} />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

async function readyFonts() {
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load(`500 26px ${FONT}`),
      document.fonts.load(`600 36px ${FONT}`),
      document.fonts.load(`700 64px ${FONT}`),
    ]);
  } catch {
    // Canvas falls back to the system sans if Inter is not ready.
  }
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

function drawTicks(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const arm = 42;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ORANGE;
  tick(ctx, x, y, 1, 1, arm);
  tick(ctx, x + size, y, -1, 1, arm);
  ctx.strokeStyle = BLUE_MID;
  tick(ctx, x, y + size, 1, -1, arm);
  tick(ctx, x + size, y + size, -1, -1, arm);
}

function tick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  arm: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + dx * arm, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dy * arm);
  ctx.stroke();
}

function wrapCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  const lines: string[] = [];
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= 2) {
        lines.push(`${word}…`);
        line = '';
        break;
      }
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
}
