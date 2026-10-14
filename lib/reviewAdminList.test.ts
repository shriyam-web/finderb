import assert from 'node:assert/strict';
import {
  flattenBusinessReviews,
  matchesReviewQuery,
  visibilityLabel,
  anonymousLabel,
  sortReviewsNewest,
} from './reviewAdminList.ts';

const rows = flattenBusinessReviews({
  id: 'biz-1',
  businessName: 'Jaipur Sweets',
  displayName: 'Jaipur Sweets House',
  city: 'Jaipur',
  slug: 'jaipur-sweets-house-jaipur',
  review: [
    {
      id: 'rev-live',
      author: 'Anita Sharma',
      content: 'Fresh jalebi and polite staff.',
      rating: 5,
      date: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'rev-anon',
      author: 'Rahul Verma',
      content: 'Took too long.',
      rating: 2,
      date: '2026-10-12T10:00:00.000Z',
      anonymous: true,
      anonymityStatus: 'pending',
      anonymousReason: 'I still visit this shop often.',
    },
    {
      id: 'rev-hidden',
      author: 'Guest',
      content: 'Hidden note',
      rating: 1,
      date: '2026-09-01T10:00:00.000Z',
      hidden: true,
    },
    {
      id: 'rev-deleted',
      author: 'Old',
      content: 'Gone',
      rating: 3,
      date: '2026-08-01T10:00:00.000Z',
      deleted: true,
    },
  ],
});

assert.equal(rows.length, 4, 'admin list includes hidden and removed reviews');
assert.equal(rows[0].business_name, 'Jaipur Sweets House');
assert.equal(rows.find((row) => row.review_id === 'rev-anon')?.public_name.startsWith('R'), true);
assert.equal(visibilityLabel(rows.find((row) => row.review_id === 'rev-live')!), 'Visible on listing');
assert.equal(visibilityLabel(rows.find((row) => row.review_id === 'rev-hidden')!), 'Hidden from public');
assert.equal(visibilityLabel(rows.find((row) => row.review_id === 'rev-deleted')!), 'Removed');
assert.equal(anonymousLabel('pending'), 'Waiting: keep anonymous or show name');
assert.equal(matchesReviewQuery(rows[0], ''), true);
assert.equal(matchesReviewQuery(rows[0], 'j'), true);
assert.equal(
  rows.filter((row) => matchesReviewQuery(row, 'rev-anon')).map((row) => row.review_id).join(),
  'rev-anon',
);
assert.equal(
  rows.filter((row) => matchesReviewQuery(row, 'jaipur')).length,
  4,
);
assert.equal(sortReviewsNewest(rows)[0].review_id, 'rev-anon');

const fromJsonText = flattenBusinessReviews({
  id: 'biz-2',
  businessName: 'Old Shop',
  review: JSON.stringify([
    { id: 'legacy-json', author: 'Meera', content: 'Nice', rating: 4, date: '2026-10-01T00:00:00.000Z' },
  ]),
});
assert.equal(fromJsonText[0]?.review_id, 'legacy-json');

console.log('reviewAdminList tests passed');
