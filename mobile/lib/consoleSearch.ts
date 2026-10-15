import type { Href } from 'expo-router';
import type { Ionicons } from '@expo/vector-icons';
import { LISTING_SECTIONS } from '../components/console/listingSections';
import type { ConsoleOverview, MissingField } from './merchantConsoleApi';

export type ConsoleSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  group: string;
};

function haystack(hit: ConsoleSearchHit) {
  return `${hit.title} ${hit.subtitle} ${hit.keywords}`.toLowerCase();
}

function matches(hit: ConsoleSearchHit, tokens: string[]) {
  if (!tokens.length) return true;
  const hay = haystack(hit);
  return tokens.every((token) => hay.includes(token));
}

function editHref(section: string): Href {
  return { pathname: '/business-console/edit', params: { section } } as Href;
}

function missingHref(field: MissingField): Href {
  if (field.key === 'profilePictureUrl') return '/business-console/photos';
  if (field.action === 'kyc' || ['businessName', 'category', 'publicPhone'].includes(field.key)) {
    return '/business-console/account';
  }
  const section = LISTING_SECTIONS.find((item) => item.fields.includes(field.key));
  return section ? editHref(section.key) : '/business-console/listing';
}

export function consoleSearchPages(overview: ConsoleOverview): ConsoleSearchHit[] {
  const shop = overview.business.name || 'Your listing';
  const plan = overview.subscription.planName || 'Plan';
  return [
    {
      id: 'page-home',
      title: 'Home',
      subtitle: 'Dashboard',
      keywords: 'home dashboard overview start',
      icon: 'home-outline',
      href: '/business-console',
      group: 'Pages',
    },
    {
      id: 'page-leads',
      title: 'Leads',
      subtitle: `${overview.stats.leadsNew} new · ${overview.stats.leadsTotal} total`,
      keywords: 'leads enquiries customers calls messages contact pipeline',
      icon: 'people-outline',
      href: '/business-console/leads',
      group: 'Pages',
    },
    {
      id: 'page-listing',
      title: shop,
      subtitle: 'My listing',
      keywords: `listing profile storefront shop details ${shop} ${overview.profile.displayName} ${overview.business.category}`,
      icon: 'storefront-outline',
      href: '/business-console/listing',
      group: 'Pages',
    },
    {
      id: 'page-reviews',
      title: 'Reviews',
      subtitle: overview.stats.reviewsAwaitingReply
        ? `${overview.stats.reviewsAwaitingReply} waiting for a reply`
        : `${overview.stats.reviewCount} reviews`,
      keywords: 'reviews ratings stars replies feedback',
      icon: 'star-outline',
      href: '/business-console/reviews',
      group: 'Pages',
    },
    {
      id: 'page-plan',
      title: 'Plan & billing',
      subtitle: overview.subscription.isActive ? `${plan} · active` : 'Free plan',
      keywords: 'plan billing subscription pay razorpay renew upgrade pro payment invoice',
      icon: 'card-outline',
      href: '/business-console/subscription',
      group: 'Pages',
    },
    {
      id: 'page-photos',
      title: 'Photos',
      subtitle: `${overview.photos.images.length} photo${overview.photos.images.length === 1 ? '' : 's'}`,
      keywords: 'photos gallery images cover camera media',
      icon: 'images-outline',
      href: '/business-console/photos',
      group: 'Pages',
    },
    {
      id: 'page-jobs',
      title: 'Jobs',
      subtitle: overview.stats.activeJobs ? `${overview.stats.activeJobs} open` : 'Hiring',
      keywords: 'jobs hiring vacancies careers recruitment',
      icon: 'briefcase-outline',
      href: '/business-console/jobs',
      group: 'Pages',
    },
    {
      id: 'page-alerts',
      title: 'Notifications',
      subtitle: overview.notifications.unread ? `${overview.notifications.unread} unread` : 'Alerts',
      keywords: 'notifications alerts inbox messages',
      icon: 'notifications-outline',
      href: '/business-console/alerts',
      group: 'Pages',
    },
    {
      id: 'page-account',
      title: 'Login & security',
      subtitle: overview.business.emailVerified && overview.business.mobileVerified ? 'Verified' : 'Verify email or mobile',
      keywords: 'login security password kyc verify email mobile account owner',
      icon: 'shield-checkmark-outline',
      href: '/business-console/account',
      group: 'Pages',
    },
    {
      id: 'page-more',
      title: 'More',
      subtitle: 'Account, appearance, log out',
      keywords: 'more menu settings appearance theme logout dark light',
      icon: 'menu-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    {
      id: 'page-qr',
      title: 'FinderB review card',
      subtitle: 'QR code and download',
      keywords: 'qr review card poster print share',
      icon: 'qr-code-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    {
      id: 'page-preview',
      title: 'Preview storefront',
      subtitle: 'See your public listing',
      keywords: 'preview storefront public listing customer view',
      icon: 'eye-outline',
      href: { pathname: '/(tabs)/merchant/[id]', params: { id: overview.business.id, preview: '1' } },
      group: 'Pages',
    },
    ...LISTING_SECTIONS.map((section) => ({
      id: `listing-${section.key}`,
      title: section.title,
      subtitle: 'Edit listing',
      keywords: `${section.title} ${section.fields.join(' ')} edit listing`,
      icon: section.icon,
      href: editHref(section.key),
      group: 'Listing',
    })),
  ];
}

export function consoleSearchLive(overview: ConsoleOverview): ConsoleSearchHit[] {
  const leads = overview.leads.slice(0, 12).map((lead) => ({
    id: `lead-${lead.id}`,
    title: lead.name || 'Lead',
    subtitle: [lead.phone, lead.category, lead.message].filter(Boolean).join(' · ') || 'Open leads',
    keywords: `lead enquiry customer ${lead.name} ${lead.phone || ''} ${lead.email || ''} ${lead.message || ''} ${lead.status}`,
    icon: 'person-outline' as const,
    href: '/business-console/leads' as Href,
    group: 'Leads',
  }));
  const reviews = overview.reviews.slice(0, 8).map((review) => ({
    id: `review-${review.id}`,
    title: `${review.rating}★ ${review.author}`,
    subtitle: (review.content || 'Review').slice(0, 80),
    keywords: `review rating ${review.author} ${review.content || ''}`,
    icon: 'chatbubble-ellipses-outline' as const,
    href: { pathname: '/business-console/reviews', params: { reviewId: review.id } } as Href,
    group: 'Reviews',
  }));
  const missing = overview.completion.missing.slice(0, 8).map((field) => ({
    id: `missing-${field.key}`,
    title: field.label,
    subtitle: 'Missing on your listing',
    keywords: `missing incomplete ${field.label} ${field.key}`,
    icon: 'add-circle-outline' as const,
    href: missingHref(field),
    group: 'Listing',
  }));
  const alerts = overview.notifications.items.slice(0, 6).map((item) => ({
    id: `alert-${item.id}`,
    title: item.title,
    subtitle: item.body.slice(0, 80),
    keywords: `notification alert ${item.title} ${item.body} ${item.type}`,
    icon: 'notifications-outline' as const,
    href: '/business-console/alerts' as Href,
    group: 'Alerts',
  }));
  return [...leads, ...reviews, ...missing, ...alerts];
}

export function searchConsole(query: string, overview: ConsoleOverview): ConsoleSearchHit[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const pages = consoleSearchPages(overview);
  if (!tokens.length) return pages.filter((item) => item.group === 'Pages').slice(0, 10);
  const hits = [...pages, ...consoleSearchLive(overview)].filter((item) => matches(item, tokens));
  return hits.slice(0, 16);
}
