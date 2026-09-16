import { categories as fallbackCategories } from '../constants/categories';
import {
  clearApiSessionCaches,
  fetchAllCategories,
  fetchBusinessesByCategory,
  fetchFeaturedHomeCategories,
  peekBusinessesByCategory,
  subscribeCategoryCatalog,
  type HomeCategory,
} from './api';
import { fetchActiveJobs } from './jobs';

export type HomeBootstrapData = {
  categories: HomeCategory[];
};

let cache: HomeBootstrapData | null = null;
let inflight: Promise<HomeBootstrapData> | null = null;
let warmupInflight: Promise<HomeBootstrapData> | null = null;
/** Parent ids from the last shuffled home load — kept across catalog refreshes. */
let parentOrderIds: string[] | null = null;

function shuffleParents<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function orderParents(categories: HomeCategory[], reshuffle: boolean): HomeCategory[] {
  if (reshuffle || !parentOrderIds?.length) {
    const shuffled = shuffleParents(categories);
    parentOrderIds = shuffled.map((cat) => cat.id);
    return shuffled;
  }

  const byId = new Map(categories.map((cat) => [cat.id, cat]));
  const ordered: HomeCategory[] = [];
  for (const id of parentOrderIds) {
    const hit = byId.get(id);
    if (!hit) continue;
    ordered.push(hit);
    byId.delete(id);
  }
  const extras = shuffleParents([...byId.values()]);
  const next = [...ordered, ...extras];
  parentOrderIds = next.map((cat) => cat.id);
  return next;
}

subscribeCategoryCatalog(() => {
  cache = null;
});

function fallbackCats(): HomeCategory[] {
  return fallbackCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: '',
    image: '',
    businessCount: 1,
  }));
}

export function getHomeBootstrapCache(): HomeBootstrapData | null {
  return cache;
}

export function clearHomeBootstrapCache() {
  cache = null;
}

/** Drop every in-memory listing so the next fetch hits the database. */
export function clearHomeSessionCaches() {
  cache = null;
  inflight = null;
  warmupInflight = null;
  parentOrderIds = null;
  clearApiSessionCaches();
}

export async function loadHomeBootstrap(force = false): Promise<HomeBootstrapData> {
  if (!force && cache) return cache;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    const categoryResult = await fetchFeaturedHomeCategories(force);
    const categories =
      categoryResult.categories.length > 0
        ? categoryResult.categories
        : fallbackCats();

    const data: HomeBootstrapData = {
      categories: orderParents(categories, force),
    };
    cache = data;
    return data;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

function listingQueryOf(category: HomeCategory) {
  return (category.queryName || category.name).trim();
}

function groupHasAllMerchants(group: HomeCategory): boolean | null {
  const page = peekBusinessesByCategory(listingQueryOf(group), {
    page: 1,
    pageSize: 24,
  });
  if (!page) return null;
  return page.merchants.length > 0;
}

function dropEmptyAllGroups(categories: HomeCategory[]): HomeCategory[] {
  const kept = categories.filter((group) => groupHasAllMerchants(group) !== false);
  return kept;
}

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item === undefined) return;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

/** Prefetch every parent shelf (All tab) so home does not fetch on scroll. */
async function warmupHomeShelves(categories: HomeCategory[]) {
  const queries = [
    ...new Set(categories.map(listingQueryOf).filter(Boolean)),
  ];
  await mapPool(queries, 3, async (query) => {
    await fetchBusinessesByCategory(query, { page: 1, pageSize: 24 }).catch(
      () => undefined,
    );
  });
}

/** Categories + all home merchant shelves — run under the splash. */
export async function warmupHomeSession(): Promise<HomeBootstrapData> {
  if (warmupInflight) return warmupInflight;

  warmupInflight = (async () => {
    const data = await loadHomeBootstrap(false);
    await warmupHomeShelves(data.categories);
    const kept = dropEmptyAllGroups(data.categories);
    parentOrderIds = kept.map((cat) => cat.id);
    const next = { categories: kept };
    cache = next;
    return next;
  })();

  try {
    return await warmupInflight;
  } finally {
    warmupInflight = null;
  }
}

/** After home is on screen: other tabs, without blocking UI. */
export function prefetchAppBackground() {
  void fetchAllCategories();
  void fetchActiveJobs();
}
