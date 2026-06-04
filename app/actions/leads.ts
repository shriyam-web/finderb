'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

import { CATEGORY_LEAD_BADGE, PROFILE_LEAD_BADGE } from '@/lib/leadBadges';

export async function submitBroadcastEnquiry(data: {
  sourceBusinessId: string;
  category: string;
  area: string;
  name: string;
  email: string;
  phone: string;
  lookingFor: string;
}) {
  try {
    const { sourceBusinessId, category, area, name, email, phone, lookingFor } = data;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !lookingFor?.trim()) {
      return { success: false, error: 'Please fill in all fields.' };
    }

    const areaTrimmed = area?.trim() ?? '';
    const blockedArea = /not specified|unknown/i.test(areaTrimmed);

    if (!category?.trim() || !areaTrimmed || blockedArea) {
      return {
        success: false,
        error: 'A valid city or area is required to send your enquiry.',
      };
    }

    const supabase = createClient(await cookies());
    const areaPattern = `%${areaTrimmed}%`;
    const categoryPattern = `%${category.trim()}%`;

    const { data: businesses, error: fetchError } = await supabase
      .from('Business')
      .select('id')
      .eq('status', 'Active')
      .ilike('category', categoryPattern)
      .or(`city.ilike.${areaPattern},location.ilike.${areaPattern}`);

    if (fetchError) throw fetchError;

    const merchantIds = new Set<string>([sourceBusinessId]);
    for (const b of businesses ?? []) {
      merchantIds.add(b.id);
    }

    if (merchantIds.size === 0) {
      return {
        success: false,
        error: 'No merchants found in this category and area. Try WhatsApp or phone instead.',
      };
    }

    const now = new Date().toISOString();
    const rows = [...merchantIds].map((businessId) => ({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      category: category.trim(),
      business_id: businessId,
      message: lookingFor.trim(),
      status: businessId === sourceBusinessId ? PROFILE_LEAD_BADGE : CATEGORY_LEAD_BADGE,
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabase.from('leads').insert(rows);

    if (insertError) throw insertError;

    return { success: true, merchantCount: merchantIds.size };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to submit enquiry';
    console.error('Submit Broadcast Enquiry Error:', error);
    return { success: false, error: msg };
  }
}
