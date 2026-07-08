import {
  getDiscountOfferCardLabel,
  getDiscountVisibilityImpact,
} from '@/lib/discountOffer';

type MerchantOfferBadgeProps = {
  discountRange?: string | null;
  compact?: boolean;
  className?: string;
};

function TicketRail({ side }: { side: 'left' | 'right' }) {
  const cx = side === 'left' ? 0 : 8;
  const punches = [4.5, 9.5, 14.5, 19.5, 24.5];

  return (
    <svg
      className={`merchant-offer-ticket-card__rail merchant-offer-ticket-card__rail--${side}`}
      viewBox="0 0 8 29"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect width="8" height="29" className="merchant-offer-ticket-card__rail-bg" />
      <line x1="0" y1="0.75" x2="8" y2="0.75" className="merchant-offer-ticket-card__rail-line" />
      <line x1="0" y1="28.25" x2="8" y2="28.25" className="merchant-offer-ticket-card__rail-line" />
      {side === 'left' && (
        <line x1="0.75" y1="0" x2="0.75" y2="29" className="merchant-offer-ticket-card__rail-line" />
      )}
      {side === 'right' && (
        <line x1="7.25" y1="0" x2="7.25" y2="29" className="merchant-offer-ticket-card__rail-line" />
      )}
      {punches.map((cy) => (
        <circle key={cy} cx={cx} cy={cy} r="2.35" className="merchant-offer-ticket-card__punch" />
      ))}
    </svg>
  );
}

export default function MerchantOfferBadge({
  discountRange,
  compact = false,
  className = '',
}: MerchantOfferBadgeProps) {
  const badgeLabel = getDiscountOfferCardLabel(discountRange);
  if (!badgeLabel) return null;

  const { tier } = getDiscountVisibilityImpact(discountRange);
  if (tier === 'none') return null;

  return (
    <div
      className={`merchant-offer-ticket-card ${compact ? 'merchant-offer-ticket-card--compact' : ''} ${className}`}
      data-tier={tier}
      title={badgeLabel}
      aria-label={`Offer: ${badgeLabel}`}
    >
      <span className="merchant-offer-ticket-card__shine" aria-hidden />

      <TicketRail side="left" />

      <div className="merchant-offer-ticket-card__body">
        <div className="merchant-offer-ticket-card__frame">
          <span className="merchant-offer-ticket-card__label">{badgeLabel}</span>
        </div>
      </div>

      <TicketRail side="right" />
    </div>
  );
}
