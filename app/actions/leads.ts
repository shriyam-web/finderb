'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

import { DIRECT_LEAD_MESSAGES, type ContactIntent } from '@/lib/directLead';
import { CATEGORY_LEAD_BADGE, DIRECT_LEAD_BADGE, PROFILE_LEAD_BADGE } from '@/lib/leadBadges';
import {
  enrichLegacyJobLeadMessage,
  extractLegacyJobId,
} from '@/lib/jobLeadMessage';
import { escapeIlikePattern } from '@/lib/searchMatch';
import { assertBusinessSession, getSessionUserId } from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { getUser } from '@/app/actions/user';

export type BusinessLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string;
  business_id: string | null;
  message: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

async function getSessionBusinessId() {
  const businessId = (await cookies()).get('business_id')?.value;
  return businessId ?? null;
}

async function getLoggedInBusinessProfile() {
  const businessId = await getSessionBusinessId();
  if (!businessId) return null;

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from('Business')
    .select('id, businessName, displayName, email, workEmail, publicPhone, mobile')
    .eq('id', businessId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    name: String(data.displayName || data.businessName || 'Business').trim(),
    email: String(data.email || data.workEmail || '').trim() || null,
    phone: String(data.publicPhone || data.mobile || '').trim() || null,
  };
}

export async function getBusinessLeads(businessId: string) {
  try {
    if (!businessId) {
      return { success: false as const, error: 'Business ID is required' };
    }

    const sessionId = await getSessionBusinessId();
    if (!sessionId || sessionId !== businessId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let leads = (data ?? []) as BusinessLead[];

    const legacyJobIds = [
      ...new Set(
        leads
          .map((lead) => extractLegacyJobId(lead.message))
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (legacyJobIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .in('id', legacyJobIds);

      const titleById = new Map((jobs ?? []).map((job) => [job.id, job.title]));

      leads = leads.map((lead) => {
        const jobId = extractLegacyJobId(lead.message);
        if (!jobId) return lead;

        const title = titleById.get(jobId);
        if (!title) return lead;

        return {
          ...lead,
          message: enrichLegacyJobLeadMessage(lead.message ?? '', title),
        };
      });
    }

    return { success: true as const, leads };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch leads';
    console.error('Get Business Leads Error:', error);
    return { success: false as const, error: msg };
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
  try {
    if (!leadId || !status?.trim()) {
      return { success: false as const, error: 'Lead ID and status are required' };
    }

    const sessionId = await getSessionBusinessId();
    if (!sessionId) {
      return { success: false as const, error: 'Not signed in' };
    }

    const supabase = createClient(await cookies());

    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('business_id')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return { success: false as const, error: 'Lead not found' };
    }

    if (lead.business_id !== sessionId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: status.trim(), updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (updateError) throw updateError;

    return { success: true as const };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update lead';
    console.error('Update Lead Status Error:', error);
    return { success: false as const, error: msg };
  }
}

export async function recordDirectLead(params: {
  businessId: string;
  channel: ContactIntent;
}) {
  try {
    const writeLimit = await enforceRateLimit('write', `direct-lead:${params.businessId}`);
    if (!writeLimit.ok) return { success: false as const, error: writeLimit.error };

    const userId = await getSessionUserId();
    const loggedInBusiness = userId ? null : await getLoggedInBusinessProfile();
    if (!userId && !loggedInBusiness) {
      return { success: false as const, error: 'Sign in to contact this business.' };
    }

    const userResult = userId ? await getUser(userId) : null;
    if (userId && (!userResult?.success || !userResult.user)) {
      return { success: false as const, error: 'Could not load your account.' };
    }

    const actorName = userResult?.user?.fullName || loggedInBusiness?.name || 'FinderB user';
    const actorEmail = userResult?.user?.email || loggedInBusiness?.email || null;
    const actorPhone = loggedInBusiness?.phone || null;

    const supabase = createClient(await cookies());
    const { data: business, error: businessError } = await supabase
      .from('Business')
      .select('category')
      .eq('id', params.businessId)
      .maybeSingle();

    if (businessError || !business) {
      return { success: false as const, error: 'Business not found.' };
    }

    const message = userId
      ? DIRECT_LEAD_MESSAGES[params.channel]
      : `Business connect request via ${params.channel}`;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let existingQuery = supabase
      .from('leads')
      .select('id')
      .eq('business_id', params.businessId)
      .eq('status', DIRECT_LEAD_BADGE)
      .eq('message', message)
      .gte('created_at', since);

    existingQuery = actorEmail
      ? existingQuery.eq('email', actorEmail)
      : existingQuery.eq('name', actorName);

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return { success: true as const, duplicate: true as const };
    }

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('leads').insert({
      name: actorName,
      email: actorEmail,
      phone: actorPhone,
      category: String(business.category || 'General'),
      business_id: params.businessId,
      message,
      status: DIRECT_LEAD_BADGE,
      created_at: now,
      updated_at: now,
    });

    if (insertError) throw insertError;

    return { success: true as const, duplicate: false as const };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not record lead';
    console.error('Record Direct Lead Error:', error);
    return { success: false as const, error: msg };
  }
}

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
    const writeLimit = await enforceRateLimit('write', 'broadcast-enquiry');
    if (!writeLimit.ok) return { success: false, error: writeLimit.error };

    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'Sign in to send an enquiry.' };
    }

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

    const businesses = [...(byCity ?? []), ...(byLocation ?? [])];

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
