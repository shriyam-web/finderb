import type { SiteRuntime } from '@/lib/siteRuntime';

function formatWindow(value: string | null): string | null {
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

export default function MaintenanceScreen({ runtime }: { runtime: SiteRuntime }) {
  const from = formatWindow(runtime.startedAt || runtime.updatedAt);
  const until = formatWindow(runtime.until);

  return (
    <main className="min-h-full flex flex-col items-center justify-center px-6 py-16 bg-[#f7f6f3] text-[#111827]">
      <div className="w-full max-w-lg text-center">
        <img
          src="/logo1.png"
          alt="FinderB"
          width={180}
          height={48}
          className="mx-auto mb-10 h-12 w-auto text-only-keep"
        />
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#6b7280]">
          Under maintenance
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">FinderB will be back shortly</h1>
        <p className="mt-4 text-[15px] leading-7 text-[#4b5563]">{runtime.message}</p>
        {(from || until) && (
          <div className="mt-8 rounded-2xl border border-[#e7e5e4] bg-white px-5 py-4 text-sm text-[#374151]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              Maintenance window
            </p>
            <p className="mt-2 leading-6">
              {from ? `From ${from}` : 'In progress'}
              {until ? <><br />Until {until} IST</> : null}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
