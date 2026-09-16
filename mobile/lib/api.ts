import { SITE_URL, isSupabaseConfigured, supabase } from './supabase';
import { getBusinessOpenStatus } from './businessHours';
import { lookupCityCoords, INDIA_CITY_COORDS } from './cityCoords';
import { getDistanceKm } from './geo';
import { mapMerchantRow, merchantHasPublicPhoto, rankMerchants, type Merchant } from './merchants';
import { applyFixedSlotOrder, getCategoryFixedSlotIds } from './categoryFixedSlots';
import { inferCategoryLevel } from './categoryTree';
import { buildHomeFeaturedGroups } from './featuredCategoryGroups';
import { createSessionMemo } from './sessionMemo';

/** Job listings have a dedicated home shelf; other parents match the website. */
const EXCLUDED_HOME_CATEGORY_SLUGS = new Set(['job']);

const MERCHANT_SELECT =
  'id, slug, businessName, displayName, category, location, city, state, about, profilePictureUrl, images, publicPhone, mobile, email, workEmail, website, whatsappNumber, instagramUrl, facebookUrl, youtubeUrl, review, isFinderBVerified, hasVerifiedBadge, discountRange, status, latitude, longitude, timings, serviceCategory, keywords, paymentModes, businessAddress, yearsInBusiness';

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
      error: 'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_* to mobile/.env',
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
    return { merchants: [], error: verified.error.message };
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
      return { rows: [], error: error.message };
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

function paginateMerchants(
  list: Merchant[],
  page: number,
  pageSize: number,
  error?: string,
): BusinessPage {
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
  error?: string;
}> {
  const result = await fetchCategoryCatalog(force);
  if (result.error) return result;
  return {
    categories: buildHomeFeaturedGroups(
      result.categories,
      EXCLUDED_HOME_CATEGORY_SLUGS,
    ),
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

  return subCategoryMemo.get(
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
        return { subCategories: [], error: error.message };
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
    return { merchants: [], error: error.message };
  }

  return {
    merchants: applyFixedSlotOrder(
      (data ?? [])
        .map((row) => mapMerchantRow(row as Record<string, unknown>))
        .filter(merchantHasPublicPhoto),
      slotIds,
    ),
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

  const escaped = escapeIlikePattern(q);
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('status', 'Active')
    .or(`name.ilike.%${escaped}%,slug.ilike.%${escaped}%`)
    .limit(40);

  if (error) {
    return { categories: [], error: error.message };
  }

  const mapped = (data ?? [])
    .map((row) => mapCategoryRow(row as Record<string, unknown>))
    .filter((cat) => cat.name);

  return {
    categories: mapped.filter((cat) => inferCategoryLevel(cat, mapped) !== 0),
  };
}

/** Light cleanup so "best dentists near me" still matches category/business text. */
export function normalizeAiQuery(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(
      /\b(near me|nearby|around me|closest|nearest|best|top|good|open now|currently open|cheap|budget|affordable|in my area|verified|finder.?b verified|with reviews|highly rated|top rated|emergency|urgent|please|looking for|find me|show me|i need|i want)\b/gi,
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

const AI_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'some',
  'any',
  'near',
  'area',
  'shop',
  'store',
  'place',
  'places',
  'local',
  'india',
]);

const AI_SYNONYMS: Array<{ match: RegExp; needles: string[] }> = [
  {
    match: /\b(dentist|dental|tooth|teeth|orthodont)/i,
    needles: ['dentist', 'dental', 'orthodontist'],
  },
  {
    match: /\b(restaurant|cafe|café|food|dining|dosa|bakery|eatery|dhaba|biryani)\b/i,
    needles: ['restaurant', 'cafe', 'bakery', 'food'],
  },
  {
    match: /\b(salon|parlour|parlor|hair|beauty|spa|makeup|mehndi)\b/i,
    needles: ['salon', 'beauty', 'spa'],
  },
  {
    match: /\b(plumber|plumbing|pipe|leak|tap|drain)\b/i,
    needles: ['plumber', 'plumbing'],
  },
  {
    match: /\b(gym|fitness|workout|yoga|crossfit)\b/i,
    needles: ['gym', 'fitness', 'yoga'],
  },
  {
    match: /\b(ca|chartered accountant|accountant|tax|gst|auditor)\b/i,
    needles: ['accountant', 'CA', 'tax'],
  },
  {
    match: /\b(doctor|clinic|hospital|physician|medico|mbbs|specialist)\b/i,
    needles: ['doctor', 'clinic', 'hospital'],
  },
  {
    match: /\b(electrician|electric|wiring|inverter)\b/i,
    needles: ['electrician', 'electric'],
  },
  {
    match: /\b(lawyer|advocate|attorney|legal)\b/i,
    needles: ['lawyer', 'advocate', 'legal'],
  },
  {
    match: /\b(pg|hostel|paying guest|co-?living)\b/i,
    needles: ['PG', 'hostel'],
  },
  {
    match: /\b(hotel|stay|lodging|resort|guest house)\b/i,
    needles: ['hotel', 'resort'],
  },
  {
    match: /\b(pharmacy|chemist|medical store|medicine)\b/i,
    needles: ['pharmacy', 'chemist'],
  },
  {
    match: /\b(car|auto|garage|mechanic|puncture|tyre|tire)\b/i,
    needles: ['mechanic', 'garage', 'auto'],
  },
  {
    match: /\b(tuition|coaching|classes|tutor|academy)\b/i,
    needles: ['tuition', 'coaching', 'tutor'],
  },
  {
    match: /\b(electronics|mobile|laptop|repair|service centre|service center)\b/i,
    needles: ['electronics', 'mobile', 'repair'],
  },
  {
    match: /\b(sweet|mithai|namkeen)\b/i,
    needles: ['sweet', 'mithai', 'bakery'],
  },
];

export function parseAiSearchIntents(raw: string): AiSearchIntent[] {
  const text = raw.toLowerCase();
  const intents: AiSearchIntent[] = [];
  if (/\b(open now|currently open|open late|24\s*hours?|emergency|urgent)\b/.test(text)) {
    intents.push('open-now');
  }
  if (/\b(best|top|good reviews?|highly rated|top rated|rating|rated)\b/.test(text)) {
    intents.push('top-rated');
  }
  if (/\b(verified|trusted|finder.?b verified)\b/.test(text)) {
    intents.push('verified');
  }
  if (/\b(near me|nearby|around me|closest|nearest|in my area)\b/.test(text)) {
    intents.push('nearest');
  }
  if (/\b(offer|offers|discount|deal|deals|sale)\b/.test(text)) {
    intents.push('offers');
  }
  if (/\b(cheap|budget|affordable|low cost|inexpensive)\b/.test(text)) {
    intents.push('budget');
  }
  return intents;
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

function expandAiNeedles(normalized: string): string[] {
  const base = normalized.trim();
  if (!base) return [];
  const needles = new Set<string>([base]);

  const words = base
    .split(/[\s,/|]+/)
    .map((w) => w.trim())
    .filter(
      (w) =>
        w.length > 2 &&
        !AI_STOPWORDS.has(w.toLowerCase()) &&
        !/^\d+$/.test(w),
    );

  // Prefer bigrams before single noisy tokens
  for (let i = 0; i < words.length - 1; i++) {
    needles.add(`${words[i]} ${words[i + 1]}`);
  }
  for (const word of words) needles.add(word);

  for (const rule of AI_SYNONYMS) {
    if (rule.match.test(base)) {
      for (const n of rule.needles) needles.add(n);
    }
  }

  // Keep phrase first, then unique expansions
  const ordered = [...needles].sort((a, b) => {
    if (a === base) return -1;
    if (b === base) return 1;
    return b.length - a.length;
  });
  return ordered.slice(0, 8);
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

/** How well a merchant matches the user's actual words — drives accuracy. */
function aiRelevanceScore(
  merchant: Merchant,
  needles: string[],
  normalizedQuery: string,
  placeHint: string | null,
): number {
  const q = normalizedQuery.toLowerCase().trim();
  const name = merchant.name.toLowerCase();
  const category = (merchant.category || '').toLowerCase();
  const services = (merchant.services || []).join(' ').toLowerCase();
  const keywords = (merchant.keywords || []).join(' ').toLowerCase();
  const about = (merchant.about || '').toLowerCase();
  const city = `${merchant.city || ''} ${merchant.location || ''} ${merchant.businessAddress || ''}`.toLowerCase();
  const haystack = `${name} ${category} ${services} ${keywords} ${about}`;

  let score = 0;

  if (q) {
    if (name === q) score += 120;
    else if (name.startsWith(q)) score += 90;
    else if (name.includes(q)) score += 70;
    if (category === q) score += 55;
    else if (category.includes(q)) score += 40;
    if (keywords.includes(q)) score += 45;
    if (services.includes(q)) score += 35;
  }

  for (const needle of needles) {
    const n = needle.toLowerCase().trim();
    if (!n || n === q) continue;
    if (name.includes(n)) score += n.includes(' ') ? 38 : 28;
    if (category.includes(n)) score += 32;
    if (keywords.split(/\s+/).some((k) => k === n) || keywords.includes(n)) {
      score += 30;
    }
    if (services.includes(n)) score += 22;
    if (about.includes(n)) score += 6;
  }

  // Token coverage — reward merchants that hit more query words
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length > 1) {
    const hits = tokens.filter((t) => haystack.includes(t)).length;
    score += hits * 12;
  }

  if (placeHint) {
    const place = placeHint.toLowerCase();
    if (city.includes(place)) score += 50;
  }

  if (merchant.isVerified) score += 8;
  const rating = effectiveRating(merchant);
  if (rating != null) {
    score += rating * 2;
    score += Math.min(merchant.reviewsCount || 0, 40) * 0.15;
  }

  return score;
}

function applyAiIntents(
  merchants: Merchant[],
  intents: AiSearchIntent[],
  coords?: { lat: number; lng: number } | null,
  needles: string[] = [],
  normalizedQuery = '',
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
    const relA = aiRelevanceScore(a, needles, normalizedQuery, placeHint);
    const relB = aiRelevanceScore(b, needles, normalizedQuery, placeHint);
    if (relB !== relA) return relB - relA;

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
): Promise<{ merchants: Merchant[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { merchants: [], error: 'Supabase is not configured' };
  }

  const q = query.trim();
  if (!q) return { merchants: [] };

  const escaped = escapeIlikePattern(q);
  const { data, error } = await supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .eq('status', 'Active')
    .or(
      [
        `businessName.ilike.%${escaped}%`,
        `displayName.ilike.%${escaped}%`,
        `category.ilike.%${escaped}%`,
        `location.ilike.%${escaped}%`,
        `city.ilike.%${escaped}%`,
        `about.ilike.%${escaped}%`,
        `serviceCategory.ilike.%${escaped}%`,
        `businessAddress.ilike.%${escaped}%`,
      ].join(','),
    )
    .order('createdAt', { ascending: false })
    .limit(Math.min(Math.max(limit * 4, 48), 140));

  if (error) {
    return { merchants: [], error: error.message };
  }

  const ranked = rankMerchants(
    (data ?? [])
      .map((row) => mapMerchantRow(row as Record<string, unknown>))
      .filter(merchantHasPublicPhoto),
  );

  return { merchants: ranked.slice(0, limit) };
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
    return { merchants: [], error: error.message };
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

export type AiSearchResult = {
  query: string;
  normalizedQuery: string;
  intents: AiSearchIntent[];
  categories: HomeCategory[];
  merchants: Merchant[];
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
  const intents = [
    ...new Set([
      ...parseAiSearchIntents(query),
      ...(options?.forceIntents ?? []),
    ]),
  ];

  if (!query) {
    return {
      query,
      normalizedQuery,
      intents,
      categories: [],
      merchants: [],
    };
  }

  const needles = expandAiNeedles(normalizedQuery);
  const searchNeedles =
    needles.length > 0 ? needles : [normalizedQuery || query];

  // Prefer phrase + synonym needles for DB; skip tiny fragments first
  const dbNeedles = searchNeedles.filter(
    (n, i) => i === 0 || n.length >= 3,
  ).slice(0, 6);

  const [categoryBatches, merchantBatches] = await Promise.all([
    Promise.all(dbNeedles.map((n) => searchCategoriesByQuery(n))),
    Promise.all(dbNeedles.map((n) => searchMerchantsByQuery(n, 20))),
  ]);

  const categoryError = categoryBatches.find((b) => b.error)?.error;
  const merchantError = merchantBatches.find((b) => b.error)?.error;

  if (
    categoryBatches.every((b) => b.error) &&
    merchantBatches.every((b) => b.error)
  ) {
    return {
      query,
      normalizedQuery,
      intents,
      categories: [],
      merchants: [],
      error: categoryError || merchantError,
    };
  }

  const categoryById = new Map<string, HomeCategory>();
  for (const batch of categoryBatches) {
    for (const cat of batch.categories) {
      if (!categoryById.has(cat.id)) categoryById.set(cat.id, cat);
    }
  }

  const categories = [...categoryById.values()]
    .filter((cat) => !EXCLUDED_HOME_CATEGORY_SLUGS.has(cat.slug) && cat.slug !== 'job')
    .sort((a, b) => (b.businessCount || 0) - (a.businessCount || 0))
    .slice(0, 8);

  const byId = new Map<string, Merchant>();
  for (const batch of merchantBatches) {
    for (const merchant of batch.merchants) {
      if (!byId.has(merchant.id)) byId.set(merchant.id, merchant);
    }
  }

  // Pull live listings from the best category match when direct hits are thin.
  if (categories[0] && byId.size < 12) {
    const byCategory = await fetchBusinessesByCategory(categories[0].name, {
      page: 1,
      pageSize: 20,
    });
    for (const merchant of byCategory.merchants) {
      if (!byId.has(merchant.id)) byId.set(merchant.id, merchant);
    }
  }

  // Resolve place from query ("dentists in Indore") for ranking / nearest.
  const placeCoords =
    placeHint != null ? lookupCityCoords(placeHint) : null;
  const rankCoords = placeCoords ?? options?.coords ?? null;
  const cityBoost = (placeHint || options?.city || '').trim().toLowerCase();

  let merchants = [...byId.values()];
  if (cityBoost) {
    merchants.sort((a, b) => {
      const aHit = `${a.city || ''} ${a.location || ''}`
        .toLowerCase()
        .includes(cityBoost)
        ? 1
        : 0;
      const bHit = `${b.city || ''} ${b.location || ''}`
        .toLowerCase()
        .includes(cityBoost)
        ? 1
        : 0;
      return bHit - aHit;
    });
  }

  // If user named a city, treat as nearest-to-that-city when no explicit nearest
  const rankIntents =
    placeCoords && !intents.includes('nearest')
      ? ([...intents, 'nearest'] as AiSearchIntent[])
      : intents;

  merchants = applyAiIntents(
    merchants,
    rankIntents,
    rankCoords,
    searchNeedles,
    normalizedQuery,
    placeHint || options?.city || null,
  ).slice(0, 36);

  return {
    query,
    normalizedQuery,
    intents,
    categories,
    merchants,
    error: categoryError || merchantError,
  };
}

export async function fetchMerchantBySlugOrId(slugOrId: string): Promise<{
  merchant: Merchant | null;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { merchant: null, error: 'Supabase is not configured' };
  }

  const key = slugOrId.trim();
  if (!key) return { merchant: null, error: 'Missing merchant id' };

  const bySlug = await supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .eq('slug', key)
    .eq('status', 'Active')
    .maybeSingle();

  if (bySlug.data) {
    return { merchant: mapMerchantRow(bySlug.data as Record<string, unknown>) };
  }

  const byId = await supabase
    .from('Business')
    .select(MERCHANT_SELECT)
    .eq('id', key)
    .eq('status', 'Active')
    .maybeSingle();

  if (byId.data) {
    return { merchant: mapMerchantRow(byId.data as Record<string, unknown>) };
  }

  return {
    merchant: null,
    error: bySlug.error?.message || byId.error?.message || 'Merchant not found',
  };
}
