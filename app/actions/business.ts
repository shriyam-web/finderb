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

function parseBusinessServices(business: {
  serviceCategory?: string | null;
  keywords?: string[] | null;
}): string[] {
  const services = new Set<string>();

  if (business.serviceCategory?.trim()) {
    business.serviceCategory
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => services.add(item));
  }

  return [...services];
}

function mapBusinessRecord(business: Record<string, unknown>) {
  const { rating, reviewCount } = getBusinessPublicRatingStats(business.review);
  const services = parseBusinessServices({
    serviceCategory: business.serviceCategory as string | null | undefined,
    keywords: business.keywords as string[] | null | undefined,
  });

  return {
    ...business,
    id: business.id as string,
    businessName: (business.businessName as string) || '',
    name: (business.businessName as string) || (business.displayName as string) || 'Business',
    location: (business.location as string) || (business.city as string) || '',
    city: (business.city as string | null) ?? null,
    state: (business.state as string | null) ?? null,
    country: (business.country as string | null) ?? null,
    category: (business.category as string) || '',
    description: (business.about as string) || '',
    about: (business.about as string | null) ?? null,
    contact: (business.publicPhone as string) || '',
    publicPhone: (business.publicPhone as string) || '',
    mobile: (business.mobile as string) || '',
    serviceCategory: (business.serviceCategory as string | null) ?? null,
    profileQrLink: (business.profileQrLink as string | null) ?? null,
    image: (business.profilePictureUrl as string) || undefined,
    profilePictureUrl: (business.profilePictureUrl as string) || undefined,
    priceRange: business.selectedPlan === 'free' ? 'Free listing' : 'Premium listing',
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
    displayName: (business.displayName as string | null) ?? null,
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

    console.log('✓ [REGISTER] Validation passed');
    console.log('[REGISTER] Attempting database operation...');

    // Generate a unique registration number
    const regNo = `FINDERB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const normalizedEmail = formData.email.toLowerCase().trim();

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
        password: formData.password,
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
    (await cookies()).set('business_id', business.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    revalidatePath('/business');
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

export async function updateBusinessPayment(id: string, paymentData: any) {
  try {
    if (!id) {
      return { success: false, error: 'Business ID is required' };
    }

    console.log('Updating payment for business:', id);

    const supabase = createClient(await cookies());

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

    console.log('Fetching business:', id);

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
    const errorMessage = handleError(error, 'Get Business');
    return { success: false, error: errorMessage };
  }
}

export async function loginBusiness(email: string, password: string) {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    console.log('Login attempt with email:', email);

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const supabase = createClient(await cookies());

    const { data: businesses, error } = await supabase
      .from('Business')
      .select('*')
      .or(`workEmail.eq.${normalizedEmail},email.eq.${normalizedEmail}`)
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }

    if (!businesses?.length) {
      console.log('No business found with email:', normalizedEmail);

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

    const matches = businesses.filter((row) => row.password === cleanPassword);
    if (!matches.length) {
      console.log('Incorrect password for email:', normalizedEmail);
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const business = matches[0];

    console.log('Login successful for business:', business.id);

    // Set a cookie for the business ID to maintain session
    (await cookies()).set('business_id', business.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return { success: true, businessId: business.id };
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
    return await getBusiness(businessId);
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
      // Find the category to get the exact name if possible, or use the slug
      query = query.ilike('category', `%${categoryName.replace(/-/g, ' ')}%`);
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
        rating: profileData.rating,
        yearsInBusiness: profileData.yearsInBusiness,
        isFinderBVerified: profileData.isFinderBVerified,
        review: profileData.review,
        reviewReply: profileData.reviewReply,
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
    return { success: true, business: mapBusinessRecord(business) };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Profile Update');
    return { success: false, error: errorMessage };
  }
}
