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
import { parseCoordinate } from '@/lib/geo';
import { formatMerchantName } from '@/lib/formatMerchantName';
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
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay/server';

import { parseBusinessServices } from '@/lib/parseBusinessServices';

function parseBusinessServicesFromRecord(business: {
  serviceCategory?: string | null;
  keywords?: string[] | null;
}): string[] {
  return parseBusinessServices(business.serviceCategory);
}

function mapBusinessRecord(business: Record<string, unknown>) {
  const { password: _password, ...safeBusiness } = business;
  const { rating, reviewCount } = getBusinessPublicRatingStats(safeBusiness.review);
  const services = parseBusinessServicesFromRecord({
    serviceCategory: business.serviceCategory as string | null | undefined,
    keywords: business.keywords as string[] | null | undefined,
  });

  const rawBusinessName = (safeBusiness.businessName as string) || '';
  const rawDisplayName = (safeBusiness.displayName as string) || '';
  const formattedBusinessName = formatMerchantName(rawBusinessName) || rawBusinessName;
  const formattedDisplayName = formatMerchantName(rawDisplayName) || rawDisplayName;
  const displayName =
    formattedBusinessName || formattedDisplayName || formatMerchantName('Business') || 'Business';

  return {
    ...safeBusiness,
    id: safeBusiness.id as string,
    businessName: formattedBusinessName,
    name: displayName,
    location: (safeBusiness.location as string) || (safeBusiness.city as string) || '',
    city: (safeBusiness.city as string | null) ?? null,
    state: (safeBusiness.state as string | null) ?? null,
    country: (safeBusiness.country as string | null) ?? null,
    category: (safeBusiness.category as string) || '',
    description: (safeBusiness.about as string) || '',
    about: (safeBusiness.about as string | null) ?? null,
    contact: (safeBusiness.publicPhone as string) || '',
    publicPhone: (safeBusiness.publicPhone as string) || '',
    mobile: (safeBusiness.mobile as string) || '',
    serviceCategory: (safeBusiness.serviceCategory as string | null) ?? null,
    profileQrLink: (safeBusiness.profileQrLink as string | null) ?? null,
    image: (safeBusiness.profilePictureUrl as string) || undefined,
    profilePictureUrl: (safeBusiness.profilePictureUrl as string) || undefined,
    priceRange: safeBusiness.selectedPlan === 'free' ? 'Free listing' : 'Premium listing',
    rating,
    reviewsCount: reviewCount,
    services,
    website: (business.website as string) || undefined,
    instagramUrl: (business.instagramUrl as string) || undefined,
    facebookUrl: (business.facebookUrl as string) || undefined,
    whatsappNumber: (business.whatsappNumber as string) || undefined,
    youtubeUrl: (business.youtubeUrl as string) || undefined,
    timings: business.timings,
    yearsInBusiness:
      typeof business.yearsInBusiness === 'number' ? business.yearsInBusiness : null,
    isFinderBVerified: Boolean(business.isFinderBVerified || business.isVerified),
    paymentModes: Array.isArray(business.paymentModes) ? business.paymentModes : [],
    email: (business.email as string) || (business.workEmail as string) || undefined,
    businessAddress: (business.businessAddress as string) || undefined,
    images: Array.isArray(business.images) ? business.images : [],
    latitude: parseCoordinate(business.latitude),
    longitude: parseCoordinate(business.longitude),
    hasVerifiedBadge: Boolean(
      business.hasVerifiedBadge || business.isFinderBVerified || business.isVerified
    ),
    review: business.review,
    reviewReply: business.reviewReply,
    keywords: Array.isArray(business.keywords) ? business.keywords : [],
    discountRange: (business.discountRange as string | null) ?? null,
    displayName: formattedDisplayName || null,
    registrationNumber: (business.registrationNumber as string | null) ?? null,
  };
}

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

    console.log('[REGISTER] ✓ Success:', business.id);
    
    // Set a cookie for the business ID to maintain session
    await setBusinessSessionCookie(business.id);

    revalidatePath('/business');
    revalidateSitemap();
    return { success: true, business };
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

    revalidatePath(`/business/${id}`);
    return { success: true, business };
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

    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: paymentData.orderId,
      paymentId: paymentData.paymentId,
      signature: paymentData.razorpaySignature,
    });

    if (!isValidSignature) {
      return { success: false, error: 'Payment verification failed' };
    }

    const supabase = createClient(await cookies());

    const { data: current, error: currentError } = await supabase
      .from('Business')
      .select('paymentStatus, paymentId')
      .eq('id', id)
      .single();

    if (currentError) {
      throw currentError;
    }

    if (current?.paymentStatus === 'completed') {
      if (current.paymentId === paymentData.paymentId) {
        const existing = await getOwnedBusiness(id);
        return existing.success
          ? { success: true, business: existing.business }
          : { success: false, error: 'Business not found' };
      }
      return { success: false, error: 'Payment is already completed for this business.' };
    }

    const { data: duplicatePayment } = await supabase
      .from('Business')
      .select('id')
      .eq('paymentId', paymentData.paymentId)
      .neq('id', id)
      .maybeSingle();

    if (duplicatePayment) {
      return { success: false, error: 'This payment has already been used.' };
    }

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        paymentStatus: 'completed',
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        selectedPlan: paymentData.selectedPlan,
        billingCycle: paymentData.billingCycle,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath(`/business/${id}`);
    return { success: true, business };
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

export async function getBusiness(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
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

    const publicBusiness = redactPublicBusinessFields(mapBusinessRecord(business));
    return { success: true, business: publicBusiness };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Business');
    return { success: false, error: errorMessage };
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

export async function getBusinessesByCategory(categoryName: string) {
  try {
    const supabase = createClient(await cookies());

    let query = supabase.from('Business').select('*');
    
    if (categoryName !== 'all') {
      const escapedCategory = escapeIlikePattern(categoryName.replace(/-/g, ' '));
      query = query.ilike('category', `%${escapedCategory}%`);
    }

    const { data: businesses, error } = await query;

    if (error) {
      throw error;
    }

    const mappedBusinesses = businesses
      .map((b: Record<string, unknown>) => mapBusinessRecord(b))
      .filter((b) => b.id);

    return { success: true, businesses: mappedBusinesses };
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

    revalidatePath(`/business/dashboard`);
    revalidatePath(`/business/${id}`);
    revalidateSitemap();
    return { success: true, business: mapBusinessRecord(business) };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Profile Update');
    return { success: false, error: errorMessage };
  }
}
