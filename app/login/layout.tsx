import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description:
    'Sign in to your FinderB account to save favourite businesses, manage your profile, and pick up where you left off.',
  alternates: { canonical: '/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
