import Link from 'next/link';
import Image from 'next/image';
import { Building2, Clock3, ShieldCheck } from 'lucide-react';

export type InactiveListingStub = {
  id: string;
  businessName: string;
  displayName: string;
  city?: string | null;
  status?: string | null;
  slug?: string | null;
  registrationNumber?: string | null;
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
    <main className="relative min-h-[70vh] overflow-hidden bg-[#f6f3ee]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(21,53,81,0.10), transparent 42%), radial-gradient(circle at 88% 12%, rgba(249,184,100,0.18), transparent 36%), linear-gradient(180deg, #f8f5f0 0%, #efeae2 100%)',
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 py-16 sm:py-24 text-center">
        <Link href="/" className="mb-10 inline-flex rounded-xl bg-white px-3 py-2 ring-1 ring-[#d9d2c6]">
          <Image
            src="/businesslogo.png"
            alt="FinderB"
            width={128}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#153551] text-white">
          <Clock3 size={28} strokeWidth={2.25} />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7b68]">
          Listing not public yet
        </p>

        <h1 className="mt-3 font-[family-name:var(--font-outfit)] text-[clamp(1.85rem,4vw,2.6rem)] font-bold leading-[1.1] tracking-tight text-[#153551]">
          {name}&apos;s profile isn&apos;t active
        </h1>

        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#5f564a] sm:text-base">
          This FinderB listing exists, but it is not live for public visitors yet. It may still be
          pending review, waiting for activation, or temporarily inactive.
        </p>

        <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-2 text-left">
          <div className="rounded-2xl border border-[#e2d8cb] bg-white/80 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7b68]">
              Current status
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#153551]">
              <Building2 size={15} className="text-[#8a7b68]" />
              {statusLabel}
            </p>
          </div>
          {listing.registrationNumber ? (
            <div className="rounded-2xl border border-[#e2d8cb] bg-white/80 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7b68]">
                Merchant ID
              </p>
              <p className="mt-1.5 font-mono text-sm font-semibold text-[#153551]">
                {listing.registrationNumber}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e2d8cb] bg-white/80 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7b68]">
                Visibility
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#153551]">Not shown in search</p>
            </div>
          )}
        </div>

        <div className="mt-8 w-full max-w-lg rounded-2xl border border-[#e2d8cb] bg-[#fffaf3] px-5 py-4 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#153551]">
            <ShieldCheck size={16} className="text-[#b8893d]" />
            If you own this business
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5f564a]">
            Sign in to your merchant dashboard to finish setup. Once an admin activates the listing
            (or your account is set to Active), this public profile page will go live automatically.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/business/login"
            className="rounded-full bg-[#153551] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2840]"
          >
            Merchant login
          </Link>
          <Link
            href="/categories"
            className="rounded-full border border-[#d9d2c6] bg-white px-6 py-3 text-sm font-semibold text-[#153551] transition hover:border-[#153551]"
          >
            Browse categories
          </Link>
          <Link
            href="/"
            className="rounded-full px-5 py-3 text-sm font-semibold text-[#6b6155] transition hover:text-[#153551]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
