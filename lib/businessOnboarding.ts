export const NEW_BUSINESS_ONBOARDING_KEY = 'finderb_new_business';

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

export function consumeNewBusinessOnboarding() {
  if (typeof window === 'undefined') return false;
  const active = sessionStorage.getItem(NEW_BUSINESS_ONBOARDING_KEY) === '1';
  if (active) sessionStorage.removeItem(NEW_BUSINESS_ONBOARDING_KEY);
  return active;
}
