import {
  Bed,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  ChefHat,
  Dumbbell,
  GraduationCap,
  Hammer,
  Hotel,
  Paintbrush,
  Scale,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Store,
  Truck,
  UtensilsCrossed,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type MerchantFloater = {
  Icon: LucideIcon;
  profession: string;
  top: string;
  side: 'left' | 'right';
  offset: string;
  size: number;
  rotate: number;
  opacity: number;
  tint: '#215481' | '#f9b864';
};

/** Edge-scattered icons for the kinds of local merchants FinderB lists. */
const MERCHANT_FLOATERS: MerchantFloater[] = [
  { Icon: UtensilsCrossed, profession: 'Restaurant', top: '7%', side: 'left', offset: '3%', size: 22, rotate: -10, opacity: 0.12, tint: '#215481' },
  { Icon: Stethoscope, profession: 'Doctor', top: '9%', side: 'right', offset: '4%', size: 20, rotate: 8, opacity: 0.11, tint: '#215481' },
  { Icon: Wrench, profession: 'Repairs', top: '17%', side: 'left', offset: '12%', size: 18, rotate: 22, opacity: 0.1, tint: '#f9b864' },
  { Icon: Building2, profession: 'Real Estate', top: '20%', side: 'right', offset: '11%', size: 24, rotate: -6, opacity: 0.11, tint: '#215481' },
  { Icon: Scissors, profession: 'Salon', top: '29%', side: 'left', offset: '2%', size: 19, rotate: -14, opacity: 0.1, tint: '#215481' },
  { Icon: Dumbbell, profession: 'Gym', top: '33%', side: 'right', offset: '2%', size: 21, rotate: 12, opacity: 0.1, tint: '#f9b864' },
  { Icon: GraduationCap, profession: 'College', top: '41%', side: 'left', offset: '8%', size: 20, rotate: -8, opacity: 0.09, tint: '#215481' },
  { Icon: Briefcase, profession: 'B2B', top: '45%', side: 'right', offset: '9%', size: 18, rotate: 16, opacity: 0.1, tint: '#215481' },
  { Icon: Hotel, profession: 'Hotel', top: '53%', side: 'left', offset: '3%', size: 22, rotate: 6, opacity: 0.09, tint: '#f9b864' },
  { Icon: Bed, profession: 'PG', top: '57%', side: 'right', offset: '4%', size: 19, rotate: -12, opacity: 0.09, tint: '#215481' },
  { Icon: Car, profession: 'Auto', top: '65%', side: 'left', offset: '11%', size: 21, rotate: -18, opacity: 0.1, tint: '#215481' },
  { Icon: Zap, profession: 'Electrician', top: '69%', side: 'right', offset: '10%', size: 17, rotate: 10, opacity: 0.09, tint: '#f9b864' },
  { Icon: Scale, profession: 'Lawyer', top: '76%', side: 'left', offset: '4%', size: 18, rotate: 14, opacity: 0.08, tint: '#215481' },
  { Icon: Camera, profession: 'Photography', top: '79%', side: 'right', offset: '6%', size: 20, rotate: -8, opacity: 0.09, tint: '#215481' },
  { Icon: Hammer, profession: 'Carpenter', top: '86%', side: 'left', offset: '14%', size: 17, rotate: -20, opacity: 0.08, tint: '#f9b864' },
  { Icon: Truck, profession: 'Movers', top: '89%', side: 'right', offset: '13%', size: 19, rotate: 6, opacity: 0.08, tint: '#215481' },
  { Icon: BookOpen, profession: 'Tutor', top: '24%', side: 'left', offset: '1%', size: 16, rotate: 8, opacity: 0.08, tint: '#215481' },
  { Icon: Store, profession: 'Shop', top: '48%', side: 'right', offset: '1%', size: 18, rotate: -4, opacity: 0.08, tint: '#f9b864' },
  { Icon: ShoppingBag, profession: 'Retail', top: '62%', side: 'left', offset: '1%', size: 17, rotate: 12, opacity: 0.08, tint: '#215481' },
  { Icon: ChefHat, profession: 'Catering', top: '74%', side: 'right', offset: '1%', size: 18, rotate: -10, opacity: 0.08, tint: '#215481' },
  { Icon: Paintbrush, profession: 'Painter', top: '37%', side: 'left', offset: '15%', size: 16, rotate: 18, opacity: 0.08, tint: '#f9b864' },
];

export default function BusinessProfileBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#faf9f7]" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f9b864]/[0.14] blur-3xl" />
      <div className="absolute -right-16 top-40 h-64 w-64 rounded-full bg-[#215481]/[0.05] blur-3xl" />
      <div className="absolute bottom-32 left-1/3 h-56 w-56 rounded-full bg-[#f9b864]/[0.08] blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="biz-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#a8a29e" strokeWidth="0.5" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#biz-grid)" />
      </svg>

      {MERCHANT_FLOATERS.map(({ Icon, profession, top, side, offset, size, rotate, opacity, tint }, index) => (
        <div
          key={index}
          className="absolute flex flex-col items-center gap-1"
          style={{
            top,
            [side]: offset,
            opacity,
            transform: `rotate(${rotate}deg)`,
          }}
        >
          <Icon size={size} style={{ color: tint }} strokeWidth={1.5} />
          <span
            className="text-[8px] font-semibold uppercase tracking-wider"
            style={{ color: tint, opacity: 0.45, transform: `rotate(${-rotate}deg)` }}
          >
            {profession}
          </span>
        </div>
      ))}
    </div>
  );
}
