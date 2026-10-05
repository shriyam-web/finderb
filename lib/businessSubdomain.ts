const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://finderb.com';

const BUSINESS_SUBDOMAIN_HOSTS = new Set([
  'business.finderb.com',
  'www.business.finderb.com',
]);

function requestHost(value: string | null): string {
  return (value || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
}

function keepSamePath(pathname: string): boolean {
  return (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/.well-known') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

export function isBusinessSubdomainHost(hostHeader: string | null): boolean {
  return BUSINESS_SUBDOMAIN_HOSTS.has(requestHost(hostHeader));
}

/** Map a business.finderb.com path onto the main FinderB business site. */
export function businessSubdomainPath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/business') return '/business/list';
  if (keepSamePath(path) || path.startsWith('/business/')) return path;
  return `/business${path.startsWith('/') ? path : `/${path}`}`;
}

export function businessSubdomainDestination(
  hostHeader: string | null,
  pathname: string,
  search = '',
): string | null {
  if (!isBusinessSubdomainHost(hostHeader)) return null;
  return `${SITE_URL}${businessSubdomainPath(pathname)}${search}`;
}
