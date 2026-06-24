export type OAuthProviderId = 'google' | 'github' | 'apple' | 'facebook';

export type OAuthProviderConfig = {
  id: OAuthProviderId;
  label: string;
  signupLabel: string;
  /** Tailwind classes for button styling */
  buttonClass: string;
  iconClass: string;
};

export const OAUTH_PROVIDER_CONFIG: Record<OAuthProviderId, OAuthProviderConfig> = {
  google: {
    id: 'google',
    label: 'Continue with Google',
    signupLabel: 'Sign up with Google',
    buttonClass:
      'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md',
    iconClass: 'text-[#4285F4]',
  },
  apple: {
    id: 'apple',
    label: 'Continue with Apple',
    signupLabel: 'Sign up with Apple',
    buttonClass: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md',
    iconClass: 'text-white',
  },
  github: {
    id: 'github',
    label: 'Continue with GitHub',
    signupLabel: 'Sign up with GitHub',
    buttonClass:
      'border-slate-800 bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md',
    iconClass: 'text-white',
  },
  facebook: {
    id: 'facebook',
    label: 'Continue with Facebook',
    signupLabel: 'Sign up with Facebook',
    buttonClass:
      'border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#166FE5] hover:shadow-md',
    iconClass: 'text-white',
  },
};

const DEFAULT_ENABLED: OAuthProviderId[] = ['google', 'apple', 'github'];

export function getEnabledOAuthProviders(): OAuthProviderConfig[] {
  const raw = process.env.NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS?.trim();
  const ids = (raw ? raw.split(',') : DEFAULT_ENABLED)
    .map((id) => id.trim().toLowerCase())
    .filter((id): id is OAuthProviderId => id in OAUTH_PROVIDER_CONFIG);

  return ids.map((id) => OAUTH_PROVIDER_CONFIG[id]);
}

export function isOAuthEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
      getEnabledOAuthProviders().length > 0
  );
}
