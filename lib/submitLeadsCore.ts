import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { DIRECT_LEAD_MESSAGES, type ContactIntent } from '@/lib/directLead';
import {
  CATEGORY_LEAD_BADGE,
  DEFAULT_LEAD_STATUS,
  DIRECT_LEAD_BADGE,
  PROFILE_LEAD_BADGE,
} from '@/lib/leadBadges';
import { escapeIlikePattern } from '@/lib/searchMatch';
import { recordMerchantNotification } from '@/lib/merchantAlert.server';
import { queueBusinessPush } from '@/lib/userNotifications.server';

const LEADS_URL = '/business/dashboard?tab=leads';

const DIRECT_LEAD_PUSH: Record<ContactIntent, string> = {
  call: 'tapped Call on your listing.',
  whatsapp: 'tapped WhatsApp on your listing.',
  enquire: 'opened the enquiry form on your listing.',
};

function dbClient() {
  return createServiceClient();
}

export type DirectLeadActor = {
  name: string;
  email: string | null;
  phone: string | null;
};

export async function recordDirectLeadForActor(params: {
  businessId: string;
  channel: ContactIntent;
  actor: DirectLeadActor;
  message?: string;
}): Promise<
  | { success: true; duplicate: boolean }
  | { success: false; error: string }
> {
  try {
    const businessId = params.businessId?.trim();
    if (!businessId) {
      return { success: false, error: 'Business ID is required.' };
    }

    const actorName = params.actor.name.trim() || 'FinderB user';
    const actorEmail = params.actor.email?.trim() || null;
    const actorPhone = params.actor.phone?.trim() || null;
    const message = params.message?.trim() || DIRECT_LEAD_MESSAGES[params.channel];

    const supabase = dbClient() ?? createClient(await cookies());
    const { data: business, error: businessError } = await supabase
      .from('Business')
      .select('category')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError || !business) {
      return { success: false, error: 'Business not found.' };
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let existingQuery = supabase
      .from('leads')
      .select('id')
      .eq('business_id', businessId)
      .or(`source.eq.${DIRECT_LEAD_BADGE},status.eq.${DIRECT_LEAD_BADGE}`)
      .eq('message', message)
      .gte('created_at', since);

    existingQuery = actorEmail
      ? existingQuery.eq('email', actorEmail)
      : existingQuery.eq('name', actorName);

    const { data: existing } = await existingQuery.maybeSingle();
    if (existing) {
      return { success: true, duplicate: true };
    }

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('leads').insert({
      name: actorName,
      email: actorEmail,
      phone: actorPhone,
      category: String(business.category || 'General'),
      business_id: businessId,
      message,
      status: DEFAULT_LEAD_STATUS,
      source: DIRECT_LEAD_BADGE,
      created_at: now,
      updated_at: now,
    });

    if (insertError) throw insertError;
    const leadTitle = 'New lead on FinderB';
    const leadBody = `${actorName} ${DIRECT_LEAD_PUSH[params.channel]}`;
    const notificationId = await recordMerchantNotification({
      businessId,
      type: 'lead',
      title: leadTitle,
      body: leadBody,
      metadata: { channel: params.channel, url: LEADS_URL },
    });
    queueBusinessPush({
      businessId,
      type: 'lead',
      title: leadTitle,
      body: leadBody,
      url: LEADS_URL,
      notificationId: notificationId || undefined,
    });
    return { success: true, duplicate: false };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not record lead';
    console.error('Record Direct Lead Error:', error);
    return { success: false, error: msg };
  }
}

export async function submitBroadcastEnquiryForUser(data: {
  sourceBusinessId: string;
  category: string;
  area: string;
  name: string;
  email: string;
  phone: string;
  lookingFor: string;
}): Promise<{ success: true; merchantCount: number } | { success: false; error: string }> {
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

    const supabase = dbClient() ?? createClient(await cookies());
    const areaPattern = `%${escapeIlikePattern(areaTrimmed)}%`;
    const categoryPattern = `%${escapeIlikePattern(category.trim())}%`;

    const [{ data: byCity }, { data: byLocation }] = await Promise.all([
      supabase
        .from('Business')
        .select('id')
        .eq('status', 'Active')
        .ilike('category', categoryPattern)
        .ilike('city', areaPattern),
      supabase
        .from('Business')
        .select('id')
        .eq('status', 'Active')
        .ilike('category', categoryPattern)
        .ilike('location', areaPattern),
    ]);

    const merchantIds = new Set<string>([sourceBusinessId]);
    for (const row of [...(byCity ?? []), ...(byLocation ?? [])]) {
      merchantIds.add(row.id);
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
      status: DEFAULT_LEAD_STATUS,
      source: businessId === sourceBusinessId ? PROFILE_LEAD_BADGE : CATEGORY_LEAD_BADGE,
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabase.from('leads').insert(rows);
    if (insertError) throw insertError;

    const need = lookingFor.trim().replace(/\s+/g, ' ');
    const enquiryTitle = 'New enquiry on FinderB';
    const enquiryBody = `${name.trim()} is looking for: ${need.length > 90 ? `${need.slice(0, 87)}...` : need}`;
    for (const merchantId of merchantIds) {
      const notificationId = await recordMerchantNotification({
        businessId: merchantId,
        type: 'lead',
        title: enquiryTitle,
        body: enquiryBody,
        metadata: { url: LEADS_URL, sourceBusinessId },
      });
      queueBusinessPush({
        businessId: merchantId,
        type: 'lead',
        title: enquiryTitle,
        body: enquiryBody,
        url: LEADS_URL,
        notificationId: notificationId || undefined,
      });
    }

    return { success: true, merchantCount: merchantIds.size };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to submit enquiry';
    console.error('Submit Broadcast Enquiry Error:', error);
    return { success: false, error: msg };
  }
}
