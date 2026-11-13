'use server';

import { getBusinessSession } from '@/app/actions/business';
import {
  confirmPromotionPayment,
  createPromotionOrder,
  deleteDraftPromotion,
  merchantDesk,
  submitCustomPromotion,
  merchantOrder,
  startPromotionPayment,
} from '@/lib/promotions/service';

async function businessId() {
  const session = await getBusinessSession();
  const id = session?.business && typeof session.business === 'object'
    ? String((session.business as { id?: string }).id || '')
    : '';
  return id;
}

export async function loadPromotionDesk() {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return merchantDesk(id);
}

export async function loadPromotionOrder(orderId: string) {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return merchantOrder(id, orderId);
}

export async function requestCustomPromotion(input: {
  budgetInr: number;
  durationDays: number;
  coverage: string;
  pincode: string;
  area: string;
  goal: string;
  phone: string;
  note?: string;
}) {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return submitCustomPromotion(id, input);
}

export async function placePromotionOrder(packageId: string, pincode: string, area: string) {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return createPromotionOrder(id, { packageId, pincode, area });
}

export async function removeDraftPromotion(orderId: string) {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return deleteDraftPromotion(id, orderId);
}

export async function beginPromotionPayment(orderId: string) {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return startPromotionPayment(id, orderId);
}

export async function finishPromotionPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  paymentId: string;
  signature: string;
}) {
  const id = await businessId();
  if (!id) return { success: false as const, error: 'Please log in again.' };
  return confirmPromotionPayment({
    businessId: id,
    orderId: input.orderId,
    razorpayOrderId: input.razorpayOrderId,
    paymentId: input.paymentId,
    signature: input.signature,
    source: 'client',
  });
}
