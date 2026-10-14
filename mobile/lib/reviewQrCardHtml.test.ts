import assert from 'node:assert/strict';
import { reviewCardFileName, reviewQrCardHtml } from './reviewQrCardHtml.ts';

assert.equal(reviewCardFileName('Jaipur Sweets House'), 'jaipur-sweets-house-finderb-review-qr.png');
assert.equal(reviewCardFileName('***'), 'business-finderb-review-qr.png');

const html = reviewQrCardHtml({
  businessName: 'Jaipur Sweets',
  place: 'Sweets · Jaipur',
  reviewUrl: 'https://finderb.com/review/jaipur-sweets',
  qrBase64: 'abc123',
});
assert.match(html, /FINDERB/);
assert.match(html, /Jaipur Sweets/);
assert.match(html, /data:image\/png;base64,abc123/);
assert.match(html, /1080/);
assert.match(html, /1350/);

console.log('reviewQrCardHtml tests passed');
