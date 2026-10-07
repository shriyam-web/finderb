import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';

export const VERIFY_MOBILE_PATH = '/verify-phone';

/** Pages a signed-in user can still open before adding a mobile number. */
const OPEN_PATHS = [
  VERIFY_MOBILE_PATH,
  '/login',
  '/signup',
  '/auth',
  '/account-deletion',
  '/privacy',
  '/terms',
  '/policy',
  '/data-safety',
  '/business/login',
  '/business/register',
];

type GateUser = { phone?: string | null; isBusinessAccount?: boolean | null } | null | undefined;

/** Customer accounts (Google or email sign-ups) need a verified mobile; business logins already have one. */
export function needsMobileNumber(user: GateUser): boolean {
  if (!user || user.isBusinessAccount) return false;
  return !isValidIndianMobileDigits(extractIndianMobileDigits(user.phone || ''));
}

export function isMobileGateOpenPath(pathname: string | null | undefined): boolean {
  const path = pathname || '/';
  return OPEN_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function verifyMobileHref(next: string): string {
  return `${VERIFY_MOBILE_PATH}?next=${encodeURIComponent(next)}`;
}
