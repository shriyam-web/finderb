import type { Metadata } from "next";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import { inter, outfit } from "@/lib/fonts";
import { effectiveSiteMode, getSiteRuntime } from "@/lib/siteRuntime";
import { getSiteConfig, publicSiteConfig } from "@/lib/siteConfig";
import type { SiteConfig } from "@/lib/siteConfigShared";
import { getRootStructuredData, rootSiteMetadata } from "@/lib/siteSeo";
import { serializeJsonLd } from "@/components/JsonLd";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

/** Home, business profiles, and the shared layout all refresh within 15 minutes. */
export const revalidate = 900;

export const metadata: Metadata = {
  ...rootSiteMetadata,
  keywords: [
    "local services",
    "verified professionals",
    "business directory",
    "India local search",
    "FinderB services",
    "local attractions",
    "top-rated businesses",
    "premium local services",
    "verified businesses India",
    "service discovery engine",
  ],
  ...(googleSiteVerification
    ? {
        verification: {
          google: googleSiteVerification,
        },
      }
    : {}),
};

function siteJsonLd(config: SiteConfig) {
  const data = getRootStructuredData();
  const organization = data['@graph'][0] as {
    legalName?: string;
    contactPoint?: Record<string, unknown>;
  };
  organization.legalName = config.contact.companyName;
  organization.contactPoint = {
    '@type': 'ContactPoint',
    ...(config.contact.showPhone ? { telephone: config.contact.phone } : {}),
    email: config.contact.email,
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['en', 'hi'],
  };
  return data;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtime = await getSiteRuntime();
  const siteConfig = await getSiteConfig();
  const publicConfig = {
    ...publicSiteConfig(siteConfig),
    billing: { razorpayMonthlyPlanId: null },
  } satisfies SiteConfig;
  const jsonLd = siteJsonLd(siteConfig);
  const mode = effectiveSiteMode(runtime);
  const mediaCdnHost = (process.env.FINDERB_MEDIA_CDN_HOST || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const htmlClass = [
    inter.variable,
    outfit.variable,
    "h-full antialiased",
    mode === "text_only" ? "site-text-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(document.cookie.indexOf('finderb_splash=')!==-1)return;var p=location.pathname;if(p==='/'||p==='/verify-phone'||p==='/business/onboarding-preview'||p==='/dashboard'||p.indexOf('/dashboard/')===0||p==='/business/dashboard'||p.indexOf('/business/dashboard/')===0||p.indexOf('/business/list')===0||p.indexOf('/business/kyc/')===0)return;if(p==='/categories'||(p.indexOf('/categories/')===0&&p.indexOf('/categories/job')!==0))return;if(p.indexOf('/business/')===0){var slug=p.slice('/business/'.length).split('/')[0];if(slug&&['login','register','dashboard','list','payment','kyc'].indexOf(slug)===-1&&p.split('/').length===3)return;}document.documentElement.classList.add('finderb-splash-on');}catch(e){}})();`,
          }}
        />
        {mediaCdnHost ? (
          <>
            <link rel="preconnect" href={`https://${mediaCdnHost}`} />
            <link rel="dns-prefetch" href={`https://${mediaCdnHost}`} />
          </>
        ) : null}
        {mode !== "maintenance" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        {mode === "maintenance" ? (
          <MaintenanceScreen runtime={runtime} />
        ) : (
          <LayoutClient siteConfig={publicConfig}>{children}</LayoutClient>
        )}
        {mode !== "maintenance" && <ServiceWorkerRegister />}
      </body>
    </html>
  );
}
