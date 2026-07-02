import Link from 'next/link';
import Image from 'next/image';
import React, { useState, type ReactNode } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Smartphone,
  ChevronDown,
  ArrowRight,
  Search,
  ShieldCheck,
} from 'lucide-react';
import AppStoreIcon from '@/components/icons/AppStoreIcon';
import IndianFlagIcon from '@/components/icons/IndianFlagIcon';
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaGooglePlay,
} from 'react-icons/fa6';
import {
  FOOTER_ABOUT,
  FOOTER_ABOUT_SECONDARY,
  FOOTER_B2B_LINKS,
  FOOTER_CONTACT,
  FOOTER_CITY_GROUPS,
  FOOTER_LOCAL_LISTINGS,
  FOOTER_NAV_COLUMNS,
  FOOTER_POPULAR_SEARCHES,
  FOOTER_PROFESSIONAL_LINKS,
  FOOTER_SECTION_INTROS,
  FOOTER_SEO_NOTES,
  FOOTER_SERVICE_LINKS,
  FOOTER_SOCIAL_LINKS,
  FOOTER_TAGLINE,
  type FooterSocialIcon,
  getFooterStructuredData,
  footerCityHref,
  footerLocalHref,
  footerSearchHref,
} from '@/lib/footerData';
import { LEGAL_COMPANY } from '@/lib/legalContent';
import { HERO_SEARCH_TYPEWRITER_EXAMPLES } from '@/lib/homeHeroConstants';
import { useTypewriterCycle } from '@/hooks/useTypewriterCycle';

const linkClass =
  'text-sm text-neutral-600 transition-colors hover:text-neutral-900 hover:underline underline-offset-2';

const SOCIAL_ICON_MAP: Record<FooterSocialIcon, typeof FaFacebook> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  x: FaXTwitter,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
};

function footerLinkKey(link: { label: string; href: string }) {
  return `${link.href}::${link.label}`;
}

function Column({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 text-sm font-medium text-neutral-900">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={footerLinkKey(link)}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function LinkGrid({
  links,
}: {
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {links.map((link) => (
        <li key={footerLinkKey(link)}>
          <Link href={link.href} className={linkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3 max-w-3xl space-y-1">
      <h2 className="text-sm font-medium text-neutral-900">{title}</h2>
      <p className="text-xs leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

function CollapsibleSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby={id} className="">
      <div className="flex items-start justify-between">
        <div className="mb-1 max-w-3xl">
          <h2 id={id} className="text-sm font-medium text-neutral-900">{title}</h2>
          <p className="text-xs leading-relaxed text-neutral-500">{description}</p>
        </div>

        <button
          onClick={() => setOpen((s) => !s)}
          aria-expanded={open}
          aria-controls={`${id}-content`}
          className="ml-4 -mr-2 rounded p-2 text-neutral-600 hover:text-neutral-900"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </div>

      <div id={`${id}-content`} className={`${open ? 'mt-3 block' : 'hidden'}`}>
        {children}
      </div>
    </section>
  );
}

function ContactRow({
  icon: Icon,
  href,
  children,
}: {
  icon: typeof Mail;
  href?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      <Icon size={15} strokeWidth={1.75} className="shrink-0 text-neutral-400" />
      <span>{children}</span>
    </>
  );

  const className =
    'group flex items-center gap-2.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900';

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function SocialButton({ label, href, icon, brandClass }: (typeof FOOTER_SOCIAL_LINKS)[number]) {
  const Icon = SOCIAL_ICON_MAP[icon];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow FinderB on ${label}`}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-white transition-opacity hover:opacity-90 ${brandClass}`}
    >
      <Icon size={15} />
    </a>
  );
}

function SecureSiteBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800"
      title="HTTPS encryption, secure sessions, and protected payments on FinderB"
    >
      <ShieldCheck size={12} strokeWidth={2.25} className="shrink-0 text-emerald-600" aria-hidden />
      Secure site
    </span>
  );
}

function MadeInIndiaBadge() {
  return (
    <span className="group relative inline-flex">
      <span
        className="inline-flex cursor-default items-center gap-1 rounded border border-neutral-300 bg-white px-2 py-0.5 font-medium text-inherit transition-colors hover:border-[#153551]/25 hover:bg-[#fafaf9]"
        tabIndex={0}
        title="Designed and developed by Shriyam Parashar"
        aria-describedby="footer-made-in-india-tooltip"
      >
        <IndianFlagIcon className="h-2.5 w-[15px] shrink-0 rounded-[2px] ring-1 ring-black/5" />
        Made in India
      </span>
      <span
        id="footer-made-in-india-tooltip"
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.4rem)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-200 bg-neutral-900 px-2.5 py-1.5 text-[10px] font-medium leading-snug text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        Designed and developed by Shriyam Parashar
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-neutral-900"
          aria-hidden
        />
      </span>
    </span>
  );
}

function Divider() {
  return <div className="border-t border-neutral-200" />;
}

const FOOTER_SEARCH_EXAMPLES = HERO_SEARCH_TYPEWRITER_EXAMPLES;

function RotatingSearchPreview() {
  const displayText = useTypewriterCycle(FOOTER_SEARCH_EXAMPLES);

  return (
    <div
      className="mb-4 flex w-fit max-w-full items-center gap-2 rounded-full border border-[#dfe6ee] bg-white/90 px-3 py-1.5 shadow-[0_2px_10px_-4px_rgba(21,53,81,0.12)] backdrop-blur-sm"
      aria-hidden
    >
      <Search size={13} strokeWidth={2.25} className="shrink-0 text-[#153551]/55" />
      <span className="inline-flex min-w-[11.5rem] items-center text-[11px] font-medium text-neutral-500 sm:min-w-[12.75rem]">
        <span className="truncate">{displayText}</span>
        <span className="ml-px inline-block h-3.5 w-px shrink-0 animate-pulse bg-[#153551]/45" />
      </span>
    </div>
  );
}

function ListYourBusinessCard() {
  return (
    <div className="relative max-w-xl overflow-hidden rounded-2xl border border-[#e4ddd3] bg-[#fdfcfa]">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#f9b864]/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #153551 0.6px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <RotatingSearchPreview />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h3 className="text-[1.2rem] font-extrabold leading-[1.2] tracking-tight text-[#0f273b] sm:text-[1.35rem]">
              Show up when{' '}
              <span className="register-hero-headline-accent">locals search.</span>
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
              List on FinderB — appear in category and city results, collect reviews, and get
              enquiries from people already looking for your business.
            </p>
          </div>

          <Link
            href="/business/register"
            className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#153551] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-8px_rgba(21,53,81,0.55)] transition-all hover:bg-[#215481] hover:shadow-[0_8px_22px_-8px_rgba(21,53,81,0.6)] active:scale-[0.98] sm:self-auto"
          >
            Get Started
            <ArrowRight
              size={15}
              strokeWidth={2.5}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const serviceLinks = FOOTER_SERVICE_LINKS.map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const professionalLinks = FOOTER_PROFESSIONAL_LINKS.map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const b2bLinks = FOOTER_B2B_LINKS.map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const searchLinks = FOOTER_POPULAR_SEARCHES.map((term) => ({
    label: term,
    href: footerSearchHref(term),
  }));

  const structuredData = getFooterStructuredData();

  return (
    <footer className="relative z-10 border-t border-neutral-200 bg-[#fafaf9] text-neutral-600">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-20">
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <Image
                src="/logo1.png"
                alt="FinderB — local business directory India"
                width={128}
                height={36}
                className="h-8 w-auto object-contain"
                quality={100}
              />
            </Link>
            <p className="text-sm font-medium text-neutral-800">{FOOTER_TAGLINE}</p>
            <div className="max-w-xl space-y-3 text-sm leading-relaxed text-neutral-600">
              <p>{FOOTER_ABOUT}</p>
              <p>{FOOTER_ABOUT_SECONDARY}</p>
            </div>
            <ListYourBusinessCard />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-4">
              <p className="text-sm font-medium text-neutral-900">Contact</p>
              <div className="space-y-3">
                <ContactRow icon={Mail} href={`mailto:${FOOTER_CONTACT.email}`}>
                  {FOOTER_CONTACT.email}
                </ContactRow>
                {/* Company phone row hidden until SHOW_COMPANY_PHONE is true in lib/legalContent.ts */}
                {FOOTER_CONTACT.phone && FOOTER_CONTACT.phoneHref ? (
                  <ContactRow icon={Phone} href={FOOTER_CONTACT.phoneHref}>
                    {FOOTER_CONTACT.phone}
                  </ContactRow>
                ) : null}
                <ContactRow icon={MapPin}>{FOOTER_CONTACT.coverage}</ContactRow>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-neutral-900">Follow us</p>
              <div className="flex flex-wrap gap-2">
                {FOOTER_SOCIAL_LINKS.map((social) => (
                  <SocialButton key={social.href} {...social} />
                ))}
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Smartphone size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-neutral-400" />
                <div className="space-y-2.5">
                  <p className="text-sm text-neutral-600">Mobile app coming soon</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-500">
                      <AppStoreIcon className="h-3.5 w-3.5 text-neutral-800" />
                      App Store
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-500">
                      <FaGooglePlay size={13} />
                      Google Play
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-8">
          <Divider />
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {FOOTER_NAV_COLUMNS.map((column) => (
            <Column key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        <div className="my-8">
          <Divider />
        </div>

        <CollapsibleSection id="footer-services" title="Services" description={FOOTER_SECTION_INTROS.services}>
          <LinkGrid links={serviceLinks} />
        </CollapsibleSection>

        <div className="my-8">
          <Divider />
        </div>

        <CollapsibleSection
          id="footer-professional"
          title="Professional services"
          description={FOOTER_SECTION_INTROS.professional}
        >
          <LinkGrid links={professionalLinks} />
        </CollapsibleSection>

        <div className="my-8">
          <Divider />
        </div>

        <CollapsibleSection id="footer-b2b" title="B2B & suppliers" description={FOOTER_SECTION_INTROS.b2b}>
          <LinkGrid links={b2bLinks} />
        </CollapsibleSection>

        <div className="my-8">
          <Divider />
        </div>

        <CollapsibleSection id="footer-cities" title="Cities" description={FOOTER_SECTION_INTROS.cities}>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FOOTER_CITY_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-xs font-medium text-neutral-500">{group.label}</p>
                <ul className="space-y-2.5">
                  {group.cities.map((city) => (
                    <li key={city}>
                      <Link href={footerCityHref(city)} className={linkClass}>
                        Businesses in {city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <div className="my-8">
          <Divider />
        </div>

        <CollapsibleSection id="footer-searches" title="Popular searches" description={FOOTER_SECTION_INTROS.searches}>
          <LinkGrid links={searchLinks} />
        </CollapsibleSection>

        <div className="my-12">
          <Divider />
        </div>

        <CollapsibleSection id="footer-local" title="Browse by city" description={FOOTER_SECTION_INTROS.local}>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {FOOTER_LOCAL_LISTINGS.cities.map((city) => (
              <div key={city}>
                <p className="mb-3 text-sm font-medium text-neutral-800">{city}</p>
                <ul className="space-y-2">
                  {FOOTER_LOCAL_LISTINGS.services.map((service) => (
                    <li key={`${city}-${service}`}>
                      <Link
                        href={footerLocalHref(service, city)}
                        className={linkClass}
                        title={`${service} in ${city}`}
                      >
                        {service} in {city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <div className="my-12">
          <Divider />
        </div>

        <div className="max-w-5xl space-y-3">
          {FOOTER_SEO_NOTES.map((note) => (
            <p key={note} className="text-xs leading-relaxed text-neutral-500">
              {note}
            </p>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white text-xs leading-snug text-neutral-600">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <div>
                <p className="text-xs text-neutral-600">© {new Date().getFullYear()} {LEGAL_COMPANY.name}. {LEGAL_COMPANY.brand} is a brand of {LEGAL_COMPANY.name}.</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SecureSiteBadge />
                  <MadeInIndiaBadge />
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-xs text-neutral-600" aria-label="Legal">
              <Link href="/privacy" className="hover:text-neutral-900 hover:underline underline-offset-2">
                Privacy Policy
              </Link>
              <span className="hidden sm:inline-block text-neutral-300">·</span>
              <Link href="/terms" className="hover:text-neutral-900 hover:underline underline-offset-2">
                Terms & Conditions
              </Link>
              <span className="hidden sm:inline-block text-neutral-300">·</span>
              <Link href="/cancellation-refund" className="hover:text-neutral-900 hover:underline underline-offset-2">
                Cancellation & Refund
              </Link>
              <span className="hidden sm:inline-block text-neutral-300">·</span>
              <Link href="/contact" className="hover:text-neutral-900 hover:underline underline-offset-2">
                Contact Us
              </Link>
              <span className="hidden sm:inline-block text-neutral-300">·</span>
              <Link href="/shipping-delivery" className="hover:text-neutral-900 hover:underline underline-offset-2">
                Shipping & Delivery
              </Link>
              <span className="hidden sm:inline-block text-neutral-300">·</span>
              <Link href="/sitemap" className="hover:text-neutral-900 hover:underline underline-offset-2">
                Sitemap
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
