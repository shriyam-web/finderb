import type { Href } from 'expo-router';
import type { Ionicons } from '@expo/vector-icons';
import { LISTING_SECTIONS, listingDetailRows } from '../components/console/listingSections';
import type { ConsoleOverview, MissingField } from './merchantConsoleApi';
import { TEAM_TABS } from './teamAccess';

export type ConsoleSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  keywords: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  group: string;
};

const ALIASES: Record<string, string[]> = {
  team: ['team', 'teammate', 'staff'],
  teams: ['team'],
  teammate: ['team'],
  teammates: ['team'],
  staff: ['team', 'invite'],
  employee: ['team'],
  employees: ['team'],
  invite: ['invite', 'team'],
  invitation: ['invite', 'team'],
  access: ['access', 'team'],
  rights: ['access', 'team'],
  billing: ['plan', 'billing', 'pay'],
  pay: ['plan', 'pay'],
  payment: ['plan', 'pay'],
  invoice: ['plan', 'billing'],
  subscription: ['plan'],
  logout: ['logout'],
  password: ['password', 'login'],
  kyc: ['kyc', 'identity'],
  qr: ['qr'],
  photo: ['photo', 'photos', 'image'],
  photos: ['photo'],
  appearance: ['appearance', 'theme'],
  theme: ['appearance', 'theme'],
  dark: ['appearance', 'theme'],
  security: ['login', 'security', 'password', 'team'],
  login: ['login', 'security'],
  more: ['more'],
};

function haystack(hit: ConsoleSearchHit) {
  return `${hit.title} ${hit.subtitle} ${hit.keywords}`.toLowerCase();
}

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1);
}

function alternatives(token: string) {
  const extra = ALIASES[token];
  return extra ? Array.from(new Set([token, ...extra])) : [token];
}

function tokenHits(hay: string, title: string, token: string) {
  if (!token) return 0;
  if (title === token) return 100;
  if (title.startsWith(`${token} `) || title.startsWith(token)) return 70;
  if (` ${title} `.includes(` ${token} `)) return 50;
  if (title.includes(token)) return 32;
  const words = hay.split(/[^a-z0-9]+/);
  if (words.includes(token)) return 22;
  if (words.some((word) => word.startsWith(token))) return 16;
  if (hay.includes(token)) return 10;
  return 0;
}

function scoreHit(hit: ConsoleSearchHit, tokens: string[]) {
  const title = hit.title.toLowerCase();
  const hay = haystack(hit);
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const alt of alternatives(token)) {
      best = Math.max(best, tokenHits(hay, title, alt));
    }
    if (best <= 0) return -1;
    score += best;
  }
  return score;
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

const TEAM_HREF = { pathname: '/business-console/account', params: { focus: 'team' } } as Href;

export function consoleSearchPages(overview: ConsoleOverview): ConsoleSearchHit[] {
  const shop = overview.business.name || 'Your listing';
  const plan = overview.subscription.planName || 'Plan';
  const merchantId = overview.business.registrationNumber || '';
  const teamWords = TEAM_TABS.map((tab) => `${tab.label} ${tab.hint}`).join(' ');
  return [
    {
      id: 'page-home',
      title: 'Home',
      subtitle: 'Dashboard',
      keywords: 'home dashboard overview start performance insights',
      icon: 'home-outline',
      href: '/business-console',
      group: 'Pages',
    },
    {
      id: 'page-leads',
      title: 'Leads',
      subtitle: `${overview.stats.leadsNew} new · ${overview.stats.leadsTotal} total`,
      keywords: 'leads enquiries customers calls messages contact pipeline won conversion',
      icon: 'people-outline',
      href: '/business-console/leads',
      group: 'Pages',
    },
    {
      id: 'page-listing',
      title: 'My Business',
      subtitle: shop,
      keywords: `listing profile storefront shop details my business ${shop} ${overview.profile.displayName} ${overview.business.category} merchant id ${merchantId}`,
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
      keywords: 'reviews ratings stars replies feedback qr card flag',
      icon: 'star-outline',
      href: '/business-console/reviews',
      group: 'Pages',
    },
    {
      id: 'page-plan',
      title: 'Plan and billing',
      subtitle: overview.subscription.isActive ? `${plan} · active` : 'Free plan',
      keywords: 'plan billing subscription pay razorpay renew upgrade pro payment invoice auto debit more menu',
      icon: 'card-outline',
      href: '/business-console/subscription',
      group: 'Pages',
    },
    {
      id: 'page-photos',
      title: 'Photos',
      subtitle: `${overview.photos.images.length} photo${overview.photos.images.length === 1 ? '' : 's'}`,
      keywords: 'photos gallery images cover camera media listing picture',
      icon: 'images-outline',
      href: '/business-console/photos',
      group: 'Pages',
    },
    {
      id: 'page-jobs',
      title: 'Jobs',
      subtitle: overview.stats.activeJobs ? `${overview.stats.activeJobs} open` : 'Hiring',
      keywords: 'jobs hiring vacancies careers recruitment more menu',
      icon: 'briefcase-outline',
      href: '/business-console/jobs',
      group: 'Pages',
    },
    {
      id: 'page-alerts',
      title: 'Notifications',
      subtitle: overview.notifications.unread ? `${overview.notifications.unread} unread` : 'Alerts',
      keywords: 'notifications alerts inbox messages bell',
      icon: 'notifications-outline',
      href: '/business-console/alerts',
      group: 'Pages',
    },
    {
      id: 'page-account',
      title: 'Login and security',
      subtitle: overview.business.emailVerified && overview.business.mobileVerified ? 'Verified' : 'Verify email or mobile',
      keywords:
        'login security password kyc verify email mobile account owner more menu team access invite staff teammate employee',
      icon: 'shield-checkmark-outline',
      href: '/business-console/account',
      group: 'Pages',
    },
    {
      id: 'page-team',
      title: 'Team access',
      subtitle: 'Invite staff and set tab rights',
      keywords: `team access invite teammate staff employee member rights view edit tabs login security more menu password share ${teamWords}`,
      icon: 'person-add-outline',
      href: TEAM_HREF,
      group: 'Pages',
    },
    {
      id: 'page-invite',
      title: 'Invite staff',
      subtitle: 'Email or mobile invitation · Team access',
      keywords: 'invite staff teammate employee team access email mobile phone invitation link more menu',
      icon: 'mail-outline',
      href: TEAM_HREF,
      group: 'Pages',
    },
    {
      id: 'page-password',
      title: 'Change password',
      subtitle: 'Login and security',
      keywords: 'change password login security account',
      icon: 'key-outline',
      href: '/business-console/account',
      group: 'Pages',
    },
    {
      id: 'page-kyc',
      title: 'Identity check (KYC)',
      subtitle: 'Login and security',
      keywords: 'kyc identity verification aadhaar pan documents account',
      icon: 'shield-outline',
      href: '/business-console/account',
      group: 'Pages',
    },
    {
      id: 'page-more',
      title: 'More',
      subtitle: 'Account, appearance, log out',
      keywords: 'more menu settings appearance theme logout dark light browse finderb',
      icon: 'menu-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    {
      id: 'page-qr',
      title: 'FinderB review card',
      subtitle: 'QR code and download',
      keywords: 'qr review card poster print share more menu',
      icon: 'qr-code-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    {
      id: 'page-preview',
      title: 'Preview storefront',
      subtitle: 'See your public listing',
      keywords: 'preview storefront public listing customer view more menu',
      icon: 'eye-outline',
      href: { pathname: '/(tabs)/merchant/[id]', params: { id: overview.business.id, preview: '1' } },
      group: 'Pages',
    },
    {
      id: 'page-appearance',
      title: 'Appearance',
      subtitle: 'Light, dark, or system',
      keywords: 'appearance theme dark light system more menu',
      icon: 'color-palette-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    {
      id: 'page-browse',
      title: 'Browse FinderB',
      subtitle: 'Open the customer app',
      keywords: 'browse finderb customer app more menu',
      icon: 'compass-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    {
      id: 'page-logout',
      title: 'Log out',
      subtitle: 'Sign out of FinderB Business',
      keywords: 'logout log out sign out exit more menu',
      icon: 'log-out-outline',
      href: '/business-console/more',
      group: 'Pages',
    },
    ...(merchantId
      ? [
          {
            id: 'page-merchant-id',
            title: merchantId,
            subtitle: 'Merchant ID',
            keywords: `merchant id finder registration business id ${merchantId}`,
            icon: 'finger-print-outline' as const,
            href: '/business-console/listing' as Href,
            group: 'Listing',
          },
        ]
      : []),
    ...LISTING_SECTIONS.map((section) => ({
      id: `listing-${section.key}`,
      title: section.title,
      subtitle: 'Edit listing',
      keywords: `${section.title} ${section.fields.join(' ')} edit listing my business`,
      icon: section.icon,
      href: editHref(section.key),
      group: 'Listing',
    })),
    ...listingDetailRows(overview).map((row) => ({
      id: `field-${row.section}-${row.label}`,
      title: row.label,
      subtitle: row.value,
      keywords: `${row.label} ${row.value} ${row.section} listing field`,
      icon: 'create-outline' as const,
      href: editHref(row.section),
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
  const health = overview.health.items.slice(0, 8).map((item) => ({
    id: `health-${item.id}`,
    title: item.label,
    subtitle: item.detail.slice(0, 80),
    keywords: `listing health ${item.label} ${item.detail} ${item.status}`,
    icon: 'pulse-outline' as const,
    href: '/business-console/listing' as Href,
    group: 'Listing',
  }));
  return [...leads, ...reviews, ...missing, ...alerts, ...health];
}

export function searchConsole(query: string, overview: ConsoleOverview): ConsoleSearchHit[] {
  const tokens = tokenize(query);
  const pages = consoleSearchPages(overview);
  if (!tokens.length) return pages.filter((item) => item.group === 'Pages').slice(0, 16);
  const seen = new Set<string>();
  return [...pages, ...consoleSearchLive(overview)]
    .map((item) => ({ item, score: scoreHit(item, tokens) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .filter((row) => {
      if (seen.has(row.item.id)) return false;
      seen.add(row.item.id);
      return true;
    })
    .slice(0, 32)
    .map((row) => row.item);
}
