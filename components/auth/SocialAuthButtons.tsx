'use client';

import TruecallerButton from '@/components/auth/TruecallerButton';
import OAuthButtonGroup from '@/components/auth/OAuthButtonGroup';

type SocialAuthButtonsProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
  onError?: (message: string) => void;
};

function WhatsAppAuthButton({ mode }: { mode: 'login' | 'signup' }) {
  const label = mode === 'signup' ? 'Sign up with WhatsApp' : 'Continue with WhatsApp';
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-[#25D366] bg-[#25D366] px-4 py-3 text-sm font-semibold text-white opacity-80"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
        <path
          fill="#FFFFFF"
          d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.12h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.76 13.9c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.3-1.64-.59-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.37.26-.28.57-.35.76-.35h.55c.17 0 .4-.07.63.48.24.57.82 1.97.89 2.11.07.15.12.32.02.51-.1.19-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.59-.07.16-.17.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.13.44.2.51.31.06.11.06.64-.18 1.32Z"
        />
      </svg>
      <span>{label}</span>
      <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Soon
      </span>
    </button>
  );
}

export default function SocialAuthButtons({
  mode,
  redirectPath = '/dashboard',
  onError,
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <OAuthButtonGroup
        mode={mode}
        redirectPath={redirectPath}
        onError={onError}
        only={['google']}
      />
      <TruecallerButton mode={mode} redirectPath={redirectPath} onError={onError} />
      <WhatsAppAuthButton mode={mode} />
    </div>
  );
}
