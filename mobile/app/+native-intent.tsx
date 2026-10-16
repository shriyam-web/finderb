const WEBSITE_BUSINESS_PAGES = new Set([
  'login',
  'dashboard',
  'kyc',
  'list',
  'payment',
  'support-login',
  'onboarding-preview',
]);

/** finderb.com/business/login etc. are website pages, not storefront slugs. */
function websiteBusinessRoute(pathname: string): string | null {
  const invite = pathname.match(/^\/business\/invite\/([^/?#]+)/i);
  if (invite?.[1]) return `/business-invite/${decodeURIComponent(invite[1])}`;
  const section = pathname.match(/^\/business\/([^/?#]+)/)?.[1]?.toLowerCase();
  if (!section) return null;
  if (section === 'register') return '/business-register';
  return WEBSITE_BUSINESS_PAGES.has(section) ? '/business-app' : null;
}

/**
 * Rewrite incoming system / deep-link paths into Expo Router routes.
 * Must never throw — a bad redirect on cold start can close or break the app.
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  void initial;
  try {
    const raw = (path || '/').trim() || '/';

    // Expo sometimes already passes an in-app path.
    if (raw.startsWith('/') && !raw.startsWith('//')) {
      // Bad rewrite leftover: finderb://auth/callback → /callback?...
      if (
        (raw === '/callback' || raw.startsWith('/callback?') || raw.startsWith('/callback#')) &&
        /[?&#](code|access_token)=/i.test(raw)
      ) {
        return `/auth${raw}`;
      }
      const website = websiteBusinessRoute(raw);
      if (website) return website;
      const reviewPath = raw.match(/^\/review\/([^/?#]+)\/?([?#][\s\S]*)?$/);
      if (reviewPath?.[1]) {
        return `/review/${decodeURIComponent(reviewPath[1])}${reviewPath[2] || ''}`;
      }
      const businessPath = raw.match(/^\/business\/([^/?#]+)\/?([?#][\s\S]*)?$/);
      if (businessPath?.[1]) {
        return `/merchant/${decodeURIComponent(businessPath[1])}${businessPath[2] || ''}`;
      }
      return raw;
    }

    // Google OAuth app callback: finderb://auth/callback?...
    // URL parser treats "auth" as hostname and "/callback" as pathname.
    const oauthApp = raw.match(
      /^finderb:\/\/auth\/callback([?#][\s\S]*)?$/i,
    );
    if (oauthApp) {
      return `/auth/callback${oauthApp[1] || ''}`;
    }

    // Triple-slash form: finderb:///auth/callback?...
    const oauthAppSlash = raw.match(
      /^finderb:\/\/\/auth\/callback([?#][\s\S]*)?$/i,
    );
    if (oauthAppSlash) {
      return `/auth/callback${oauthAppSlash[1] || ''}`;
    }

    // Custom scheme business links: finderb://business/slug or finderb://merchant/slug
    const schemeBusiness = raw.match(
      /^finderb:\/\/(?:\/)?(?:business|merchant)\/([^/?#]+)([?#][\s\S]*)?$/i,
    );
    if (schemeBusiness?.[1]) {
      return `/merchant/${decodeURIComponent(schemeBusiness[1])}${schemeBusiness[2] || ''}`;
    }

    const schemeReview = raw.match(
      /^finderb:\/\/(?:\/)?review\/([^/?#]+)([?#][\s\S]*)?$/i,
    );
    if (schemeReview?.[1]) {
      return `/review/${decodeURIComponent(schemeReview[1])}${schemeReview[2] || ''}`;
    }

    // Custom scheme blog links: finderb://blog/slug
    const schemeBlog = raw.match(
      /^finderb:\/\/(?:\/)?blog\/([^/?#]+)([?#][\s\S]*)?$/i,
    );
    if (schemeBlog?.[1]) {
      return `/blog/${decodeURIComponent(schemeBlog[1])}${schemeBlog[2] || ''}`;
    }

    const url = new URL(raw, 'https://finderb.com');

    // finderb://auth/callback parsed via URL API
    if (
      url.protocol === 'finderb:' &&
      url.hostname === 'auth' &&
      (url.pathname === '/callback' || url.pathname === '' || url.pathname === '/')
    ) {
      return `/auth/callback${url.search}${url.hash}`;
    }

    // finderb://business/slug or finderb://merchant/slug
    if (
      url.protocol === 'finderb:' &&
      (url.hostname === 'business' || url.hostname === 'merchant')
    ) {
      const slug = url.pathname.replace(/^\//, '');
      const inviteToken =
        url.hostname === 'business' ? slug.match(/^invite\/([^/?#]+)/i)?.[1] : undefined;
      if (inviteToken) {
        return `/business-invite/${decodeURIComponent(inviteToken)}`;
      }
      if (slug) {
        return `/merchant/${decodeURIComponent(slug.split('/')[0])}${url.search}${url.hash}`;
      }
    }

    if (url.protocol === 'finderb:' && url.hostname === 'review') {
      const slug = url.pathname.replace(/^\//, '');
      if (slug) {
        return `/review/${decodeURIComponent(slug)}${url.search}${url.hash}`;
      }
    }

    // finderb://blog/slug
    if (url.protocol === 'finderb:' && url.hostname === 'blog') {
      const slug = url.pathname.replace(/^\//, '');
      if (slug) {
        return `/blog/${decodeURIComponent(slug)}${url.search}${url.hash}`;
      }
    }

    if (url.protocol === 'finderb:' && url.pathname.startsWith('/auth/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    const reviewMatch = url.pathname.match(/^\/review\/([^/]+)\/?$/);
    if (reviewMatch?.[1]) {
      return `/review/${decodeURIComponent(reviewMatch[1])}${url.search}${url.hash}`;
    }

    const websiteRoute = websiteBusinessRoute(url.pathname);
    if (websiteRoute) return websiteRoute;

    const businessMatch = url.pathname.match(/^\/business\/([^/]+)\/?$/);
    if (businessMatch?.[1]) {
      return `/merchant/${decodeURIComponent(businessMatch[1])}${url.search}${url.hash}`;
    }

    const blogMatch = url.pathname.match(/^\/blog\/([^/]+)\/?$/);
    if (blogMatch?.[1]) {
      return `/blog/${decodeURIComponent(blogMatch[1])}${url.search}${url.hash}`;
    }

    // HTTPS mobile OAuth bridge opened inside the app somehow
    if (url.pathname === '/auth/mobile-callback' || url.pathname.startsWith('/auth/')) {
      if (url.pathname === '/auth/mobile-callback') {
        return `/auth/callback${url.search}${url.hash}`;
      }
      return `${url.pathname}${url.search}${url.hash}`;
    }

    // Don't invent routes from unknown custom-scheme hosts (causes Unmatched Route).
    if (url.protocol === 'finderb:') {
      return '/';
    }
  } catch {
    // keep original path
  }
  return path || '/';
}
