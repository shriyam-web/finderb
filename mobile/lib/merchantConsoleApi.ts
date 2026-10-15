import { SITE_URL } from './supabase';
import { getStoredToken } from './session';
import type { TeamAccessMap } from './teamAccess';

export type DayTiming = {
  open?: string;
  close?: string;
  isClosed?: boolean;
  is24Hours?: boolean;
};

export type Timings = Record<string, DayTiming>;

export type ConsoleProfile = {
  displayName: string;
  businessName: string;
  ownerName: string;
  ownerMobile: string;
  category: string;
  publicPhone: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  youtubeUrl: string;
  about: string;
  keywords: string[];
  email: string;
  timings: Timings;
  discountRange: string;
  serviceCategory: string;
  paymentModes: string[];
  yearsInBusiness: number;
  profileQrLink: string;
  reviewReply: string;
};

export type MissingField = {
  key: string;
  label: string;
  settingsKey: string | null;
  action: 'settings' | 'kyc';
};

export type HealthItem = {
  id: string;
  label: string;
  detail: string;
  status: 'complete' | 'attention' | 'review' | 'blocked';
  priority: number;
};

export type SubscriptionStatus = {
  isActive: boolean;
  planName: string;
  lastPlanName: string | null;
  planId: string;
  billingCycle: 'monthly' | 'annual' | null;
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  alertLevel: 'none' | 'warning' | 'urgent' | 'expired';
  canRenew: boolean;
  isExpired: boolean;
  isPendingPayment: boolean;
  autoRenewEnabled: boolean;
  mandateStatus: string;
  canCancelAutoRenew: boolean;
  mandateRevokePending: boolean;
  isMonthlyMandate: boolean;
  startedAtDisplay?: string;
  expiresAtDisplay?: string;
};

export type ConsoleLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string;
  message: string | null;
  status: string;
  source?: string | null;
  created_at: string | null;
  merchant_read_at?: string | null;
  locked: boolean;
};

export type ConsoleReview = {
  id: string;
  author: string;
  rating: number;
  content: string;
  date?: string;
  anonymous?: boolean;
  hidden?: boolean;
  flagged?: boolean;
  reply: { content: string; date: string | null } | null;
};

export type ConsoleNotification = {
  id: string;
  kind: 'alert' | 'broadcast';
  type: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  ctaUrl: string | null;
  ctaLabel: string | null;
};

export type ConsoleBusiness = {
  id: string;
  slug: string | null;
  name: string;
  legalName: string;
  category: string;
  city: string;
  status: string;
  statusLabel: string;
  isLive: boolean;
  kycStatus: string;
  verifiedBadge: boolean;
  registrationNumber: string | null;
  deletionScheduledAt: string | null;
  profilePath: string;
  ownerName: string;
  loginEmail: string;
  loginMobile: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  whatsappVerified: boolean;
  createdAt: string | null;
};

export type ConsoleOverview = {
  success: true;
  business: ConsoleBusiness;
  profile: ConsoleProfile;
  photos: { images: string[]; cover: string | null };
  hasPublicPhoto: boolean;
  completion: { percent: number; missing: MissingField[] };
  health: { score: number; items: HealthItem[]; openCount: number; headline: string };
  subscription: SubscriptionStatus;
  stats: {
    views30d: number;
    viewsAllTime: number;
    leadsTotal: number;
    leadsNew: number;
    leads7d: number;
    leadsConverted: number;
    viewsToday: number;
    views7d: number;
    visitors30d: number;
    viewsDaily: { day: string; views: number }[];
    rating: number | null;
    reviewCount: number;
    reviewsAwaitingReply: number;
    activeJobs: number;
    averageResponse: string | null;
    averageResponseMs: number | null;
    competitorAverage: number | null;
  };
  leads: ConsoleLead[];
  reviews: ConsoleReview[];
  reviewFlags?: { used: number; remaining: number; limit: number };
  notifications: { items: ConsoleNotification[]; unread: number };
  limits: {
    aboutMaxWords: number;
    maxKeywords: number;
    replyMin: number;
    replyMax: number;
    maxActiveJobs: number;
  };
  kycMessage: string;
  actor?: {
    isOwner: boolean;
    teamMemberId: string | null;
    access: TeamAccessMap;
  };
};

export type ConsoleJob = {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string | null;
  description: string;
  department: string | null;
  status: string;
  created_at: string;
};

export type PaymentHistoryItem = {
  id: string;
  planName: string;
  billingCycle: string;
  amountDisplay: string;
  status: string;
  paymentType: string;
  orderId: string | null;
  paymentId: string | null;
  planStartedAt: string | null;
  planExpiresAt: string | null;
  createdAt: string;
};

export type Pricing = {
  offerName: string;
  monthly: { name: string; price: number; retail: number };
  annual: { name: string; price: number; retail: number; perMonth: number };
  features: string[];
  starterIncludes: string[];
  compare: { label: string; free: boolean | string; monthly: boolean | string; annual: boolean | string }[];
  checkoutAvailable: boolean;
};

export type SubscriptionDetails = {
  success: true;
  subscription: SubscriptionStatus;
  history: PaymentHistoryItem[];
  pricing: Pricing;
  message?: string;
};

export type CheckoutStart = {
  success: true;
  checkoutMode: 'order' | 'subscription';
  order?: { id: string; amount: number; currency: string };
  subscription?: { id: string };
  keyId: string;
  business: { businessName: string; fullName: string; email: string; mobile: string };
};

export type ChangeRequest = {
  id: string;
  field: string;
  current_value: string;
  requested_value: string;
  status: string;
  merchant_note: string | null;
  admin_note: string | null;
  created_at: string;
};

export type ConsoleFailure = { success: false; error: string; code?: string };
export type ConsoleResult<T> = T | ConsoleFailure;

const TIMEOUT_MS = 45000;

/** Every merchant console call goes through one website route that checks the app login. */
export async function consoleCall<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<ConsoleResult<T>> {
  const token = await getStoredToken();
  if (!token) return { success: false, error: 'Please log in again.', code: 'signed_out' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${SITE_URL}/api/business/mobile/console`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as ConsoleResult<T> | null;
    if (!body) return { success: false, error: `FinderB did not answer (${response.status}). Try again.` };
    return body;
  } catch {
    return {
      success: false,
      error: controller.signal.aborted
        ? 'FinderB took too long to answer. Check your internet and try again.'
        : 'No internet connection. Check your network and try again.',
    };
  } finally {
    clearTimeout(timer);
  }
}

export function isFailure<T>(result: ConsoleResult<T>): result is ConsoleFailure {
  return (result as ConsoleFailure).success === false;
}
