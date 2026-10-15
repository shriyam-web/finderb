export const CATEGORY_CHANGE_FIELD = 'category';
export const LEGAL_BUSINESS_NAME_FIELD = 'legal_business_name';
export const DISPLAY_NAME_FIELD = 'display_name';

export const BUSINESS_CHANGE_REQUEST_FIELDS = [
  CATEGORY_CHANGE_FIELD,
  LEGAL_BUSINESS_NAME_FIELD,
  DISPLAY_NAME_FIELD,
] as const;

export const CHANGE_REQUEST_BUSINESS_COLUMN: Record<
  (typeof BUSINESS_CHANGE_REQUEST_FIELDS)[number],
  'category' | 'businessName' | 'displayName'
> = {
  [CATEGORY_CHANGE_FIELD]: 'category',
  [LEGAL_BUSINESS_NAME_FIELD]: 'businessName',
  [DISPLAY_NAME_FIELD]: 'displayName',
};

export const CHANGE_REQUEST_FIELD_LABEL: Record<string, string> = {
  [CATEGORY_CHANGE_FIELD]: 'Category',
  [LEGAL_BUSINESS_NAME_FIELD]: 'Legal business name',
  [DISPLAY_NAME_FIELD]: 'Display name',
};

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
