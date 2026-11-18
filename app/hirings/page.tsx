import Link from 'next/link';
import { LEGAL_COMPANY } from '@/lib/legalContent';

const roles = [
  {
    title: 'Senior Product Designer',
    department: 'Design',
    location: 'Bengaluru, India',
    type: 'Full-time',
  },
  {
    title: 'Full Stack Developer',
    department: 'Engineering',
    location: 'Remote or Mumbai',
    type: 'Full-time',
  },
  {
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Delhi, India',
    type: 'Full-time',
  },
  {
    title: 'Customer Success Lead',
    department: 'Operations',
    location: 'Hyderabad, India',
    type: 'Full-time',
  },
] as const;

const reasons = [
  {
    title: 'Work people actually use',
    text: 'FinderB is how people in India look up a nearby shop or service. The work shows up on a public listing, a search, or a review.',
  },
  {
    title: 'Room to own a problem',
    text: 'Teams are small. A person can take a piece of the product from the first version through to the people who use it.',
  },
  {
    title: 'A clear product',
    text: 'The job is local discovery: help a customer find the right business, and help that business be found.',
  },
] as const;

const benefits = [
  { title: 'Work from anywhere', text: 'Remote-friendly roles, with some jobs based in an Indian city.' },
  { title: 'Health cover', text: 'Medical cover for you and your family on eligible roles.' },
  { title: 'Learning budget', text: 'A yearly amount for courses, books, and conferences.' },
  { title: 'Leave', text: 'A trust-based leave policy. The work matters more than a fixed number of days.' },
] as const;

export default function HiringsPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': roles.map((role) => ({
      '@type': 'JobPosting',
      title: role.title,
      description: `${role.title} at FinderB. ${role.department} team. ${role.location}. ${role.type}.`,
      employmentType: 'FULL_TIME',
      jobLocationType: role.location.startsWith('Remote') ? 'TELECOMMUTE' : undefined,
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: role.location,
          addressCountry: 'IN',
        },
      },
      hiringOrganization: {
        '@type': 'Organization',
        name: LEGAL_COMPANY.brand,
        sameAs: LEGAL_COMPANY.website,
      },
      directApply: false,
    })),
  };

  return (
    <div className="finderb-single-font min-h-[calc(100dvh-6.75rem)] bg-[#fafaf9] lg:min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-20 sm:px-6 lg:pt-32">
        <header className="border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium text-[#215481]">Careers</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Jobs at FinderB
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            FinderB is a local business directory for India. These are the roles open with {LEGAL_COMPANY.name}. Apply from this page if one of them fits.
          </p>
          <div className="mt-6">
            <a
              href="#open-roles"
              className="inline-flex items-center justify-center rounded-lg bg-[#153551] px-5 py-3 text-sm font-semibold text-white hover:bg-[#215481]"
            >
              See open roles
            </a>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Why people join</h2>
          <div className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
            {reasons.map((item) => (
              <div key={item.title} className="py-5">
                <h3 className="text-[15px] font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-neutral-700">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="open-roles" className="mt-12 scroll-mt-28">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Open roles</h2>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            Four roles are open. Each application goes to the FinderB team.
          </p>
          <div className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
            {roles.map((role) => (
              <article key={role.title} className="py-5">
                <h3 className="text-base font-semibold text-neutral-900">{role.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {role.department}
                  <span aria-hidden="true"> · </span>
                  {role.location}
                  <span aria-hidden="true"> · </span>
                  {role.type}
                </p>
                <Link
                  href={`/contact?topic=${encodeURIComponent(role.title)}`}
                  className="mt-3 inline-flex text-sm font-medium text-[#215481] underline underline-offset-2"
                >
                  Apply for {role.title}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">What a role includes</h2>
          <ul className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-700">
            {benefits.map((item) => (
              <li key={item.title}>
                <span className="font-medium text-neutral-900">{item.title}.</span> {item.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">No matching role</h2>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            You can still write. Send a short note and your CV through the contact page, and say which kind of work you want. We keep it for a later opening.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex text-sm font-medium text-[#215481] underline underline-offset-2"
          >
            Send your CV
          </Link>
        </section>
      </main>
    </div>
  );
}
