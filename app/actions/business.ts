'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sortBusinessesByProfileCompleteness } from '@/lib/businessProfileCompleteness';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import {
  formatRegistrationConflictMessage,
  formatWrongPortalLoginMessage,
  getRegistrationConflict,
  getAlternateAccountType,
  LOGIN_PATHS,
  lookupEmailAccountTypes,
} from '@/lib/emailAccountLookup';
import { mapBusinessRecord, mapOwnedBusinessRecord } from '@/lib/businessMapping';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { ensureBusinessSlug } from '@/lib/businessSlug.server';
import { isLegacyBusinessId, resolveBusinessSlug } from '@/lib/businessSlug';
import { createServiceClient } from '@/lib/supabase/service';
import {
  CATEGORY_LISTINGS_MAX_PAGE_SIZE,
  CATEGORY_LISTINGS_PAGE_SIZE,
} from '@/lib/categoryListings';
import { validateMapPinAgainstAddress } from '@/app/actions/location';
import {
  applyResolvedAddressToManual,
  hasResolvedMapAddress,
  mapPinMatchesManualAddress,
} from '@/lib/locationMatch';
import {
  REGISTRATION_EMAIL_REGEX,
  validateAndNormalizeRegistrationPayload,
} from '@/lib/merchantRegistrationValidation';
import {
  getReviewReplyDraft,
  normalizeReviewReplyForStorage,
  validateReviewReplyContent,
} from '@/lib/businessReviews';
import {
  indianMobileValidationError,
  normalizeIndianPhoneForStorage,
} from '@/lib/indianPhone';
import { normalizeSearchKeywords } from '@/lib/businessKeywords';
import {
  ABOUT_BUSINESS_MAX_WORDS,
  isAboutWithinWordLimit,
  trimAboutToWordLimit,
} from '@/lib/businessAbout';
import { parseCoordinate } from '@/lib/geo';
import { revalidateSitemap } from '@/lib/sitemapData';
import { escapeIlikePattern } from '@/lib/searchMatch';
import {
  PASSWORD_MIN_LENGTH_USER,
  validateChangePasswordFields,
} from '@/lib/security/passwordPolicy';
import {
  hashPassword,
  PASSWORD_MIN_LENGTH_MERCHANT,
  validatePasswordLength,
  verifyPassword,
} from '@/lib/security/password';
import {
  assertBusinessSession,
  setBusinessSessionCookie,
} from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { redactPublicBusinessFields } from '@/lib/security/businessFields';
import { finalizeMerchantPayment } from '@/lib/razorpay/finalizeMerchantPayment';

// Safe error handler wrapper
function handleError(error: any, context: string): string {
  console.error(`${context} Error:`, error);

  const msg = error?.message || String(error) || 'An unexpected error occurred';

  // Handle Supabase errors
  if (error?.code === 'PGRST116') {
    return 'Record not found.';
  }

  if (error?.code === '23505') {
    if (msg.includes('mobile')) {
      return 'This mobile number is already registered.';
    }
    if (msg.includes('email')) {
      return 'This email already exists.';
    }
    return 'Duplicate entry found.';
  }

  if (msg.includes('connect') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
    return 'Database connection failed. Please check your configuration.';
  }

  if (msg.includes('Server Components render')) {
    return 'Server error occurred. Please check Vercel logs for details.';
  }

  return msg;
}

export async function registerBusiness(formData: any) {
  const startTime = Date.now();

  try {
    const validated = validateAndNormalizeRegistrationPayload(formData);
    if (!validated.ok) {
      return { success: false, error: validated.error };
    }

    const normalized = validated.data;

    console.log('✓ [REGISTER] Validation passed');
    console.log('[REGISTER] Attempting database operation...');

    // Generate a unique registration number
    const regNo = `FINDERB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const normalizedEmail = normalized.email;

    const ipLimit = await enforceRateLimit('register');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `register:${normalizedEmail}`);
    if (!emailLimit.ok) return { success: false, error: emailLimit.error };

    const supabase = createClient(await cookies());

    const existingAccount = await getRegistrationConflict(supabase, normalizedEmail, 'merchant');
    if (existingAccount) {
      return {
        success: false,
        error: formatRegistrationConflictMessage(existingAccount, 'merchant'),
        suggestedLoginPath: LOGIN_PATHS[existingAccount],
        registeredAs: existingAccount,
      };
    }

    console.log('[REGISTER] Creating business record...');

    const now = new Date().toISOString();
    const passwordValue = normalized.password
      ? await hashPassword(normalized.password)
      : null;

    const { data: business, error } = await supabase
      .from('Business')
      .insert({
        id: crypto.randomUUID(),
        fullName: normalized.fullName,
        workEmail: normalizedEmail,
        email: normalizedEmail,
        mobile: normalized.mobile,
        businessName: normalized.businessName,
        displayName: normalized.displayName,
        owner_name: normalized.fullName,
        owner_mobile: normalized.mobile,
        category: normalized.category,
        location: normalized.location,
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
        publicPhone: normalized.publicPhone,
        businessAddress: normalized.businessAddress,
        selectedPlan: normalized.selectedPlan || 'free',
        billingCycle: normalized.billingCycle || 'monthly',
        status: 'Pending',
        kycStatus: 'pending',
        registrationNumber: regNo,
        ...(passwordValue ? { password: passwordValue } : {}),
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const slug = await ensureBusinessSlug(business);
    const businessWithSlug = { ...business, slug };

    console.log('[REGISTER] ✓ Success:', businessWithSlug.id);
    
    // Set a cookie for the business ID to maintain session
    await setBusinessSessionCookie(businessWithSlug.id);

    revalidatePath('/business');
    revalidateSitemap();
    return { success: true, business: businessWithSlug };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[REGISTER] ✗ Failed after ${duration}ms:`, error);
    const errorMessage = handleError(error, 'Registration');
    return { success: false, error: errorMessage };
  }
}

export async function updateBusinessKYC(id: string, _kycData: unknown) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    return {
      success: false,
      error:
        'In-dashboard KYC uploads are no longer accepted. FinderB verifies businesses through a separate verification partner — our team will contact you when documents are needed.',
    };
  } catch (error: unknown) {
    const errorMessage = handleError(error, 'KYC Update');
    return { success: false, error: errorMessage };
  }
}

export async function updateBusinessPayment(
  id: string,
  paymentData: {
    paymentId: string;
    orderId: string;
    selectedPlan: string;
    billingCycle: string;
    razorpaySignature: string;
    amountPaise: number;
  }
) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (
      !paymentData?.paymentId ||
      !paymentData?.orderId ||
      !paymentData?.razorpaySignature
    ) {
      return { success: false, error: 'Invalid payment details' };
    }

    const result = await finalizeMerchantPayment({
      businessId: id,
      orderId: paymentData.orderId,
      paymentId: paymentData.paymentId,
      plan: paymentData.selectedPlan,
      billingCycle: paymentData.billingCycle,
      amountPaise: paymentData.amountPaise,
      razorpaySignature: paymentData.razorpaySignature,
      source: 'checkout',
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const businessResult = await getOwnedBusiness(id);
    if (!businessResult.success || !businessResult.business) {
      return { success: false, error: 'Business not found after payment' };
    }

    return { success: true, business: businessResult.business };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Payment Update');
    return { success: false, error: errorMessage };
  }
}

export async function updateBusinessImages(id: string, images: string[], profilePictureUrl?: string) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    console.log('Updating images for business:', id);

    const supabase = createClient(await cookies());

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        images: images,
        profilePictureUrl: profilePictureUrl || (images.length > 0 ? images[0] : null),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath(`/business/dashboard`);
    return { success: true, business };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Images Update');
    return { success: false, error: errorMessage };
  }
}

export async function getBusinessBySlugOrId(slugOrId: string) {
  try {
    if (!slugOrId?.trim()) {
      return { success: false, error: 'Business identifier is required', reason: 'not_found' as const };
    }

    const identifier = slugOrId.trim();
    const supabase = createClient(await cookies());

    const { data: bySlug, error: slugError } = await supabase
      .from('Business')
      .select('*')
      .eq('slug', identifier)
      .maybeSingle();

    if (slugError) throw slugError;

    let business = bySlug;

    if (!business && isLegacyBusinessId(identifier)) {
      const { data: byId, error: idError } = await supabase
        .from('Business')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();

      if (idError) throw idError;
      business = byId;
    }

    if (!business) {
      const service = createServiceClient();
      if (service) {
        const { data: bySlugAdmin } = await service
          .from('Business')
          .select('*')
          .eq('slug', identifier)
          .maybeSingle();

        business = bySlugAdmin;

        if (!business && isLegacyBusinessId(identifier)) {
          const { data: byIdAdmin } = await service
            .from('Business')
            .select('*')
            .eq('id', identifier)
            .maybeSingle();
          business = byIdAdmin;
        }
      }
    }

    if (!business) {
      return { success: false, error: 'Business not found', reason: 'not_found' as const };
    }

    const listingStatus = String(business.status || 'Pending');
    if (listingStatus.toLowerCase() !== 'active') {
      const displayName =
        String(business.displayName || business.businessName || 'This business').trim() ||
        'This business';
      return {
        success: false,
        error: 'Business listing is not active',
        reason: 'inactive' as const,
        listing: {
          id: String(business.id),
          businessName: String(business.businessName || displayName),
          displayName,
          city: business.city ? String(business.city) : null,
          status: listingStatus,
          slug: business.slug ? String(business.slug) : null,
          registrationNumber: business.registrationNumber
            ? String(business.registrationNumber)
            : null,
        },
      };
    }

    let slug = business.slug?.trim() || '';
    if (!slug) {
      try {
        slug = await ensureBusinessSlug(business);
      } catch (slugError) {
        console.error('[getBusinessBySlugOrId] slug ensure failed:', slugError);
        slug = resolveBusinessSlug({
          slug: business.slug,
          name: business.displayName,
          businessName: business.businessName,
          city: business.city,
        });
      }
    }

    const mapped = mapBusinessRecord({ ...business, slug });
    const publicBusiness = redactPublicBusinessFields(mapped);
    return { success: true, business: publicBusiness, reason: 'active' as const };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Business');
    return { success: false, error: errorMessage, reason: 'not_found' as const };
  }
}

/** @deprecated Use getBusinessBySlugOrId */
export async function getBusiness(id: string) {
  return getBusinessBySlugOrId(id);
}

export async function getRelatedBusinessesForProfile(
  business: {
    id: string;
    category: string;
    city?: string | null;
  },
  options?: { categoryLimit?: number; cityLimit?: number }
) {
  try {
    const supabase = createClient(await cookies());
    const categoryLimit = options?.categoryLimit ?? 4;
    const cityLimit = options?.cityLimit ?? 4;

    const categoryQuery = supabase
      .from('Business')
      .select('*')
      .eq('status', 'Active')
      .neq('id', business.id)
      .ilike('category', `%${escapeIlikePattern(business.category)}%`)
      .order('updatedAt', { ascending: false })
      .limit(categoryLimit + 2);

    let cityBusinesses: Record<string, unknown>[] = [];
    if (business.city?.trim()) {
      const { data } = await supabase
        .from('Business')
        .select('*')
        .eq('status', 'Active')
        .neq('id', business.id)
        .ilike('city', `%${escapeIlikePattern(business.city.trim())}%`)
        .order('updatedAt', { ascending: false })
        .limit(cityLimit + 2);
      cityBusinesses = data ?? [];
    }

    const { data: categoryRows, error } = await categoryQuery;
    if (error) throw error;

    const sameCategory = (categoryRows ?? [])
      .map((row) => mapBusinessRecord(row))
      .filter((row) => row.id !== business.id)
      .slice(0, categoryLimit);

    const sameCity = cityBusinesses
      .map((row) => mapBusinessRecord(row))
      .filter(
        (row) => row.id !== business.id && !sameCategory.some((item) => item.id === row.id)
      )
      .slice(0, cityLimit);

    return { success: true as const, sameCategory, sameCity };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Related Businesses');
    return { success: false as const, error: errorMessage };
  }
}

/** Full merchant record for the logged-in owner only (no password). */
export async function getOwnedBusiness(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createClient(await cookies());

    const { data: business, error } = await supabase
      .from('Business')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Business not found' };
      }
      throw error;
    }

    return { success: true, business: mapOwnedBusinessRecord(business) };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Owned Business');
    return { success: false, error: errorMessage };
  }
}

export async function loginBusiness(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const passwordCheck = validatePasswordLength(password, 1);
    if (!passwordCheck.ok) {
      return { success: false, error: passwordCheck.error };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const ipLimit = await enforceRateLimit('auth');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `login:${normalizedEmail}`);
    if (!emailLimit.ok) return { success: false, error: emailLimit.error };

    const supabase = createClient(await cookies());
    const loginFields = 'id, password, createdAt';

    const [{ data: byWorkEmail }, { data: byEmail }] = await Promise.all([
      supabase.from('Business').select(loginFields).eq('workEmail', normalizedEmail),
      supabase.from('Business').select(loginFields).eq('email', normalizedEmail),
    ]);

    const seen = new Set<string>();
    const businesses = [...(byWorkEmail ?? []), ...(byEmail ?? [])]
      .filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      );

    if (!businesses.length) {
      const accountTypes = await lookupEmailAccountTypes(supabase, normalizedEmail);
      const alternateType = getAlternateAccountType(accountTypes, 'merchant');

      if (alternateType) {
        return {
          success: false,
          error: formatWrongPortalLoginMessage(alternateType, 'merchant'),
          suggestedLoginPath: LOGIN_PATHS[alternateType],
          registeredAs: alternateType,
        };
      }

      return {
        success: false,
        error: 'No Merchant account found with this email. Please check your email or register a new business.',
      };
    }

    let matchedBusiness: (typeof businesses)[number] | null = null;
    for (const row of businesses) {
      const verification = await verifyPassword(password, row.password);
      if (verification.valid) {
        matchedBusiness = row;
        if (verification.needsRehash) {
          const hashedPassword = await hashPassword(password);
          await supabase
            .from('Business')
            .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
            .eq('id', row.id);
        }
        break;
      }
    }

    if (!matchedBusiness) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    await setBusinessSessionCookie(matchedBusiness.id);

    return { success: true, businessId: matchedBusiness.id };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Login');
    return { success: false, error: errorMessage };
  }
}

export async function logoutBusiness() {
  try {
    (await cookies()).delete('business_id');
    revalidatePath('/business/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to logout' };
  }
}

export async function verifyBusinessCurrentPassword(businessId: string, currentPassword: string) {
  try {
    if (!businessId) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const trimmed = currentPassword?.trim() ?? '';
    if (!trimmed) {
      return { success: false, error: 'Enter your current password.' };
    }

    const supabase = createClient(await cookies());
    const { data: business, error } = await supabase
      .from('Business')
      .select('id, password')
      .eq('id', businessId)
      .single();

    if (error || !business?.password) {
      return { success: false, error: 'Could not verify your current password.' };
    }

    const verification = await verifyPassword(trimmed, business.password);
    if (!verification.valid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = handleError(error, 'Verify Password');
    return { success: false, error: errorMessage };
  }
}

export async function changeBusinessPassword(
  businessId: string,
  input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
) {
  try {
    if (!businessId) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const currentPassword = input.currentPassword?.trim() ?? '';
    if (!currentPassword) {
      return { success: false, error: 'Enter your current password.' };
    }

    const changeError = validateChangePasswordFields({
      newPassword: input.newPassword ?? '',
      confirmPassword: input.confirmPassword ?? '',
      minLength: PASSWORD_MIN_LENGTH_USER,
    });
    if (changeError) {
      return { success: false, error: changeError };
    }

    if (currentPassword === input.newPassword) {
      return {
        success: false,
        error: 'New password must be different from your current password.',
      };
    }

    const ipLimit = await enforceRateLimit('auth');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const supabase = createClient(await cookies());

    const { data: business, error: fetchError } = await supabase
      .from('Business')
      .select('id, password')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false, error: 'Business not found' };
    }

    if (!business.password) {
      return {
        success: false,
        error: 'No password is set on this account. Please contact support.',
      };
    }

    const verification = await verifyPassword(currentPassword, business.password);
    if (!verification.valid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const hashedPassword = await hashPassword(input.newPassword);

    const { error: updateError } = await supabase
      .from('Business')
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = handleError(error, 'Change Password');
    return { success: false, error: errorMessage };
  }
}

export async function getBusinessSession() {
  try {
    const businessId = (await cookies()).get('business_id')?.value;
    if (!businessId) return null;
    return await getOwnedBusiness(businessId);
  } catch (error) {
    console.error('Get Business Session Error:', error);
    return null;
  }
}

export async function getBusinessSummariesByIds(ids: string[]) {
  try {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) {
      return { success: true, businesses: [] as ReturnType<typeof mapBusinessRecord>[] };
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from('Business')
      .select('id, businessName, displayName, slug, city')
      .in('id', uniqueIds);

    if (error) throw error;

    const businesses = (data ?? []).map((row) => mapBusinessRecord(row));
    return { success: true, businesses };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Business Summaries');
    return { success: false, error: errorMessage };
  }
}

export async function getFeaturedBusinesses() {
  try {
    const supabase = createClient(await cookies());

    const { data: businesses, error } = await supabase
      .from('Business')
      .select('*')
      .eq('status', 'Active')
      .or('isFinderBVerified.eq.true,hasVerifiedBadge.eq.true')
      .limit(60);

    if (error) {
      throw error;
    }

    const mappedBusinesses = businesses.map((b: Record<string, unknown>) => mapBusinessRecord(b));
    const rankedBusinesses = sortBusinessesByProfileCompleteness(mappedBusinesses).slice(0, 12);

    return { success: true, businesses: rankedBusinesses };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Featured Businesses');
    return { success: false, error: errorMessage };
  }
}

export async function getBusinessesByCategoryAndCity(
  categorySlug: string,
  citySlug: string,
  options?: { page?: number; pageSize?: number }
) {
  try {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(
      Math.max(options?.pageSize ?? CATEGORY_LISTINGS_PAGE_SIZE, 1),
      CATEGORY_LISTINGS_MAX_PAGE_SIZE
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createClient(await cookies());
    const escapedCategory = escapeIlikePattern(categorySlug.replace(/-/g, ' '));
    const escapedCity = escapeIlikePattern(citySlug.replace(/-/g, ' '));

    const { data: businesses, error, count } = await supabase
      .from('Business')
      .select('*', { count: 'exact' })
      .eq('status', 'Active')
      .ilike('category', `%${escapedCategory}%`)
      .or(`city.ilike.%${escapedCity}%,location.ilike.%${escapedCity}%`)
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedBusinesses = (businesses ?? [])
      .map((b: Record<string, unknown>) => mapBusinessRecord(b))
      .filter((b) => b.id);

    const total = count ?? mappedBusinesses.length;

    return {
      success: true as const,
      businesses: mappedBusinesses,
      total,
      page,
      pageSize,
      hasMore: from + mappedBusinesses.length < total,
    };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Businesses By Category And City');
    return { success: false as const, error: errorMessage };
  }
}

export async function getBusinessesByCategory(
  categoryName: string,
  options?: { page?: number; pageSize?: number }
) {
  try {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(
      Math.max(options?.pageSize ?? CATEGORY_LISTINGS_PAGE_SIZE, 1),
      CATEGORY_LISTINGS_MAX_PAGE_SIZE
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createClient(await cookies());

    let query = supabase
      .from('Business')
      .select('*', { count: 'exact' })
      .eq('status', 'Active')
      .order('createdAt', { ascending: false });

    if (categoryName !== 'all') {
      const escapedCategory = escapeIlikePattern(categoryName.replace(/-/g, ' '));
      query = query.ilike('category', `%${escapedCategory}%`);
    }

    const { data: businesses, error, count } = await query.range(from, to);

    if (error) {
      throw error;
    }

    const mappedBusinesses = (businesses ?? [])
      .map((b: Record<string, unknown>) => mapBusinessRecord(b))
      .filter((b) => b.id);

    const total = count ?? mappedBusinesses.length;

    return {
      success: true,
      businesses: mappedBusinesses,
      total,
      page,
      pageSize,
      hasMore: from + mappedBusinesses.length < total,
    };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Businesses By Category');
    return { success: false, error: errorMessage };
  }
}

export async function updateBusinessProfile(id: string, profileData: any) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    console.log('Updating profile for business:', id);

    const supabase = createClient(await cookies());

    const lat = parseCoordinate(profileData.latitude);
    const lng = parseCoordinate(profileData.longitude);
    const hasValidMapPin = lat != null && lng != null && !(lat === 0 && lng === 0);

    if (hasValidMapPin) {
      const mapMatch = await validateMapPinAgainstAddress(lat, lng, {
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
      });

      if (!hasResolvedMapAddress(mapMatch.resolved)) {
        return {
          success: false,
          error:
            mapMatch.ok === false
              ? mapMatch.error
              : 'Could not read city/state from your map pin. Check the link or API key.',
        };
      }

      const mergedAddress = applyResolvedAddressToManual(
        {
          city: profileData.city,
          state: profileData.state,
          country: profileData.country,
        },
        mapMatch.resolved,
      );

      profileData.city = mergedAddress.city;
      profileData.state = mergedAddress.state;
      profileData.country = mergedAddress.country;

      const finalMatch = mapPinMatchesManualAddress(mapMatch.resolved, mergedAddress);
      if (!finalMatch.ok) {
        return { success: false, error: finalMatch.error };
      }
    }

    const aboutText = typeof profileData.about === 'string' ? profileData.about : '';
    if (!isAboutWithinWordLimit(aboutText)) {
      return {
        success: false,
        error: `About Business must be ${ABOUT_BUSINESS_MAX_WORDS} words or fewer.`,
      };
    }

    profileData.publicPhone = normalizeIndianPhoneForStorage(profileData.publicPhone ?? '');
    const publicPhoneError = indianMobileValidationError(profileData.publicPhone);
    if (publicPhoneError) {
      return { success: false, error: publicPhoneError };
    }

    const normalizedWhatsapp = normalizeIndianPhoneForStorage(profileData.whatsappNumber ?? '');
    if (normalizedWhatsapp) {
      const whatsappError = indianMobileValidationError(normalizedWhatsapp);
      if (whatsappError) {
        return { success: false, error: whatsappError };
      }
    }
    profileData.whatsappNumber = normalizedWhatsapp;
    profileData.keywords = normalizeSearchKeywords(profileData.keywords);

    const normalizedOwnerMobile = normalizeIndianPhoneForStorage(profileData.ownerMobile ?? '');
    if (normalizedOwnerMobile) {
      const ownerMobileError = indianMobileValidationError(normalizedOwnerMobile);
      if (ownerMobileError) {
        return { success: false, error: ownerMobileError };
      }
    }
    profileData.ownerMobile = normalizedOwnerMobile;

    const reviewReplyDraft = getReviewReplyDraft(profileData.reviewReply);
    const reviewReplyError = validateReviewReplyContent(reviewReplyDraft);
    if (reviewReplyError) {
      return { success: false, error: reviewReplyError };
    }
    const reviewReplyValue = normalizeReviewReplyForStorage(reviewReplyDraft);

    // Placeholder-onboarded merchants see an empty email field; never let a
    // blank submit erase the login email. Only write when a real one is given.
    const submittedEmail =
      typeof profileData.email === 'string' ? profileData.email.trim().toLowerCase() : '';
    if (submittedEmail && !REGISTRATION_EMAIL_REGEX.test(submittedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        displayName: profileData.displayName?.trim() || null,
        owner_name: profileData.ownerName?.trim() || null,
        owner_mobile: profileData.ownerMobile || null,
        ...(submittedEmail ? { email: submittedEmail, workEmail: submittedEmail } : {}),
        publicPhone: profileData.publicPhone,
        businessAddress: profileData.businessAddress,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        location: profileData.location || (profileData.city && profileData.state ? `${profileData.city}, ${profileData.state}` : profileData.city || profileData.state || ''),
        yearsInBusiness: profileData.yearsInBusiness,
        ...(hasValidMapPin ? { latitude: lat, longitude: lng } : {}),
        website: profileData.website,
        instagramUrl: profileData.instagramUrl,
        facebookUrl: profileData.facebookUrl,
        whatsappNumber: profileData.whatsappNumber,
        youtubeUrl: profileData.youtubeUrl,
        about: trimAboutToWordLimit(aboutText),
        keywords: profileData.keywords,
        timings: profileData.timings,
        discountRange: profileData.discountRange,
        serviceCategory: profileData.serviceCategory,
        paymentModes: profileData.paymentModes,
        reviewReply: reviewReplyValue,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const mapped = mapOwnedBusinessRecord(business);
    await ensureBusinessSlug({
      id: mapped.id,
      businessName: mapped.businessName,
      displayName: mapped.name,
      city: mapped.city,
      slug: mapped.slug,
    });
    revalidateBusinessProfilePaths(mapped);
    return { success: true, business: mapped };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Profile Update');
    return { success: false, error: errorMessage };
  }
}
