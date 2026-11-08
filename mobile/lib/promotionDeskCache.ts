export type PromotionPackageCard = {
  id: string;
  name: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  referenceInr: number;
  discountPercent: number;
  reach: string;
  views?: string;
  visits?: string;
  popular: boolean;
  estimateNote: string;
};

export type PromotionDeskCache = {
  success: true;
  verification: { status: string; rejectionReason: string | null };
  packages: PromotionPackageCard[];
};

/** Shown the moment the screen opens. Replaced when the server answers. */
export const LAUNCH_PACKAGES: PromotionPackageCard[] = [
  {
    id: 'starter',
    name: 'Starter Boost',
    durationDays: 5,
    coverage: '5–8 KM',
    priceInr: 999,
    referenceInr: 5999,
    discountPercent: 83,
    reach: '6,000–10,000 people',
    views: '10,000+ views',
    visits: '300+ profile visits',
    popular: false,
    estimateNote: '',
  },
  {
    id: 'growth',
    name: 'Growth Booster',
    durationDays: 10,
    coverage: '15–20 KM / City',
    priceInr: 1999,
    referenceInr: 9999,
    discountPercent: 80,
    reach: '18,000–28,000 people',
    views: '25,000+ views',
    visits: '1,000+ profile visits',
    popular: true,
    estimateNote: '',
  },
  {
    id: 'mega',
    name: 'Mega Booster',
    durationDays: 15,
    coverage: 'District / Regional',
    priceInr: 2999,
    referenceInr: 17999,
    discountPercent: 83,
    reach: '45,000–70,000 people',
    views: '60,000+ views',
    visits: '2,500+ profile visits',
    popular: false,
    estimateNote: '',
  },
];

let cached: PromotionDeskCache | null = null;
let inflight: Promise<unknown> | null = null;

export function peekPromotionDesk() {
  return cached;
}

export function storePromotionDesk(desk: PromotionDeskCache) {
  cached = desk;
}

export function primePromotionDesk(run: (action: string) => Promise<unknown>) {
  if (cached || inflight) return inflight;
  inflight = run('promotions').then((result) => {
    inflight = null;
    const desk = result as PromotionDeskCache & { success?: boolean };
    if (desk?.success && desk.packages?.length) storePromotionDesk(desk);
  });
  return inflight;
}
