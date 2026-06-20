import { Award, MapPinned, TrendingUp } from 'lucide-react';
import type { PlanTone } from '@/components/pricing/PricingPlanCard';

const ICON_SIZE = 26;
const ICON_STROKE = 1.65;

export function PricingPlanIcon({ tone }: { tone: PlanTone }) {
  if (tone === 'free') {
    return (
      <MapPinned
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className="text-[#153551]"
        aria-hidden
      />
    );
  }

  if (tone === 'monthly') {
    return (
      <TrendingUp
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        className="text-[#f9b864]"
        aria-hidden
      />
    );
  }

  return (
    <Award
      size={ICON_SIZE}
      strokeWidth={ICON_STROKE}
      className="text-[#f9b864]"
      aria-hidden
    />
  );
}
