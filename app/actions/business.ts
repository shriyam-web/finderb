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
    const regNo = `BOOMB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const supabase = createClient(await cookies());

    console.log('[REGISTER] Creating business record...');

    const now = new Date().toISOString();
    const { data: business, error } = await supabase
      .from('Business')
      .insert({
        id: crypto.randomUUID(),
        fullName: formData.fullName,
        workEmail: formData.email,
        email: formData.email,
        mobile: formData.mobile,
        businessName: formData.businessName,
        category: formData.category,
        location: formData.location || `${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        publicPhone: formData.publicPhone,
        businessAddress: formData.businessAddress,
        selectedPlan: formData.selectedPlan || 'pro',
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

    const supabase = createClient(await cookies());

    const { data: business, error } = await supabase
      .from('Business')
      .select('*')
      .or(`workEmail.eq.${email},email.eq.${email}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No business found with email:', email);
        return { success: false, error: 'Business account not found. Please check your email or register a new account.' };
      }
      throw error;
    }

    if (business.password !== password) {
      console.log('Incorrect password for business:', business.id);
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    console.log('Login successful for business:', business.id);
    return { success: true, businessId: business.id };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Login');
    return { success: false, error: errorMessage };
  }
}
