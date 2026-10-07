import type { SiteRuntime } from '@/lib/siteRuntime';

function formatUntil(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MaintenanceMark() {
  return (
    <svg
      viewBox="0 0 280 180"
      className="mx-auto mb-8 h-36 w-auto text-only-keep"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="m-sky" x1="40" y1="20" x2="240" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d9e7f3" />
          <stop offset="100%" stopColor="#eef4f9" />
        </linearGradient>
        <linearGradient id="m-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9b864" />
          <stop offset="100%" stopColor="#e8811e" />
        </linearGradient>
      </defs>
      <circle cx="140" cy="92" r="78" fill="url(#m-sky)" />
      <circle
        cx="140"
        cy="92"
        r="66"
        fill="none"
        stroke="#215481"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeDasharray="3 7"
      />
      <g transform="translate(168 48)" fill="#215481" fillOpacity="0.18">
        <path d="M18 8a8 8 0 1 0-5.2 12.1L8 24.9 11.1 28l4.8-4.8A8 8 0 0 0 18 8Zm-8 1.8a6.2 6.2 0 1 1 0 12.4 6.2 6.2 0 0 1 0-12.4Z" />
        <circle cx="10" cy="14" r="2.4" fill="#f69e32" fillOpacity="0.9" />
      </g>
      <g transform="translate(86 34)">
        <path
          d="M32 4c-15.5 0-28 12.3-28 27.5C4 50.8 32 84 32 84s28-33.2 28-52.5C60 16.3 47.5 4 32 4Z"
          fill="#215481"
        />
        <circle cx="32" cy="31" r="11" fill="#f7f6f3" />
        <circle cx="32" cy="31" r="5.5" fill="url(#m-gold)" />
      </g>
      <g transform="translate(54 108) rotate(-28)">
        <rect x="18" y="10" width="86" height="14" rx="7" fill="#1a4367" />
        <rect x="0" y="6" width="28" height="22" rx="4" fill="url(#m-gold)" />
        <rect x="6" y="10" width="6" height="14" rx="1" fill="#fff" fillOpacity="0.35" />
        <rect x="14" y="10" width="6" height="14" rx="1" fill="#fff" fillOpacity="0.35" />
        <circle cx="110" cy="17" r="11" fill="#215481" />
        <circle cx="110" cy="17" r="5" fill="#f7f6f3" />
      </g>
      <g transform="translate(198 118)" fill="none" stroke="#215481" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="14" cy="14" r="10" strokeOpacity="0.7" />
        <path d="M14 6.5v3.2M14 18.3v3.2M6.5 14h3.2M18.3 14h3.2" stroke="#f69e32" />
      </g>
    </svg>
  );
}

export default function MaintenanceScreen({ runtime }: { runtime: SiteRuntime }) {
  const until = formatUntil(runtime.until);

  return (
    <main className="maintenance-screen min-h-full flex flex-col items-center justify-center px-6 py-16 bg-[#f7f6f3] text-[#111827]">
      <div className="w-full max-w-lg text-center">
        <img
          src="/logo1.png"
          alt="FinderB"
          width={180}
          height={48}
          className="mx-auto mb-8 h-12 w-auto text-only-keep"
        />
        <MaintenanceMark />
        <h1 className="text-3xl font-semibold tracking-tight">
          FinderB will be back shortly
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#4b5563]">{runtime.message}</p>
        {until ? (
          <div className="mt-8 rounded-2xl border border-[#e7e5e4] bg-white px-5 py-4 text-sm leading-6 text-[#374151]">
            <p className="text-[#9ca3af]">Maintenance window</p>
            <p className="mt-1">Until {until} IST</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
