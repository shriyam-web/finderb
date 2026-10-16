'use server';

import { createDataClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

import { type ContactIntent } from '@/lib/directLead';
import {
  enrichLegacyJobLeadMessage,
  extractLegacyJobId,
} from '@/lib/jobLeadMessage';
import { getSessionBusinessId, getSessionUserId } from '@/lib/security/session';
import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
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
  merchant_read_at?: string | null;
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

/** Older contact taps stored the account email only. Fill the verified mobile so Call and WhatsApp appear. */
async function attachVerifiedAccountPhones(leads: BusinessLead[]): Promise<BusinessLead[]> {
  const emails = [
    ...new Set(
      leads
        .filter((lead) => !String(lead.phone || '').trim() && lead.email?.includes('@'))
        .map((lead) => String(lead.email).trim())
    ),
  ];
  if (!emails.length) return leads;

  const supabase = createServiceClient();
  if (!supabase) return leads;

  const { data, error } = await supabase.from('User').select('email, phone').in('email', emails);
  if (error || !data?.length) return leads;

  const phoneByEmail = new Map<string, string>();
  for (const row of data) {
    const email = String(row.email || '').trim().toLowerCase();
    const phone = String(row.phone || '').trim();
    if (email && phone) phoneByEmail.set(email, phone);
  }
  if (!phoneByEmail.size) return leads;

  return leads.map((lead) => {
    if (String(lead.phone || '').trim()) return lead;
    const phone = phoneByEmail.get(String(lead.email || '').trim().toLowerCase());
    return phone ? { ...lead, phone } : lead;
  });
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
    const tab = await assertBusinessTab(businessId, 'leads', 'view');
    if (!tab.ok) return { success: false as const, error: tab.error };

    const supabase = await createDataClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let leads = await attachVerifiedAccountPhones((data ?? []) as BusinessLead[]);

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

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: status.trim(),
        updated_at: now,
        merchant_read_at: now,
      })
      .eq('id', leadId);

    if (updateError) throw updateError;

    return { success: true as const };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update lead';
    console.error('Update Lead Status Error:', error);
    return { success: false as const, error: msg };
  }
}

export async function markLeadRead(leadId: string) {
  try {
    if (!leadId) {
      return { success: false as const, error: 'Lead ID is required' };
    }
    const sessionId = await getSessionBusinessId();
    if (!sessionId) {
      return { success: false as const, error: 'Not signed in' };
    }
    const tab = await assertBusinessTab(sessionId, 'leads', 'view');
    if (!tab.ok) return { success: false as const, error: tab.error };

    const supabase = await createDataClient();
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('business_id, merchant_read_at')
      .eq('id', leadId)
      .single();
    if (fetchError || !lead) {
      return { success: false as const, error: 'Lead not found' };
    }
    if (lead.business_id !== sessionId) {
      return { success: false as const, error: 'Unauthorized' };
    }
    if (lead.merchant_read_at) {
      return { success: true as const, alreadyRead: true as const };
    }
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('leads')
      .update({ merchant_read_at: now, updated_at: now })
      .eq('id', leadId);
    if (updateError) throw updateError;
    return { success: true as const, alreadyRead: false as const };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not update this lead';
    console.error('Mark Lead Read Error:', error);
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

    const account = userResult?.user as { fullName?: string | null; email?: string | null; phone?: string | null } | undefined;
    const actorName = account?.fullName || loggedInBusiness?.name || 'FinderB user';
    const actorEmail = account?.email || loggedInBusiness?.email || null;
    const actorPhone = account?.phone || loggedInBusiness?.phone || null;

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

    let phone = data.phone?.trim() || '';
    if (!phone) {
      const account = await getUser(userId);
      phone = String(
        (account.success && account.user ? (account.user as { phone?: string | null }).phone : '') || ''
      ).trim();
    }

    return submitBroadcastEnquiryForUser({ ...data, phone });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to submit enquiry';
    console.error('Submit Broadcast Enquiry Error:', error);
    return { success: false, error: msg };
  }
}
