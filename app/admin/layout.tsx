import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | FinderB',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
