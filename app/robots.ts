import { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/siteSeo';

const PRIVATE_DISALLOW = [
  '/private',
  '/dashboard',
  '/login',
  '/signup',
  '/business/dashboard',
  '/business/login',
  '/business/kyc',
  '/business/payment',
  '/api/',
] as const;

/** Explicit allow rules for live AI fetch / search agents (in addition to *). */
const AI_CRAWLER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_DISALLOW],
      },
      ...AI_CRAWLER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: [...PRIVATE_DISALLOW],
      })),
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
