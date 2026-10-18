import { safeUserError } from './safeError';
import { SITE_URL, isSupabaseConfigured, supabase } from './supabase';
import { getBusinessOpenStatus } from './businessHours';
import { lookupCityCoords, INDIA_CITY_COORDS } from './cityCoords';
import { getDistanceKm, sortByUserLocation, type Coords } from './geo';
import { mapMerchantRow, merchantHasPublicPhoto, rankMerchants, type Merchant } from './merchants';
import { applyFixedSlotOrder, getCategoryFixedSlotIds } from './categoryFixedSlots';
import {
  EXACT_CATEGORY_SCORE,
  categoryMatchScore,
  categoryRelevanceScore,
  exactMissNotice,
  merchantMatchTier,
  nameSuggestionScore,
  scoreMerchantMatch,
  detectSearchIntents,
  parseDirectoryQuery,
  relatedSearchTerms,
  searchDisplayLabel,
} from './searchPrecision';
import { buildHomeFeaturedGroups, uniqueCatalogCategories } from './featuredCategoryGroups';
import { createSessionMemo } from './sessionMemo';
import { consoleCall, isFailure } from './merchantConsoleApi';

/** Job listings have a dedicated home shelf; other parents match the website. */
const EXCLUDED_HOME_CATEGORY_SLUGS = new Set(['job']);

/** Public listing columns only — anon GRANT in supabase/security_lockdown.sql. Extra columns 400 the whole query. */
const MERCHANT_SELECT =
  'id, slug, businessName, displayName, category, location, city, state, about, profilePictureUrl, images, publicPhone, mobile, email, workEmail, website, whatsappNumber, instagramUrl, facebookUrl, youtubeUrl, review, isFinderBVerified, hasVerifiedBadge, discountRange, status, latitude, longitude, timings, serviceCategory, keywords, paymentModes, businessAddress, yearsInBusiness, createdAt';

const MERCHANT_SELECT_WITH_FLAGS = `${MERCHANT_SELECT}, emailVerified, mobileVerified, whatsappVerified`;

const CATEGORY_SELECT =
  'id, name, slug, symbol, banner, items_count, position, status, parent_id, level';

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  businessCount: number;
  parentId?: string | null;
  level?: number | null;
  queryName?: string;
  children?: HomeCategory[];
};

export type SubCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  businessCount: number;
  queryName: string;
};

function dbSymbol(value: unknown): string {
  if (typeof value !== 'string' || !value || value === 'Not Set') return '';
  return value;
}

function dbBanner(value: unknown): string {
  if (typeof value !== 'string' || !value || value === 'Not Set') return '';
  return value;
}

function resolveMediaUrl(value: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${SITE_URL}${value}`;
  return value;
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

/** Short words must match a whole token. "ca" must not fetch every "car". */
function ilikeClauses(column: string, needle: string): string[] {
  const escaped = escapeIlikePattern(needle.trim());
  if (!escaped) return [];
  if (escaped.length <= 2) {
    return [
      `${column}.ilike.${escaped}`,
      `${column}.ilike.${escaped} %`,
      `${column}.ilike.% ${escaped}`,
      `${column}.ilike.% ${escaped} %`,
    ];
  }
  if (escaped.length === 3) {
    return [
      `${column}.ilike.${escaped}`,
      `${column}.ilike.${escaped}%`,
      `${column}.ilike.% ${escaped}%`,
      `${column}.ilike.%-${escaped}%`,
    ];
  }
  return [`${column}.ilike.%${escaped}%`];
}

function toCategoryLookupSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function mapCategoryRow(row: Record<string, unknown>): HomeCategory {
  const name = String(row.name || '').trim();
  const slug =
    String(row.slug || '')
      .trim()
      .toLowerCase() || name.toLowerCase().replace(/\s+/g, '-');
  const parentRaw = row.parent_id;
  const parentId =
    parentRaw == null || parentRaw === '' ? null : String(parentRaw);
  const levelRaw = row.level;
  const level =
    typeof levelRaw === 'number'
      ? levelRaw
      : parentId
        ? 2
        : 1;
  return {
    id: String(row.id),
    name,
    slug,
    icon: resolveMediaUrl(dbSymbol(row.symbol)),
    image: resolveMediaUrl(dbBanner(row.banner)),
    businessCount: Number(row.items_count) || 0,
    parentId,
    level,
    queryName: name,
  };
}

async function resolveBusinessCategoryNeedles(categoryName: string): Promise<string[]> {
  if (!supabase) return [];
  const raw = categoryName.trim();
  if (!raw || raw.toLowerCase() === 'all') return [];

  const asSlug = toCategoryLookupSlug(raw);
  type CategoryRow = { id: string; name: string; parent_id: string | null };
  let cat: CategoryRow | null = null;

  const { data: bySlug } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .eq('slug', asSlug)
    .maybeSingle();
  if (bySlug?.name) {
    cat = {
      id: String(bySlug.id),
      name: String(bySlug.name),
      parent_id: bySlug.parent_id == null ? null : String(bySlug.parent_id),
    };
  }

  if (!cat) {
    const { data: byName } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('name', raw)
      .maybeSingle();
    if (byName?.name) {
      cat = {
        id: String(byName.id),
        name: String(byName.name),
        parent_id: byName.parent_id == null ? null : String(byName.parent_id),
      };
    }
  }

  if (!cat) {
    const fallback =
      raw.includes('-') && !/\s/.test(raw) ? raw.replace(/-/g, ' ') : raw;
    return [fallback];
  }

  const needles = new Set<string>([cat.name.trim()]);
  const { data: children } = await supabase
    .from('categories')
    .select('id, name')
    .eq('parent_id', cat.id);

  const childIds = (children ?? [])
    .map((child) => String(child.id || ''))
    .filter(Boolean);

  for (const child of children ?? []) {
    const childName = String(child.name || '').trim();
    if (!childName) continue;
    needles.add(childName);
    needles.add(`${cat.name.trim()} › ${childName}`);
  }

  if (childIds.length) {
    const { data: grands } = await supabase
      .from('categories')
      .select('name, parent_id')
      .in('parent_id', childIds);
    const childNameById = new Map(
      (children ?? []).map((child) => [
        String(child.id),
        String(child.name || '').trim(),
      ]),
    );
    for (const grand of grands ?? []) {
      const grandName = String(grand.name || '').trim();
      if (!grandName) continue;
      needles.add(grandName);
      const midName = childNameById.get(String(grand.parent_id)) || '';
      if (midName) needles.add(`${midName} › ${grandName}`);
    }
  }

  if (cat.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('name, level')
      .eq('id', cat.parent_id)
      .maybeSingle();
    const parentName = String(parent?.name || '').trim();
    if (parentName && Number(parent?.level) !== 0) {
      needles.add(`${parentName} › ${cat.name.trim()}`);
    }
  }

  return [...needles];
}

export type CategoryShelf = {
  category: HomeCategory;
  merchants: Merchant[];
};

export async function fetchHomeCategoryShelves(options?: {
  categoryLimit?: number;
  merchantsPerCategory?: number;
}): Promise<{
  shelves: CategoryShelf[];
  error?: string;
}> {
  const categoryLimit = options?.categoryLimit ?? 5;
  const merchantsPerCategory = options?.merchantsPerCategory ?? 8;

  const { categories, error } = await fetchExploreCategories(60);
  if (error) return { shelves: [], error };
  if (categories.length === 0) return { shelves: [] };

  const top = [...categories]
    .filter((cat) => !EXCLUDED_HOME_CATEGORY_SLUGS.has(cat.slug))
    .sort((a, b) => (b.businessCount || 0) - (a.businessCount || 0))
    .slice(0, categoryLimit);

  const results = await Promise.all(
    top.map(async (category) => {
      const { merchants } = await fetchBusinessesByCategory(category.name, {
        page: 1,
        pageSize: merchantsPerCategory,
      });
      return { category, merchants } satisfies CategoryShelf;
    }),
  );

  return {
    shelves: results.filter((shelf) => shelf.merchants.length > 0),
  };
}

export async function fetchFeaturedMerchants(limit = 12): Promise<{
  merchants: Merchant[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      merchants: [],
      error: 'Could not load businesses.',
    };
  }

  // Prefer verified, then fill with other active photo listings so the strip never looks empty.
  const verified = await supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .eq('status', 'Active')
    .or('isFinderBVerified.eq.true,hasVerifiedBadge.eq.true')
    .limit(80);

  if (verified.error) {
    return { merchants: [], error: safeUserError(verified.error, 'Could not load businesses.') };
  }

  let ranked = rankMerchants(
    (verified.data ?? []).map((row) => mapMerchantRow(row as Record<string, unknown>)),
  );

  if (ranked.length < limit) {
    const extras = await supabase
      .from('Business')
      .select(MERCHANT_SELECT)
      .eq('status', 'Active')
      .order('createdAt', { ascending: false })
      .limit(100);

    if (!extras.error && extras.data) {
      const seen = new Set(ranked.map((m) => m.id));
      const more = rankMerchants(
        extras.data
          .map((row) => mapMerchantRow(row as Record<string, unknown>))
          .filter((m) => !seen.has(m.id)),
      );
      ranked = [...ranked, ...more];
    }
  }

  return { merchants: ranked.slice(0, limit) };
}

export async function fetchHomeCategories(limit = 12): Promise<{
  categories: HomeCategory[];
  error?: string;
}> {
  const result = await fetchExploreCategories(40);
  if (result.error) return result;
  return {
    categories: result.categories
      .filter((cat) => !EXCLUDED_HOME_CATEGORY_SLUGS.has(cat.slug))
      .slice(0, limit),
  };
}

function normalizeCategoryLabel(value: string): string {
  return value.trim().toLowerCase();
}

function countBusinessesForCategoryTree(
  categoryName: string,
  descendantNames: string[],
  labels: string[],
): number {
  const names = [categoryName, ...descendantNames]
    .map(normalizeCategoryLabel)
    .filter(Boolean);
  if (!names.length) return 0;
  return labels.filter((label) => {
    const normalized = normalizeCategoryLabel(label);
    return names.some(
      (name) =>
        normalized === name ||
        normalized.startsWith(`${name} ›`) ||
        normalized.endsWith(` › ${name}`),
    );
  }).length;
}

function attachDescendantBusinessCounts(
  nodes: HomeCategory[],
  labels: string[],
): HomeCategory[] {
  const childrenByParent = new Map<string, HomeCategory[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const list = childrenByParent.get(node.parentId) ?? [];
    list.push(node);
    childrenByParent.set(node.parentId, list);
  }

  const visiting = new Set<string>();
  const collectNames = (id: string, name: string): string[] => {
    if (visiting.has(id)) return [name];
    visiting.add(id);
    const kids = childrenByParent.get(id) ?? [];
    const names = [
      name,
      ...kids.flatMap((kid) => collectNames(kid.id, kid.name)),
    ];
    visiting.delete(id);
    return names;
  };

  return nodes.map((node) => {
    if (labels.length === 0) return node;
    const names = collectNames(node.id, node.name);
    return {
      ...node,
      businessCount: countBusinessesForCategoryTree(
        names[0] ?? node.name,
        names.slice(1),
        labels,
      ),
    };
  });
}

async function fetchActiveBusinessCategoryLabels(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const labels: string[] = [];
  const pageSize = 1000;
  let from = 0;

  while (from < 20000) {
    const { data, error } = await supabase
      .from('Business')
      .select('category')
      .eq('status', 'Active')
      .range(from, from + pageSize - 1);
    if (error || !data) break;
    for (const row of data) {
      const label = typeof row.category === 'string' ? row.category.trim() : '';
      if (label) labels.push(label);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return labels;
}

async function fetchAllCategoryRows(): Promise<{
  rows: Record<string, unknown>[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { rows: [], error: 'Supabase is not configured' };
  }

  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('status', 'Active')
      .order('position', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      return { rows: [], error: safeUserError(error, 'Could not load this.') };
    }

    const chunk = (data ?? []) as Record<string, unknown>[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
    if (from > 20000) break;
  }

  return { rows };
}

type CategoryCatalog = {
  categories: HomeCategory[];
  error?: string;
};

type SubCategoryResult = {
  subCategories: SubCategory[];
  error?: string;
};

type MerchantListResult = {
  merchants: Merchant[];
  slotIds?: Array<string | null>;
  error?: string;
};

type BusinessPage = {
  merchants: Merchant[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: string;
};

const categoryCatalogMemo = createSessionMemo<CategoryCatalog>();
const subCategoryMemo = createSessionMemo<SubCategoryResult>();
const merchantListMemo = createSessionMemo<MerchantListResult>();

const CATEGORY_CATALOG_KEY = 'all';
const catalogListeners = new Set<() => void>();

export function subscribeCategoryCatalog(listener: () => void) {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
  };
}

function emitCategoryCatalog() {
  catalogListeners.forEach((listener) => listener());
}

export function peekAllCategories(): CategoryCatalog | null {
  return categoryCatalogMemo.peek(CATEGORY_CATALOG_KEY) ?? null;
}

export function clearCategorySessionCache() {
  categoryCatalogMemo.clear();
  subCategoryMemo.clear();
}

export function clearMerchantSessionCache() {
  merchantListMemo.clear();
}

export function clearApiSessionCaches() {
  clearCategorySessionCache();
  clearMerchantSessionCache();
}

function merchantListKey(categoryQuery: string) {
  return categoryQuery.trim().toLowerCase();
}

let listingOrigin: { coords: Coords | null; city: string | null } = {
  coords: null,
  city: null,
};
let listingOriginKey = '';
const nearestFirstMemo = new WeakMap<Merchant[], { key: string; list: Merchant[] }>();

/** Where the user is; category listings are ranked nearest-first from here. */
export function setListingOrigin(coords: Coords | null, city: string | null) {
  listingOrigin = { coords, city: city?.trim() || null };
  listingOriginKey = [
    coords ? `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}` : '',
    listingOrigin.city?.toLowerCase() ?? '',
  ].join('|');
}

/** Ranks the whole category before paging, so page 1 really holds the closest businesses. */
function nearestFirst(list: Merchant[]): Merchant[] {
  if (!listingOrigin.coords && !listingOrigin.city) return list;
  const hit = nearestFirstMemo.get(list);
  if (hit && hit.key === listingOriginKey) return hit.list;
  const sorted = sortByUserLocation(list, listingOrigin);
  nearestFirstMemo.set(list, { key: listingOriginKey, list: sorted });
  return sorted;
}

function paginateMerchants(
  rawList: Merchant[],
  page: number,
  pageSize: number,
  error?: string,
): BusinessPage {
  const list = nearestFirst(rawList);
  const total = list.length;
  return {
    merchants: list.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    error,
  };
}

/** Full category pool, before nearest-page slicing. Home shuffles this when no filter is on. */
export function getCategoryMerchantPool(categoryQuery: string): Merchant[] | null {
  const hit = merchantListMemo.peek(merchantListKey(categoryQuery));
  if (!hit || hit.error) return null;
  return hit.merchants;
}

/** Paid category slots. Home puts these back after a fair shuffle. */
export function getCategorySlotIds(categoryQuery: string): Array<string | null> {
  const hit = merchantListMemo.peek(merchantListKey(categoryQuery));
  return hit?.slotIds ?? [];
}

export function peekBusinessesByCategory(
  categoryQuery: string,
  options?: { page?: number; pageSize?: number },
): BusinessPage | null {
  const hit = merchantListMemo.peek(merchantListKey(categoryQuery));
  if (!hit || hit.error) return null;
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(Math.max(options?.pageSize ?? 20, 1), 40);
  return paginateMerchants(hit.merchants, page, pageSize, hit.error);
}

function rollupItemsCount(nodes: HomeCategory[]): HomeCategory[] {
  const childrenByParent = new Map<string, HomeCategory[]>();
  for (const node of nodes) {
    if (!node.parentId || node.parentId === node.id) continue;
    const list = childrenByParent.get(node.parentId) ?? [];
    list.push(node);
    childrenByParent.set(node.parentId, list);
  }
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const totalOf = (node: HomeCategory): number => {
    const cached = memo.get(node.id);
    if (cached != null) return cached;
    if (visiting.has(node.id)) return node.businessCount || 0;
    visiting.add(node.id);
    const kids = childrenByParent.get(node.id) ?? [];
    const sum =
      (node.businessCount || 0) + kids.reduce((acc, kid) => acc + totalOf(kid), 0);
    visiting.delete(node.id);
    memo.set(node.id, sum);
    return sum;
  };
  return nodes.map((node) => ({ ...node, businessCount: totalOf(node) }));
}

async function fetchCategoryCatalog(force = false): Promise<CategoryCatalog> {
  if (!isSupabaseConfigured || !supabase) {
    return { categories: [], error: 'Supabase is not configured' };
  }

  const result = await categoryCatalogMemo.get(
    CATEGORY_CATALOG_KEY,
    async () => {
      const { rows, error } = await fetchAllCategoryRows();
      if (error) {
        return { categories: [], error };
      }

      const mapped = rows
        .map((row) => mapCategoryRow(row))
        .filter((cat) => Boolean(cat.name));

      const quick: CategoryCatalog = {
        categories: rollupItemsCount(mapped).sort(
          (a, b) => (b.businessCount || 0) - (a.businessCount || 0),
        ),
      };

      void fetchActiveBusinessCategoryLabels()
        .then((labels) => {
          if (!labels.length) return;
          categoryCatalogMemo.set(CATEGORY_CATALOG_KEY, {
            categories: attachDescendantBusinessCounts(mapped, labels).sort(
              (a, b) => (b.businessCount || 0) - (a.businessCount || 0),
            ),
          });
          emitCategoryCatalog();
        })
        .catch(() => undefined);

      return quick;
    },
    force,
  );
  if (result.error) categoryCatalogMemo.delete(CATEGORY_CATALOG_KEY);
  return result;
}

/** Every active category (including grouping parents) with live merchant counts. */
export async function fetchAllCategories(force = false): Promise<{
  categories: HomeCategory[];
  error?: string;
}> {
  return fetchCategoryCatalog(force);
}

/** Top-level parents only — used by older home shelves. */
export async function fetchExploreCategories(limit = 80): Promise<{
  categories: HomeCategory[];
  error?: string;
}> {
  const result = await fetchCategoryCatalog();
  if (result.error) return result;
  return {
    categories: result.categories
      .filter((cat) => !cat.parentId)
      .slice(0, limit),
  };
}

/** Homepage parent groups with nested categories and subcategories. */
export async function fetchFeaturedHomeCategories(force = false): Promise<{
  categories: HomeCategory[];
  catalog: HomeCategory[];
  error?: string;
}> {
  const result = await fetchCategoryCatalog(force);
  if (result.error) return { ...result, catalog: [] };
  const usable = result.categories.filter(
    (cat) => !EXCLUDED_HOME_CATEGORY_SLUGS.has(cat.slug),
  );
  return {
    categories: buildHomeFeaturedGroups(usable, EXCLUDED_HOME_CATEGORY_SLUGS),
    catalog: uniqueCatalogCategories(usable),
  };
}

export async function fetchSubCategories(
  parentId: string,
  parentName: string,
  force = false,
): Promise<SubCategoryResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { subCategories: [], error: 'Supabase is not configured' };
  }

  const result = await subCategoryMemo.get(
    parentId,
    async () => {
      const client = supabase;
      if (!client) {
        return { subCategories: [], error: 'Supabase is not configured' };
      }
      const { data, error } = await client
        .from('categories')
        .select(CATEGORY_SELECT)
        .eq('parent_id', parentId)
        .eq('status', 'Active')
        .order('items_count', { ascending: false });

      if (error) {
        return { subCategories: [], error: safeUserError(error, 'Could not load this.') };
      }

      const allTab: SubCategory = {
        id: `all:${parentId}`,
        name: 'All',
        slug: 'all',
        icon: '',
        image: '',
        businessCount: 0,
        queryName: parentName,
      };

      const kids = (data ?? []).map((row) => {
        const mapped = mapCategoryRow(row as Record<string, unknown>);
        return {
          ...mapped,
          queryName: mapped.name,
        } satisfies SubCategory;
      });

      return { subCategories: [allTab, ...kids] };
    },
    force,
  );
  if (result.error) subCategoryMemo.delete(parentId);
  return result;
}

async function loadMerchantList(
  categoryQuery: string,
): Promise<MerchantListResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { merchants: [], error: 'Supabase is not configured' };
  }

  const needles = (await resolveBusinessCategoryNeedles(categoryQuery)).slice(
    0,
    16,
  );
  let slotIds: Array<string | null> = [];
  if (
    categoryQuery.trim() &&
    categoryQuery.trim().toLowerCase() !== 'all' &&
    supabase
  ) {
    const asSlug = toCategoryLookupSlug(categoryQuery);
    const { data: slotRow } =
      (await supabase
        .from('categories')
        .select(
          'fixed_slots, position_1_business_id, position_2_business_id, position_3_business_id, position_4_business_id, position_5_business_id',
        )
        .eq('slug', asSlug)
        .maybeSingle()) || {};
    const row =
      slotRow ||
      (
        await supabase
          .from('categories')
          .select(
            'fixed_slots, position_1_business_id, position_2_business_id, position_3_business_id, position_4_business_id, position_5_business_id',
          )
          .eq('name', categoryQuery.trim())
          .maybeSingle()
      ).data;
    slotIds = getCategoryFixedSlotIds(row);
  }

  let query = supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .eq('status', 'Active')
    .order('createdAt', { ascending: false })
    .range(0, 399);

  if (needles.length === 1) {
    query = query.ilike('category', `%${escapeIlikePattern(needles[0])}%`);
  } else if (needles.length > 1) {
    const orFilter = needles
      .map((n) => {
        const escaped = escapeIlikePattern(n).replace(/"/g, '');
        return `category.ilike."%${escaped}%"`;
      })
      .join(',');
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error) {
    return { merchants: [], error: safeUserError(error, 'Could not load this.') };
  }

  return {
    merchants: applyFixedSlotOrder(
      (data ?? [])
        .map((row) => mapMerchantRow(row as Record<string, unknown>))
        .filter(merchantHasPublicPhoto),
      slotIds,
    ),
    slotIds,
  };
}

export async function fetchBusinessesByCategory(
  categoryQuery: string,
  options?: { page?: number; pageSize?: number; force?: boolean },
): Promise<BusinessPage> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(Math.max(options?.pageSize ?? 20, 1), 40);
  const key = merchantListKey(categoryQuery);

  if (!isSupabaseConfigured || !supabase) {
    return paginateMerchants([], page, pageSize, 'Supabase is not configured');
  }

  const result = await merchantListMemo.get(
    key,
    () => loadMerchantList(categoryQuery),
    Boolean(options?.force),
  );
  if (result.error) merchantListMemo.delete(key);

  return paginateMerchants(result.merchants, page, pageSize, result.error);
}

export async function searchCategoriesByQuery(query: string): Promise<{
  categories: HomeCategory[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { categories: [], error: 'Supabase is not configured' };
  }

  const q = query.trim();
  if (!q) return { categories: [] };

  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('status', 'Active')
    .or([...ilikeClauses('name', q), ...ilikeClauses('slug', q)].join(','))
    .limit(40);

  if (error) {
    return { categories: [], error: safeUserError(error, 'Could not load this.') };
  }

  const mapped = (data ?? [])
    .map((row) => mapCategoryRow(row as Record<string, unknown>))
    .filter((cat) => cat.name);
  const required = parseDirectoryQuery(q).required;

  return {
    categories: mapped
      .map((cat) => ({
        cat,
        score: categoryMatchScore(cat.name, cat.slug, required),
      }))
      .filter((row) => row.score >= EXACT_CATEGORY_SCORE)
      .sort(
        (a, b) =>
          b.score - a.score || (b.cat.businessCount || 0) - (a.cat.businessCount || 0),
      )
      .map((row) => row.cat),
  };
}

/** Light cleanup so "best dentists near me" still matches category/business text. */
export function normalizeAiQuery(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(
      /\b(near me|nearby|near by|around me|around here|close by|close to me|closest|nearest|best|top|popular|good|open now|currently open|open today|open late|open|cheap|budget|affordable|in my area|verified|finder.?b verified|with reviews|reviews|highly rated|top rated|best rated|good rating|high rating|well reviewed|emergency|urgent|please|looking for|find me|show me|i need|i want|offers?|discounts?|high discount|deals?|sale|promo|coupon)\b/gi,
      ' ',
    )
    .replace(/\b(in|near|around|at)\s+[A-Za-z][A-Za-z\s.'-]{1,28}/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type AiSearchIntent =
  | 'open-now'
  | 'top-rated'
  | 'verified'
  | 'nearest'
  | 'offers'
  | 'budget';

export type AiSearchOptions = {
  coords?: { lat: number; lng: number } | null;
  city?: string | null;
  forceIntents?: AiSearchIntent[];
};

export function parseAiSearchIntents(raw: string): AiSearchIntent[] {
  return detectSearchIntents(raw);
}

/** Pull "in Indore" / city names from the query for geo-aware ranking. */
export function extractAiPlaceHint(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const patterned = text.match(
    /\b(?:in|near|around|at)\s+([A-Za-z][A-Za-z\s.'-]{1,28}?)(?:\s*$|[,.]|\s+for\b|\s+with\b)/i,
  );
  if (patterned?.[1]) {
    const place = patterned[1].trim().replace(/\s+/g, ' ');
    if (place.length >= 3) return place;
  }

  const lower = text.toLowerCase();
  const cities = Object.keys(INDIA_CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const city of cities) {
    if (city.length < 4) continue;
    if (new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\b`, 'i').test(lower)) {
      return city;
    }
  }
  return null;
}

function merchantHasOfferLabel(merchant: Merchant): boolean {
  return (
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer'
  );
}

function distanceKm(
  merchant: Merchant,
  coords?: { lat: number; lng: number } | null,
): number {
  if (
    !coords ||
    merchant.latitude == null ||
    merchant.longitude == null ||
    (merchant.latitude === 0 && merchant.longitude === 0)
  ) {
    return Number.POSITIVE_INFINITY;
  }
  return getDistanceKm(
    coords.lat,
    coords.lng,
    merchant.latitude,
    merchant.longitude,
  );
}

function effectiveRating(merchant: Merchant): number | null {
  if (merchant.rating != null && merchant.rating > 0) return merchant.rating;
  return null;
}

function applyAiIntents(
  merchants: Merchant[],
  intents: AiSearchIntent[],
  coords?: { lat: number; lng: number } | null,
  terms: string[] = [],
  placeHint: string | null = null,
): Merchant[] {
  let rows = [...merchants];

  if (intents.includes('open-now')) {
    rows = rows.filter(
      (m) => getBusinessOpenStatus(m.timings).status === 'Open',
    );
  }
  if (intents.includes('top-rated')) {
    // Never treat missing ratings as 5★
    rows = rows.filter((m) => {
      const rating = effectiveRating(m);
      return rating != null && rating >= 4.2;
    });
  }
  if (intents.includes('verified')) {
    rows = rows.filter((m) => m.isVerified);
  }
  if (intents.includes('offers')) {
    rows = rows.filter(merchantHasOfferLabel);
  }

  const preferNearest = intents.includes('nearest') && coords;
  const preferRated = intents.includes('top-rated');
  const preferOpen = intents.includes('open-now');
  const preferBudget = intents.includes('budget');

  rows.sort((a, b) => {
    const tierA = merchantMatchTier(a, terms);
    const tierB = merchantMatchTier(b, terms);
    if (tierA !== tierB) return tierA - tierB;

    if (preferOpen) {
      const aOpen = getBusinessOpenStatus(a.timings).status === 'Open' ? 1 : 0;
      const bOpen = getBusinessOpenStatus(b.timings).status === 'Open' ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
    }

    if (preferNearest && coords) {
      const distA = distanceKm(a, coords);
      const distB = distanceKm(b, coords);
      if (distA !== distB) return distA - distB;
    }

    if (preferRated) {
      const ra = effectiveRating(a) ?? 0;
      const rb = effectiveRating(b) ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
    }

    if (preferBudget) {
      const ao = merchantHasOfferLabel(a) ? 1 : 0;
      const bo = merchantHasOfferLabel(b) ? 1 : 0;
      if (bo !== ao) return bo - ao;
    }

    if (coords && !preferNearest) {
      const distA = distanceKm(a, coords);
      const distB = distanceKm(b, coords);
      // Mild distance bias when relevance ties
      if (Number.isFinite(distA) || Number.isFinite(distB)) {
        if (distA !== distB) return distA - distB;
      }
    }

    if (placeHint) {
      const place = placeHint.toLowerCase();
      const aHit = `${a.city || ''} ${a.location || ''}`.toLowerCase().includes(place)
        ? 1
        : 0;
      const bHit = `${b.city || ''} ${b.location || ''}`.toLowerCase().includes(place)
        ? 1
        : 0;
      if (bHit !== aHit) return bHit - aHit;
    }

    if (a.isVerified !== b.isVerified) return Number(b.isVerified) - Number(a.isVerified);
    const ra = effectiveRating(a) ?? 0;
    const rb = effectiveRating(b) ?? 0;
    return rb - ra;
  });

  return rows;
}

export async function searchMerchantsByQuery(
  query: string,
  limit = 24,
  scope: 'identity' | 'mention' = 'identity',
): Promise<{ merchants: Merchant[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { merchants: [], error: 'Supabase is not configured' };
  }

  const q = query.trim();
  if (!q) return { merchants: [] };

  const columns = [
    ...ilikeClauses('businessName', q),
    ...ilikeClauses('displayName', q),
    ...ilikeClauses('category', q),
    ...ilikeClauses('serviceCategory', q),
    ...(scope === 'mention' ? ilikeClauses('about', q) : []),
  ];

  const { data, error } = await supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .eq('status', 'Active')
    .or(columns.join(','))
    .order('createdAt', { ascending: false })
    .limit(Math.min(Math.max(limit * 4, 48), 140));

  if (error) {
    return { merchants: [], error: safeUserError(error, 'Could not load this.') };
  }

  const required = parseDirectoryQuery(normalizeAiQuery(q) || q).required;
  const maxTier = scope === 'mention' ? 3 : 1;
  const ranked = (data ?? [])
    .map((row) => mapMerchantRow(row as Record<string, unknown>))
    .filter((merchant) => {
      const tier = merchantMatchTier(merchant, required);
      if (tier > maxTier) return false;
      // A named business still belongs in search when it has no public photo yet.
      return merchantHasPublicPhoto(merchant) || tier === 1;
    })
    .sort(
      (a, b) => merchantMatchTier(a, required) - merchantMatchTier(b, required),
    );

  return { merchants: ranked.slice(0, limit) };
}

/** Names that start with, contain, or nearly spell what the user typed. */
async function searchNameSuggestions(rawQuery: string): Promise<Merchant[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const tokens = rawQuery
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  if (!tokens.length) return [];

  const patterns = [
    tokens.map((token) => escapeIlikePattern(token)).join('%'),
    tokens
      .map((token) => escapeIlikePattern(token.length >= 5 ? token.slice(0, -1) : token))
      .join('%'),
  ];
  const longest = [...tokens].sort((a, b) => b.length - a.length)[0];
  if (longest.length >= 5) patterns.push(escapeIlikePattern(longest.slice(0, 4)));

  const found = new Map<string, { merchant: Merchant; score: number }>();
  for (const pattern of [...new Set(patterns)]) {
    const needle = `%${pattern}%`;
    const { data, error } = await supabase
      .from('Business')
      .select(MERCHANT_SELECT)
      .eq('status', 'Active')
      .or(`businessName.ilike.${needle},displayName.ilike.${needle}`)
      .limit(40);
    if (error || !data) continue;
    for (const row of data) {
      const merchant = mapMerchantRow(row as Record<string, unknown>);
      const score = Math.max(
        nameSuggestionScore(merchant.name, rawQuery),
        nameSuggestionScore(String((row as { businessName?: string }).businessName || ''), rawQuery),
        nameSuggestionScore(String((row as { displayName?: string }).displayName || ''), rawQuery),
      );
      if (score <= 0) continue;
      const current = found.get(merchant.id);
      if (!current || score > current.score) found.set(merchant.id, { merchant, score });
    }
    if ([...found.values()].some((item) => item.score >= 90)) break;
  }

  return [...found.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.merchant);
}

export async function fetchMerchantsByIds(ids: string[]): Promise<{
  merchants: Merchant[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { merchants: [], error: 'Supabase is not configured' };
  }

  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, 50);
  if (!unique.length) return { merchants: [] };

  const { data, error } = await supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .in('id', unique)
    .eq('status', 'Active');

  if (error) {
    return { merchants: [], error: safeUserError(error, 'Could not load this.') };
  }

  const byId = new Map(
    (data ?? [])
      .map((row) => mapMerchantRow(row as Record<string, unknown>))
      .map((merchant) => [merchant.id, merchant]),
  );

  return {
    merchants: unique
      .map((id) => byId.get(id))
      .filter((row): row is Merchant => Boolean(row)),
  };
}

export type DirectorySearchResult = {
  query: string;
  label: string;
  terms: string[];
  categories: HomeCategory[];
  merchants: Merchant[];
  moreInCategory: Merchant[];
  moreCategoryLabel: string | null;
  exactMatch: boolean;
  notice: string | null;
  error?: string;
};

function usableCategories(categories: HomeCategory[]): HomeCategory[] {
  const byId = new Map<string, HomeCategory>();
  for (const cat of categories) {
    if (EXCLUDED_HOME_CATEGORY_SLUGS.has(cat.slug) || cat.slug === 'job') continue;
    if (!byId.has(cat.id)) byId.set(cat.id, cat);
  }
  return [...byId.values()].sort(
    (a, b) => (b.businessCount || 0) - (a.businessCount || 0),
  );
}

function usableMerchants(merchants: Merchant[]): Merchant[] {
  const byId = new Map<string, Merchant>();
  for (const merchant of merchants) {
    if (!byId.has(merchant.id)) byId.set(merchant.id, merchant);
  }
  return [...byId.values()];
}

function inPlace(merchant: Merchant, placeHint: string): boolean {
  return `${merchant.city || ''} ${merchant.location || ''}`
    .toLowerCase()
    .includes(placeHint.toLowerCase());
}

/** Category + business lookup. Exact categories stay above everything else. */
export async function searchDirectory(
  rawQuery: string,
  options?: { coords?: { lat: number; lng: number } | null; city?: string | null },
): Promise<DirectorySearchResult> {
  const query = rawQuery.trim();
  const label = searchDisplayLabel(query);
  const intents = parseAiSearchIntents(query);
  const placeHint = extractAiPlaceHint(query);
  const normalized = normalizeAiQuery(query) || label;
  const parsed = parseDirectoryQuery(normalized);
  const blank: DirectorySearchResult = {
    query,
    label,
    terms: parsed.required,
    categories: [],
    merchants: [],
    moreInCategory: [],
    moreCategoryLabel: null,
    exactMatch: !query,
    notice: query ? exactMissNotice(label) : null,
  };
  if (!query) return blank;

  const collect = async (needles: string[]) => {
    const [categoryBatches, merchantBatches] = await Promise.all([
      Promise.all(needles.map((needle) => searchCategoriesByQuery(needle))),
      Promise.all(needles.map((needle) => searchMerchantsByQuery(needle, 24, 'identity'))),
    ]);
    return {
      categories: usableCategories(categoryBatches.flatMap((batch) => batch.categories)),
      merchants: usableMerchants(merchantBatches.flatMap((batch) => batch.merchants)),
      error:
        categoryBatches.find((batch) => batch.error)?.error ||
        merchantBatches.find((batch) => batch.error)?.error,
      failed:
        categoryBatches.every((batch) => batch.error) &&
        merchantBatches.every((batch) => batch.error),
    };
  };

  const suggestionPromise = searchNameSuggestions(query);
  const needles = parsed.primaryNeedles.length > 0 ? parsed.primaryNeedles : [normalized];
  // Search the phrase and each word. A word inside a name still counts when
  // another word in the query does not.
  const firstNeedles =
    parsed.phrase.includes(' ')
      ? [...new Set([...needles, ...parsed.required])]
      : needles;
  let found = await collect(firstNeedles);
  if (found.failed) {
    return { ...blank, exactMatch: true, notice: null, error: found.error };
  }

  const suggestions = await suggestionPromise;
  const scored = new Map<string, { merchant: Merchant; score: number }>();
  const remember = (merchant: Merchant, score: number) => {
    if (score <= 0) return;
    const current = scored.get(merchant.id);
    if (!current || score > current.score) scored.set(merchant.id, { merchant, score });
  };
  for (const merchant of found.merchants) {
    remember(merchant, scoreMerchantMatch(merchant, parsed.required));
  }
  for (const merchant of suggestions) {
    remember(
      merchant,
      Math.max(
        scoreMerchantMatch(merchant, parsed.required),
        nameSuggestionScore(merchant.name, query),
      ),
    );
  }

  let exactCategories = found.categories
    .map((category) => ({
      category,
      score: Math.max(
        categoryMatchScore(category.name, category.slug, parsed.required),
        categoryRelevanceScore(category.name, category.slug, parsed.required),
      ),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || (b.category.businessCount || 0) - (a.category.businessCount || 0))
    .map((row) => row.category)
    .slice(0, 8);

  if (exactCategories[0] && scored.size < 12) {
    const extra = await fetchBusinessesByCategory(exactCategories[0].name, {
      page: 1,
      pageSize: 24,
    });
    for (const merchant of extra.merchants) {
      remember(merchant, scoreMerchantMatch(merchant, parsed.required));
    }
  }

  if (scored.size > 0 || exactCategories.length > 0) {
    const ordered = [...scored.values()].sort((a, b) => b.score - a.score).map((row) => row.merchant);
    const ranked = applyAiIntents(
      ordered,
      intents,
      options?.coords ?? null,
      parsed.required,
      placeHint,
    );
    const placed = placeHint ? ranked.filter((merchant) => inPlace(merchant, placeHint)) : ranked;
    const primary = placed.slice(0, 24);
    const queryIsCategory = exactCategories.some((category) =>
      categoryMatchScore(category.name, category.slug, parsed.required) >= EXACT_CATEGORY_SCORE,
    );
    let moreInCategory: Merchant[] = [];
    let moreCategoryLabel: string | null = null;
    const anchor = primary[0];
    if (anchor?.category && !queryIsCategory) {
      const leaf = anchor.category.split('›').pop()?.trim() || anchor.category;
      const extra = await fetchBusinessesByCategory(anchor.category, { page: 1, pageSize: 24 });
      const seen = new Set(primary.map((merchant) => merchant.id));
      moreInCategory = extra.merchants.filter((merchant) => !seen.has(merchant.id)).slice(0, 12);
      if (!moreInCategory.length && leaf !== anchor.category) {
        const byLeaf = await fetchBusinessesByCategory(leaf, { page: 1, pageSize: 24 });
        moreInCategory = byLeaf.merchants.filter((merchant) => !seen.has(merchant.id)).slice(0, 12);
      }
      moreCategoryLabel = moreInCategory.length ? leaf : null;
    }
    const strongest = scored.get(primary[0]?.id || '')?.score ?? 0;
    const everyTermHit = primary.some(
      (merchant) => merchantMatchTier(merchant, parsed.required) <= 1,
    );
    const notice = placeHint && primary.length === 0
      ? `No matches in ${placeHint}.`
      : null;
    return {
      query,
      label,
      terms: parsed.required,
      categories: exactCategories,
      merchants: primary,
      moreInCategory,
      moreCategoryLabel,
      exactMatch: everyTermHit || strongest >= 80,
      notice,
      error: found.error,
    };
  }

  const relatedTerms = relatedSearchTerms(parsed.required);
  const relatedCategories: HomeCategory[] = [];
  const relatedMerchants: Merchant[] = [];
  if (relatedTerms.length > 0) {
    const related = await collect(relatedTerms);
    const seenCats = new Set<string>();
    for (const cat of related.categories) {
      if (seenCats.has(cat.id)) continue;
      seenCats.add(cat.id);
      relatedCategories.push(cat);
    }
    const seenMerchants = new Set<string>();
    for (const merchant of related.merchants) {
      if (seenMerchants.has(merchant.id)) continue;
      const matchesRelated = relatedTerms.some(
        (term) => merchantMatchTier(merchant, [term]) <= 1,
      );
      if (!matchesRelated) continue;
      seenMerchants.add(merchant.id);
      relatedMerchants.push(merchant);
    }
  }

  if (relatedMerchants.length < 8 && parsed.required[0]) {
    const mentions = await searchMerchantsByQuery(parsed.required[0], 8, 'mention');
    const seen = new Set(relatedMerchants.map((merchant) => merchant.id));
    for (const merchant of mentions.merchants) {
      if (seen.has(merchant.id)) continue;
      if (merchantMatchTier(merchant, parsed.required) > 3) continue;
      relatedMerchants.push(merchant);
      seen.add(merchant.id);
    }
  }

  const relatedRanked = applyAiIntents(
    [...suggestions, ...relatedMerchants],
    intents,
    options?.coords ?? null,
    [],
    placeHint,
  );
  const relatedPlaced = placeHint
    ? relatedRanked.filter((merchant) => inPlace(merchant, placeHint))
    : relatedRanked;

  return {
    query,
    label,
    terms: parsed.required,
    categories: relatedCategories.slice(0, 8),
    merchants: relatedPlaced.slice(0, 24),
    moreInCategory: [],
    moreCategoryLabel: null,
    exactMatch: false,
    notice:
      relatedCategories.length > 0 || relatedPlaced.length > 0
        ? null
        : `No exact match for “${label}”.`,
    error: found.error,
  };
}

export type AiSearchResult = {
  query: string;
  normalizedQuery: string;
  intents: AiSearchIntent[];
  categories: HomeCategory[];
  merchants: Merchant[];
  moreInCategory: Merchant[];
  moreCategoryLabel: string | null;
  exactMatch: boolean;
  notice: string | null;
  error?: string;
};

/** Category + business lookup used by the mobile FinderB AI tab. */
export async function runAiSearch(
  rawQuery: string,
  options?: AiSearchOptions,
): Promise<AiSearchResult> {
  const query = rawQuery.trim();
  const placeHint = extractAiPlaceHint(query);
  const normalizedQuery = normalizeAiQuery(query) || query;
  const intents = options?.forceIntents
    ? [...new Set(options.forceIntents)]
    : parseAiSearchIntents(query);

  if (!query) {
    return {
      query,
      normalizedQuery,
      intents,
      categories: [],
      merchants: [],
      moreInCategory: [],
      moreCategoryLabel: null,
      exactMatch: true,
      notice: null,
    };
  }

  const placeCoords = placeHint != null ? lookupCityCoords(placeHint) : null;
  const rankCoords = placeCoords ?? options?.coords ?? null;
  const rankIntents =
    placeCoords && !intents.includes('nearest')
      ? ([...intents, 'nearest'] as AiSearchIntent[])
      : intents;

  const directory = await searchDirectory(query, {
    coords: rankCoords,
    city: placeHint || options?.city || null,
  });

  const merchants = applyAiIntents(
    directory.merchants,
    rankIntents,
    rankCoords,
    directory.exactMatch ? directory.terms : [],
    placeHint || options?.city || null,
  ).slice(0, 36);

  return {
    query,
    normalizedQuery,
    intents,
    categories: directory.categories,
    merchants,
    moreInCategory: directory.moreInCategory,
    moreCategoryLabel: directory.moreCategoryLabel,
    exactMatch: directory.exactMatch,
    notice: directory.notice,
    error: directory.error,
  };
}

export async function fetchMerchantBySlugOrId(
  slugOrId: string,
  options?: { allowUnlisted?: boolean },
): Promise<{
  merchant: Merchant | null;
  error?: string;
}> {
  const client = supabase;
  if (!isSupabaseConfigured || !client) {
    return { merchant: null, error: 'Supabase is not configured' };
  }

  const key = slugOrId.trim();
  if (!key) return { merchant: null, error: 'Missing merchant id' };

  // Pending or paused listings are hidden from public reads; the owner's preview comes from the server.
  if (options?.allowUnlisted) {
    const own = await consoleCall<{ success: true; row: Record<string, unknown> }>('storefront');
    if (!isFailure(own) && own.row && (own.row.id === key || own.row.slug === key)) {
      return { merchant: mapMerchantRow(own.row) };
    }
  }

  const loadRow = async (column: 'slug' | 'id') => {
    const flagged = await client
      .from('Business')
      .select(MERCHANT_SELECT_WITH_FLAGS)
      .eq(column, key)
      .eq('status', 'Active')
      .maybeSingle();
    if (!flagged.error) return flagged.data;
    const message = flagged.error.message || '';
    if (!/emailVerified|mobileVerified|whatsappVerified/i.test(message)) return null;
    const plain = await client
      .from('Business')
      .select(MERCHANT_SELECT)
      .eq(column, key)
      .eq('status', 'Active')
      .maybeSingle();
    return plain.data;
  };

  const bySlug = await loadRow('slug');
  if (bySlug) return { merchant: mapMerchantRow(bySlug as Record<string, unknown>) };

  const byId = await loadRow('id');
  if (byId) return { merchant: mapMerchantRow(byId as Record<string, unknown>) };

  return { merchant: null, error: 'Merchant not found' };
}
