'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registerBusiness(formData: any) {
  try {
    // Generate a unique registration number
    const regNo = `BOOMB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const business = await prisma.business.create({
      data: {
        fullName: formData.fullName,
        workEmail: formData.email, // Use email as workEmail since that's what the form collects
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
    return { success: false, error: error.message || 'Something went wrong' };
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
