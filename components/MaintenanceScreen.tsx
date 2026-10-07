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
      viewBox="0 0 200 200"
      className="mx-auto mb-8 h-32 w-32 text-only-keep"
      role="img"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="88" fill="#e8f0f6" />
      <g transform="translate(100 100)" fill="#215481">
        <rect x="-7" y="-42" width="14" height="18" rx="3" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(45)" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(90)" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(135)" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(180)" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(225)" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(270)" />
        <rect x="-7" y="-42" width="14" height="18" rx="3" transform="rotate(315)" />
        <circle r="28" />
        <circle r="12" fill="#e8f0f6" />
      </g>
      <g transform="translate(134 128) rotate(-38)" fill="#f69e32">
        <path d="M-17-34h13v11h8v-11h13v20a13 13 0 0 1-13 13h-8a13 13 0 0 1-13-13z" />
        <rect x="-7" y="-4" width="14" height="40" rx="7" />
        <circle cy="38" r="10" />
        <circle cy="38" r="4" fill="#e8f0f6" />
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
