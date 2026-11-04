import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEGAL_FOOTER_LINKS, LEGAL_LAST_UPDATED } from '@/lib/legalContent';
import { getSiteConfig } from '@/lib/siteConfig';

type LegalPageLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default async function LegalPageLayout({
  title,
  description,
  children,
}: LegalPageLayoutProps) {
  const contact = (await getSiteConfig()).contact;
  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#fafaf9] lg:min-h-screen">
      <main className="mx-auto max-w-2xl px-5 pt-28 pb-20 sm:px-6 lg:pt-32">
        <header className="mb-10 border-b border-neutral-200 pb-8">
          <p className="text-sm text-neutral-500">{contact.brand}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-base leading-relaxed text-neutral-600">{description}</p>
          ) : null}
          <p className="mt-4 text-sm text-neutral-400">Last updated {LEGAL_LAST_UPDATED}</p>
        </header>

        <article className="space-y-9 text-[15px] leading-7 text-neutral-700">{children}</article>

        <footer className="mt-14 border-t border-neutral-200 pt-8">
          <p className="text-sm font-medium text-neutral-800">Other pages</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
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
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-neutral-400">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export async function LegalContactBox({ note }: { email?: string; phone?: string; note?: string }) {
  const contact = (await getSiteConfig()).contact;
  return (
    <div className="border-l-2 border-neutral-300 pl-4 text-neutral-700">
      <p className="font-medium text-neutral-900">{contact.companyName}</p>
      <p className="mt-2">
        Email:{' '}
        <a href={`mailto:${contact.email}`} className="text-neutral-900 underline underline-offset-2">
          {contact.email}
        </a>
      </p>
      {contact.showPhone ? (
        <p className="mt-1">
          Phone:{' '}
          <a
            href={`tel:${contact.phone.replace(/\s/g, '')}`}
            className="text-neutral-900 underline underline-offset-2"
          >
            {contact.phoneDisplay}
          </a>
        </p>
      ) : null}
      {contact.showAddress ? (
        <p className="mt-1">
          {contact.addressLine1}, {contact.addressLine2}, {contact.country} {contact.pincode}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-neutral-500">
        {contact.hoursWeekdays}. {contact.hoursSaturday}. {contact.hoursSunday}.
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        Grievance officer: {contact.grievanceName} ({contact.grievanceEmail}). {contact.grievanceResponse}.
      </p>
      {note && <p className="mt-2 text-sm text-neutral-500">{note}</p>}
    </div>
  );
}
