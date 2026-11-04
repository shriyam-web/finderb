'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  DEFAULT_SITE_CONFIG,
  type SiteConfig,
  type SiteContact,
  type SitePricing,
} from '@/lib/siteConfigShared';

const SiteConfigContext = createContext<SiteConfig>(DEFAULT_SITE_CONFIG);

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig;
  children: ReactNode;
}) {
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}

export function useSiteContact(): SiteContact {
  return useSiteConfig().contact;
}

export function useSitePricing(): SitePricing & {
  monthlyDiscount: number;
  annualDiscount: number;
  annualPerMonth: number;
} {
  const pricing = useSiteConfig().pricing;
  const percent = (retail: number, offer: number) =>
    retail > 0 ? Number((((retail - offer) / retail) * 100).toFixed(1)) : 0;
  return {
    ...pricing,
    monthlyDiscount: percent(pricing.growthMonthlyRetail, pricing.growthMonthly),
    annualDiscount: percent(pricing.proAnnualRetail, pricing.proAnnual),
    annualPerMonth: Math.max(1, Math.round(pricing.proAnnual / 12)),
  };
}
