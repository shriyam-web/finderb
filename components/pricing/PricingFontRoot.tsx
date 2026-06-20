import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-pricing',
  weight: ['400', '500', '600', '700'],
});

export default function PricingFontRoot({ children }: { children: React.ReactNode }) {
  return <div className={`${dmSans.variable} pricing-font-root`}>{children}</div>;
}
