'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

    return { success: true, business };
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

    const { data: business, error } = await supabase
      .from('Business')
      .select('*')
      .or(`workEmail.eq.${normalizedEmail},email.eq.${normalizedEmail}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No business found with email:', normalizedEmail);
        return { success: false, error: 'Business account not found. Please check your email or register a new account.' };
      }
      throw error;
    }

    if (business.password !== cleanPassword) {
      console.log('Incorrect password for business:', business.id);
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

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
      .eq('isVerified', true)
      .limit(10);

    if (error) {
      throw error;
    }

    // Map DB fields to the expected Business interface
    const mappedBusinesses = businesses.map((b: any) => ({
      id: b.id,
      name: b.businessName,
      category: b.category,
      rating: 4.5, // Default for now
      reviewsCount: 0, // Default for now
      location: b.location || b.city || 'Location not specified',
      description: b.businessAddress,
      contact: b.publicPhone,
      services: [], // Default for now
      image: b.profilePictureUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800', // Default placeholder
      profilePictureUrl: b.profilePictureUrl,
      priceRange: b.selectedPlan === 'free' ? 'Free' : 'Premium'
    }));

    return { success: true, businesses: mappedBusinesses };
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

    const mappedBusinesses = businesses.map((b: any) => ({
      id: b.id,
      name: b.businessName,
      category: b.category,
      rating: 4.5,
      reviewsCount: 0,
      location: b.location || b.city || 'Location not specified',
      description: b.businessAddress,
      contact: b.publicPhone,
      services: [],
      image: b.profilePictureUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
      profilePictureUrl: b.profilePictureUrl,
      priceRange: b.selectedPlan === 'free' ? 'Free' : 'Premium'
    }));

    return { success: true, businesses: mappedBusinesses };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get Businesses By Category');
    return { success: false, error: errorMessage };
  }
}
