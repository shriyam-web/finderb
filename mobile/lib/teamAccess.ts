export const TEAM_TABS = [
  { key: 'overview', label: 'Home', hint: 'Dashboard snapshot and alerts', allowsEdit: false },
  { key: 'listings', label: 'My Listing', hint: 'Public listing, photos, and preview', allowsEdit: true },
  { key: 'leads', label: 'Leads', hint: 'Enquiries and pipeline status', allowsEdit: true },
  { key: 'reviews', label: 'Reviews', hint: 'Ratings, replies, and review card', allowsEdit: true },
  { key: 'jobs', label: 'Jobs', hint: 'Job posts on FinderB', allowsEdit: true },
  { key: 'subscription', label: 'Plan', hint: 'Billing, renewal, and payments', allowsEdit: true },
  { key: 'messages', label: 'Messages', hint: 'Customer messages', allowsEdit: true },
  { key: 'settings', label: 'Settings', hint: 'Profile, hours, and listing details', allowsEdit: true },
] as const;

export type TeamTabKey = (typeof TEAM_TABS)[number]['key'];
export type TabRights = { view: boolean; edit: boolean };
export type TeamAccessMap = Record<TeamTabKey, TabRights>;
export type TeamInviteChannel = 'email' | 'phone';

export const TEAM_TAB_LOCKED = 'You do not have access to this part of FinderB Business.';
export const TEAM_OWNER_ONLY = 'Only the original business owner can manage team access.';
export const TEAM_INVITE_HOURS = 48;

export function ownerTeamAccess(): TeamAccessMap {
  return Object.fromEntries(
    TEAM_TABS.map((tab) => [tab.key, { view: true, edit: true }]),
  ) as TeamAccessMap;
}

export function defaultInviteAccess(): TeamAccessMap {
  return {
    overview: { view: true, edit: false },
    listings: { view: true, edit: false },
    leads: { view: true, edit: true },
    reviews: { view: true, edit: true },
    jobs: { view: false, edit: false },
    subscription: { view: false, edit: false },
    messages: { view: true, edit: true },
    settings: { view: false, edit: false },
  };
}

export function normalizeTeamAccess(raw: unknown): TeamAccessMap {
  const next = defaultInviteAccess();
  if (!raw || typeof raw !== 'object') return next;
  const src = raw as Record<string, unknown>;
  for (const tab of TEAM_TABS) {
    const row = src[tab.key];
    if (!row || typeof row !== 'object') continue;
    const view = Boolean((row as TabRights).view);
    const edit = tab.allowsEdit ? Boolean((row as TabRights).edit) : false;
    next[tab.key] = { view: view || edit, edit };
  }
  return next;
}

export function canViewTeamTab(access: TeamAccessMap | null | undefined, key: TeamTabKey, isOwner: boolean) {
  if (isOwner) return true;
  return Boolean(access?.[key]?.view);
}

export function canEditTeamTab(access: TeamAccessMap | null | undefined, key: TeamTabKey, isOwner: boolean) {
  if (isOwner) return true;
  const row = access?.[key];
  return Boolean(row?.view && row?.edit);
}

export function firstVisibleTeamTab(access: TeamAccessMap | null | undefined, isOwner: boolean): TeamTabKey {
  if (isOwner) return 'overview';
  return TEAM_TABS.find((tab) => access?.[tab.key]?.view)?.key ?? 'overview';
}

export function summarizeTeamAccess(access: TeamAccessMap): string {
  const visible = TEAM_TABS.filter((tab) => access[tab.key]?.view);
  if (!visible.length) return 'No tabs';
  return visible
    .map((tab) => `${tab.label}${access[tab.key].edit && tab.allowsEdit ? ' (edit)' : ''}`)
    .join(', ');
}

export const MOBILE_ROUTE_TAB: Record<string, TeamTabKey> = {
  index: 'overview',
  leads: 'leads',
  listing: 'listings',
  reviews: 'reviews',
  subscription: 'subscription',
  more: 'overview',
  jobs: 'jobs',
  photos: 'listings',
  account: 'settings',
  plan: 'subscription',
  alerts: 'overview',
};
