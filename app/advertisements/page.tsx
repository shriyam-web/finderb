import Link from 'next/link';

const formats = [
  {
    title: 'Premium listing',
    text: 'Your business stays near the top of its category and in search, with a verified badge and priority support.',
    points: ['Higher placement in search', 'Verified badge on the listing', 'Priority support'],
  },
  {
    title: 'Banner ads',
    text: 'A visual ad on the home page and search pages, for people who are already browsing local businesses.',
    points: ['Home and search placement', 'Your own creative', 'Impression tracking'],
  },
  {
    title: 'Category placement',
    text: 'A dedicated spot inside one category, so you are the business people see when they browse that trade.',
    points: ['Shown inside one category', 'Exclusive placement', 'Reporting on views'],
  },
] as const;

const reasons = [
  {
    title: 'People are already looking',
    text: 'Ads sit next to search and category pages, when someone is choosing a local business.',
  },
  {
    title: 'You choose the area',
    text: 'A campaign can focus on the cities and categories where your customers actually are.',
  },
  {
    title: 'The budget stays flexible',
    text: 'Start with a listing boost or a banner. You can change the plan as the response comes in.',
  },
  {
    title: 'Listings are real businesses',
    text: 'FinderB is a directory of shops and services, so the audience is looking for a provider, not a random click.',
  },
] as const;

const reach = [
  { value: '10M+', label: 'Monthly active users' },
  { value: '500+', label: 'Cities covered' },
  { value: '2M+', label: 'Daily searches' },
  { value: '18%', label: 'Average conversion' },
] as const;

export default function AdvertisePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Advertise on FinderB',
    url: 'https://finderb.com/advertisements',
    description:
      'Promote a local business on FinderB with a premium listing, banner ads, or a category placement across India.',
    about: {
      '@type': 'Service',
      name: 'FinderB advertising',
      areaServed: 'IN',
      provider: { '@type': 'Organization', name: 'FinderB', url: 'https://finderb.com' },
    },
  };

  return (
    <div className="finderb-single-font min-h-[calc(100dvh-6.75rem)] bg-[#fafaf9] lg:min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="mx-auto max-w-5xl px-5 pt-28 pb-20 sm:px-6 lg:pt-32">
        <header className="max-w-3xl border-b border-neutral-200 pb-8">
          <p className="text-sm font-medium text-[#215481]">Advertising</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Advertise on FinderB
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            Put your business in front of people who are already searching for a local service in India.
            Choose a premium listing, a banner, or a place inside one category.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/business/register"
              className="inline-flex items-center justify-center rounded-lg bg-[#153551] px-5 py-3 text-sm font-semibold text-white hover:bg-[#215481]"
            >
              Start with a listing
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Talk to FinderB
            </Link>
          </div>
        </header>

        <section className="mt-10" aria-label="FinderB reach">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
            {reach.map((item) => (
              <div key={item.label} className="bg-white px-4 py-5">
                <dt className="text-sm text-neutral-500">{item.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Ways to advertise</h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-neutral-700">
            Each format is meant for a different job: being found in search, being seen on the home page, or owning a category.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {formats.map((item) => (
              <article key={item.title} className="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{item.text}</p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-neutral-700">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Why businesses use it</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {reasons.map((item) => (
              <article key={item.title} className="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">How to start</h2>
          <ol className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-700">
            <li>
              <span className="font-medium text-neutral-900">1. Publish the business.</span> Create a FinderB listing with the category, city, photos, and hours customers expect to see.
            </li>
            <li>
              <span className="font-medium text-neutral-900">2. Pick a placement.</span> A premium listing, a banner, or a category spot. Pricing for plans is on the{' '}
              <Link href="/pricing" className="font-medium text-[#215481] underline underline-offset-2">
                pricing page
              </Link>
              .
            </li>
            <li>
              <span className="font-medium text-neutral-900">3. Watch the response.</span> Views and enquiries come back to the business, so you can see which placement is working.
            </li>
          </ol>
        </section>

        <section className="mt-12 rounded-xl border border-neutral-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Ready to run an ad?</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-neutral-700">
            List the business first if it is not on FinderB yet. If you already have a listing and want help choosing a placement, write to the team.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/business/register"
              className="inline-flex items-center justify-center rounded-lg bg-[#153551] px-5 py-3 text-sm font-semibold text-white hover:bg-[#215481]"
            >
              List your business
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Contact FinderB
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
