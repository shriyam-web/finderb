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

export function reviewFlagOutcomeTitle(status: string | null | undefined): string {
  switch (normalizeReviewFlagStatus(status)) {
    case 'hidden':
      return 'Flag reviewed — review hidden';
    case 'deleted':
      return 'Flag reviewed — review removed';
    case 'dismissed':
      return 'Flag reviewed — no issue found';
    default:
      return 'Admin replied to your flag';
  }
}

export function reviewFlagReplyBody(author: string): string {
  const name = author.trim() || 'a customer';
  return `Admin has replied on your flag to review by ${name}.`;
}
