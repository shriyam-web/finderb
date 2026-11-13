import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_COMPANY } from '@/lib/legalContent';

const faqs = [
  {
    question: 'What is FinderB?',
    answer:
      'FinderB is a local business directory for India. People use it to find shops, clinics, restaurants, tutors, hotels, and other services near them, and to read reviews before they call or visit. Businesses use it to publish a public listing, collect leads, and ask customers for reviews.',
  },
  {
    question: 'Is a FinderB listing free?',
    answer:
      'A business can create a listing without paying. The public page can show the shop name, category, city, photos, hours, and a way for customers to enquire. Paid plans add tools such as a verified badge, lead contacts, and promoted ads. Pricing is listed on the pricing page.',
  },
  {
    question: 'How do reviews on FinderB work?',
    answer:
      'A customer can leave a star rating and a written review on the business page, or scan the shop’s FinderB review card. The business can reply in public. Reviews stay on the listing so the next person can see what other customers said.',
  },
  {
    question: 'How do I find a business near me?',
    answer:
      'Search by what you need and the place, for example a dentist in your neighbourhood or a restaurant in your city. You can also browse categories, open a city page, or use FinderB AI search to describe the job in a sentence. Each listing shows where the business is and how to contact it.',
  },
  {
    question: 'Who operates FinderB?',
    answer: `${LEGAL_COMPANY.brand} is operated by ${LEGAL_COMPANY.name}. For a listing, a payment, or a privacy question, write to ${LEGAL_COMPANY.email}.`,
  },
] as const;

const pageDescription =
  'FinderB is a local business directory for India. Search verified shops and services, read reviews, and list your own business for free.';

export const metadata: Metadata = {
  title: { absolute: "About FinderB | India's local business directory" },
  description: pageDescription,
  alternates: { canonical: '/about' },
  openGraph: {
    title: "About FinderB | India's local business directory",
    description: pageDescription,
    url: '/about',
    type: 'website',
  },
};

export default function AboutPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        name: 'About FinderB',
        url: 'https://finderb.com/about',
        description: pageDescription,
        isPartOf: { '@type': 'WebSite', name: 'FinderB', url: 'https://finderb.com/' },
        about: {
          '@type': 'Organization',
          name: LEGAL_COMPANY.brand,
          legalName: LEGAL_COMPANY.name,
          url: LEGAL_COMPANY.website,
          email: LEGAL_COMPANY.email,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#fafaf9] lg:min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-20 sm:px-6 lg:pt-32">
        <header className="border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium text-[#215481]">About FinderB</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            A local business directory for India
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            FinderB helps people find a nearby shop or service, and helps that business stay visible
            when someone is already looking. Search by category and city, read what other customers
            wrote, and contact the business from its public page.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">What people use it for</h2>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            Someone looking for a restaurant, a doctor, a hotel, a tutor, a salon, a lawyer, or a
            contractor can search FinderB instead of asking around. A listing shows the business name,
            what it does, the city or neighbourhood, photos, opening hours, and reviews. From there
            they can call, send a message, or visit.
          </p>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            Browse{' '}
            <Link href="/categories" className="font-medium text-[#215481] underline underline-offset-2">
              categories
            </Link>
            , open{' '}
            <Link href="/tourist-places" className="font-medium text-[#215481] underline underline-offset-2">
              tourist places
            </Link>
            , or read the{' '}
            <Link href="/blog" className="font-medium text-[#215481] underline underline-offset-2">
              FinderB blog
            </Link>{' '}
            for local guides. FinderB AI search takes a sentence — “a dentist open on Sunday near me” —
            and looks through live categories.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">What a business gets</h2>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            A shop, clinic, or practice can{' '}
            <Link href="/business/register" className="font-medium text-[#215481] underline underline-offset-2">
              list on FinderB
            </Link>{' '}
            and keep a public page customers can find. The owner adds photos, hours, offers, and the
            details people check before they walk in. Enquiries from that page show up as leads, so the
            business can call or message back.
          </p>
          <ul className="mt-4 space-y-3 text-[15px] leading-7 text-neutral-700">
            <li>
              <span className="font-medium text-neutral-900">A public shop page.</span> Name, category,
              area, photos, hours, and contact choices, in one place.
            </li>
            <li>
              <span className="font-medium text-neutral-900">Reviews and replies.</span> Customers leave
              a rating. The business can answer in public, or share a review card with a QR code.
            </li>
            <li>
              <span className="font-medium text-neutral-900">Leads.</span> When someone uses the listing
              to call, message, or send an enquiry, the business sees it and can follow up.
            </li>
            <li>
              <span className="font-medium text-neutral-900">Plans and ads.</span> A free listing is the
              start. Growth tools, a verified badge, and local ads are on the{' '}
              <Link href="/pricing" className="font-medium text-[#215481] underline underline-offset-2">
                pricing page
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">How a listing stays useful</h2>
          <ol className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-700">
            <li>
              <span className="font-medium text-neutral-900">1. The business publishes the facts.</span>{' '}
              Category, city, photos, and hours tell a stranger whether this is the right place.
            </li>
            <li>
              <span className="font-medium text-neutral-900">2. Customers add proof.</span> Reviews say
              what a visit was actually like. A reply from the owner shows the shop is paying attention.
            </li>
            <li>
              <span className="font-medium text-neutral-900">3. Search sends the next person there.</span>{' '}
              FinderB matches the words they type with categories, cities, and listings, then shows the
              pages that fit.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Who runs FinderB</h2>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            {LEGAL_COMPANY.brand} is operated by {LEGAL_COMPANY.name}. The product is built for local
            discovery in India: one listing for the business, one search for the customer.
          </p>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            Questions about a listing, a subscription, or your data go to{' '}
            <a
              href={`mailto:${LEGAL_COMPANY.email}`}
              className="font-medium text-[#215481] underline underline-offset-2"
            >
              {LEGAL_COMPANY.email}
            </a>
            . The{' '}
            <Link href="/contact" className="font-medium text-[#215481] underline underline-offset-2">
              contact page
            </Link>{' '}
            has hours and the grievance contact. Privacy, terms, and account deletion are linked in the
            footer.
          </p>
        </section>

        <section className="mt-12 border-t border-neutral-200 pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Questions</h2>
          <div className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map((item) => (
              <div key={item.question} className="py-5">
                <h3 className="text-[15px] font-semibold text-neutral-900">{item.question}</h3>
                <p className="mt-2 text-[15px] leading-7 text-neutral-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/business/register"
            className="inline-flex items-center justify-center rounded-lg bg-[#153551] px-5 py-3 text-sm font-semibold text-white hover:bg-[#215481]"
          >
            List your business
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Browse categories
          </Link>
        </section>
      </main>
    </div>
  );
}
