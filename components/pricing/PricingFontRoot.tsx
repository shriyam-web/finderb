import { dmSans } from '@/lib/fonts';

export default function PricingFontRoot({ children }: { children: React.ReactNode }) {
  return <div className={`${dmSans.variable} pricing-font-root`}>{children}</div>;
}
