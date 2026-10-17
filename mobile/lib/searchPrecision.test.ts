import assert from 'node:assert/strict';
import {
  categoryMatchScore,
  detectSearchIntents,
  exactMissNotice,
  merchantMatchTier,
  nameSuggestionScore,
  orderMerchantsByPrecision,
  parseDirectoryQuery,
  relatedSearchTerms,
  searchDisplayLabel,
} from './searchPrecision.ts';

const gym = {
  name: 'Iron House',
  category: 'Health › Gym',
  services: [] as string[],
  keywords: [] as string[],
  about: 'Weights and trainers',
};

const namedGym = {
  name: "Gold's Gym",
  category: 'Restaurant',
  services: [] as string[],
  keywords: [] as string[],
  about: '',
};

const yoga = {
  name: 'Sunrise Yoga',
  category: 'Yoga',
  services: ['fitness'],
  keywords: ['wellness'],
  about: 'A calm studio near the park',
};

const fitness = {
  name: 'Pulse Fitness',
  category: 'Fitness',
  services: [],
  keywords: [],
  about: '',
};

const gymQuery = parseDirectoryQuery('gym');
const gymsQuery = parseDirectoryQuery('gyms');
const singerQuery = parseDirectoryQuery('singer');

assert.deepEqual(gymQuery.primaryNeedles, ['gym', 'gyms']);
assert.equal(gymQuery.primaryNeedles.includes('yoga'), false);
assert.equal(gymQuery.primaryNeedles.includes('fitness'), false);
assert.equal(parseDirectoryQuery('dentist').primaryNeedles.includes('dental'), true);
assert.equal(gymsQuery.required[0], 'gym');
assert.equal(categoryMatchScore('Gym', 'gym', gymQuery.required), 100);
assert.equal(categoryMatchScore('Gyms', 'gyms', gymsQuery.required), 100);
assert.equal(categoryMatchScore('Yoga', 'yoga', gymQuery.required), 0);
assert.equal(categoryMatchScore('Fitness', 'fitness', gymQuery.required), 0);
assert.equal(categoryMatchScore('Gymnasium', 'gymnasium', gymQuery.required), 0);
assert.equal(categoryMatchScore('Barber', 'barber', parseDirectoryQuery('bar').required), 0);
assert.equal(categoryMatchScore('Cardiac Care', 'cardiac-care', parseDirectoryQuery('car').required), 0);
assert.equal(categoryMatchScore('Car Rental', 'car-rental', parseDirectoryQuery('car').required), 100);
assert.equal(
  categoryMatchScore('Dental Clinic', 'dental-clinic', parseDirectoryQuery('dentist').required),
  100,
);
assert.equal(
  categoryMatchScore('Eye Clinic', 'eye-clinic', parseDirectoryQuery('dentist').required),
  0,
);

assert.equal(merchantMatchTier(gym, gymQuery.required), 0);
assert.equal(merchantMatchTier(namedGym, gymQuery.required), 1);
assert.equal(merchantMatchTier(yoga, gymQuery.required), 4);
assert.equal(merchantMatchTier(fitness, gymQuery.required), 4);

const ordered = orderMerchantsByPrecision(
  [yoga, namedGym, fitness, gym],
  gymQuery.required,
  (merchant) => (merchant.name === 'Sunrise Yoga' ? 0.2 : 8),
);
assert.deepEqual(
  ordered.map((merchant) => merchant.name),
  ['Iron House', "Gold's Gym", 'Sunrise Yoga', 'Pulse Fitness'],
);

assert.equal(categoryMatchScore('Music Classes', 'music-classes', singerQuery.required), 0);
assert.equal(relatedSearchTerms(singerQuery.required).includes('music'), true);
assert.equal(relatedSearchTerms(singerQuery.required).includes('singer'), false);
assert.equal(searchDisplayLabel('Singer near me'), 'Singer');
assert.match(exactMissNotice('Singer'), /No exact match for “Singer”/);

const dental = parseDirectoryQuery('dental clinic');
assert.equal(dental.primaryNeedles[0], 'dental clinic');
assert.equal(dental.primaryNeedles.includes('clinic'), false);
assert.equal(dental.primaryNeedles.includes('dentist'), true);
assert.equal(categoryMatchScore('Dental Clinic', 'dental-clinic', dental.required), 100);
assert.equal(categoryMatchScore('Eye Clinic', 'eye-clinic', dental.required), 0);

assert.deepEqual(parseDirectoryQuery('open gym near me').required, ['gym']);
assert.deepEqual(parseDirectoryQuery('best dentist').required, ['dentist']);
assert.deepEqual(parseDirectoryQuery('verified plumber nearby').required, ['plumber']);
assert.deepEqual(parseDirectoryQuery('property with rajnish').required, ['property', 'rajnish']);
assert.equal(
  merchantMatchTier(
    { name: 'Property With Rajnish', category: 'Real Estate', services: [], keywords: [], about: '' },
    parseDirectoryQuery('property with rajnish').required,
  ),
  1,
);

assert.ok(nameSuggestionScore('Property With Rajnish', 'property with') >= 90);
assert.ok(nameSuggestionScore('Property With Rajnish', 'PROPERTY WITH RAJ') >= 64);
assert.ok(nameSuggestionScore('Property With Rajnish', 'rajnish property') >= 64);
assert.ok(nameSuggestionScore('Property With Rajnish', 'propert with rajnish') >= 64);
assert.equal(nameSuggestionScore('Barber Shop', 'bar'), 0);
assert.equal(nameSuggestionScore('Cardiac Care', 'car'), 0);

assert.deepEqual(detectSearchIntents('gym nearby'), ['nearest']);
assert.deepEqual(detectSearchIntents('gym near by'), ['nearest']);
assert.ok(detectSearchIntents('gym with high discount').includes('offers'));
assert.ok(detectSearchIntents('salon offers near me').includes('offers'));
assert.ok(detectSearchIntents('salon offers near me').includes('nearest'));
assert.ok(detectSearchIntents('cafe with good reviews').includes('top-rated'));
assert.deepEqual(detectSearchIntents('open gym near me').sort(), ['nearest', 'open-now']);

console.log('searchPrecision tests passed');
