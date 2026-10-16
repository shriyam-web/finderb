export type ReviewFlagStatus = 'open' | 'hidden' | 'deleted' | 'dismissed';

export function normalizeReviewFlagStatus(value: string | null | undefined): ReviewFlagStatus | null {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'hidden' || status === 'deleted' || status === 'dismissed' || status === 'open') {
    return status;
  }
  return status ? 'open' : null;
}

export function reviewFlagOutcomeLabel(status: string | null | undefined): string | null {
  switch (normalizeReviewFlagStatus(status)) {
    case 'open':
      return 'Under review';
    case 'hidden':
      return 'Hidden';
    case 'deleted':
      return 'Removed';
    case 'dismissed':
      return 'No issue found';
    default:
      return null;
  }
}
