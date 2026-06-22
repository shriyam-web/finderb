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
import { mapBusinessRecord } from '@/lib/businessMapping';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { ensureBusinessSlug } from '@/lib/businessSlug.server';
import { isLegacyBusinessId } from '@/lib/businessSlug';
import {
  CATEGORY_LISTINGS_MAX_PAGE_SIZE,
  CATEGORY_LISTINGS_PAGE_SIZE,
} from '@/lib/categoryListings';
import { parseCoordinate } from '@/lib/geo';
import { revalidateSitemap } from '@/lib/sitemapData';
import { escapeIlikePattern } from '@/lib/searchMatch';
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
    // Validate required fields first
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.businessName || !formData.category || !formData.publicPhone || !formData.businessAddress) {
      return { success: false, error: 'All required fields must be filled' };
    }

    if (formData.password) {
      const passwordCheck = validatePasswordLength(formData.password, PASSWORD_MIN_LENGTH_MERCHANT);
      if (!passwordCheck.ok) {
        return { success: false, error: passwordCheck.error };
      }
    }

    console.log('✓ [REGISTER] Validation passed');
    console.log('[REGISTER] Attempting database operation...');

    // Generate a unique registration number
    const regNo = `FINDERB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const normalizedEmail = formData.email.toLowerCase().trim();

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
    const passwordValue = formData.password
      ? await hashPassword(formData.password)
      : null;

    const { data: business, error } = await supabase
      .from('Business')
      .insert({
        id: crypto.randomUUID(),
        fullName: formData.fullName,
        workEmail: normalizedEmail,
        email: normalizedEmail,
        mobile: formData.mobile.trim(),
        businessName: formData.businessName,
        category: formData.category,
        location: formData.location || `${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        publicPhone: formData.publicPhone.trim(),
        businessAddress: formData.businessAddress,
        selectedPlan: formData.selectedPlan || 'free',
        billingCycle: formData.billingCycle || 'monthly',
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

    const slug = await ensureBusinessSlug(supabase, business);
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

export async function updateBusinessKYC(id: string, kycData: any) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    console.log('Updating KYC for business:', id);

    const supabase = createClient(await cookies());

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        panNumber: kycData.panNumber,
        aadharNumber: kycData.aadharNumber,
        panUrl: kycData.panUrl,
        aadharUrl: kycData.aadharUrl,
        msmeGstUrl: kycData.msmeGstUrl,
        kycStatus: 'submitted',
        hasVerifiedBadge: !!kycData.msmeGstUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const mapped = mapBusinessRecord(business);
    revalidateBusinessProfilePaths(mapped);
    return { success: true, business: mapped };
  } catch (error: any) {
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
      return { success: false, error: 'Business identifier is required' };
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
      return { success: false, error: 'Business not found' };
    }

    const slug = await ensureBusinessSlug(supabase, business);
    const mapped = mapBusinessRecord({ ...business, slug });
    const publicBusiness = redactPublicBusinessFields(mapped);
    return { success: true, business: publicBusiness };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Business');
    return { success: false, error: errorMessage };
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

    return { success: true, business: mapBusinessRecord(business) };
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

export async function getFeaturedBusinesses() {
  try {
    const supabase = createClient(await cookies());

    const { data: businesses, error } = await supabase
      .from('Business')
      .select('*')
      .eq('status', 'Active')
      .or('isVerified.eq.true,isFinderBVerified.eq.true')
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

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        businessName: profileData.businessName,
        displayName: profileData.displayName,
        category: profileData.category,
        email: profileData.email,
        workEmail: profileData.email,
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
        about: profileData.about,
        keywords: profileData.keywords,
        timings: profileData.timings,
        discountRange: profileData.discountRange,
        serviceCategory: profileData.serviceCategory,
        paymentModes: profileData.paymentModes,
        profileQrLink: profileData.profileQrLink,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const mapped = mapBusinessRecord(business);
    revalidateBusinessProfilePaths(mapped);
    return { success: true, business: mapped };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Profile Update');
    return { success: false, error: errorMessage };
  }
}
