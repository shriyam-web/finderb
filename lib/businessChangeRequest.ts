export const CATEGORY_CHANGE_FIELD = 'category';
export const LEGAL_BUSINESS_NAME_FIELD = 'legal_business_name';

export const BUSINESS_CHANGE_REQUEST_FIELDS = [
  CATEGORY_CHANGE_FIELD,
  LEGAL_BUSINESS_NAME_FIELD,
] as const;

export type BusinessChangeRequestField = (typeof BUSINESS_CHANGE_REQUEST_FIELDS)[number];

export type BusinessChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export type BusinessChangeRequest = {
  id: string;
  business_id: string;
  field: string;
  current_value: string;
  requested_value: string;
  status: BusinessChangeRequestStatus;
  merchant_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};
