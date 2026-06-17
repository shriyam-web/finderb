import { LEGAL_COMPANY } from '@/lib/legalContent';

export function footerSearchHref(query: string): string {
  return `/categories?search=${encodeURIComponent(query)}`;
}

export function footerCategoryHref(slug: string): string {
  return `/categories/${slug}`;
}

export function footerCityHref(city: string): string {
  return footerSearchHref(`local businesses in ${city}`);
}

export function footerLocalHref(service: string, city: string): string {
  return footerSearchHref(`${service} in ${city}`);
}

export const FOOTER_SITE_URL = 'https://finderb.com';

export const FOOTER_TAGLINE = 'Find local businesses, services & professionals near you';

export const FOOTER_ABOUT =
  'FinderB is India\'s local business directory and discovery platform. Search restaurants, doctors, plumbers, electricians, salons, tutors, CA firms, lawyers, real estate agents, hotels, gyms, and thousands of other categories in your city — with ratings, reviews, phone numbers, addresses, and maps in one place.';

export const FOOTER_ABOUT_SECONDARY =
  'Whether you need emergency home repair, wedding vendors, healthcare, education, B2B suppliers, or everyday services, FinderB connects you with verified listings across metro cities, tier-2 towns, and growing local markets. Business owners can add a free listing, reach nearby customers, collect reviews, and manage their profile online.';

export const FOOTER_SEO_NOTES = [
  'FinderB covers 500+ Indian cities including Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, Pune, Kolkata, Ahmedabad, Lucknow, Jaipur, Chandigarh, Kochi, Indore, Bhopal, Nagpur, Surat, Vadodara, Coimbatore, Visakhapatnam, Patna, Ranchi, Guwahati, and many more.',
  'Discover local services with category browse, city-wise search, AI-assisted queries, and popular “near me” filters for restaurants, hospitals, salons, packers & movers, coaching classes, car garages, and professional consultants.',
  'FinderB helps users compare businesses, read customer feedback, and contact providers directly — while helping merchants improve local SEO visibility, showcase offers, and grow footfall from organic search and mobile discovery.',
] as const;

export const FOOTER_CONTACT = {
  email: LEGAL_COMPANY.email,
  phone: LEGAL_COMPANY.phoneDisplay,
  phoneHref: `tel:${LEGAL_COMPANY.phone}`,
  coverage: '500+ cities across India',
} as const;

export const FOOTER_NAV_COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'All Categories', href: '/categories' },
      { label: 'Top Picks Near You', href: '/?tab=top-picks' },
      { label: 'AI Search Assistant', href: '/?tab=ai' },
      { label: 'Latest Local News', href: '/news' },
      { label: 'Movies & Showtimes', href: '/movies' },
      { label: 'Tourist Places', href: '/tourist-places' },
      { label: 'Blog & City Guides', href: '/blog' },
      { label: 'Job Listings', href: '/categories/job' },
    ],
  },
  {
    title: 'For Business',
    links: [
      { label: 'Free Business Listing', href: '/business/register' },
      { label: 'Business Login', href: '/business/login' },
      { label: 'Merchant Dashboard', href: '/business/dashboard' },
      { label: 'Advertise on FinderB', href: '/advertisements' },
      { label: 'Premium & Pricing', href: '/pricing' },
      { label: 'Get Verified', href: '/business/register' },
      { label: 'Partner Support', href: '/contact' },
    ],
  },
  {
    title: 'Top Categories',
    links: [
      { label: 'Restaurants & Cafés', href: footerCategoryHref('restaurants') },
      { label: 'Doctors & Hospitals', href: footerCategoryHref('doctors') },
      { label: 'Real Estate & Property', href: footerCategoryHref('real-estate') },
      { label: 'Plumbers & Home Repair', href: footerCategoryHref('repairs-services') },
      { label: 'Salons & Beauty Spas', href: footerSearchHref('salon spa') },
      { label: 'Gyms & Fitness Centres', href: footerSearchHref('gym fitness') },
      { label: 'Schools & Coaching', href: footerCategoryHref('education') },
      { label: 'CA & Tax Consultants', href: footerSearchHref('chartered accountant') },
      { label: 'Lawyers & Legal Aid', href: footerCategoryHref('finance') },
      { label: 'Wedding Vendors', href: footerSearchHref('wedding services') },
      { label: 'Car Service & Garages', href: footerSearchHref('car service garage') },
      { label: 'Hotels, PG & Lodging', href: footerSearchHref('hotels pg accommodation') },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About FinderB', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Careers', href: '/hirings' },
      { label: 'User Sign In', href: '/login' },
      { label: 'Create Account', href: '/signup' },
      { label: 'My Dashboard', href: '/dashboard' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Cancellation & Refund', href: '/cancellation-refund' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Shipping & Delivery', href: '/shipping-delivery' },
      { label: 'Sitemap', href: '/sitemap' },
    ],
  },
] as const;

export const FOOTER_SERVICE_LINKS = [
  { label: 'Packers & Movers', href: footerSearchHref('packers and movers') },
  { label: 'AC Repair & Service', href: footerSearchHref('ac repair service') },
  { label: 'Electricians', href: footerSearchHref('electrician near me') },
  { label: 'Plumbers', href: footerSearchHref('plumber near me') },
  { label: 'Carpenters', href: footerSearchHref('carpenter') },
  { label: 'Pest Control', href: footerSearchHref('pest control') },
  { label: 'Interior Designers', href: footerSearchHref('interior designer') },
  { label: 'Architects', href: footerSearchHref('architect') },
  { label: 'Photographers', href: footerSearchHref('photographer') },
  { label: 'Videographers', href: footerSearchHref('wedding videographer') },
  { label: 'Caterers', href: footerSearchHref('catering services') },
  { label: 'Dentists', href: footerSearchHref('dentist') },
  { label: 'Hospitals', href: footerSearchHref('hospital') },
  { label: 'Pathology Labs', href: footerSearchHref('pathology lab') },
  { label: 'Pharmacies', href: footerSearchHref('pharmacy medical store') },
  { label: 'Ayurvedic Doctors', href: footerSearchHref('ayurvedic doctor clinic') },
  { label: 'Schools', href: footerSearchHref('school') },
  { label: 'Coaching Classes', href: footerSearchHref('coaching classes tuition') },
  { label: 'Beauty Parlours', href: footerSearchHref('beauty parlour') },
  { label: 'Pet Shops & Clinics', href: footerSearchHref('pet shop clinic') },
  { label: 'Bike & Car Wash', href: footerSearchHref('bike car wash') },
  { label: 'Driving Schools', href: footerSearchHref('driving school') },
  { label: 'Event Planners', href: footerSearchHref('event management') },
  { label: 'Banquet Halls', href: footerSearchHref('banquet hall marriage hall') },
  { label: 'Jewellery Stores', href: footerSearchHref('jewellery showroom') },
  { label: 'Furniture Stores', href: footerSearchHref('furniture store') },
  { label: 'Mobile & Laptop Repair', href: footerSearchHref('mobile laptop repair') },
  { label: 'Home Cleaning', href: footerSearchHref('home cleaning maid service') },
  { label: 'Water Purifier Service', href: footerSearchHref('water purifier service') },
  { label: 'Courier & Logistics', href: footerSearchHref('courier logistics') },
  { label: 'Printing & Stationery', href: footerSearchHref('printing stationery shop') },
  { label: 'Tailors & Boutiques', href: footerSearchHref('tailor boutique') },
  { label: 'Florists', href: footerSearchHref('florist flower shop') },
  { label: 'Security Services', href: footerSearchHref('security guard agency') },
  { label: 'Solar Panel Installers', href: footerSearchHref('solar panel installation') },
  { label: 'CCTV Installation', href: footerSearchHref('cctv camera installation') },
  { label: 'Loan & Insurance Agents', href: footerSearchHref('loan insurance agent') },
  { label: 'Travel Agents', href: footerSearchHref('travel agent tour operator') },
] as const;

export const FOOTER_PROFESSIONAL_LINKS = [
  { label: 'Chartered Accountants', href: footerSearchHref('chartered accountant CA firm') },
  { label: 'Company Secretaries', href: footerSearchHref('company secretary') },
  { label: 'GST Consultants', href: footerSearchHref('gst consultant') },
  { label: 'Tax Lawyers', href: footerSearchHref('tax lawyer') },
  { label: 'Property Lawyers', href: footerSearchHref('property lawyer') },
  { label: 'Corporate Lawyers', href: footerSearchHref('corporate lawyer') },
  { label: 'Notary Services', href: footerSearchHref('notary services') },
  { label: 'HR Consultants', href: footerSearchHref('hr consultancy') },
  { label: 'Digital Marketing Agencies', href: footerSearchHref('digital marketing agency') },
  { label: 'Web Developers', href: footerSearchHref('website developer') },
  { label: 'Graphic Designers', href: footerSearchHref('graphic designer') },
  { label: 'Financial Advisors', href: footerSearchHref('financial advisor') },
  { label: 'Insurance Advisors', href: footerSearchHref('insurance advisor') },
  { label: 'Real Estate Brokers', href: footerSearchHref('real estate broker agent') },
  { label: 'Builders & Contractors', href: footerSearchHref('builder contractor') },
  { label: 'Civil Engineers', href: footerSearchHref('civil engineer consultant') },
  { label: 'Vastu Consultants', href: footerSearchHref('vastu consultant') },
  { label: 'Immigration Consultants', href: footerSearchHref('immigration consultant') },
] as const;

export const FOOTER_B2B_LINKS = [
  { label: 'B2B Suppliers', href: footerSearchHref('b2b suppliers wholesalers') },
  { label: 'Manufacturers', href: footerSearchHref('manufacturers') },
  { label: 'Distributors', href: footerSearchHref('distributors dealers') },
  { label: 'Industrial Equipment', href: footerSearchHref('industrial equipment suppliers') },
  { label: 'Packaging Material', href: footerSearchHref('packaging material suppliers') },
  { label: 'Office Furniture', href: footerSearchHref('office furniture suppliers') },
  { label: 'IT Hardware Vendors', href: footerSearchHref('it hardware vendors') },
  { label: 'Commercial Vehicle Dealers', href: footerSearchHref('commercial vehicle dealers') },
  { label: 'Construction Material', href: footerSearchHref('construction material suppliers') },
  { label: 'Textile Wholesalers', href: footerSearchHref('textile wholesalers') },
  { label: 'Food Wholesale', href: footerSearchHref('food wholesale suppliers') },
  { label: 'Printing Press', href: footerSearchHref('printing press commercial') },
] as const;

export const FOOTER_CITY_GROUPS = [
  {
    label: 'Metro cities',
    cities: [
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Hyderabad',
      'Chennai',
      'Kolkata',
      'Pune',
      'Ahmedabad',
    ],
  },
  {
    label: 'North India',
    cities: [
      'Lucknow',
      'Jaipur',
      'Chandigarh',
      'Noida',
      'Gurgaon',
      'Kanpur',
      'Varanasi',
      'Agra',
      'Dehradun',
      'Amritsar',
      'Meerut',
      'Prayagraj',
    ],
  },
  {
    label: 'South India',
    cities: [
      'Coimbatore',
      'Kochi',
      'Visakhapatnam',
      'Mysore',
      'Madurai',
      'Thiruvananthapuram',
      'Nagpur',
      'Surat',
      'Vadodara',
      'Indore',
      'Mangalore',
      'Tiruchirappalli',
    ],
  },
  {
    label: 'East & West India',
    cities: [
      'Bhubaneswar',
      'Patna',
      'Ranchi',
      'Guwahati',
      'Raipur',
      'Nashik',
      'Rajkot',
      'Jodhpur',
      'Udaipur',
      'Bhopal',
      'Siliguri',
      'Jamshedpur',
    ],
  },
  {
    label: 'Central & Northeast',
    cities: [
      'Gwalior',
      'Jabalpur',
      'Aurangabad',
      'Solapur',
      'Kolhapur',
      'Shillong',
      'Imphal',
      'Agartala',
      'Goa',
      'Panaji',
      'Shimla',
      'Jammu',
    ],
  },
] as const;

export const FOOTER_POPULAR_SEARCHES = [
  'Best restaurants near me',
  'Top rated doctors near me',
  'Verified plumbers near me',
  'Chartered accountant near me',
  'Wedding photographers near me',
  'Gyms and fitness centres near me',
  'Home cleaning services near me',
  '24 hour hospitals near me',
  'Real estate agents near me',
  'PG and hostels near me',
  'Car repair garage near me',
  'Beauty salons and spas near me',
  'Home tuition teachers near me',
  'Packers and movers near me',
  'Interior designers near me',
  'Emergency dentists near me',
  'Banquet halls for wedding',
  'Veterinary clinics near me',
  'Mobile phone shops near me',
  'Electricians near me',
  'AC service and repair near me',
  'Birthday caterers near me',
  'Driving schools near me',
  'Gold jewellery showrooms near me',
  'IIT JEE coaching classes near me',
  'B2B wholesalers near me',
  'Property lawyers near me',
  'Budget hotels near me',
  'Two wheeler service centre near me',
  'Corporate event planners near me',
  'Ayurvedic clinics near me',
  'Diagnostic centres near me',
  'Nursery and playschools near me',
  'Modular kitchen dealers near me',
  'RO water purifier repair near me',
  'Coffee shops near me',
  'Vegetarian restaurants near me',
  'Pediatricians near me',
  'Gynecologists near me',
  'Orthopedic doctors near me',
  'Eye hospitals near me',
  'Skin specialists near me',
  'Marriage halls near me',
  'Tent house decorators near me',
  'Mehendi artists near me',
  'DJ services near me',
  'Car rental near me',
  'Self drive cars near me',
  'Laundry services near me',
  'Dry cleaners near me',
] as const;

export const FOOTER_LOCAL_LISTINGS = {
  services: [
    'Restaurants',
    'Doctors',
    'Hotels',
    'Gyms',
    'Salons',
    'Plumbers',
    'Electricians',
    'Schools',
    'Dentists',
    'Pharmacies',
    'CA Firms',
    'Lawyers',
  ],
  cities: [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
    'Lucknow',
    'Jaipur',
    'Ahmedabad',
    'Chandigarh',
    'Kochi',
  ],
} as const;

export type FooterSocialIcon = 'facebook' | 'instagram' | 'x' | 'linkedin' | 'youtube';

export type FooterSocialLink = {
  label: string;
  href: string;
  icon: FooterSocialIcon;
  brandClass: string;
};

export const FOOTER_SOCIAL_LINKS: readonly FooterSocialLink[] = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/finderb',
    icon: 'facebook',
    brandClass: 'bg-[#1877F2] hover:bg-[#1664d8]',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/finderb',
    icon: 'instagram',
    brandClass:
      'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d6] hover:from-[#f5c82e] hover:via-[#e02573] hover:to-[#5c24c8]',
  },
  {
    label: 'X',
    href: 'https://x.com/finderb',
    icon: 'x',
    brandClass: 'bg-[#000000] hover:bg-[#1a1a1a]',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/finderb',
    icon: 'linkedin',
    brandClass: 'bg-[#0A66C2] hover:bg-[#0958aa]',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@finderb',
    icon: 'youtube',
    brandClass: 'bg-[#FF0000] hover:bg-[#e60000]',
  },
];

export const FOOTER_SECTION_INTROS = {
  services:
    'Browse home services, healthcare, education, events, retail, and daily essentials listed on FinderB across India.',
  professional:
    'Find chartered accountants, lawyers, consultants, and other professional service providers in your city.',
  b2b: 'Discover B2B suppliers, wholesalers, distributors, and commercial vendors for business needs.',
  cities: 'Explore local business listings, shops, and service providers in major Indian cities and towns.',
  searches: 'Popular “near me” and local intent searches that users look for on FinderB every day.',
  local: 'City-wise category links for faster local business discovery and long-tail search coverage.',
} as const;

export function getFooterStructuredData() {
  const searchTargets = [
    ...FOOTER_POPULAR_SEARCHES.slice(0, 12),
    ...FOOTER_SERVICE_LINKS.slice(0, 8).map((item) => item.label),
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${FOOTER_SITE_URL}/#organization`,
        name: 'FinderB',
        legalName: 'MAAGAA Connect Private Limited',
        url: FOOTER_SITE_URL,
        logo: `${FOOTER_SITE_URL}/logo1.png`,
        description: FOOTER_ABOUT,
        email: FOOTER_CONTACT.email,
        telephone: LEGAL_COMPANY.phone,
        areaServed: {
          '@type': 'Country',
          name: 'India',
        },
        sameAs: FOOTER_SOCIAL_LINKS.map((item) => item.href),
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: LEGAL_COMPANY.phone,
          email: FOOTER_CONTACT.email,
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${FOOTER_SITE_URL}/#website`,
        url: FOOTER_SITE_URL,
        name: 'FinderB',
        publisher: { '@id': `${FOOTER_SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${FOOTER_SITE_URL}/categories?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        name: 'Popular local searches on FinderB',
        itemListElement: searchTargets.map((name, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name,
          url: `${FOOTER_SITE_URL}${footerSearchHref(name)}`,
        })),
      },
    ],
  };
}
