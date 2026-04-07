'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registerBusiness(formData: any) {
  try {
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

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.businessName || !formData.category || !formData.publicPhone || !formData.businessAddress) {
      return { success: false, error: 'All required fields must be filled' };
    }

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
    console.error('Registration Error:', error);

    // Handle specific database errors
    if (error.code === 'P2002') {
      // Unique constraint violation
      if (error.meta?.target?.includes('mobile')) {
        return { success: false, error: 'This mobile number is already registered. Please use a different number or try logging in.' };
      }
      if (error.meta?.target?.includes('email')) {
        return { success: false, error: 'This email address is already registered. Please use a different email or try logging in.' };
      }
    }

    // Handle connection errors
    if (error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
      return { success: false, error: 'Database connection error. Please try again later.' };
    }

    return { success: false, error: error.message || 'Something went wrong during registration' };
  }
}

export async function updateBusinessKYC(id: string, kycData: any) {
  try {
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
    console.error('KYC Update Error:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function updateBusinessPayment(id: string, paymentData: any) {
  try {
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
    console.error('Payment Update Error:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}

export async function getBusiness(id: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id },
    });
    return { success: true, business };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginBusiness(email: string, password: string) {
  try {
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { workEmail: email },
          { email: email }
        ]
      }
    });

    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    if (business.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    return { success: true, businessId: business.id };
  } catch (error: any) {
    console.error('Login Error:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}
