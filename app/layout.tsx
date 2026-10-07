import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import { effectiveSiteMode, getSiteRuntime } from "@/lib/siteRuntime";
import { getRootStructuredData, rootSiteMetadata } from "@/lib/siteSeo";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

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

const jsonLd = getRootStructuredData();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtime = await getSiteRuntime();
  const mode = effectiveSiteMode(runtime);
  const htmlClass = [
    inter.variable,
    mode === "maintenance" ? "" : outfit.variable,
    "h-full antialiased",
    mode === "text_only" ? "site-text-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={htmlClass}>
      <head>
        {mode !== "maintenance" && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        {mode === "maintenance" ? (
          <MaintenanceScreen runtime={runtime} />
        ) : (
          <LayoutClient>{children}</LayoutClient>
        )}
        {mode !== "maintenance" && <ServiceWorkerRegister />}
      </body>
    </html>
  );
}
