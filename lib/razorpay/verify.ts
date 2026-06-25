import { getRazorpayBasicAuth } from '@/lib/razorpay/server';

export type RazorpayContact = {
  id: string;
  entity: 'contact';
  name: string;
  contact: string;
  email?: string;
  type: string;
  reference_id: string;
  batch_id: string | null;
  active: boolean;
  created_at: number;
  notes?: Record<string, string>;
};

export type RazorpayFundAccount = {
  id: string;
  entity: 'fund_account';
  contact_id: string;
  currency: string;
  active: boolean;
  account_type: 'bank_account' | 'vpa';
  bank_account?: {
    name: string;
    ifsc: string;
    account_number: string;
    bank_name?: string;
  };
  vpa?: {
    address: string;
  };
  created_at: number;
  notes?: Record<string, string>;
};

export type RazorpayFundAccountValidation = {
  id: string;
  entity: 'fund_account.validation';
  fund_account: RazorpayFundAccount;
  status: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
  created_at: number;
  results?: {
    account_status: string | null;
    registered_name: string | null;
  };
};

async function razorpayVerificationRequest<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const auth = getRazorpayBasicAuth();
  if (!auth) {
    return { ok: false, error: 'Razorpay is not configured.' };
  }

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      ...(init?.headers as Record<string, string>),
    },
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('[razorpay verify] request failed:', path, data);
    return {
      ok: false,
      error: data?.error?.description || 'Razorpay verification request failed.',
    };
  }

  return { ok: true, data: data as T };
}

export async function createRazorpayContact(params: {
  name: string;
  contact: string;
  email?: string;
  type: 'vendor' | 'customer' | 'employee' | 'other';
  referenceId: string;
  notes?: Record<string, string>;
}): Promise<{ success: true; contact: RazorpayContact } | { success: false; error: string }> {
  const requestBody: Record<string, unknown> = {
    name: params.name,
    contact: params.contact,
    type: params.type,
    reference_id: params.referenceId,
  };

  if (params.email) {
    requestBody.email = params.email;
  }

  if (params.notes) {
    requestBody.notes = params.notes;
  }

  const result = await razorpayVerificationRequest<RazorpayContact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, contact: result.data };
}

export async function createRazorpayBankFundAccount(params: {
  contactId: string;
  name: string;
  ifsc: string;
  accountNumber: string;
  bankName?: string;
  notes?: Record<string, string>;
}): Promise<{ success: true; fundAccount: RazorpayFundAccount } | { success: false; error: string }> {
  const requestBody: Record<string, unknown> = {
    contact_id: params.contactId,
    account_type: 'bank_account',
    bank_account: {
      name: params.name,
      ifsc: params.ifsc,
      account_number: params.accountNumber,
    },
  };

  if (params.bankName) {
    (requestBody.bank_account as Record<string, string>).bank_name = params.bankName;
  }

  if (params.notes) {
    requestBody.notes = params.notes;
  }

  const result = await razorpayVerificationRequest<RazorpayFundAccount>('/fund_accounts', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, fundAccount: result.data };
}

export async function createRazorpayVpaFundAccount(params: {
  contactId: string;
  vpaAddress: string;
  notes?: Record<string, string>;
}): Promise<{ success: true; fundAccount: RazorpayFundAccount } | { success: false; error: string }> {
  const requestBody: Record<string, unknown> = {
    contact_id: params.contactId,
    account_type: 'vpa',
    vpa: {
      address: params.vpaAddress,
    },
  };

  if (params.notes) {
    requestBody.notes = params.notes;
  }

  const result = await razorpayVerificationRequest<RazorpayFundAccount>('/fund_accounts', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, fundAccount: result.data };
}

export async function validateRazorpayBankAccount(params: {
  fundAccountId: string;
  accountNumber: string;
  amount: number;
  currency: string;
  notes?: Record<string, string>;
}): Promise<
  | { success: true; validation: RazorpayFundAccountValidation }
  | { success: false; error: string }
> {
  const requestBody: Record<string, unknown> = {
    account_number: params.accountNumber,
    fund_account: {
      id: params.fundAccountId,
    },
    amount: params.amount,
    currency: params.currency,
  };

  if (params.notes) {
    requestBody.notes = params.notes;
  }

  const result = await razorpayVerificationRequest<RazorpayFundAccountValidation>(
    '/fund_accounts/validations',
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }
  );

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, validation: result.data };
}
