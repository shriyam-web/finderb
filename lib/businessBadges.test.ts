import assert from 'node:assert/strict';
import { buildBadgeReports, HIGHLY_RATED_MIN, NEW_LISTING_MS, QUICK_REPLY_MS } from './businessBadges.ts';

const base = {
  repliedCount: 0,
  averageResponseMs: null as number | null,
  rating: null as number | null,
  reviewCount: 0,
  monthViews: 0,
  monthLeads: 0,
  topViews: 0,
  topLeads: 0,
  category: 'Cafe',
  city: 'Jaipur',
  liveAt: null as string | null,
  completionPercent: 0,
  nowMs: Date.parse('2026-10-18T00:00:00.000Z'),
};

const byId = (facts: Partial<typeof base> & { overrides?: Record<string, 'on' | 'off'> }) => {
  const reports = buildBadgeReports({ ...base, ...facts });
  return Object.fromEntries(reports.map((badge) => [badge.id, badge]));
};

const quiet = byId({});
assert.equal(quiet.quickReply.earned, false);
assert.equal(quiet.quickReply.active, false);
assert.equal(quiet.trusted.active, false);
assert.equal(quiet.bestInCategory.earned, false);

const quick = byId({ repliedCount: 5, averageResponseMs: QUICK_REPLY_MS });
assert.equal(quick.quickReply.earned, true);
assert.equal(byId({ repliedCount: 4, averageResponseMs: 10 * 60 * 1000 }).quickReply.earned, false);
assert.equal(byId({ repliedCount: 6, averageResponseMs: QUICK_REPLY_MS + 1 }).quickReply.earned, false);

const rated = byId({ rating: HIGHLY_RATED_MIN, reviewCount: 10 });
assert.equal(rated.highlyRated.earned, true);
assert.equal(byId({ rating: 4.69, reviewCount: 12 }).highlyRated.earned, false);
assert.equal(byId({ rating: 4.9, reviewCount: 9 }).highlyRated.earned, false);

const popular = byId({ monthViews: 4, topViews: 4, monthLeads: 0, topLeads: 3 });
assert.equal(popular.popularMonth.earned, true);
assert.equal(byId({ monthViews: 0, topViews: 0, monthLeads: 2, topLeads: 2 }).popularMonth.earned, true);
assert.equal(byId({ monthViews: 1, topViews: 5, monthLeads: 1, topLeads: 4 }).popularMonth.earned, false);

const liveAt = new Date(base.nowMs - 29 * 24 * 60 * 60 * 1000).toISOString();
assert.equal(byId({ liveAt }).newOnFinderB.earned, true);
assert.equal(byId({ liveAt: new Date(base.nowMs - NEW_LISTING_MS).toISOString() }).newOnFinderB.earned, false);

const bestFacts = {
  rating: 4,
  reviewCount: 3,
  averageResponseMs: 4 * 60 * 60 * 1000,
  completionPercent: 91,
};
assert.equal(byId(bestFacts).bestInCategory.earned, true);
assert.equal(byId({ ...bestFacts, completionPercent: 90 }).bestInCategory.earned, false);
assert.equal(byId({ ...bestFacts, reviewCount: 2 }).bestInCategory.earned, false);
assert.equal(byId({ overrides: { bestInCategory: 'on' } }).bestInCategory.active, true);
assert.equal(byId({ ...bestFacts, overrides: { bestInCategory: 'off' } }).bestInCategory.active, false);

const forced = byId({ overrides: { trusted: 'on', quickReply: 'off' }, repliedCount: 8, averageResponseMs: 60_000 });
assert.equal(forced.trusted.active, true);
assert.equal(forced.trusted.earned, false);
assert.equal(forced.quickReply.earned, true);
assert.equal(forced.quickReply.active, false);

console.log('business badge rules ok');
