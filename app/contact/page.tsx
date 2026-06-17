'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, CreditCard, MessageSquare } from 'lucide-react';
import { LEGAL_COMPANY, LEGAL_FOOTER_LINKS } from '@/lib/legalContent';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      <main className="flex-1 pt-24 lg:pt-32 pb-24">
        <section className="px-4 mb-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm">
              Get In Touch
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-[1.05]">
              Contact Us
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              Have questions about listings, subscriptions, payments, or refunds? Our team is here to
              help.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 mb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-primary mb-2">{LEGAL_COMPANY.brand}</h2>
                <p className="text-gray-500">
                  A brand of {LEGAL_COMPANY.name}. India&apos;s local business discovery platform
                  for users and merchants.
                </p>
              </div>

              <div className="space-y-6">
                <ContactItem
                  icon={Mail}
                  title="General Support"
                  lines={[LEGAL_COMPANY.email, 'We respond within 1–2 business days']}
                  href={`mailto:${LEGAL_COMPANY.email}`}
                />
                <ContactItem
                  icon={CreditCard}
                  title="Payments & Refunds"
                  lines={[LEGAL_COMPANY.refundsEmail, 'Include your Razorpay payment ID']}
                  href={`mailto:${LEGAL_COMPANY.refundsEmail}`}
                />
                <ContactItem
                  icon={Phone}
                  title="Phone Support"
                  lines={[LEGAL_COMPANY.phoneDisplay, 'Mon–Fri 9 AM – 6 PM IST']}
                  href={`tel:${LEGAL_COMPANY.phone}`}
                />
                <ContactItem
                  icon={MapPin}
                  title="Registered Office"
                  lines={[
                    LEGAL_COMPANY.address.line1,
                    `${LEGAL_COMPANY.address.line2}, ${LEGAL_COMPANY.address.country} – ${LEGAL_COMPANY.address.pincode}`,
                  ]}
                />
                <ContactItem
                  icon={Clock}
                  title="Business Hours"
                  lines={[
                    LEGAL_COMPANY.businessHours.weekdays,
                    LEGAL_COMPANY.businessHours.saturday,
                    LEGAL_COMPANY.businessHours.sunday,
                  ]}
                />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={18} className="text-primary" />
                  <h3 className="font-bold text-primary">Grievance Officer</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  For privacy or consumer grievances, write to{' '}
                  <a
                    href={`mailto:${LEGAL_COMPANY.grievanceOfficer.email}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {LEGAL_COMPANY.grievanceOfficer.email}
                  </a>
                  . We aim to respond {LEGAL_COMPANY.grievanceOfficer.responseTime}.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 md:p-10">
              <h2 className="text-2xl font-black text-primary mb-6">Send us a Message</h2>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="First Name" placeholder="Your first name" />
                  <Field label="Last Name" placeholder="Your last name" />
                </div>
                <Field label="Email" type="email" placeholder="your@email.com" />
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">Subject</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors">
                    <option>General Inquiry</option>
                    <option>Business Registration</option>
                    <option>Payment / Subscription Issue</option>
                    <option>Refund Request</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">Message</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4">
          <div className="rounded-2xl border border-gray-100 bg-slate-50 p-6 md:p-8">
            <h2 className="text-sm font-black uppercase tracking-wider text-primary mb-4">
              Legal & policy pages
            </h2>
            <nav aria-label="Legal pages">
              <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
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
          </div>
        </section>
      </main>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  title,
  lines,
  href,
}: {
  icon: typeof Mail;
  title: string;
  lines: string[];
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-bold text-primary mb-1">{title}</h3>
        {lines.map((line, index) =>
          index === 0 && href ? (
            <a key={line} href={href} className="text-gray-700 hover:text-primary hover:underline">
              {line}
            </a>
          ) : (
            <p key={line} className={index === 0 ? 'text-gray-700' : 'text-sm text-gray-500'}>
              {line}
            </p>
          )
        )}
      </div>
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
      <label className="block text-sm font-bold text-primary mb-2">{label}</label>
      <input
        type={type}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}
