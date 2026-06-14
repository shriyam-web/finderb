import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "FinderB | India's #1 Local Services & Business Discovery Platform",
    template: "%s | FinderB"
  },
  description: "FinderB is India's premier discovery engine for verified local services, businesses, and professionals. Explore 300+ cities to find top-rated services, movies, attractions, and more. Trusted by millions for professional excellence.",
  keywords: ["local services", "verified professionals", "business directory", "India local search", "FinderB services", "local attractions", "top-rated businesses", "premium local services", "verified businesses India", "service discovery engine"],
  authors: [{ name: "FinderB" }],
  creator: "FinderB",
  publisher: "FinderB Inc.",
  metadataBase: new URL("https://finderb.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FinderB - Discover the Best Local Services Near You",
    description: "Your gateway to professional local services and verified businesses across 300+ cities in India. Experience premium local discovery.",
    url: "https://finderb.com",
    siteName: "FinderB",
    images: [
      {
        url: "/logo1.png",
        width: 1200,
        height: 630,
        alt: "FinderB - India's Premier Local Discovery Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinderB - India's #1 Local Services Platform",
    description: "Find verified professionals and top-rated services in your city with FinderB. Trusted discovery for your local needs.",
    images: ["/logo1.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-placeholder", // User should replace this
  },
  category: "Business",
  appleWebApp: {
    capable: true,
    title: "FinderB",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FinderB",
    "url": "https://finderb.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://finderb.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FinderB",
    "url": "https://finderb.com",
    "logo": "https://finderb.com/logo1.png",
    "description": "FinderB is India's premium local discovery platform connecting users with verified professionals and top-rated services across 300+ cities.",
    "sameAs": [
      "https://facebook.com/finderb",
      "https://twitter.com/finderb",
      "https://instagram.com/finderb",
      "https://linkedin.com/company/finderb"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-000-0000000",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  }
];

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
