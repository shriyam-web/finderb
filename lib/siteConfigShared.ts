import { LEGAL_COMPANY, SHOW_COMPANY_ADDRESS, SHOW_COMPANY_PHONE } from '@/lib/legalContent';
import {
  GROWTH_PRO_OFFER_ANNUAL,
  GROWTH_PRO_OFFER_MONTHLY,
  GROWTH_PRO_RETAIL_ANNUAL,
  GROWTH_PRO_RETAIL_MONTHLY,
} from '@/lib/pricing/growthPro';

export const SITE_CONFIG_ID = 'finderb';

export type SitePricing = {
  growthMonthly: number;
  growthMonthlyRetail: number;
  proAnnual: number;
  proAnnualRetail: number;
};

export type SiteContact = {
  companyName: string;
  brand: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  showPhone: boolean;
  addressLine1: string;
  addressLine2: string;
  country: string;
  pincode: string;
  showAddress: boolean;
  hoursWeekdays: string;
  hoursSaturday: string;
  hoursSunday: string;
  grievanceName: string;
  grievanceEmail: string;
  grievanceResponse: string;
};

export type SiteFeatures = {
  promoteBusinessOnline: boolean;
};

export type SiteBilling = {
  razorpayMonthlyPlanId: string | null;
};

export type SiteConfig = {
  pricing: SitePricing;
  contact: SiteContact;
  features: SiteFeatures;
  billing: SiteBilling;
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  pricing: {
    growthMonthly: GROWTH_PRO_OFFER_MONTHLY,
    growthMonthlyRetail: GROWTH_PRO_RETAIL_MONTHLY,
    proAnnual: GROWTH_PRO_OFFER_ANNUAL,
    proAnnualRetail: GROWTH_PRO_RETAIL_ANNUAL,
  },
  contact: {
    companyName: LEGAL_COMPANY.name,
    brand: LEGAL_COMPANY.brand,
    email: LEGAL_COMPANY.email,
    phone: LEGAL_COMPANY.phone,
    phoneDisplay: LEGAL_COMPANY.phoneDisplay,
    showPhone: SHOW_COMPANY_PHONE,
    addressLine1: LEGAL_COMPANY.address.line1,
    addressLine2: LEGAL_COMPANY.address.line2,
    country: LEGAL_COMPANY.address.country,
    pincode: LEGAL_COMPANY.address.pincode,
    showAddress: SHOW_COMPANY_ADDRESS,
    hoursWeekdays: LEGAL_COMPANY.businessHours.weekdays,
    hoursSaturday: LEGAL_COMPANY.businessHours.saturday,
    hoursSunday: LEGAL_COMPANY.businessHours.sunday,
    grievanceName: LEGAL_COMPANY.grievanceOfficer.name,
    grievanceEmail: LEGAL_COMPANY.grievanceOfficer.email,
    grievanceResponse: LEGAL_COMPANY.grievanceOfficer.responseTime,
  },
  features: {
    promoteBusinessOnline: false,
  },
  billing: {
    razorpayMonthlyPlanId: null,
  },
};

function money(value: unknown, fallback: number): number {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return fallback;
  const rupees = Math.round(amount);
  if (rupees < 1 || rupees > 10_000_000) return fallback;
  return rupees;
}

function text(value: unknown, fallback: string, max = 180): string {
  const next = String(value ?? '').trim();
  if (!next) return fallback;
  return next.slice(0, max);
}

function flag(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function parseSiteConfig(raw: unknown): SiteConfig {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pricing = (row.pricing && typeof row.pricing === 'object' ? row.pricing : {}) as Record<string, unknown>;
  const contact = (row.contact && typeof row.contact === 'object' ? row.contact : {}) as Record<string, unknown>;
  const features = (row.features && typeof row.features === 'object' ? row.features : {}) as Record<string, unknown>;
  const billing = (row.billing && typeof row.billing === 'object' ? row.billing : {}) as Record<string, unknown>;
  const base = DEFAULT_SITE_CONFIG;
  const planId = String(billing.razorpayMonthlyPlanId || '').trim();
  return {
    pricing: {
      growthMonthly: money(pricing.growthMonthly, base.pricing.growthMonthly),
      growthMonthlyRetail: money(pricing.growthMonthlyRetail, base.pricing.growthMonthlyRetail),
      proAnnual: money(pricing.proAnnual, base.pricing.proAnnual),
      proAnnualRetail: money(pricing.proAnnualRetail, base.pricing.proAnnualRetail),
    },
    contact: {
      companyName: text(contact.companyName, base.contact.companyName),
      brand: text(contact.brand, base.contact.brand, 40),
      email: text(contact.email, base.contact.email),
      phone: text(contact.phone, base.contact.phone, 20),
      phoneDisplay: text(contact.phoneDisplay, base.contact.phoneDisplay, 32),
      showPhone: flag(contact.showPhone, base.contact.showPhone),
      addressLine1: text(contact.addressLine1, base.contact.addressLine1),
      addressLine2: text(contact.addressLine2, base.contact.addressLine2),
      country: text(contact.country, base.contact.country, 60),
      pincode: text(contact.pincode, base.contact.pincode, 12),
      showAddress: flag(contact.showAddress, base.contact.showAddress),
      hoursWeekdays: text(contact.hoursWeekdays, base.contact.hoursWeekdays),
      hoursSaturday: text(contact.hoursSaturday, base.contact.hoursSaturday),
      hoursSunday: text(contact.hoursSunday, base.contact.hoursSunday),
      grievanceName: text(contact.grievanceName, base.contact.grievanceName),
      grievanceEmail: text(contact.grievanceEmail, base.contact.grievanceEmail),
      grievanceResponse: text(contact.grievanceResponse, base.contact.grievanceResponse),
    },
    features: {
      promoteBusinessOnline: flag(features.promoteBusinessOnline, false),
    },
    billing: {
      razorpayMonthlyPlanId: planId || null,
    },
  };
}

export function publicSiteConfig(config: SiteConfig) {
  return {
    pricing: config.pricing,
    contact: config.contact,
    features: config.features,
  };
}

