import Link from 'next/link';
import Image from 'next/image';
import { Clock3, ShieldCheck } from 'lucide-react';

export type InactiveListingStub = {
  id: string;
  businessName: string;
  displayName: string;
  city?: string | null;
  status?: string | null;
  slug?: string | null;
};

type Props = {
  listing: InactiveListingStub;
};

function formatStatus(status?: string | null) {
  const value = (status || 'Pending').trim();
  if (!value) return 'Pending';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function BusinessListingInactivePage({ listing }: Props) {
  const name = listing.displayName || listing.businessName || 'This business';
  const statusLabel = formatStatus(listing.status);

  return (
    <main className="relative min-h-[65vh] overflow-hidden bg-[#f6f3ee]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(21,53,81,0.09), transparent 40%), radial-gradient(circle at 88% 8%, rgba(249,184,100,0.16), transparent 34%), linear-gradient(180deg, #f8f5f0 0%, #efeae2 100%)',
        }}
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center px-5 py-14 sm:py-20 text-center">
        <Link href="/" className="mb-8 inline-flex rounded-xl bg-white px-3 py-2 ring-1 ring-[#d9d2c6]">
          <Image
            src="/brands/fb-mark-240.png"
            alt="FinderB"
            width={36}
            height={36}
            className="h-9 w-9"
            priority
          />
        </Link>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#153551] text-white shadow-[0_10px_28px_rgba(21,53,81,0.18)]">
          <Clock3 size={22} strokeWidth={2.25} />
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7b68]">
          Listing not public yet
        </p>

        <h1 className="mt-2 font-[family-name:var(--font-outfit)] text-[clamp(1.55rem,4vw,2rem)] font-bold leading-[1.15] tracking-tight text-[#153551]">
          {name}
        </h1>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e2d8cb] bg-white/90 px-3.5 py-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a7b68]">
            Status
          </span>
          <span className="text-sm font-semibold text-[#153551]">{statusLabel}</span>
        </div>

        <div className="mt-7 w-full rounded-2xl border border-[#e2d8cb] bg-[#fffaf3] px-4 py-4 text-left shadow-[0_8px_24px_rgba(21,53,81,0.05)]">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#153551]">
            <ShieldCheck size={16} className="shrink-0 text-[#b8893d]" />
            If you own this business
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5f564a]">
            Your profile will be activated within a maximum of 24 hours after review.
          </p>
          <Link
            href="/business/login"
            className="mt-3.5 inline-flex rounded-full bg-[#153551] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0f2840]"
          >
            Merchant login
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link href="/categories" className="font-semibold text-[#153551] hover:underline">
            Browse categories
          </Link>
          <span className="text-[#c4b9a8]" aria-hidden>
            ·
          </span>
          <Link href="/" className="font-semibold text-[#6b6155] hover:text-[#153551]">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
