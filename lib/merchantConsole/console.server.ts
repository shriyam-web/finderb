import 'server-only';

import {
  changeBusinessPassword,
  getOwnedBusiness,
  updateBusinessImages,
  updateBusinessProfile,
} from '@/app/actions/business';
import { getBusinessLeads, markLeadRead, updateLeadStatus } from '@/app/actions/leads';
import { isOpenLead } from '@/lib/leadBadges';
import { isLeadUnread, averageLeadResponseLabel } from '@/lib/leadRead';
import { loadCompetitorAverageFromClient } from '@/lib/dashboard/competitorInsights';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { isBusinessWhatsappVerified } from '@/lib/unverifiedContact';
import {
  BUSINESS_REVIEW_FLAGS_PER_MONTH,
  getBusinessPublicRatingStats,
  getReviewReplyDraft,
  parseBusinessReviews,
  REVIEW_REPLY_MAX_LENGTH,
  REVIEW_REPLY_MIN_LENGTH,
  toMerchantReview,
  visibleMerchantReviews,
} from '@/lib/businessReviews';
import { countBusinessReviewFlagsThisMonth } from '@/lib/reviewModeration.server';
import { createJob, deleteJob, getJobsByBusiness, updateJob } from '@/app/actions/job';
import { getBusinessProfileViewStats } from '@/app/actions/analytics';
import { merchantNotificationCta } from '@/lib/merchantNotificationCta';
import { cancelMerchantAutoRenew, getMerchantSubscriptionDetails } from '@/app/actions/subscription';
import { completeMerchantPayment, createMerchantPaymentOrder } from '@/app/actions/payment';
import { getPendingChangeRequest, submitChangeRequest } from '@/app/actions/businessChangeRequests';
import {
  confirmMerchantEmailVerifyCode,
  confirmMerchantMobileVerifyCode,
  confirmMerchantOwnerMobileCode,
  getMerchantContactStatus,
  requestMerchantEmailVerifyCode,
  requestMerchantMobileVerifyCode,
  requestMerchantOwnerMobileCode,
} from '@/lib/auth/merchantContactVerify.server';
import {
  CATEGORY_CHANGE_FIELD,
  DISPLAY_NAME_FIELD,
  LEGAL_BUSINESS_NAME_FIELD,
} from '@/lib/businessChangeRequest';
import { getAccountHealth } from '@/lib/dashboard/accountHealth';
import { getAccountMissingFields, getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import { getMerchantSubscriptionStatus } from '@/lib/subscription/merchantSubscription';
import {
  getListingStatusLabel,
  hasPublicTrustBadge,
  isListingLive,
  KYC_OUTSOURCED_MESSAGE,
} from '@/lib/businessVerification';
import { PROFILE_LINK_FIELDS, validateProfileLink } from '@/lib/validateProfileUrl';
import { isValidEstablishmentYear, minEstablishmentYear } from '@/lib/establishmentYear';
import { MAX_SEARCH_KEYWORDS } from '@/lib/businessKeywords';
import { flagMerchantReview, upsertMerchantReviewReply } from '@/app/actions/reviews';
import { businessHasPublicPhoto, normalizeBusinessImages } from '@/lib/businessMapping';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { broadcastTargetsMerchants } from '@/lib/broadcastAudience';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLocation';
import { pickPublicBusinessEmail } from '@/lib/placeholderEmail';
import { extractIndianMobileDigits } from '@/lib/indianPhone';
import { ABOUT_BUSINESS_MAX_WORDS } from '@/lib/businessAbout';
import {
  GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL,
  GROWTH_PRO_FEATURES,
  GROWTH_PRO_OFFER_ANNUAL,
  GROWTH_PRO_OFFER_MONTHLY,
  GROWTH_PRO_OFFER_NAME,
  GROWTH_PRO_RETAIL_ANNUAL,
  GROWTH_PRO_RETAIL_MONTHLY,
  FREE_LISTING_INCLUDED,
  PLAN_COMPARE_ROWS,
} from '@/lib/pricing/growthPro';
import { isRazorpayConfigured } from '@/lib/razorpay/server';
import {
  inviteTeamMember,
  listTeamMembers,
  resendTeamInvite,
  revokeTeamMember,
  updateTeamAccess,
  verifyTeamInviteOtp,
} from '@/lib/businessTeam/teamInvites.server';
import { CONSOLE_ACTION_ACCESS, TEAM_OWNER_ONLY, TEAM_TAB_LOCKED } from '@/lib/businessTeam/teamAccess';
import { resolveBusinessActor } from '@/lib/businessTeam/teamActor.server';
import { createServiceClient } from '@/lib/supabase/service';
import { escapeIlikePattern } from '@/lib/searchMatch';

type Business = Record<string, unknown>;
type Fail = { success: false; error: string };

const fail = (error: string): Fail => ({ success: false, error });
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const LEAD_CONTACT_LOCKED = 'Upgrade to see contact';

/** Same public columns the app reads for any storefront, so the owner preview maps identically. */
const STOREFRONT_SELECT =
  'id, slug, businessName, displayName, category, location, city, state, about, profilePictureUrl, images, publicPhone, mobile, email, workEmail, website, whatsappNumber, instagramUrl, facebookUrl, youtubeUrl, review, isFinderBVerified, hasVerifiedBadge, discountRange, status, latitude, longitude, timings, serviceCategory, keywords, paymentModes, businessAddress, yearsInBusiness, emailVerified, mobileVerified, whatsappVerified';

async function loadBusiness(businessId: string): Promise<Business | Fail> {
  const owned = await getOwnedBusiness(businessId);
  if (!owned.success || !owned.business) return fail(owned.error || 'Business not found');
  return owned.business as Business;
}

function subscriptionOf(business: Business) {
  return getMerchantSubscriptionStatus({
    paymentStatus: business.paymentStatus as string,
    selectedPlan: business.selectedPlan as string,
    billingCycle: business.billingCycle as string,
    planStartedAt: business.planStartedAt as string,
    planExpiresAt: business.planExpiresAt as string,
    updatedAt: business.updatedAt as string,
    createdAt: business.createdAt as string,
    autoRenewEnabled: business.autoRenewEnabled as boolean,
    mandateStatus: business.mandateStatus as string,
    subscriptionStatus: business.subscriptionStatus as string,
    razorpaySubscriptionId: business.razorpaySubscriptionId as string,
  });
}

/** Everything the listing editor needs, in the same shape the website settings form submits. */
function profileOf(business: Business) {
  const lat = Number(business.latitude) || 0;
  const lng = Number(business.longitude) || 0;
  const discount = text(business.discountRange);
  return {
    displayName: text(business.displayName),
    businessName: text(business.businessName),
    ownerName: text(business.ownerName) || text(business.owner_name),
    ownerMobile: extractIndianMobileDigits(business.ownerMobile) || '',
    category: text(business.category),
    publicPhone: text(business.publicPhone),
    businessAddress: text(business.businessAddress),
    city: text(business.city),
    state: text(business.state),
    country: text(business.country),
    latitude: lat,
    longitude: lng,
    googleMapsUrl: lat && lng ? buildGoogleMapsUrl(lat, lng) : '',
    website: text(business.website),
    instagramUrl: text(business.instagramUrl),
    facebookUrl: text(business.facebookUrl),
    whatsappNumber: text(business.whatsappNumber),
    youtubeUrl: text(business.youtubeUrl),
    about: text(business.about),
    keywords: Array.isArray(business.keywords) ? (business.keywords as string[]) : [],
    email: pickPublicBusinessEmail(business.workEmail as string, business.email as string) || '',
    timings: business.timings && typeof business.timings === 'object' ? business.timings : {},
    discountRange: !discount || discount === 'Seasonal Offer' ? 'No Discount' : discount,
    serviceCategory: text(business.serviceCategory),
    paymentModes: Array.isArray(business.paymentModes) ? (business.paymentModes as string[]) : [],
    yearsInBusiness: Number(business.yearsInBusiness) || 0,
    profileQrLink: text(business.profileQrLink),
    reviewReply: getReviewReplyDraft(business.reviewReply),
  };
}

function photosOf(business: Business) {
  return {
    images: normalizeBusinessImages(business.images),
    cover: text(business.profilePictureUrl) || null,
  };
}

function reviewsOf(
  business: Business,
  flaggedIds: Set<string> = new Set()
) {
  return visibleMerchantReviews(parseBusinessReviews(business.review)).map((review) => {
    const view = toMerchantReview(review);
    return {
      id: view.id,
      author: view.author,
      rating: view.rating,
      content: view.content,
      date: view.date,
      anonymous: Boolean(view.anonymous),
      hidden: Boolean(view.hidden),
      flagged: flaggedIds.has(view.id),
      reply: review.merchantReply?.content?.trim()
        ? { content: review.merchantReply.content.trim(), date: review.merchantReply.date || null }
        : null,
    };
  });
}

async function reviewFlagState(businessId: string) {
  const supabase = createServiceClient();
  const limit = BUSINESS_REVIEW_FLAGS_PER_MONTH;
  if (!supabase) {
    return { used: 0, remaining: limit, limit, flaggedIds: new Set<string>() };
  }
  const [{ data }, used] = await Promise.all([
    supabase
      .from('review_reports')
      .select('review_id')
      .eq('reporter_key', `business:${businessId}`),
    countBusinessReviewFlagsThisMonth(businessId),
  ]);
  return {
    used,
    remaining: Math.max(0, limit - used),
    limit,
    flaggedIds: new Set((data || []).map((row) => String(row.review_id))),
  };
}

async function loadCompetitorAverage(businessId: string, category: string) {
  return loadCompetitorAverageFromClient(createServiceClient(), businessId, category);
}

function maskLeads<T extends { email: string | null; phone: string | null }>(leads: T[], unlocked: boolean) {
  if (unlocked) return leads.map((lead) => ({ ...lead, locked: false }));
  return leads.map((lead) => ({
    ...lead,
    email: lead.email ? LEAD_CONTACT_LOCKED : null,
    phone: lead.phone ? LEAD_CONTACT_LOCKED : null,
    locked: true,
  }));
}

async function loadNotifications(businessId: string, category: string) {
  const supabase = createServiceClient();
  const [merchantRows, broadcasts] = await Promise.all([
    supabase
      ? supabase
          .from('merchant_notifications')
          .select('id, type, title, body, metadata, read_at, created_at')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    supabase
      ? supabase
          .from('broadcasts')
          .select('id, title, message, created_at, cta_url, cta_label, target_audience')
          .order('created_at', { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  if ('error' in merchantRows && merchantRows.error) {
    console.error('[merchant alerts]', merchantRows.error);
  }

  const own = ((merchantRows.data ?? []) as Array<{
    id: string;
    type: string;
    title: string | null;
    body: string;
    metadata: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
  }>).map((item) => {
    const cta = merchantNotificationCta(item.type, item.metadata);
    return {
      id: item.id,
      kind: 'alert' as const,
      type: item.type,
      title: item.title || 'Alert',
      body: item.body,
      createdAt: item.created_at,
      read: Boolean(item.read_at),
      ctaUrl: cta.url,
      ctaLabel: cta.label,
    };
  });

  const news = ((broadcasts.data ?? []) as Record<string, unknown>[])
    .filter((row) => broadcastTargetsMerchants(row.target_audience, category))
    .map((row) => ({
      id: String(row.id),
      kind: 'broadcast' as const,
      type: 'broadcast',
      title: text(row.title) || 'FinderB update',
      body: text(row.message),
      createdAt: String(row.created_at),
      read: true,
      ctaUrl: text(row.cta_url) || null,
      ctaLabel: text(row.cta_label) || null,
    }));

  const items = [...own, ...news].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return { items, unread: own.filter((item) => !item.read).length };
}

const TREND_DAYS = 14;
const IST_OFFSET_MS = 330 * 60 * 1000;

function istDayKey(time: number): string {
  return new Date(time + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Daily views for the last two weeks (India time), plus today, 7-day and distinct-visitor counts. */
async function viewTrend(businessId: string) {
  const empty = { today: 0, last7: 0, uniqueVisitors30d: 0, daily: [] as { day: string; views: number }[] };
  const supabase = createServiceClient();
  if (!supabase) return empty;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('profile_views')
    .select('viewed_at, session_hash')
    .eq('business_id', businessId)
    .gte('viewed_at', since)
    .order('viewed_at', { ascending: false })
    .limit(10000);
  if (error || !data) return empty;

  const now = Date.now();
  const counts = new Map<string, number>();
  const visitors = new Set<string>();
  let last7 = 0;
  for (const row of data as { viewed_at: string; session_hash: string | null }[]) {
    const at = new Date(row.viewed_at).getTime();
    if (Number.isNaN(at)) continue;
    const key = istDayKey(at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (now - at <= 7 * 24 * 60 * 60 * 1000) last7 += 1;
    visitors.add(row.session_hash || `anon:${row.viewed_at}`);
  }
  const daily = Array.from({ length: TREND_DAYS }, (_, index) => {
    const day = istDayKey(now - (TREND_DAYS - 1 - index) * 24 * 60 * 60 * 1000);
    return { day, views: counts.get(day) ?? 0 };
  });
  return { today: counts.get(istDayKey(now)) ?? 0, last7, uniqueVisitors30d: visitors.size, daily };
}

async function overview(businessId: string) {
  const actor = await resolveBusinessActor(businessId);
  if (!actor.ok) return fail(actor.error);
  const business = await loadBusiness(businessId);
  if ('success' in business) return business;

  const subscription = subscriptionOf(business);
  const photos = photosOf(business);
  const withPhotos = { ...business, profilePictureUrl: photos.cover, images: photos.images };
  const completion = getProfileCompletion(withPhotos);
  const missing = getAccountMissingFields(withPhotos);
  const health = getAccountHealth({
    paymentStatus: business.paymentStatus as string,
    kycStatus: business.kycStatus as string,
    completionPercent: completion.percentage,
    subscription,
  });
  const ratingStats = getBusinessPublicRatingStats(business.review);
  const flagState = await reviewFlagState(businessId);
  const reviews = reviewsOf(business, flagState.flaggedIds);
  const status = String(business.status || 'Pending');
  const category = text(business.category);

  const [leadsResult, jobsResult, views, notifications, trend, competitorAverage] = await Promise.all([
    getBusinessLeads(businessId),
    getJobsByBusiness(businessId),
    getBusinessProfileViewStats(businessId),
    loadNotifications(businessId, category),
    viewTrend(businessId),
    loadCompetitorAverage(businessId, category),
  ]);
  const leads = leadsResult.success ? leadsResult.leads : [];
  const jobs = jobsResult.success && jobsResult.jobs ? jobsResult.jobs : [];

  return {
    success: true as const,
    business: {
      id: businessId,
      slug: (business.slug as string) || null,
      name: text(business.name) || text(business.displayName) || text(business.businessName) || 'Your business',
      legalName: text(business.businessName),
      category,
      city: text(business.city),
      status,
      statusLabel: getListingStatusLabel(status),
      isLive: isListingLive(status),
      kycStatus: String(business.kycStatus || 'pending'),
      verifiedBadge: hasPublicTrustBadge({
        isFinderBVerified: business.isFinderBVerified as boolean,
        hasVerifiedBadge: business.hasVerifiedBadge as boolean,
      }),
      registrationNumber: text(business.registrationNumber) || null,
      profilePath: getBusinessProfilePath({
        id: businessId,
        slug: business.slug as string,
        name: business.name as string,
        businessName: business.businessName as string,
        city: business.city as string,
      }),
      ownerName: text(business.ownerName) || text(business.fullName),
      loginEmail: pickPublicBusinessEmail(business.workEmail as string, business.email as string) || '',
      loginMobile: extractIndianMobileDigits(business.mobile) || '',
      emailVerified: Boolean(business.emailVerified),
      mobileVerified: Boolean(business.mobileVerified),
      whatsappVerified: isBusinessWhatsappVerified({
        whatsappVerified: business.whatsappVerified as boolean,
        whatsappNumber: text(business.whatsappNumber),
        publicPhone: text(business.publicPhone),
        mobile: text(business.mobile),
        mobileVerified: Boolean(business.mobileVerified),
      }),
      createdAt: (business.createdAt as string) || null,
    },
    profile: profileOf(business),
    photos,
    hasPublicPhoto: businessHasPublicPhoto(withPhotos),
    completion: { percent: completion.percentage, missing },
    health,
    subscription,
    stats: {
      views30d: views.viewsLast30Days ?? 0,
      viewsAllTime: views.viewsAllTime ?? 0,
      leadsTotal: leads.length,
      leadsNew: leads.filter((lead) => isLeadUnread(lead)).length,
      averageResponse: averageLeadResponseLabel(leads),
      competitorAverage,
      leads7d: leads.filter(
        (lead) => lead.created_at && Date.now() - new Date(lead.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000,
      ).length,
      leadsConverted: leads.filter((lead) => lead.status === 'Converted').length,
      viewsToday: trend.today,
      views7d: trend.last7,
      visitors30d: trend.uniqueVisitors30d,
      viewsDaily: trend.daily,
      rating: ratingStats.rating,
      reviewCount: ratingStats.reviewCount,
      reviewsAwaitingReply: reviews.filter((review) => !review.reply).length,
      activeJobs: jobs.filter((job: { status?: string }) => job.status === 'active').length,
    },
    leads: maskLeads(leads.slice(0, 5), subscription.isActive),
    reviews,
    reviewFlags: {
      used: flagState.used,
      remaining: flagState.remaining,
      limit: flagState.limit,
    },
    notifications,
    limits: {
      aboutMaxWords: ABOUT_BUSINESS_MAX_WORDS,
      maxKeywords: MAX_SEARCH_KEYWORDS,
      replyMin: REVIEW_REPLY_MIN_LENGTH,
      replyMax: REVIEW_REPLY_MAX_LENGTH,
      maxActiveJobs: 3,
    },
    kycMessage: KYC_OUTSOURCED_MESSAGE,
    actor: {
      isOwner: actor.isOwner,
      teamMemberId: actor.isOwner ? null : actor.teamMemberId,
      access: actor.access,
    },
  };
}

async function storefront(businessId: string) {
  const supabase = createServiceClient();
  if (!supabase) return fail('Storefront preview is not available right now.');
  const { data, error } = await supabase
    .from('Business')
    .select(STOREFRONT_SELECT)
    .eq('id', businessId)
    .maybeSingle();
  if (error || !data) return fail('Could not load your storefront.');
  return { success: true as const, row: data };
}

async function saveProfile(businessId: string, patch: unknown) {
  if (!patch || typeof patch !== 'object') return fail('Nothing to save.');
  const business = await loadBusiness(businessId);
  if ('success' in business) return business;

  const editable = profileOf(business);
  const next: Record<string, unknown> = { ...editable };
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (
      key in editable ||
      key === 'emailVerificationToken' ||
      key === 'ownerMobileVerificationToken' ||
      key === 'whatsappVerificationToken'
    ) {
      next[key] = value;
    }
  }
  next.businessName = editable.businessName;
  next.category = editable.category;
  next.displayName = editable.displayName;

  for (const field of PROFILE_LINK_FIELDS) {
    const checked = validateProfileLink(field, String(next[field] ?? ''));
    if (!checked.ok) return fail(checked.error);
    next[field] = checked.value;
  }
  const year = Number(next.yearsInBusiness) || 0;
  if (year && !isValidEstablishmentYear(year)) {
    return fail(
      `Year of establishment must be between ${minEstablishmentYear()} and ${new Date().getFullYear()}.`,
    );
  }
  next.yearsInBusiness = year;
  if (Array.isArray(next.keywords) && next.keywords.length > MAX_SEARCH_KEYWORDS) {
    return fail(`Add up to ${MAX_SEARCH_KEYWORDS} search keywords.`);
  }

  const result = await updateBusinessProfile(businessId, next);
  if (!result.success) return fail(result.error || 'Could not save your changes.');
  return overview(businessId);
}

const DATA_URI = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_UPLOAD_BYTES = 4_000_000;

async function uploadPhoto(businessId: string, image: unknown) {
  const match = typeof image === 'string' ? DATA_URI.exec(image) : null;
  if (!match) return fail('Choose a JPG, PNG or WebP photo.');
  if (Math.floor((match[2].length * 3) / 4) > MAX_UPLOAD_BYTES) {
    return fail('This photo is too large. Choose a smaller one.');
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) return fail('Photo upload is not available right now.');

  const business = await loadBusiness(businessId);
  if ('success' in business) return business;
  const current = photosOf(business);

  let secureUrl = '';
  try {
    const form = new FormData();
    form.append('file', image as string);
    form.append('upload_preset', uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const body = (await response.json().catch(() => null)) as { secure_url?: unknown } | null;
    if (response.ok && typeof body?.secure_url === 'string') secureUrl = body.secure_url;
    if (!secureUrl) console.error('[merchant console upload] Cloudinary status', response.status);
  } catch (error) {
    console.error('[merchant console upload]', error);
  }
  if (!secureUrl) return fail('Could not upload the photo. Please try again.');

  const images = [...current.images, secureUrl];
  const result = await updateBusinessImages(businessId, images, current.cover || secureUrl);
  if (!result.success) return fail(result.error || 'Could not save the photo.');
  return overview(businessId);
}

async function setPhotos(businessId: string, images: unknown, cover: unknown) {
  const list = normalizeBusinessImages(images);
  const business = await loadBusiness(businessId);
  if ('success' in business) return business;
  const owned = new Set(photosOf(business).images);
  if (list.some((url) => !owned.has(url))) return fail('Refresh and try again.');
  const nextCover = typeof cover === 'string' && list.includes(cover) ? cover : list[0] || '';
  const result = await updateBusinessImages(businessId, list, nextCover);
  if (!result.success) return fail(result.error || 'Could not update photos.');
  return overview(businessId);
}

async function leads(businessId: string) {
  const business = await loadBusiness(businessId);
  if ('success' in business) return business;
  const result = await getBusinessLeads(businessId);
  if (!result.success) return fail(result.error);
  return {
    success: true as const,
    unlocked: subscriptionOf(business).isActive,
    leads: maskLeads(result.leads, subscriptionOf(business).isActive),
  };
}

async function markLeadReadAction(leadId: unknown) {
  if (typeof leadId !== 'string' || !leadId) return fail('Lead is required.');
  const result = await markLeadRead(leadId);
  return result.success ? { success: true as const } : fail(result.error);
}

async function hideBusiness(businessId: string) {
  const supabase = createServiceClient();
  if (!supabase) return fail('Could not take down this listing.');
  const { data, error } = await supabase
    .from('Business')
    .update({
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', businessId)
    .select('id, slug, businessName, displayName, city, status')
    .maybeSingle();
  if (error || !data) return fail('Could not take down this listing.');
  revalidateBusinessProfilePaths({
    id: data.id,
    slug: data.slug,
    name: data.displayName,
    businessName: data.businessName,
    city: data.city,
  });
  return {
    success: true as const,
    message: 'Your listing has been taken down and is no longer visible to customers.',
  };
}

async function setLeadStatus(leadId: unknown, status: unknown) {
  const allowed = [
    'To be contacted',
    'Asked to connect later',
    'Contacted',
    'Not interested',
    'Wrong lead',
    'Converted',
    'Closed',
  ];
  if (typeof leadId !== 'string' || typeof status !== 'string' || !allowed.includes(status)) {
    return fail('Choose a valid status.');
  }
  const result = await updateLeadStatus(leadId, status);
  return result.success ? { success: true as const } : fail(result.error);
}

async function replyReview(businessId: string, reviewId: unknown, content: unknown) {
  const result = await upsertMerchantReviewReply({
    businessId,
    reviewId: String(reviewId || ''),
    content: String(content || ''),
  });
  if (!result.success) return fail(result.error);
  return overview(businessId);
}

async function flagReview(businessId: string, reviewId: unknown, reason: unknown) {
  const result = await flagMerchantReview({
    businessId,
    reviewId: String(reviewId || ''),
    reason: String(reason || ''),
  });
  if (!result.success) return fail(result.error);
  return overview(businessId);
}

type JobInput = {
  title?: unknown;
  type?: unknown;
  location?: unknown;
  salary?: unknown;
  description?: unknown;
  department?: unknown;
  status?: unknown;
};

function cleanJob(input: JobInput) {
  return {
    title: text(input.title),
    type: text(input.type),
    location: text(input.location),
    salary: text(input.salary),
    description: text(input.description),
    department: text(input.department),
  };
}

async function jobs(businessId: string) {
  const result = await getJobsByBusiness(businessId);
  if (!result.success) return fail(result.error || 'Could not load jobs.');
  return { success: true as const, jobs: result.jobs ?? [] };
}

async function saveJob(businessId: string, jobId: unknown, input: JobInput) {
  const job = cleanJob(input || {});
  if (!job.title || !job.type || !job.location || !job.description) {
    return fail('Add a title, job type, location and description.');
  }
  const result =
    typeof jobId === 'string' && jobId
      ? await updateJob(jobId, job)
      : await createJob({ ...job, businessId });
  if (!result.success) return fail(result.error || 'Could not save the job.');
  return jobs(businessId);
}

async function setJobStatus(businessId: string, jobId: unknown, status: unknown) {
  if (typeof jobId !== 'string' || (status !== 'active' && status !== 'closed')) {
    return fail('Choose a valid status.');
  }
  if (status === 'active') {
    const current = await jobs(businessId);
    if (current.success && current.jobs.filter((job: { status?: string }) => job.status === 'active').length >= 3) {
      return fail('Maximum limit of 3 active job postings reached.');
    }
  }
  const result = await updateJob(jobId, { status });
  if (!result.success) return fail(result.error || 'Could not update the job.');
  return jobs(businessId);
}

async function removeJob(businessId: string, jobId: unknown) {
  if (typeof jobId !== 'string') return fail('Job not found');
  const result = await deleteJob(jobId);
  if (!result.success) return fail(result.error || 'Could not delete the job.');
  return jobs(businessId);
}

function pricing() {
  return {
    offerName: GROWTH_PRO_OFFER_NAME,
    monthly: { name: 'Growth', price: GROWTH_PRO_OFFER_MONTHLY, retail: GROWTH_PRO_RETAIL_MONTHLY },
    annual: {
      name: 'Pro',
      price: GROWTH_PRO_OFFER_ANNUAL,
      retail: GROWTH_PRO_RETAIL_ANNUAL,
      perMonth: GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL,
    },
    features: [...GROWTH_PRO_FEATURES],
    starterIncludes: [...FREE_LISTING_INCLUDED],
    compare: PLAN_COMPARE_ROWS,
    checkoutAvailable: isRazorpayConfigured(),
  };
}

async function subscription(businessId: string) {
  const result = await getMerchantSubscriptionDetails(businessId);
  if (!result.success) return fail(result.error);
  return { success: true as const, subscription: result.subscription, history: result.history, pricing: pricing() };
}

async function startCheckout(businessId: string, billingCycle: unknown) {
  const result = await createMerchantPaymentOrder({
    businessId,
    plan: 'pro',
    billingCycle: String(billingCycle || ''),
  });
  if (!result.success) return fail(result.error);
  return result;
}

async function completeCheckout(businessId: string, input: Record<string, unknown>) {
  const result = await completeMerchantPayment({
    businessId,
    plan: 'pro',
    billingCycle: String(input.billingCycle || ''),
    razorpayOrderId: text(input.razorpayOrderId) || undefined,
    razorpaySubscriptionId: text(input.razorpaySubscriptionId) || undefined,
    razorpayPaymentId: text(input.razorpayPaymentId),
    razorpaySignature: text(input.razorpaySignature),
  });
  if (!result.success) return fail(result.error);
  return subscription(businessId);
}

async function cancelAutoRenew(businessId: string) {
  const result = await cancelMerchantAutoRenew(businessId);
  if (!result.success) return fail(result.error);
  const details = await subscription(businessId);
  return details.success ? { ...details, message: result.message } : details;
}

async function changeRequests(businessId: string) {
  const [category, legalName, displayName] = await Promise.all([
    getPendingChangeRequest(businessId, CATEGORY_CHANGE_FIELD),
    getPendingChangeRequest(businessId, LEGAL_BUSINESS_NAME_FIELD),
    getPendingChangeRequest(businessId, DISPLAY_NAME_FIELD),
  ]);
  return {
    success: true as const,
    category: category.success ? category.request : null,
    legalName: legalName.success ? legalName.request : null,
    displayName: displayName.success ? displayName.request : null,
  };
}

async function requestChange(businessId: string, field: unknown, value: unknown, note: unknown) {
  const target =
    field === 'category'
      ? CATEGORY_CHANGE_FIELD
      : field === 'legalName'
        ? LEGAL_BUSINESS_NAME_FIELD
        : field === 'displayName'
          ? DISPLAY_NAME_FIELD
          : null;
  if (!target) return fail('Choose what you want to change.');
  const result = await submitChangeRequest({
    businessId,
    field: target,
    requestedValue: String(value || ''),
    merchantNote: text(note) || undefined,
  });
  if (!result.success) return fail(result.error);
  return changeRequests(businessId);
}

/**
 * The app finds a merchant by the login's email or mobile, so a verified change on the business
 * is copied to that login too; otherwise the next request could not find the business.
 */
async function followContactChange(userId: string, kind: 'email' | 'mobile', value: string) {
  const supabase = createServiceClient();
  if (!supabase) return;
  if (kind === 'email') {
    const { data: clash } = await supabase
      .from('User')
      .select('id')
      .ilike('email', escapeIlikePattern(value))
      .neq('id', userId)
      .limit(1);
    if (clash?.length) return;
    await supabase.from('User').update({ email: value, updatedAt: new Date().toISOString() }).eq('id', userId);
    return;
  }
  const { data: clash } = await supabase.from('User').select('id').eq('phone', value).neq('id', userId).limit(1);
  if (clash?.length) return;
  await supabase.from('User').update({ phone: value, updatedAt: new Date().toISOString() }).eq('id', userId);
}

async function contactCode(kind: unknown, value: unknown) {
  if (kind === 'email') return requestMerchantEmailVerifyCode(value);
  if (kind === 'mobile') return requestMerchantMobileVerifyCode(value);
  return fail('Choose email or mobile.');
}

async function confirmContact(userId: string, businessId: string, kind: unknown, value: unknown, code: unknown) {
  const otp = String(code || '').trim();
  const result =
    kind === 'email'
      ? await confirmMerchantEmailVerifyCode(value, otp)
      : kind === 'mobile'
        ? await confirmMerchantMobileVerifyCode(value, otp)
        : fail('Choose email or mobile.');
  if (!result.success) return result;
  await followContactChange(userId, kind as 'email' | 'mobile', result.value);
  const next = await overview(businessId);
  return next.success ? { ...next, message: result.message } : next;
}

async function changePassword(businessId: string, input: Record<string, unknown>) {
  const result = await changeBusinessPassword(businessId, {
    currentPassword: String(input.currentPassword || ''),
    newPassword: String(input.newPassword || ''),
    confirmPassword: String(input.confirmPassword || ''),
  });
  return result.success ? { success: true as const } : fail(result.error || 'Could not change the password.');
}

async function markRead(businessId: string) {
  const supabase = createServiceClient();
  if (supabase) {
    const { error } = await supabase
      .from('merchant_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .is('read_at', null);
    if (error) console.error('[merchant alerts read]', error);
  }
  return { success: true as const };
}

export type ConsoleRequest = { action?: unknown } & Record<string, unknown>;

async function gateConsoleAction(businessId: string, action: unknown) {
  const key = String(action || '');
  const rule = CONSOLE_ACTION_ACCESS[key];
  if (!rule) return null;
  const actor = await resolveBusinessActor(businessId);
  if (!actor.ok) return fail(actor.error);
  if (rule.owner && !actor.isOwner) return fail(TEAM_OWNER_ONLY);
  if (rule.tab && rule.mode === 'edit' && !(actor.isOwner || (actor.access[rule.tab]?.view && actor.access[rule.tab]?.edit))) {
    return fail(TEAM_TAB_LOCKED);
  }
  if (rule.tab && rule.mode === 'view' && !(actor.isOwner || actor.access[rule.tab]?.view)) {
    return fail(TEAM_TAB_LOCKED);
  }
  return null;
}

/** Dispatch one console action. The caller must already run inside `runAsMobileMerchant`. */
export async function runConsoleAction(userId: string, businessId: string, body: ConsoleRequest) {
  const blocked = await gateConsoleAction(businessId, body.action);
  if (blocked) return blocked;
  switch (body.action) {
    case 'overview':
      return overview(businessId);
    case 'storefront':
      return storefront(businessId);
    case 'saveProfile':
      return saveProfile(businessId, body.patch);
    case 'uploadPhoto':
      return uploadPhoto(businessId, body.image);
    case 'setPhotos':
      return setPhotos(businessId, body.images, body.cover);
    case 'leads':
      return leads(businessId);
    case 'setLeadStatus':
      return setLeadStatus(body.leadId, body.status);
    case 'markLeadRead':
      return markLeadReadAction(body.leadId);
    case 'hideBusiness':
      return hideBusiness(businessId);
    case 'replyReview':
      return replyReview(businessId, body.reviewId, body.content);
    case 'flagReview':
      return flagReview(businessId, body.reviewId, body.reason);
    case 'jobs':
      return jobs(businessId);
    case 'saveJob':
      return saveJob(businessId, body.jobId, (body.job || {}) as JobInput);
    case 'setJobStatus':
      return setJobStatus(businessId, body.jobId, body.status);
    case 'deleteJob':
      return removeJob(businessId, body.jobId);
    case 'subscription':
      return subscription(businessId);
    case 'startCheckout':
      return startCheckout(businessId, body.billingCycle);
    case 'completeCheckout':
      return completeCheckout(businessId, body);
    case 'cancelAutoRenew':
      return cancelAutoRenew(businessId);
    case 'changeRequests':
      return changeRequests(businessId);
    case 'requestChange':
      return requestChange(businessId, body.field, body.value, body.note);
    case 'contactStatus':
      return getMerchantContactStatus();
    case 'sendContactCode':
      return contactCode(body.kind, body.value);
    case 'confirmContact':
      return confirmContact(userId, businessId, body.kind, body.value, body.code);
    case 'sendOwnerMobileCode':
      return requestMerchantOwnerMobileCode(body.value);
    case 'confirmOwnerMobile':
      return confirmMerchantOwnerMobileCode(body.value, String(body.code || '').trim());
    case 'changePassword':
      return changePassword(businessId, body);
    case 'markNotificationsRead':
      return markRead(businessId);
    case 'notifications': {
      const business = await loadBusiness(businessId);
      if ('success' in business) return business;
      return loadNotifications(businessId, text(business.category));
    }
    case 'listTeam':
      return { success: true as const, members: await listTeamMembers(businessId) };
    case 'inviteTeam':
      return inviteTeamMember({
        businessId,
        channel: body.channel === 'phone' ? 'phone' : 'email',
        email: String(body.email || ''),
        mobile: String(body.mobile || ''),
        access: body.access,
        invitedBy: businessId,
      });
    case 'resendTeam':
      return resendTeamInvite({ businessId, memberId: String(body.memberId || '') });
    case 'verifyTeamOtp':
      return verifyTeamInviteOtp({
        businessId,
        memberId: String(body.memberId || ''),
        code: String(body.code || ''),
      });
    case 'updateTeamAccess':
      return updateTeamAccess({
        businessId,
        memberId: String(body.memberId || ''),
        access: body.access,
      });
    case 'revokeTeam':
      return revokeTeamMember({ businessId, memberId: String(body.memberId || '') });
    default:
      return fail('Unknown action.');
  }
}
