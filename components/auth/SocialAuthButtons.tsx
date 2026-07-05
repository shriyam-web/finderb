'use client';

import TruecallerButton from '@/components/auth/TruecallerButton';
import OAuthButtonGroup from '@/components/auth/OAuthButtonGroup';

type SocialAuthButtonsProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
  onError?: (message: string) => void;
};

export default function SocialAuthButtons({
  mode,
  redirectPath = '/dashboard',
  onError,
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-2.5">
      <TruecallerButton mode={mode} redirectPath={redirectPath} onError={onError} />
      <OAuthButtonGroup mode={mode} redirectPath={redirectPath} onError={onError} />
    </div>
  );
}
