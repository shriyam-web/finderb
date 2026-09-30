'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebook, FaGithub } from 'react-icons/fa';
import { createClient } from '@/utils/supabase/client';
import {
  getEnabledOAuthProviders,
  type OAuthProviderConfig,
  type OAuthProviderId,
} from '@/lib/auth/oauthProviders';
import { getSafeRedirectPath } from '@/lib/authRedirect';

const PROVIDER_ICONS: Record<OAuthProviderId, React.ComponentType<{ className?: string }>> = {
  google: FcGoogle,
  apple: FaApple,
  github: FaGithub,
  facebook: FaFacebook,
};

type OAuthButtonGroupProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
  onError?: (message: string) => void;
  /** Limit which configured providers render. User auth shows Google only. */
  only?: OAuthProviderId[];
};

export default function OAuthButtonGroup({
  mode,
  redirectPath = '/dashboard',
  onError,
  only,
}: OAuthButtonGroupProps) {
  const providers = getEnabledOAuthProviders().filter((provider) =>
    only ? only.includes(provider.id) : true,
  );
  const [loadingProvider, setLoadingProvider] = useState<OAuthProviderId | null>(null);

  if (!providers.length) return null;

  const startOAuth = async (provider: OAuthProviderConfig) => {
    setLoadingProvider(provider.id);
    onError?.('');

    try {
      const supabase = createClient();
      const next = getSafeRedirectPath(redirectPath);
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.id,
        options: {
          redirectTo,
          ...(provider.id === 'google'
            ? { queryParams: { access_type: 'online', prompt: 'select_account' } }
            : {}),
        },
      });

      if (error) {
        onError?.(error.message || `Could not start ${provider.label}.`);
        setLoadingProvider(null);
      }
    } catch {
      onError?.('Could not connect to the sign-in provider. Please try again.');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {providers.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.id];
        const label = mode === 'signup' ? provider.signupLabel : provider.label;
        const isLoading = loadingProvider === provider.id;

        return (
          <button
            key={provider.id}
            type="button"
            disabled={Boolean(loadingProvider)}
            onClick={() => void startOAuth(provider)}
            className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${provider.buttonClass}`}
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Icon className={`h-[18px] w-[18px] shrink-0 ${provider.iconClass}`} />
            )}
            <span>{isLoading ? 'Redirecting…' : label}</span>
          </button>
        );
      })}
    </div>
  );
}
