import { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/siteSeo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/private',
          '/dashboard',
          '/login',
          '/signup',
          '/business/dashboard',
          '/business/login',
          '/business/kyc',
          '/business/payment',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
