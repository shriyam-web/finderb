import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import { getRootStructuredData, rootSiteMetadata } from "@/lib/siteSeo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

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
  verification: {
    google: "google-site-verification-placeholder",
  },
};

const jsonLd = getRootStructuredData();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <head>
        <link href="https://fonts.cdnfonts.com/css/google-sans" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        <LayoutClient>
          {children}
        </LayoutClient>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
