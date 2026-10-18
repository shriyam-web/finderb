import { safeUserError } from './safeError';
import { SITE_URL } from './supabase';
import { getStoredToken } from './session';

type LeadFailure = {
  success: false;
  error: string;
  unauthorized?: boolean;
};

type AuthHeaders = {
  'Content-Type': string;
  Accept: string;
  Authorization: string;
};

function isLeadFailure(value: AuthHeaders | LeadFailure): value is LeadFailure {
  return 'success' in value && value.success === false;
}

async function authHeaders(): Promise<AuthHeaders | LeadFailure> {
  const token = await getStoredToken();
  if (!token) {
    return {
      success: false,
      error: 'Sign in to continue.',
      unauthorized: true,
    };
  }
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function postLead<T>(path: string, body: Record<string, unknown>): Promise<T | LeadFailure> {
  const headers = await authHeaders();
  if (isLeadFailure(headers)) return headers;

  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text) as T & { success?: boolean; error?: string };
      if (res.status === 401) {
        return {
          success: false,
          error: data.error || 'Please log in.',
          unauthorized: true,
        };
      }
      return data;
    } catch {
      return { success: false, error: `Server error (${res.status}). Please try again.` };
    }
  } catch (error) {
    return {
      success: false,
      error: safeUserError(error, 'Network error. Check your connection.'),
    };
  }
}

export async function submitBroadcastEnquiry(input: {
  sourceBusinessId: string;
  category: string;
  area: string;
  name: string;
  email: string;
  phone: string;
  lookingFor: string;
}): Promise<{ success: true; merchantCount: number } | LeadFailure> {
  const result = await postLead<{ success?: boolean; merchantCount?: number; error?: string }>(
    '/api/leads/enquiry',
    input,
  );
  if ('unauthorized' in result && result.unauthorized) return result;
  if (!('success' in result) || !result.success) {
    return { success: false, error: ('error' in result && result.error) || 'Could not send enquiry.' };
  }
  return { success: true, merchantCount: Number(result.merchantCount) || 1 };
}

export async function recordDirectLead(input: {
  businessId: string;
  channel: 'call' | 'whatsapp' | 'enquire';
}): Promise<{ success: true; duplicate?: boolean } | LeadFailure> {
  const result = await postLead<{ success?: boolean; duplicate?: boolean; error?: string }>(
    '/api/leads/direct',
    input,
  );
  if ('unauthorized' in result && result.unauthorized) return result;
  if (!('success' in result) || !result.success) {
    return { success: false, error: ('error' in result && result.error) || 'Could not record contact.' };
  }
  return { success: true, duplicate: Boolean(result.duplicate) };
}

export async function submitJobApplicationLead(input: {
  jobId: string;
  businessId: string;
  jobTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
}): Promise<{ success: true } | LeadFailure> {
  const result = await postLead<{ success?: boolean; error?: string }>('/api/jobs/apply', input);
  if ('unauthorized' in result && result.unauthorized) return result;
  if (!('success' in result) || !result.success) {
    return { success: false, error: ('error' in result && result.error) || 'Could not submit application' };
  }
  return { success: true };
}
