import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create a free FinderB account to save listings, write reviews, and discover trusted local businesses near you.',
  alternates: { canonical: '/signup' },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
