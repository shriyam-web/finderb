import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Mail, Phone, MapPin, Smartphone, Store } from 'lucide-react';
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

const SOCIAL_ICON_MAP: Record<
  FooterSocialIcon,
  typeof FaFacebook
> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  x: FaXTwitter,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
};

function Column({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 text-sm font-medium text-slate-900">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-slate-500 transition-colors hover:text-primary"
            >
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
        <li key={link.label}>
          <Link
            href={link.href}
            className="text-sm text-slate-500 transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5 max-w-3xl space-y-1">
      <h2 className="text-sm font-medium text-slate-900">{title}</h2>
      <p className="text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <span>{children}</span>
    </>
  );

  const className =
    'group flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-slate-900';

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
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm transition-all hover:scale-105 hover:shadow-md ${brandClass}`}
    >
      <Icon size={16} />
    </a>
  );
}

function MadeInIndiaBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm">
      <IndianFlagIcon className="h-3.5 w-[21px] shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/5" />
      Made in India
    </span>
  );
}

function Divider() {
  return <div className="border-t border-slate-100" />;
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
    <footer className="relative z-10 border-t border-slate-200 bg-white text-slate-600">
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
            <p className="text-sm font-medium text-slate-800">{FOOTER_TAGLINE}</p>
            <div className="max-w-xl space-y-3 text-sm leading-relaxed text-slate-500">
              <p>{FOOTER_ABOUT}</p>
              <p>{FOOTER_ABOUT_SECONDARY}</p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-900">Contact</p>
              <div className="space-y-3">
                <ContactRow icon={Mail} href={`mailto:${FOOTER_CONTACT.email}`}>
                  {FOOTER_CONTACT.email}
                </ContactRow>
                <ContactRow icon={Phone} href={FOOTER_CONTACT.phoneHref}>
                  {FOOTER_CONTACT.phone}
                </ContactRow>
                <ContactRow icon={MapPin}>{FOOTER_CONTACT.coverage}</ContactRow>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-900">Follow us</p>
              <div className="flex flex-wrap gap-2.5">
                {FOOTER_SOCIAL_LINKS.map((social) => (
                  <SocialButton key={social.label} {...social} />
                ))}
              </div>

              <div className="flex items-start gap-3 pt-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                  <Smartphone size={15} strokeWidth={1.75} />
                </span>
                <div className="space-y-2.5">
                  <p className="text-sm text-slate-500">Mobile app coming soon</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
                      <AppStoreIcon className="h-3.5 w-3.5 text-slate-800" />
                      App Store
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400">
                      <FaGooglePlay size={13} />
                      Google Play
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-12">
          <Divider />
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {FOOTER_NAV_COLUMNS.map((column) => (
            <Column key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        <div className="my-12">
          <Divider />
        </div>

        <section aria-labelledby="footer-services">
          <SectionHeader title="Services" description={FOOTER_SECTION_INTROS.services} />
          <LinkGrid links={serviceLinks} />
        </section>

        <div className="my-12">
          <Divider />
        </div>

        <section aria-labelledby="footer-professional">
          <SectionHeader
            title="Professional services"
            description={FOOTER_SECTION_INTROS.professional}
          />
          <LinkGrid links={professionalLinks} />
        </section>

        <div className="my-12">
          <Divider />
        </div>

        <section aria-labelledby="footer-b2b">
          <SectionHeader title="B2B & suppliers" description={FOOTER_SECTION_INTROS.b2b} />
          <LinkGrid links={b2bLinks} />
        </section>

        <div className="my-12">
          <Divider />
        </div>

        <section aria-labelledby="footer-cities">
          <SectionHeader title="Cities" description={FOOTER_SECTION_INTROS.cities} />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FOOTER_CITY_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-xs font-medium text-slate-400">{group.label}</p>
                <ul className="space-y-2.5">
                  {group.cities.map((city) => (
                    <li key={city}>
                      <Link
                        href={footerCityHref(city)}
                        className="text-sm text-slate-500 transition-colors hover:text-primary"
                      >
                        Businesses in {city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="my-12">
          <Divider />
        </div>

        <section aria-labelledby="footer-searches">
          <SectionHeader title="Popular searches" description={FOOTER_SECTION_INTROS.searches} />
          <LinkGrid links={searchLinks} />
        </section>

        <div className="my-12">
          <Divider />
        </div>

        <section aria-labelledby="footer-local">
          <SectionHeader title="Browse by city" description={FOOTER_SECTION_INTROS.local} />
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {FOOTER_LOCAL_LISTINGS.cities.map((city) => (
              <div key={city}>
                <p className="mb-3 text-sm font-medium text-slate-800">{city}</p>
                <ul className="space-y-2">
                  {FOOTER_LOCAL_LISTINGS.services.map((service) => (
                    <li key={`${city}-${service}`}>
                      <Link
                        href={footerLocalHref(service, city)}
                        className="text-sm text-slate-500 transition-colors hover:text-primary"
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
        </section>

        <div className="my-12">
          <Divider />
        </div>

        <div className="max-w-5xl space-y-3">
          {FOOTER_SEO_NOTES.map((note) => (
            <p key={note} className="text-xs leading-relaxed text-slate-400">
              {note}
            </p>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.06] via-white to-secondary/[0.08]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <Store size={20} strokeWidth={1.75} />
              </span>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">List your business on FinderB</p>
                <p className="max-w-xl text-sm leading-relaxed text-slate-500">
                  Free registration, local SEO visibility, and customer reviews — reach people searching in
                  your city.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
              <Link
                href="/business/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Get started free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-primary/20 hover:text-primary"
              >
                View plans
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} FinderB Technologies Pvt Ltd.
              </p>
              <MadeInIndiaBadge />
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400" aria-label="Legal">
            <Link href="/privacy" className="hover:text-slate-600">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-600">
              Terms
            </Link>
            <Link href="/policy" className="hover:text-slate-600">
              Policy
            </Link>
            <Link href="/sitemap" className="hover:text-slate-600">
              Sitemap
            </Link>
            <Link href="/contact" className="hover:text-slate-600">
              Contact
            </Link>
          </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
