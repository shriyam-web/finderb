import type { Business } from '@/lib/mockData';
import { getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import { plainAboutText } from '@/lib/businessAbout';
import { getPublicReviewRating, parseBusinessReviews } from '@/lib/businessReviews';

export type BusinessFaqItem = {
  question: string;
  answer: string;
};

export type BusinessSeoContent = {
  about: string;
  whyChoose: string;
  customerHighlights: string;
  servicesIntro: string;
  faqs: BusinessFaqItem[];
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant<T>(seed: string, variants: T[]): T {
  return variants[hashString(seed) % variants.length];
}

export function buildBusinessSeoContent(business: Business): BusinessSeoContent {
  const location = getBusinessLocationLabel(business);
  const cityPhrase = location || 'your area';
  const reviews = parseBusinessReviews(business.review);
  const rating = getPublicReviewRating(reviews);
  const services = business.services?.filter(Boolean) ?? [];
  const serviceSample = services.slice(0, 4).join(', ');
  const seed = `${business.id}:${business.name}:${business.category}`;

  const aboutSource = business.about || business.description;
  const about = aboutSource?.trim()
    ? plainAboutText(aboutSource).trim()
    : `${business.name} is a ${business.category.toLowerCase()} business serving customers in ${cityPhrase}. View contact details, business hours, services, and customer feedback on FinderB.`;

  const whyChoose = pickVariant(seed, [
    `${business.name} is listed on FinderB to help local customers in ${cityPhrase} discover trusted ${business.category.toLowerCase()} services with transparent contact information and reviews.`,
    `Customers searching for ${business.category.toLowerCase()} in ${cityPhrase} can compare ${business.name} with nearby alternatives, check phone numbers, and read verified feedback on FinderB.`,
    `${business.name} focuses on ${serviceSample || business.category.toLowerCase()} for clients in ${cityPhrase}, with FinderB providing a verified local profile for easier discovery.`,
  ]);

  const customerHighlights =
    rating != null && reviews.length > 0
      ? `Customers rate ${business.name} ${rating}/5 based on ${reviews.length} review${reviews.length === 1 ? '' : 's'} on FinderB${
          reviews[0]?.content
            ? `. Recent feedback mentions: "${reviews[0].content.slice(0, 120)}${reviews[0].content.length > 120 ? '…' : ''}"`
            : '.'
        }`
      : `${business.name} is open to customer reviews on FinderB. Share your experience to help others in ${cityPhrase} choose the right ${business.category.toLowerCase()} provider.`;

  const servicesIntro = services.length
    ? `${business.name} offers ${services.length} listed service${services.length === 1 ? '' : 's'} including ${serviceSample}. Contact the business directly for pricing, availability, and custom requests.`
    : `Explore ${business.category.toLowerCase()} services from ${business.name} in ${cityPhrase}. Contact the business for a detailed service list and quotes.`;

  const faqs: BusinessFaqItem[] = [
    {
      question: `What is the contact number for ${business.name}?`,
      answer: business.contact
        ? `You can reach ${business.name} at ${business.contact}${business.whatsappNumber ? ` or WhatsApp ${business.whatsappNumber}` : ''}.`
        : `Contact details for ${business.name} are available on this FinderB profile.`,
    },
    {
      question: `Where is ${business.name} located?`,
      answer:
        business.businessAddress || business.location
          ? `${business.name} is located at ${business.businessAddress || business.location}${location ? ` (${location})` : ''}.`
          : `${business.name} serves customers in ${cityPhrase}. Check the map section for directions.`,
    },
    {
      question: `What category is ${business.name} listed under on FinderB?`,
      answer: `${business.name} is listed under ${business.category} on FinderB, helping users find relevant local businesses in ${cityPhrase}.`,
    },
  ];

  if (services.length > 0) {
    faqs.push({
      question: `What services does ${business.name} provide?`,
      answer: `${business.name} provides ${services.join(', ')}. Reach out directly to confirm scope, pricing, and availability.`,
    });
  }

  if (business.website) {
    faqs.push({
      question: `Does ${business.name} have an official website?`,
      answer: `Yes. Visit ${business.name} online at ${business.website} or use this FinderB profile for phone, address, and reviews.`,
    });
  }

  if (rating != null) {
    faqs.push({
      question: `What is the customer rating of ${business.name}?`,
      answer: `${business.name} has an average rating of ${rating}/5 from ${reviews.length} customer review${reviews.length === 1 ? '' : 's'} on FinderB.`,
    });
  }

  return { about, whyChoose, customerHighlights, servicesIntro, faqs };
}

export function buildFaqJsonLd(faqs: BusinessFaqItem[], pageUrl: string) {
  if (!faqs.length) return null;

  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
