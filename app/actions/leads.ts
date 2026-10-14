'use server';

import { createDataClient } from '@/utils/supabase/server';

import { type ContactIntent } from '@/lib/directLead';
import {
  enrichLegacyJobLeadMessage,
  extractLegacyJobId,
} from '@/lib/jobLeadMessage';
import { getSessionBusinessId, getSessionUserId } from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { getUser } from '@/app/actions/user';
import {
  recordDirectLeadForActor,
  submitBroadcastEnquiryForUser,
} from '@/lib/submitLeadsCore';
import { isLeadPipelineStatus } from '@/lib/leadBadges';

export type BusinessLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string;
  business_id: string | null;
  message: string | null;
  status: string;
  source?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

async function getLoggedInBusinessProfile() {
  const businessId = await getSessionBusinessId();
  if (!businessId) return null;

  const supabase = await createDataClient();
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

    const supabase = await createDataClient();
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
    if (!isLeadPipelineStatus(status.trim())) {
      return { success: false as const, error: 'Choose a valid lead status.' };
    }

    const sessionId = await getSessionBusinessId();
    if (!sessionId) {
      return { success: false as const, error: 'Not signed in' };
    }

    const supabase = await createDataClient();

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

    return recordDirectLeadForActor({
      businessId: params.businessId,
      channel: params.channel,
      actor: {
        name: actorName,
        email: actorEmail,
        phone: actorPhone,
      },
      message: userId
        ? undefined
        : `Business connect request via ${params.channel}`,
    });
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
}): Promise<{ success: true; merchantCount: number } | { success: false; error: string }> {
  try {
    const writeLimit = await enforceRateLimit('write', 'broadcast-enquiry');
    if (!writeLimit.ok) return { success: false, error: writeLimit.error };

    const userId = await getSessionUserId();
    if (!userId) {
      return { success: false, error: 'Sign in to send an enquiry.' };
    }

    return submitBroadcastEnquiryForUser(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to submit enquiry';
    console.error('Submit Broadcast Enquiry Error:', error);
    return { success: false, error: msg };
  }
}
