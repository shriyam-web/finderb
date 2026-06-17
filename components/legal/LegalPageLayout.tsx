import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEGAL_COMPANY, LEGAL_FOOTER_LINKS, LEGAL_LAST_UPDATED } from '@/lib/legalContent';

type LegalPageLayoutProps = {
  badge?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function LegalPageLayout({
  badge = 'Legal',
  title,
  description,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        <section className="px-4 mb-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
              {badge}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-[1.05]">
              {title}
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 mb-16">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6 py-4 mb-10">
            <p className="text-sm text-gray-500">
              Last updated: <span className="font-semibold text-gray-700">{LEGAL_LAST_UPDATED}</span>
            </p>
          </div>

          <div className="space-y-12 text-gray-700 leading-relaxed">{children}</div>

          <aside className="mt-16 rounded-2xl border border-gray-100 bg-slate-50 p-6 md:p-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-primary mb-4">
              Related policies
            </h2>
            <nav aria-label="Related legal pages">
              <ul className="grid gap-2 sm:grid-cols-2">
                {LEGAL_FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </section>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-black text-primary mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-6 space-y-2">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalContactBox({
  email,
  phone,
  note,
}: {
  email?: string;
  phone?: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 space-y-2 text-gray-700">
      {email && (
        <p>
          <strong>Email:</strong>{' '}
          <a href={`mailto:${email}`} className="text-primary hover:underline">
            {email}
          </a>
        </p>
      )}
      {phone && (
        <p>
          <strong>Phone:</strong>{' '}
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-primary hover:underline">
            {phone}
          </a>
        </p>
      )}
      <p>
        <strong>Address:</strong> {LEGAL_COMPANY.address.line1},{' '}
        {LEGAL_COMPANY.address.line2}, {LEGAL_COMPANY.address.country} –{' '}
        {LEGAL_COMPANY.address.pincode}
      </p>
      {note && <p className="text-sm text-gray-500 pt-1">{note}</p>}
    </div>
  );
}
