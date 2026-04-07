'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Safe error handler wrapper
function handleError(error: any, context: string): string {
  console.error(`${context} Error:`, error);

  // Handle specific database errors
  if (error?.code === 'P2002') {
    const target = error.meta?.target;
    if (Array.isArray(target) && target.includes('mobile')) {
      return 'This mobile number is already registered.';
    }
    if (Array.isArray(target) && target.includes('email')) {
      return 'This email already exists.';
    }
    return 'Duplicate entry found.';
  }

  if (error?.code === 'P2025') {
    return 'Record not found.';
  }

  const msg = error?.message || 'An unexpected error occurred';

  if (msg.includes('connect') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
    return 'Database connection failed. Please check your configuration.';
  }

  return msg;
}

export async function registerBusiness(formData: any) {
  try {
    // Validate required fields first
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.businessName || !formData.category || !formData.publicPhone || !formData.businessAddress) {
      return { success: false, error: 'All required fields must be filled' };
    }

    console.log('Registration attempt with data:', {
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile,
      businessName: formData.businessName,
      category: formData.category,
      hasPassword: !!formData.password,
      hasPublicPhone: !!formData.publicPhone,
      hasBusinessAddress: !!formData.businessAddress
    });

    // Generate a unique registration number
    const regNo = `BOOMB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const business = await prisma.business.create({
      data: {
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
      },
    });

    revalidatePath('/business');
    return { success: true, business };
  } catch (error: any) {
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

    const business = await prisma.business.update({
      where: { id },
      data: {
        panNumber: kycData.panNumber,
        aadharNumber: kycData.aadharNumber,
        panUrl: kycData.panUrl,
        aadharUrl: kycData.aadharUrl,
        msmeGstUrl: kycData.msmeGstUrl,
        kycStatus: 'submitted',
        hasVerifiedBadge: !!kycData.msmeGstUrl,
      },
    });

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

    const business = await prisma.business.update({
      where: { id },
      data: {
        paymentStatus: 'completed',
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        selectedPlan: paymentData.selectedPlan,
        billingCycle: paymentData.billingCycle,
      },
    });

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

    const business = await prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      return { success: false, error: 'Business not found' };
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

    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { workEmail: email },
          { email: email }
        ]
      }
    });

    if (!business) {
      console.log('No business found with email:', email);
      return { success: false, error: 'Business account not found. Please check your email or register a new account.' };
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
