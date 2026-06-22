import type { Business } from '@/lib/mockData';
import { buildBusinessSeoContent } from '@/lib/businessContent';

type BusinessSeoContentProps = {
  business: Business;
};

export default function BusinessSeoContent({ business }: BusinessSeoContentProps) {
  const content = buildBusinessSeoContent(business);

  return (
    <section
      aria-label="Business information"
      className="border-t border-stone-200 bg-[#fafaf9] py-10"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:max-w-7xl">
        <article>
          <h2 className="text-base font-semibold text-[#153551]">About {business.name}</h2>
          <p className="mt-3 text-[15px] leading-7 text-stone-600">{content.about}</p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-[#153551]">Why choose {business.name}</h2>
          <p className="mt-3 text-[15px] leading-7 text-stone-600">{content.whyChoose}</p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-[#153551]">Services offered</h2>
          <p className="mt-3 text-[15px] leading-7 text-stone-600">{content.servicesIntro}</p>
        </article>

        <article>
          <h2 className="text-base font-semibold text-[#153551]">Customer highlights</h2>
          <p className="mt-3 text-[15px] leading-7 text-stone-600">{content.customerHighlights}</p>
        </article>

        {content.faqs.length > 0 && (
          <article id="faqs">
            <h2 className="text-base font-semibold text-[#153551]">
              Frequently asked questions about {business.name}
            </h2>
            <dl className="mt-4 space-y-4">
              {content.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-lg border border-stone-200/80 bg-white px-4 py-3"
                >
                  <dt className="text-sm font-semibold text-[#153551]">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </article>
        )}
      </div>
    </section>
  );
}
