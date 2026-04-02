import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Boomb | India's #1 Local Services & Business Discovery Platform",
    template: "%s | Boomb"
  },
  description: "Boomb is India's premier discovery engine for verified local services, businesses, and professionals. Explore 300+ cities to find top-rated services, movies, attractions, and more. Trusted by millions for professional excellence.",
  keywords: ["local services", "verified professionals", "business directory", "India local search", "Boomb services", "local attractions", "top-rated businesses", "premium local services", "verified businesses India", "service discovery engine"],
  authors: [{ name: "Boomb" }],
  creator: "Boomb",
  publisher: "Boomb Inc.",
  metadataBase: new URL("https://boomb.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Boomb - Discover the Best Local Services Near You",
    description: "Your gateway to professional local services and verified businesses across 300+ cities in India. Experience premium local discovery.",
    url: "https://boomb.in",
    siteName: "Boomb",
    images: [
      {
        url: "/boomb logo.png",
        width: 1200,
        height: 630,
        alt: "Boomb - India's Premier Local Discovery Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boomb - India's #1 Local Services Platform",
    description: "Find verified professionals and top-rated services in your city with Boomb. Trusted discovery for your local needs.",
    images: ["/boomb logo.png"],
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
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Boomb",
    "url": "https://boomb.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://boomb.in/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Boomb",
    "url": "https://boomb.in",
    "logo": "https://boomb.in/boomb%20logo.png",
    "description": "Boomb is India's premium local discovery platform connecting users with verified professionals and top-rated services across 300+ cities.",
    "sameAs": [
      "https://facebook.com/boomb",
      "https://twitter.com/boomb",
      "https://instagram.com/boomb",
      "https://linkedin.com/company/boomb"
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
