export const CATEGORY_FIXED_SLOT_MAX = 5;

export type CategoryFixedSlotRow = {
  fixed_slots?: number | null;
  position_1_business_id?: string | null;
  position_2_business_id?: string | null;
  position_3_business_id?: string | null;
  position_4_business_id?: string | null;
  position_5_business_id?: string | null;
};

export function getCategoryFixedSlotIds(
  row: CategoryFixedSlotRow | null | undefined
): Array<string | null> {
  if (!row) return [];
  const configured = Math.min(
    Math.max(Number(row.fixed_slots) || 0, 0),
    CATEGORY_FIXED_SLOT_MAX
  );
  const capacity = configured > 0 ? configured : CATEGORY_FIXED_SLOT_MAX;
  return [
    row.position_1_business_id,
    row.position_2_business_id,
    row.position_3_business_id,
    row.position_4_business_id,
    row.position_5_business_id,
  ]
    .slice(0, capacity)
    .map((id) => {
      const value = typeof id === 'string' ? id.trim() : '';
      return value || null;
    });
}

/** Place pinned merchants at their 1-based slot indexes; remaining listings fill the gaps. */
export function applyFixedSlotOrder<T extends { id: string }>(
  items: T[],
  slotIds: Array<string | null | undefined>
): T[] {
  if (!items.length || !slotIds.some(Boolean)) return items;

  const byId = new Map(items.map((item) => [item.id, item]));
  const pinnedAt = new Map<number, T>();
  const used = new Set<string>();

  slotIds.forEach((id, index) => {
    if (!id) return;
    const item = byId.get(id);
    if (!item || used.has(item.id)) return;
    pinnedAt.set(index, item);
    used.add(item.id);
  });

  if (used.size === 0) return items;

  const rest = items.filter((item) => !used.has(item.id));
  const total = items.length;
  const result: T[] = new Array(total);
  let restIndex = 0;

  for (let i = 0; i < total; i += 1) {
    const pinned = pinnedAt.get(i);
    if (pinned) {
      result[i] = pinned;
      continue;
    }
    result[i] = rest[restIndex];
    restIndex += 1;
  }

  // If a slot index is past the list length, still keep those merchants at the end.
  const overflow: T[] = [];
  pinnedAt.forEach((item, index) => {
    if (index >= total && !result.includes(item)) overflow.push(item);
  });

  return overflow.length ? [...result.filter(Boolean), ...overflow] : result.filter(Boolean);
}

export function shufflePreservingFixedSlots<T extends { id: string }>(
  items: T[],
  slotIds: Array<string | null | undefined>,
  shuffle: (rows: T[]) => T[]
): T[] {
  const pinnedIds = new Set(slotIds.filter((id): id is string => Boolean(id)));
  if (pinnedIds.size === 0) return shuffle(items);

  const indexById = new Map<string, number>();
  items.forEach((item, index) => {
    if (pinnedIds.has(item.id)) indexById.set(item.id, index);
  });

  const rest = items.filter((item) => !indexById.has(item.id));
  const shuffledRest = shuffle(rest);
  const result: Array<T | undefined> = new Array(items.length);
  indexById.forEach((index, id) => {
    const item = items.find((row) => row.id === id);
    if (item) result[index] = item;
  });

  let restIndex = 0;
  for (let i = 0; i < result.length; i += 1) {
    if (!result[i]) {
      result[i] = shuffledRest[restIndex];
      restIndex += 1;
    }
  }

  return result.filter((item): item is T => Boolean(item));
}
