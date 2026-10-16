'use server';

import { createDataClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sortBusinessesByProfileCompleteness } from '@/lib/businessProfileCompleteness';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import {
  formatWrongPortalLoginMessage,
  registrationConflictFailure,
  getRegistrationConflict,
  getAlternateAccountType,
  businessMobileConflictMessage,
  LOGIN_PATHS,
  lookupEmailAccountTypes,
  lookupMobileAccountTypes,
} from '@/lib/emailAccountLookup';
import {
  mapBusinessRecord,
  mapOwnedBusinessRecord,
  businessHasPublicPhoto,
  filterBusinessesWithPublicPhotos,
  normalizeBusinessImages,
  syncBusinessImagesWithCover,
} from '@/lib/businessMapping';
import { revalidateBusinessProfilePaths } from '@/lib/businessRevalidation';
import { ensureBusinessSlug } from '@/lib/businessSlug.server';
import { getBusinessProfilePath, isLegacyBusinessId, resolveBusinessSlug } from '@/lib/businessSlug';
import { queueIndexNow } from '@/lib/indexNow.server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  applyDueBusinessDeletion,
  cancelScheduledBusinessDeletion,
  scheduleBusinessDeletion,
} from '@/lib/accountDeletion.server';
import {
  CATEGORY_LISTINGS_MAX_PAGE_SIZE,
  CATEGORY_LISTINGS_PAGE_SIZE,
} from '@/lib/categoryListings';
import { validateMapPinAgainstAddress } from '@/app/actions/location';
import { finalizeMerchantPayment } from '@/lib/razorpay/finalizeMerchantPayment';
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
  extractIndianMobileDigits,
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
  getSessionUserId,
  setBusinessSessionCookie,
} from '@/lib/security/session';
import { assertBusinessOwner, assertBusinessTab, resolveBusinessActor } from '@/lib/businessTeam/teamActor.server';
import { PROFILE_LINK_FIELDS, validateProfileLink } from '@/lib/validateProfileUrl';
import { socialProfileError } from '@/lib/profileLinkExists.server';
import { removeUserAccountsMovedToBusiness } from '@/lib/accountDeletion.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { redactPublicBusinessFields } from '@/lib/security/businessFields';
import { type CategoryTreeRef } from '@/lib/categoryTree';
import {
  applyFixedSlotOrder,
  getCategoryFixedSlotIds,
  type CategoryFixedSlotRow,
} from '@/lib/categoryFixedSlots';
import {
  assertEmailVerificationProof,
  MERCHANT_EMAIL_UPDATE_PURPOSE,
  MERCHANT_REGISTER_EMAIL_PURPOSE,
} from '@/lib/auth/emailOtp.server';
import {
  assertPhoneProof,
  MERCHANT_REGISTER_PHONE_SUBJECT,
  MERCHANT_REGISTER_PHONE_UNVERIFIED,
} from '@/lib/auth/phoneVerify.server';
import { assertOwnerMobileProof } from '@/lib/auth/merchantContactVerify.server';

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

  if (
    msg.includes('Server Components render') ||
    /updateTag|revalidateTag|Server Action|Invariant:/i.test(msg)
  ) {
    return 'Could not finish saving. Please try again.';
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
    const latitude = parseCoordinate(formData?.latitude);
    const longitude = parseCoordinate(formData?.longitude);
    const hasMapPin =
      latitude != null && longitude != null && (latitude !== 0 || longitude !== 0);
    if (hasMapPin) {
      const pinCheck = await validateMapPinAgainstAddress(latitude, longitude, {
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
      });
      if (!pinCheck.ok) {
        return { success: false, error: pinCheck.error };
      }
    }

    console.log('✓ [REGISTER] Validation passed');
    console.log('[REGISTER] Attempting database operation...');

    // Generate a unique registration number
    const regNo = `FINDERB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const normalizedEmail = normalized.email;

    const emailProof = assertEmailVerificationProof(
      MERCHANT_REGISTER_EMAIL_PURPOSE,
      normalizedEmail,
      formData?.emailVerificationToken,
    );
    if (!emailProof.ok) {
      return { success: false, error: emailProof.error };
    }

    const phoneProof = assertPhoneProof(
      MERCHANT_REGISTER_PHONE_SUBJECT,
      extractIndianMobileDigits(normalized.mobile),
      formData?.phoneVerificationToken,
      MERCHANT_REGISTER_PHONE_UNVERIFIED,
    );
    if (!phoneProof.ok) {
      return { success: false, error: phoneProof.error };
    }

    const whatsappDigits = extractIndianMobileDigits(normalized.whatsappNumber);
    const whatsappToken =
      whatsappDigits === extractIndianMobileDigits(normalized.mobile)
        ? formData?.phoneVerificationToken
        : formData?.whatsappVerificationToken;
    const whatsappProof = assertPhoneProof(
      MERCHANT_REGISTER_PHONE_SUBJECT,
      whatsappDigits,
      whatsappToken,
      'Verify your WhatsApp number with the OTP before registering.',
    );
    if (!whatsappProof.ok) {
      return { success: false, error: whatsappProof.error };
    }

    const ipLimit = await enforceRateLimit('register');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `register:${normalizedEmail}`);
    if (!emailLimit.ok) return { success: false, error: emailLimit.error };

    const supabase = await createDataClient();

    const existingAccount = await getRegistrationConflict(supabase, normalizedEmail, 'merchant');
    if (existingAccount) return registrationConflictFailure(existingAccount, 'merchant');

    const mobileConflict = await businessMobileConflictMessage(supabase, normalized.mobile);
    if (mobileConflict) {
      return {
        success: false,
        error: mobileConflict,
        suggestedLoginPath: LOGIN_PATHS.merchant,
        registeredAs: 'merchant' as const,
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
        whatsappNumber: normalized.whatsappNumber,
        category: normalized.category,
        location: normalized.location,
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
        publicPhone: normalized.mobile,
        businessAddress: normalized.businessAddress,
        ...(hasMapPin ? { latitude, longitude } : {}),
        selectedPlan: normalized.selectedPlan || 'free',
        billingCycle: normalized.billingCycle || 'monthly',
        status: 'Pending',
        kycStatus: 'pending',
        emailVerified: true,
        mobileVerified: true,
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

    let slug = String(business.slug || '');
    try {
      slug = await ensureBusinessSlug(business);
    } catch (slugError) {
      console.error('[REGISTER] slug failed', slugError);
    }
    const businessWithSlug = { ...business, slug };

    console.log('[REGISTER] ✓ Success:', businessWithSlug.id);

    try {
      const removedUserIds = await removeUserAccountsMovedToBusiness(normalizedEmail, normalized.mobile);
      const signedInUserId = await getSessionUserId();
      if (signedInUserId && removedUserIds.includes(signedInUserId)) {
        (await cookies()).delete('user_id');
      }
    } catch (moveError) {
      console.error('[REGISTER] user account move failed', moveError);
    }

    const welcomeName = normalized.displayName || normalized.businessName;
    await Promise.all([
      (async () => {
        try {
          const { sendBusinessWelcomeEmail } = await import('@/lib/email/sendBusinessWelcomeEmail');
          await sendBusinessWelcomeEmail({
            to: normalizedEmail,
            ownerName: normalized.fullName,
            businessName: welcomeName,
            city: normalized.city,
          });
        } catch (welcomeError) {
          console.error('[REGISTER] welcome email failed', welcomeError);
        }
      })(),
      (async () => {
        try {
          const { sendBusinessWelcomeWhatsApp } = await import(
            '@/lib/whatsapp/sendBusinessWelcomeWhatsApp'
          );
          await sendBusinessWelcomeWhatsApp({
            mobile: normalized.mobile,
            ownerName: normalized.fullName,
            businessName: welcomeName,
            registrationNumber: regNo,
          });
        } catch (welcomeError) {
          console.error('[REGISTER] welcome WhatsApp failed', welcomeError);
        }
      })(),
    ]);

    try {
      await setBusinessSessionCookie(businessWithSlug.id);
    } catch (sessionError) {
      console.error('[REGISTER] session cookie failed', sessionError);
    }

    try {
      revalidatePath('/business');
      revalidateSitemap();
    } catch (revalidateError) {
      console.error('[REGISTER] cache refresh failed', revalidateError);
    }
    return { success: true, business: businessWithSlug };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[REGISTER] ✗ Failed after ${duration}ms:`, error);
    const errorMessage = handleError(error, 'Registration');
    return { success: false, error: errorMessage };
  }
}

/** True when a FinderB user account already uses this email or mobile, so the merchant can confirm reusing it. */
export async function isContactOnUserAccount(kind: 'email' | 'mobile', value: string): Promise<boolean> {
  const limit = await enforceRateLimit('lookup', 'business-contact-owner');
  if (!limit.ok) return false;
  try {
    const supabase = await createDataClient();
    if (kind === 'mobile') {
      const digits = normalizeIndianPhoneForStorage(value);
      if (digits.length !== 10) return false;
      const types = await lookupMobileAccountTypes(supabase, digits);
      return types.includes('user') && !types.includes('merchant');
    }
    const email = value.trim().toLowerCase();
    if (!email.includes('@')) return false;
    const types = await lookupEmailAccountTypes(supabase, email);
    return types.includes('user') && !types.includes('merchant') && !types.includes('admin');
  } catch (error) {
    console.error('[REGISTER] contact owner lookup failed', error);
    return false;
  }
}

/** Step 1 check so a taken owner mobile is flagged before the rest of the form. */
export async function checkBusinessMobileAvailable(
  mobile: string
): Promise<{ success: true } | { success: false; error: string }> {
  const digits = normalizeIndianPhoneForStorage(mobile);
  if (digits.length !== 10) return { success: true };

  const limit = await enforceRateLimit('lookup', 'business-mobile');
  if (!limit.ok) return { success: false, error: limit.error };

  try {
    const supabase = await createDataClient();
    const conflict = await businessMobileConflictMessage(supabase, digits);
    if (conflict) return { success: false, error: conflict };
    return { success: true };
  } catch (error) {
    console.error('[REGISTER] mobile availability check failed', error);
    return { success: true };
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

    const auth = await assertBusinessTab(id, 'subscription', 'edit');
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

    const auth = await assertBusinessTab(id, 'listings', 'edit');
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    console.log('Updating images for business:', id);

    const supabase = await createDataClient();
    const cleanImages = normalizeBusinessImages(images);
    const explicitProfile =
      typeof profilePictureUrl === 'string' ? profilePictureUrl.trim() : '';
    // Always keep a profile pic when gallery photos exist, and keep cover in images[].
    const resolvedProfile = explicitProfile || cleanImages[0] || null;
    const syncedImages = syncBusinessImagesWithCover(cleanImages, resolvedProfile);

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        images: syncedImages,
        profilePictureUrl: resolvedProfile,
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
    const supabase = await createDataClient();

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
    if (!businessHasPublicPhoto(mapped)) {
      return {
        success: false,
        error: 'Business listing is hidden until photos are added',
        reason: 'not_found' as const,
      };
    }

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
    const supabase = await createDataClient();
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

    const sameCategory = filterBusinessesWithPublicPhotos(
      (categoryRows ?? [])
        .map((row) => mapBusinessRecord(row))
        .filter((row) => row.id !== business.id)
    ).slice(0, categoryLimit);

    const sameCity = filterBusinessesWithPublicPhotos(
      cityBusinesses
        .map((row) => mapBusinessRecord(row))
        .filter(
          (row) => row.id !== business.id && !sameCategory.some((item) => item.id === row.id)
        )
    ).slice(0, cityLimit);

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

    const supabase = await createDataClient();
    await applyDueBusinessDeletion(id);

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

    const gallery = normalizeBusinessImages(business.images);
    const profileUrl =
      typeof business.profilePictureUrl === 'string' ? business.profilePictureUrl.trim() : '';
    const hasProfile = Boolean(profileUrl);
    const syncedGallery = syncBusinessImagesWithCover(gallery, profileUrl || null);

    // Heal cover from gallery, and keep cover inside images[] so Settings/My Listing always show it.
    if ((!hasProfile && gallery.length > 0) || syncedGallery.length !== gallery.length) {
      const nextProfile = profileUrl || syncedGallery[0] || null;
      const { data: healed, error: healError } = await supabase
        .from('Business')
        .update({
          profilePictureUrl: nextProfile,
          images: syncedGallery,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (!healError && healed) {
        return { success: true, business: mapOwnedBusinessRecord(healed) };
      }
    }

    return { success: true, business: mapOwnedBusinessRecord(business) };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Owned Business');
    return { success: false, error: errorMessage };
  }
}

export async function loginBusiness(email: string, password: string) {
  try {
    const identifier = email.trim();
    const normalizedEmail = identifier.toLowerCase();
    const normalizedPassword = password.trim();
    if (!identifier || !normalizedPassword) {
      return { success: false, error: 'Email or mobile number and password are required' };
    }

    const passwordCheck = validatePasswordLength(normalizedPassword, 1);
    if (!passwordCheck.ok) {
      return { success: false, error: passwordCheck.error };
    }

    const loginDigits = extractIndianMobileDigits(identifier);
    const isEmailLogin = identifier.includes('@');
    if (!isEmailLogin && loginDigits.length < 10) {
      return { success: false, error: 'Enter a valid email or 10-digit mobile number' };
    }

    const ipLimit = await enforceRateLimit('auth');
    if (!ipLimit.ok) return { success: false, error: ipLimit.error };

    const emailLimit = await enforceRateLimit('authEmail', `login:${isEmailLogin ? normalizedEmail : loginDigits}`);
    if (!emailLimit.ok) return { success: false, error: emailLimit.error };

    const supabase = await createDataClient();
    const loginFields = 'id, password, createdAt, mobile, owner_mobile, publicPhone';

    const phonePattern = `%${escapeIlikePattern(loginDigits)}`;
    const [{ data: byWorkEmail }, { data: byEmail }, { data: byMobile }, { data: byOwnerMobile }, { data: byPublicPhone }] =
      await Promise.all([
        isEmailLogin
          ? supabase.from('Business').select(loginFields).ilike('workEmail', escapeIlikePattern(normalizedEmail))
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
        isEmailLogin
          ? supabase.from('Business').select(loginFields).ilike('email', escapeIlikePattern(normalizedEmail))
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
        !isEmailLogin
          ? supabase.from('Business').select(loginFields).ilike('mobile', phonePattern).limit(8)
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
        !isEmailLogin
          ? supabase.from('Business').select(loginFields).ilike('owner_mobile', phonePattern).limit(8)
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
        !isEmailLogin
          ? supabase.from('Business').select(loginFields).ilike('publicPhone', phonePattern).limit(8)
          : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      ]);

    const seen = new Set<string>();
    const phoneMatches = [...(byMobile ?? []), ...(byOwnerMobile ?? []), ...(byPublicPhone ?? [])].filter((row) => {
      const candidates = [row.mobile, row.owner_mobile, row.publicPhone];
      return candidates.some((value) => extractIndianMobileDigits(value) === loginDigits);
    });
    const businesses = [...(byWorkEmail ?? []), ...(byEmail ?? []), ...phoneMatches]
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
      const { verifyTeamMemberPassword } = await import('@/lib/businessTeam/teamInvites.server');
      const team = await verifyTeamMemberPassword({
        email: isEmailLogin ? normalizedEmail : null,
        phone: isEmailLogin ? null : loginDigits,
        password: normalizedPassword,
      });
      if (team) {
        await setBusinessSessionCookie(team.businessId, { teamMemberId: team.memberId });
        void import('@/lib/businessUserLinks.server').then(({ linkUsersMatchingBusiness }) =>
          linkUsersMatchingBusiness(team.businessId)
        );
        return { success: true, businessId: team.businessId };
      }

      const accountTypes = isEmailLogin
        ? await lookupEmailAccountTypes(supabase, normalizedEmail)
        : await lookupMobileAccountTypes(supabase, loginDigits);
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
        error: isEmailLogin
          ? 'No merchant account found with this email. Check the email or register your business.'
          : 'No merchant account found with this mobile number. Check the number or register your business.',
      };
    }

    let matchedBusiness: (typeof businesses)[number] | null = null;
    for (const row of businesses) {
      const verification = await verifyPassword(normalizedPassword, row.password);
      if (verification.valid) {
        matchedBusiness = row;
        if (verification.needsRehash) {
          const hashedPassword = await hashPassword(normalizedPassword);
          await supabase
            .from('Business')
            .update({ password: hashedPassword, updatedAt: new Date().toISOString() })
            .eq('id', row.id);
        }
        break;
      }
    }

    if (!matchedBusiness) {
      const { verifyTeamMemberPassword } = await import('@/lib/businessTeam/teamInvites.server');
      const team = await verifyTeamMemberPassword({
        email: isEmailLogin ? normalizedEmail : null,
        phone: isEmailLogin ? null : loginDigits,
        password: normalizedPassword,
      });
      if (team) {
        await setBusinessSessionCookie(team.businessId, { teamMemberId: team.memberId });
        void import('@/lib/businessUserLinks.server').then(({ linkUsersMatchingBusiness }) =>
          linkUsersMatchingBusiness(team.businessId)
        );
        return { success: true, businessId: team.businessId };
      }
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    await setBusinessSessionCookie(matchedBusiness.id);
    void import('@/lib/businessUserLinks.server').then(({ linkUsersMatchingBusiness }) =>
      linkUsersMatchingBusiness(matchedBusiness.id)
    );

    return { success: true, businessId: matchedBusiness.id };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Login');
    return { success: false, error: errorMessage };
  }
}

export async function logoutBusiness() {
  try {
    const { clearBusinessSessionCookies } = await import('@/lib/security/session');
    await clearBusinessSessionCookies();
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

    const auth = await assertBusinessOwner(businessId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const trimmed = currentPassword?.trim() ?? '';
    if (!trimmed) {
      return { success: false, error: 'Enter your current password.' };
    }

    const supabase = await createDataClient();
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

    const auth = await assertBusinessOwner(businessId);
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

    const supabase = await createDataClient();

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
    const {
      getSessionBusinessId,
      isBusinessSupportSession,
      getBusinessSupportIdleDeadline,
    } = await import('@/lib/security/session');
    const businessId = await getSessionBusinessId();
    if (!businessId) return null;
    const owned = await getOwnedBusiness(businessId);
    if (!owned?.success || !owned.business) return null;
    const supportSession = await isBusinessSupportSession();
    const supportIdleDeadline = supportSession
      ? await getBusinessSupportIdleDeadline()
      : null;
    const actor = await resolveBusinessActor(businessId);
    if (!actor.ok) return null;
    return {
      ...owned,
      supportSession,
      supportIdleDeadline,
      isOwner: actor.isOwner,
      teamAccess: actor.access,
      teamMemberId: actor.isOwner ? null : actor.teamMemberId,
    };
  } catch (error) {
    console.error('Get Business Session Error:', error);
    return null;
  }
}

/** Slide support-session idle window after real admin activity in the merchant panel. */
export async function touchBusinessSupportSession() {
  try {
    const { touchSupportSessionActivity } = await import('@/lib/security/session');
    return await touchSupportSessionActivity();
  } catch (error) {
    console.error('Touch Business Support Session Error:', error);
    return { ok: false as const };
  }
}

export async function getBusinessSummariesByIds(ids: string[]) {
  try {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) {
      return { success: true, businesses: [] as ReturnType<typeof mapBusinessRecord>[] };
    }

    const supabase = await createDataClient();
    const { data, error } = await supabase
      .from('Business')
      .select('id, businessName, displayName, slug, city, profilePictureUrl, images')
      .in('id', uniqueIds);

    if (error) throw error;

    const businesses = filterBusinessesWithPublicPhotos(
      (data ?? []).map((row) => mapBusinessRecord(row))
    );
    return { success: true, businesses };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Business Summaries');
    return { success: false, error: errorMessage };
  }
}

export async function getFeaturedBusinesses() {
  try {
    const supabase = await createDataClient();

    const { data: businesses, error } = await supabase
      .from('Business')
      .select('*')
      .eq('status', 'Active')
      .or('isFinderBVerified.eq.true,hasVerifiedBadge.eq.true')
      .limit(60);

    if (error) {
      throw error;
    }

    const mappedBusinesses = filterBusinessesWithPublicPhotos(
      businesses.map((b: Record<string, unknown>) => mapBusinessRecord(b))
    );
    const rankedBusinesses = sortBusinessesByProfileCompleteness(mappedBusinesses).slice(0, 12);

    const ids = rankedBusinesses.map((business) => business.id);
    const { data: jobs } = ids.length
      ? await supabase
          .from('jobs')
          .select('business_id')
          .eq('status', 'active')
          .in('business_id', ids)
      : { data: [] as { business_id: string }[] };

    const hiringIds = new Set(
      (jobs ?? [])
        .map((row) => row.business_id)
        .filter(Boolean)
        .map(String)
    );

    const withJobs = rankedBusinesses.map((business) => ({
      ...business,
      hasActiveJobs: hiringIds.has(String(business.id)),
    }));

    return { success: true, businesses: withJobs };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Featured Businesses');
    return { success: false, error: errorMessage };
  }
}

/**
 * Expand a category slug/name into Business.category match needles.
 * Merchants may store "Parent › Child", only the parent, or only the leaf subcategory.
 * Parent → All must include every child label under that parent (same as category counts).
 */
function toCategoryLookupSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CATEGORY_SLOT_SELECT =
  'id, name, parent_id, level, fixed_slots, position_1_business_id, position_2_business_id, position_3_business_id, position_4_business_id, position_5_business_id';

type CategoryLookupRow = CategoryTreeRef & CategoryFixedSlotRow;

async function resolveCategoryListingContext(
  supabase: Awaited<ReturnType<typeof createDataClient>>,
  categoryName: string
): Promise<{ needles: string[]; slotIds: Array<string | null> }> {
  const needles = await resolveBusinessCategoryNeedles(supabase, categoryName);
  const raw = categoryName.trim();
  if (!raw || raw.toLowerCase() === 'all') {
    return { needles, slotIds: [] };
  }

  const asSlug = toCategoryLookupSlug(raw);
  let row: CategoryLookupRow | null = null;
  const { data: bySlug } = await supabase
    .from('categories')
    .select(CATEGORY_SLOT_SELECT)
    .eq('slug', asSlug)
    .maybeSingle();
  if (bySlug?.id) row = bySlug as CategoryLookupRow;
  if (!row) {
    const { data: byName } = await supabase
      .from('categories')
      .select(CATEGORY_SLOT_SELECT)
      .eq('name', raw)
      .maybeSingle();
    if (byName?.id) row = byName as CategoryLookupRow;
  }

  return { needles, slotIds: getCategoryFixedSlotIds(row) };
}

async function resolveBusinessCategoryNeedles(
  supabase: Awaited<ReturnType<typeof createDataClient>>,
  categoryName: string
): Promise<string[]> {
  const raw = categoryName.trim();
  if (!raw || raw.toLowerCase() === 'all') return [];

  const asSlug = toCategoryLookupSlug(raw);

  let cat: { id: string; name: string; parent_id: string | null } | null = null;

  const { data: bySlug } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('slug', asSlug)
    .maybeSingle();
  if (bySlug?.name) cat = bySlug;

  if (!cat) {
    const { data: byName } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('name', raw)
      .maybeSingle();
    if (byName?.name) cat = byName;
  }

  if (!cat) {
    const fallback =
      raw.includes('-') && !/\s/.test(raw) ? raw.replace(/-/g, ' ') : raw;
    return [fallback];
  }

  const needles = new Set<string>([cat.name.trim()]);

  const { data: children } = await supabase
    .from('categories')
    .select('id, name')
    .eq('parent_id', cat.id);

  const childIds = (children ?? [])
    .map((child) => String(child.id || ''))
    .filter(Boolean);

  for (const child of children ?? []) {
    const childName = child.name?.trim();
    if (!childName) continue;
    needles.add(childName);
    needles.add(`${cat.name.trim()} › ${childName}`);
  }

  if (childIds.length) {
    const { data: grands } = await supabase
      .from('categories')
      .select('name, parent_id')
      .in('parent_id', childIds);

    const childNameById = new Map(
      (children ?? []).map((child) => [String(child.id), String(child.name || '').trim()])
    );

    for (const grand of grands ?? []) {
      const grandName = grand.name?.trim();
      if (!grandName) continue;
      needles.add(grandName);
      const midName = childNameById.get(String(grand.parent_id)) || '';
      if (midName) needles.add(`${midName} › ${grandName}`);
    }
  }

  if (cat.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('name, level, parent_id')
      .eq('id', cat.parent_id)
      .maybeSingle();
    const parentName = parent?.name?.trim();
    // Only combine with a Category (not a Parent Category grouping name).
    if (parentName && Number(parent?.level) !== 0) {
      needles.add(`${parentName} › ${cat.name.trim()}`);
    }
  }

  return [...needles];
}

function applyBusinessCategoryFilter<T extends { or: Function; ilike: Function }>(
  query: T,
  needles: string[]
): T {
  if (needles.length === 0) return query;
  if (needles.length === 1) {
    return query.ilike('category', `%${escapeIlikePattern(needles[0])}%`) as T;
  }
  const orFilter = needles
    .map((n) => `category.ilike.%${escapeIlikePattern(n)}%`)
    .join(',');
  return query.or(orFilter) as T;
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
    const needed = page * pageSize;
    const fetchLimit = Math.min(Math.max(needed * 4, pageSize * 4), 500);

    const supabase = await createDataClient();
    const { needles, slotIds } = await resolveCategoryListingContext(supabase, categorySlug);
    const escapedCity = escapeIlikePattern(citySlug.replace(/-/g, ' '));

    let query = supabase
      .from('Business')
      .select('*', { count: 'exact' })
      .eq('status', 'Active');
    query = applyBusinessCategoryFilter(query, needles);

    const { data: businesses, error, count } = await query
      .or(`city.ilike.%${escapedCity}%,location.ilike.%${escapedCity}%`)
      .order('createdAt', { ascending: false })
      .range(0, fetchLimit - 1);

    if (error) throw error;

    const withPhotos = applyFixedSlotOrder(
      filterBusinessesWithPublicPhotos(
        (businesses ?? []).map((b: Record<string, unknown>) => mapBusinessRecord(b)).filter((b) => b.id)
      ),
      slotIds
    );
    const mappedBusinesses = withPhotos.slice((page - 1) * pageSize, page * pageSize);

    // Approximate public total from the photo ratio in the fetched window.
    const rawFetched = businesses?.length ?? 0;
    const photoRatio = rawFetched > 0 ? withPhotos.length / rawFetched : 1;
    const total = Math.max(
      mappedBusinesses.length,
      Math.round((count ?? withPhotos.length) * photoRatio)
    );

    return {
      success: true as const,
      businesses: mappedBusinesses,
      total,
      page,
      pageSize,
      hasMore: withPhotos.length > page * pageSize || fetchLimit < (count ?? 0),
      fixedSlotIds: slotIds.filter((id): id is string => Boolean(id)),
    };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Businesses By Category And City');
    return { success: false as const, error: errorMessage };
  }
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let state = hashSeed(seed) || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export async function getBusinessesByCategory(
  categoryName: string,
  options?: { page?: number; pageSize?: number; shuffleSeed?: string }
) {
  try {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(
      Math.max(options?.pageSize ?? CATEGORY_LISTINGS_PAGE_SIZE, 1),
      CATEGORY_LISTINGS_MAX_PAGE_SIZE
    );
    const needed = page * pageSize;
    const fetchLimit = options?.shuffleSeed
      ? 500
      : Math.min(Math.max(needed * 4, pageSize * 4), 500);

    const supabase = await createDataClient();

    let query = supabase
      .from('Business')
      .select('*', { count: 'exact' })
      .eq('status', 'Active')
      .order('createdAt', { ascending: false });

    let slotIds: Array<string | null> = [];

    if (categoryName !== 'all') {
      const context = await resolveCategoryListingContext(supabase, categoryName);
      slotIds = context.slotIds;
      query = applyBusinessCategoryFilter(query, context.needles);
    }

    const { data: businesses, error, count } = await query.range(0, fetchLimit - 1);

    if (error) {
      throw error;
    }

    const photoList = filterBusinessesWithPublicPhotos(
      (businesses ?? []).map((b: Record<string, unknown>) => mapBusinessRecord(b)).filter((b) => b.id)
    );
    const rotated = options?.shuffleSeed ? seededShuffle(photoList, options.shuffleSeed) : photoList;
    const withPhotos = applyFixedSlotOrder(rotated, slotIds);
    const mappedBusinesses = withPhotos.slice((page - 1) * pageSize, page * pageSize);

    const ids = mappedBusinesses.map((business) => business.id);
    const { data: jobs } = ids.length
      ? await supabase
          .from('jobs')
          .select('business_id')
          .eq('status', 'active')
          .in('business_id', ids)
      : { data: [] as { business_id: string }[] };

    const hiringIds = new Set(
      (jobs ?? [])
        .map((row) => row.business_id)
        .filter(Boolean)
        .map(String)
    );

    const withJobs = mappedBusinesses.map((business) => ({
      ...business,
      hasActiveJobs: hiringIds.has(String(business.id)),
    }));

    const rawFetched = businesses?.length ?? 0;
    const photoRatio = rawFetched > 0 ? withPhotos.length / rawFetched : 1;
    const total = Math.max(
      withJobs.length,
      Math.round((count ?? withPhotos.length) * photoRatio)
    );

    return {
      success: true,
      businesses: withJobs,
      total,
      page,
      pageSize,
      hasMore: withPhotos.length > page * pageSize || fetchLimit < (count ?? 0),
      fixedSlotIds: slotIds.filter((id): id is string => Boolean(id)),
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

    const auth = await assertBusinessTab(id, 'settings', 'edit');
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = await createDataClient();
    const socialFields = ['instagramUrl', 'facebookUrl', 'youtubeUrl'] as const;
    const { data: currentLinks } = await supabase
      .from('Business')
      .select('instagramUrl, facebookUrl, youtubeUrl')
      .eq('id', id)
      .maybeSingle();
    for (const field of socialFields) {
      if (!(field in (profileData || {}))) continue;
      const checked = validateProfileLink(field, String(profileData[field] ?? ''));
      if (!checked.ok) return { success: false, error: checked.error };
      const previous = String(currentLinks?.[field] || '').trim();
      if (checked.value && checked.value !== previous) {
        const existsError = await socialProfileError(field, checked.value);
        if (existsError) return { success: false, error: existsError };
      }
      profileData[field] = checked.value;
    }
    if (PROFILE_LINK_FIELDS.has('website') && 'website' in (profileData || {})) {
      const checked = validateProfileLink('website', String(profileData.website ?? ''));
      if (!checked.ok) return { success: false, error: checked.error };
      profileData.website = checked.value;
    }

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

    const { data: currentContact } = await supabase
      .from('Business')
      .select('mobile, owner_mobile, whatsappNumber, mobileVerified')
      .eq('id', id)
      .maybeSingle();
    const loginMobile = String(currentContact?.mobile || '').trim();
    const knownMobiles = [currentContact?.owner_mobile, currentContact?.mobile].map((value) =>
      extractIndianMobileDigits(String(value || '')),
    );

    // The public number is always the verified login mobile; it changes only through the mobile OTP flow.
    profileData.publicPhone = loginMobile || normalizeIndianPhoneForStorage(profileData.publicPhone ?? '');
    const publicPhoneError = indianMobileValidationError(profileData.publicPhone, {
      allowLandline: true,
      label: 'display phone number',
    });
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
    const nextWhatsapp = extractIndianMobileDigits(normalizedWhatsapp);
    const currentWhatsapp = extractIndianMobileDigits(String(currentContact?.whatsappNumber || ''));
    if (nextWhatsapp && nextWhatsapp !== currentWhatsapp && !knownMobiles.includes(nextWhatsapp)) {
      const whatsappProof = assertOwnerMobileProof(
        id,
        nextWhatsapp,
        profileData?.whatsappVerificationToken ?? profileData?.ownerMobileVerificationToken,
        'whatsapp',
      );
      if (!whatsappProof.ok) {
        return { success: false, error: whatsappProof.error };
      }
    }
    profileData.keywords = normalizeSearchKeywords(profileData.keywords);

    const normalizedOwnerMobile = normalizeIndianPhoneForStorage(profileData.ownerMobile ?? '');
    if (normalizedOwnerMobile) {
      const ownerMobileError = indianMobileValidationError(normalizedOwnerMobile);
      if (ownerMobileError) {
        return { success: false, error: ownerMobileError };
      }
    }
    profileData.ownerMobile = normalizedOwnerMobile;

    const nextOwnerMobile = extractIndianMobileDigits(normalizedOwnerMobile);
    if (nextOwnerMobile) {
      if (!knownMobiles.includes(nextOwnerMobile)) {
        const ownerProof = assertOwnerMobileProof(
          id,
          nextOwnerMobile,
          profileData?.ownerMobileVerificationToken,
        );
        if (!ownerProof.ok) {
          return { success: false, error: ownerProof.error };
        }
      }
    }

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
    let emailJustVerified = false;
    if (submittedEmail && !REGISTRATION_EMAIL_REGEX.test(submittedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (submittedEmail) {
      const { data: currentBusiness } = await supabase
        .from('Business')
        .select('email, workEmail')
        .eq('id', id)
        .maybeSingle();
      const knownEmails = new Set(
        [currentBusiness?.email, currentBusiness?.workEmail]
          .map((value) => String(value || '').trim().toLowerCase())
          .filter(Boolean),
      );
      if (!knownEmails.has(submittedEmail)) {
        const emailProof = assertEmailVerificationProof(
          MERCHANT_EMAIL_UPDATE_PURPOSE,
          submittedEmail,
          profileData?.emailVerificationToken,
        );
        if (!emailProof.ok) {
          return { success: false, error: emailProof.error };
        }
        emailJustVerified = true;
      }
    }

    const nextWhatsappVerified =
      Boolean(nextWhatsapp) &&
      (nextWhatsapp === extractIndianMobileDigits(loginMobile) && Boolean(currentContact?.mobileVerified)
        ? true
        : nextWhatsapp !== currentWhatsapp
          ? Boolean(profileData?.whatsappVerificationToken || profileData?.ownerMobileVerificationToken)
          : undefined);

    const { data: business, error } = await supabase
      .from('Business')
      .update({
        owner_name: profileData.ownerName?.trim() || null,
        owner_mobile: profileData.ownerMobile || null,
        ...(submittedEmail ? { email: submittedEmail, workEmail: submittedEmail } : {}),
        ...(emailJustVerified ? { emailVerified: true } : {}),
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
        ...(nextWhatsappVerified !== undefined ? { whatsappVerified: nextWhatsappVerified } : {}),
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
    if (String(business.status || '').toLowerCase() === 'active') {
      queueIndexNow([getBusinessProfilePath(mapped)]);
    }
    return { success: true, business: mapped };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Profile Update');
    return { success: false, error: errorMessage };
  }
}

export async function hideOwnBusinessListing(businessId: string) {
  try {
    if (!businessId) {
      return { success: false as const, error: 'Business ID is required' };
    }
    const auth = await assertBusinessOwner(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }
    return scheduleBusinessDeletion(businessId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not schedule deletion.';
    return { success: false as const, error: msg };
  }
}

export async function cancelOwnBusinessDeletion(businessId: string) {
  try {
    if (!businessId) {
      return { success: false as const, error: 'Business ID is required' };
    }
    const auth = await assertBusinessOwner(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }
    return cancelScheduledBusinessDeletion(businessId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not cancel deletion.';
    return { success: false as const, error: msg };
  }
}
