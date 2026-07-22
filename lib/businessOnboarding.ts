export const NEW_BUSINESS_ONBOARDING_KEY = 'finderb_new_business';
export const BUSINESS_ONBOARDING_DONE_PREFIX = 'finderb_onboarding_done:';

/** Survives React Strict Mode remounts within the same page load; cleared on full refresh. */
const onboardingStartedThisLoad = new Set<string>();

export const BUSINESS_ONBOARDING_MESSAGES = [
  'Setting up your account…',
  'Setting up professional tools…',
  'Setting up statistics…',
  'Setting up the leads center…',
  'Creating your listing…',
  'Verifying your profile…',
  'Preparing your dashboard…',
  'Almost ready…',
] as const;

export function markNewBusinessOnboarding() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(NEW_BUSINESS_ONBOARDING_KEY, '1');
  }
}

export function hasPendingBusinessOnboarding() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(NEW_BUSINESS_ONBOARDING_KEY) === '1';
}

export function consumeNewBusinessOnboarding() {
  if (typeof window === 'undefined') return false;
  const active = sessionStorage.getItem(NEW_BUSINESS_ONBOARDING_KEY) === '1';
  if (active) sessionStorage.removeItem(NEW_BUSINESS_ONBOARDING_KEY);
  return active;
}

export function hasCompletedBusinessOnboarding(businessId: string) {
  if (typeof window === 'undefined' || !businessId) return false;
  try {
    return localStorage.getItem(`${BUSINESS_ONBOARDING_DONE_PREFIX}${businessId}`) === '1';
  } catch {
    return false;
  }
}

export function markBusinessOnboardingComplete(businessId: string) {
  if (typeof window === 'undefined' || !businessId) return;
  try {
    localStorage.setItem(`${BUSINESS_ONBOARDING_DONE_PREFIX}${businessId}`, '1');
  } catch {
    /* ignore quota / private mode */
  }
  try {
    sessionStorage.removeItem(NEW_BUSINESS_ONBOARDING_KEY);
  } catch {
    /* ignore */
  }
}

export function beginBusinessOnboardingThisLoad(businessId: string) {
  if (!businessId) return false;
  if (onboardingStartedThisLoad.has(businessId)) return true;
  onboardingStartedThisLoad.add(businessId);
  return false;
}

export function isBusinessOnboardingActiveThisLoad(businessId: string) {
  return Boolean(businessId) && onboardingStartedThisLoad.has(businessId);
}
