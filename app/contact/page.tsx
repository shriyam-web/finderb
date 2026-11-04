'use client';

import Link from 'next/link';
import { LEGAL_FOOTER_LINKS, LEGAL_LAST_UPDATED } from '@/lib/legalContent';
import { useSiteContact } from '@/components/SiteConfigProvider';

export default function ContactPage() {
  const contact = useSiteContact();
  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#fafaf9] lg:min-h-screen">
      <main className="mx-auto max-w-5xl px-5 pt-28 pb-20 sm:px-6 lg:pt-32">
        <header className="mb-10 max-w-2xl border-b border-neutral-200 pb-8">
          <p className="text-sm text-neutral-500">{contact.brand}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-[2rem]">
            Contact us
          </h1>
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            Questions about listings, subscriptions, payments, or refunds — write to us and we&apos;ll
            get back within 1–2 business days.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="max-w-md space-y-8 text-[15px] leading-7 text-neutral-700">
            <div>
              <p className="font-medium text-neutral-900">{contact.companyName}</p>
              <p className="mt-1 text-neutral-600">
                {contact.brand} is operated by {contact.companyName}.
              </p>
            </div>

            <dl className="space-y-5">
              <div>
                <dt className="text-sm font-medium text-neutral-900">Email</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                  >
                    {contact.email}
                  </a>
                </dd>
              </div>
              {contact.showPhone ? (
                <div>
                  <dt className="text-sm font-medium text-neutral-900">Phone</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                    >
                      {contact.phoneDisplay}
                    </a>
                  </dd>
                </div>
              ) : null}
              {contact.showAddress ? (
                <div>
                  <dt className="text-sm font-medium text-neutral-900">Office</dt>
                  <dd className="mt-0.5">
                    {contact.addressLine1}
                    <br />
                    {contact.addressLine2}, {contact.country} {contact.pincode}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sm font-medium text-neutral-900">Hours</dt>
                <dd className="mt-0.5 space-y-0.5">
                  <p>{contact.hoursWeekdays}</p>
                  <p>{contact.hoursSaturday}</p>
                  <p>{contact.hoursSunday}</p>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-900">Grievance officer</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${contact.grievanceEmail}`}
                    className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                  >
                    {contact.grievanceEmail}
                  </a>
                  <span className="block text-sm text-neutral-500">
                    {contact.grievanceName}. Response {contact.grievanceResponse}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-900">Send a message</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Or email us directly at {contact.email}
            </p>

            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" placeholder="Rahul" />
                <Field label="Last name" placeholder="Sharma" />
              </div>
              <Field label="Email" type="email" placeholder="you@example.com" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">Subject</label>
                <select className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500">
                  <option>General enquiry</option>
                  <option>Business listing</option>
                  <option>Payment or subscription</option>
                  <option>Refund request</option>
                  <option>Technical issue</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">Message</label>
                <textarea
                  rows={5}
                  className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-500"
                  placeholder="What do you need help with?"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Send message
              </button>
            </form>
          </div>
        </div>

        <footer className="mt-14 max-w-2xl border-t border-neutral-200 pt-8">
          <p className="text-sm font-medium text-neutral-800">Policy pages</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_FOOTER_LINKS.filter((l) => l.href !== '/contact').map((link) => (
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
          <p className="mt-6 text-xs text-neutral-400">Last updated {LEGAL_LAST_UPDATED}</p>
        </footer>
      </main>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</label>
      <input
        type={type}
        className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
        placeholder={placeholder}
      />
    </div>
  );
}
