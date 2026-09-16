import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { JobListing } from '../lib/jobs';
import {
  formatJobPosted,
  formatJobType,
  JOB_TYPE_FILTERS,
} from '../lib/jobs';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type JobTypeFilter = (typeof JOB_TYPE_FILTERS)[number];
type JobSortId = 'newest' | 'salary' | 'title';

type JobFilters = {
  query: string;
  location: string;
  type: JobTypeFilter;
  sort: JobSortId;
  withSalary: boolean;
};

const DEFAULT_FILTERS: JobFilters = {
  query: '',
  location: '',
  type: 'All',
  sort: 'newest',
  withSalary: false,
};

const SORT_OPTIONS: Array<{
  id: JobSortId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'newest', label: 'Newest', icon: 'time-outline' },
  { id: 'salary', label: 'Pay listed', icon: 'cash-outline' },
  { id: 'title', label: 'A–Z', icon: 'text-outline' },
];

type Props = {
  jobs: JobListing[];
  loading?: boolean;
  error?: string;
  onSeeAll: () => void;
  onRetry?: () => void;
  onOpenJob: (job: JobListing) => void;
};

function CompanyMark({
  name,
  photo,
  size = 44,
}: {
  name: string;
  photo?: string | null;
  size?: number;
}) {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.logoWrap,
        { width: size, height: size, borderRadius: Math.round(size * 0.27) },
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.logo} contentFit="cover" />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={[styles.logoInitial, size < 42 && { fontSize: 13 }]}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

function snippet(text: string | null | undefined, max = 110): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function MetaFact({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={12} color={colors.textMuted} />
      <Text style={styles.factText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function matchesJobType(job: JobListing, type: JobTypeFilter): boolean {
  if (type === 'All') return true;
  const formatted = formatJobType(job.type).toLowerCase();
  const raw = (job.type || '').toLowerCase();
  const target = type.toLowerCase();
  return formatted === target || raw === target || raw.includes(target);
}

function filterAndSortJobs(jobs: JobListing[], filters: JobFilters): JobListing[] {
  const q = filters.query.trim().toLowerCase();
  const loc = filters.location.trim().toLowerCase();

  let rows = jobs.filter((job) => {
    const company = job.business?.businessName || '';
    const matchesSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      company.toLowerCase().includes(q) ||
      (job.department || '').toLowerCase().includes(q);
    const place = `${job.location || ''} ${job.business?.city || ''}`.toLowerCase();
    const matchesLocation = !loc || place.includes(loc);
    const matchesType = matchesJobType(job, filters.type);
    const matchesSalary = !filters.withSalary || Boolean(job.salary?.trim());
    return matchesSearch && matchesLocation && matchesType && matchesSalary;
  });

  rows = [...rows].sort((a, b) => {
    if (filters.sort === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (filters.sort === 'salary') {
      const aPay = a.salary?.trim() ? 0 : 1;
      const bPay = b.salary?.trim() ? 0 : 1;
      if (aPay !== bPay) return aPay - bPay;
    }
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return rows;
}

function activeFilterCount(filters: JobFilters): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.location.trim()) count += 1;
  if (filters.type !== 'All') count += 1;
  if (filters.sort !== 'newest') count += 1;
  if (filters.withSalary) count += 1;
  return count;
}

/** Homepage jobs — detailed cards + portal-style filters. */
export function HomeJobsShelf({
  jobs,
  loading,
  error,
  onSeeAll,
  onRetry,
  onOpenJob,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<JobFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const citySuggestions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      const city = (job.business?.city || job.location || '').trim();
      if (!city) continue;
      const key = city;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([city]) => city);
  }, [jobs]);

  const filtered = useMemo(
    () => filterAndSortJobs(jobs, filters),
    [filters, jobs],
  );
  const draftMatches = useMemo(
    () => filterAndSortJobs(jobs, draft).length,
    [draft, jobs],
  );

  const featured = filtered[0] || null;
  const rest = filtered.slice(1, 4);
  const filterCount = activeFilterCount(filters);

  const openFilters = () => {
    setDraft(filters);
    setFilterOpen(true);
  };

  const applyDraft = () => {
    setFilters(draft);
    setFilterOpen(false);
  };

  const resetDraft = () => setDraft(DEFAULT_FILTERS);

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
  };

  const setTypeQuick = (type: JobTypeFilter) => {
    setFilters((prev) => ({ ...prev, type }));
  };

  return (
    <View style={styles.shelf}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Text style={styles.title}>FinderB Jobs</Text>
          <Text style={styles.subtitle}>Open roles from local businesses</Text>
        </View>
        <View style={styles.headRight}>
          <Pressable
            onPress={openFilters}
            hitSlop={8}
            style={[styles.filterBtn, filterCount > 0 && styles.filterBtnOn]}
            accessibilityRole="button"
            accessibilityLabel={
              filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'
            }
          >
            <Ionicons
              name="options-outline"
              size={15}
              color={filterCount > 0 ? colors.onDark : colors.ink}
            />
            {filterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            ) : (
              <Text style={styles.filterBtnText}>Filter</Text>
            )}
          </Pressable>
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
            <Text style={styles.seeAllText}>View all</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.brand} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        nestedScrollEnabled
      >
        {JOB_TYPE_FILTERS.map((type) => {
          const on = filters.type === type;
          return (
            <Pressable
              key={type}
              onPress={() => setTypeQuick(type)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {type === 'All' ? 'All roles' : type}
              </Text>
            </Pressable>
          );
        })}
        {filterCount > 0 ? (
          <Pressable onPress={clearAll} style={styles.clearChip}>
            <Ionicons name="close" size={12} color={colors.accentDeep} />
            <Text style={styles.clearChipText}>Clear</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {filters.query.trim() || filters.location.trim() || filters.withSalary ? (
        <View style={styles.activeRow}>
          {filters.query.trim() ? (
            <View style={styles.activePill}>
              <Ionicons name="search" size={11} color={colors.ink} />
              <Text style={styles.activePillText} numberOfLines={1}>
                {filters.query.trim()}
              </Text>
            </View>
          ) : null}
          {filters.location.trim() ? (
            <View style={styles.activePill}>
              <Ionicons name="location-outline" size={11} color={colors.ink} />
              <Text style={styles.activePillText} numberOfLines={1}>
                {filters.location.trim()}
              </Text>
            </View>
          ) : null}
          {filters.withSalary ? (
            <View style={styles.activePill}>
              <Ionicons name="cash-outline" size={11} color={colors.ink} />
              <Text style={styles.activePillText}>Pay listed</Text>
            </View>
          ) : null}
          <Text style={styles.matchHint}>
            {filtered.length} match{filtered.length === 1 ? '' : 'es'}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.stateText}>Loading openings…</Text>
        </View>
      ) : !featured ? (
        <View style={styles.stateBox}>
          <Ionicons name="briefcase-outline" size={20} color={colors.textSoft} />
          <Text style={styles.stateTitle}>
            {jobs.length === 0 ? 'No openings yet' : 'No matching jobs'}
          </Text>
          <Text style={styles.stateText}>
            {jobs.length === 0
              ? error || 'Businesses will post roles here soon.'
              : 'Try another type, city, or clear filters.'}
          </Text>
          {jobs.length === 0 && onRetry ? (
            <Pressable style={styles.retryBtn} onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : filterCount > 0 ? (
            <Pressable style={styles.retryBtn} onPress={clearAll}>
              <Text style={styles.retryText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.body}>
          <Pressable
            onPress={() => onOpenJob(featured)}
            style={({ pressed }) => [
              styles.featured,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={featured.title}
          >
            <View style={styles.featuredAccent} />
            <View style={styles.featuredInner}>
              <View style={styles.featuredTop}>
                <CompanyMark
                  name={featured.business?.businessName || 'Company'}
                  photo={featured.business?.profilePictureUrl}
                  size={48}
                />
                <View style={styles.featuredTopCopy}>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {featured.business?.businessName || 'Company'}
                  </Text>
                  <Text style={styles.postedLine}>
                    {formatJobPosted(featured.created_at)
                      ? `Posted ${formatJobPosted(featured.created_at)}`
                      : 'Open role'}
                  </Text>
                </View>
              </View>

              <Text style={styles.featuredRole} numberOfLines={2}>
                {featured.title}
              </Text>

              {snippet(featured.description, 130) ? (
                <Text style={styles.excerpt} numberOfLines={2}>
                  {snippet(featured.description, 130)}
                </Text>
              ) : null}

              <View style={styles.factRow}>
                {featured.type ? (
                  <MetaFact
                    icon="briefcase-outline"
                    label={formatJobType(featured.type)}
                  />
                ) : null}
                {featured.location || featured.business?.city ? (
                  <MetaFact
                    icon="location-outline"
                    label={featured.location || featured.business?.city || ''}
                  />
                ) : null}
                {featured.department ? (
                  <MetaFact icon="layers-outline" label={featured.department} />
                ) : null}
              </View>

              <View style={styles.featuredFooter}>
                <View style={styles.payBlock}>
                  <Text style={styles.payLabel}>Compensation</Text>
                  <Text style={styles.payValue} numberOfLines={1}>
                    {featured.salary || 'Discussed on apply'}
                  </Text>
                </View>
                <View style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View role</Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.onDark} />
                </View>
              </View>
            </View>
          </Pressable>

          {rest.map((job) => {
            const company = job.business?.businessName || 'Company';
            const place = job.location || job.business?.city || '';
            const posted = formatJobPosted(job.created_at);
            const blurb = snippet(job.description, 90);
            return (
              <Pressable
                key={job.id}
                onPress={() => onOpenJob(job)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={job.title}
              >
                <View style={styles.cardTop}>
                  <CompanyMark
                    name={company}
                    photo={job.business?.profilePictureUrl}
                    size={42}
                  />
                  <View style={styles.cardTopCopy}>
                    <Text style={styles.cardRole} numberOfLines={2}>
                      {job.title}
                    </Text>
                    <Text style={styles.cardCompany} numberOfLines={1}>
                      {company}
                      {posted ? ` · ${posted}` : ''}
                    </Text>
                  </View>
                </View>

                {blurb ? (
                  <Text style={styles.cardExcerpt} numberOfLines={2}>
                    {blurb}
                  </Text>
                ) : null}

                <View style={styles.factRow}>
                  {job.type ? (
                    <MetaFact
                      icon="briefcase-outline"
                      label={formatJobType(job.type)}
                    />
                  ) : null}
                  {place ? (
                    <MetaFact icon="location-outline" label={place} />
                  ) : null}
                  {job.department ? (
                    <MetaFact icon="layers-outline" label={job.department} />
                  ) : null}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardPay} numberOfLines={1}>
                    {job.salary || 'Pay on apply'}
                  </Text>
                  <View style={styles.cardCta}>
                    <Text style={styles.cardCtaText}>Details</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.brand}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={onSeeAll}
            style={({ pressed }) => [styles.allBtn, pressed && styles.pressed]}
          >
            <Text style={styles.allBtnText}>
              Browse all jobs
              {filtered.length > 4 ? ` · ${filtered.length} matches` : ''}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.brand} />
          </Pressable>
        </View>
      )}

      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={styles.sheetScrim}
            onPress={() => setFilterOpen(false)}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(16, insets.bottom + 12) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filter jobs</Text>
                <Text style={styles.sheetSub}>
                  Search, city, type, and sort — like a job board
                </Text>
              </View>
              <Pressable onPress={() => setFilterOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetBody}
            >
              <Text style={styles.sheetLabel}>Keyword</Text>
              <View style={styles.field}>
                <Ionicons name="search" size={16} color={colors.textSoft} />
                <TextInput
                  value={draft.query}
                  onChangeText={(query) =>
                    setDraft((prev) => ({ ...prev, query }))
                  }
                  placeholder="Title, company, or department"
                  placeholderTextColor={colors.textSoft}
                  style={styles.fieldInput}
                  returnKeyType="search"
                />
                {draft.query ? (
                  <Pressable
                    onPress={() => setDraft((prev) => ({ ...prev, query: '' }))}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSoft} />
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.sheetLabel}>Location</Text>
              <View style={styles.field}>
                <Ionicons name="location-outline" size={16} color={colors.textSoft} />
                <TextInput
                  value={draft.location}
                  onChangeText={(location) =>
                    setDraft((prev) => ({ ...prev, location }))
                  }
                  placeholder="City or area"
                  placeholderTextColor={colors.textSoft}
                  style={styles.fieldInput}
                  returnKeyType="search"
                />
              </View>

              {citySuggestions.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cityRow}
                >
                  {citySuggestions.map((city) => {
                    const on =
                      draft.location.trim().toLowerCase() ===
                      city.toLowerCase();
                    return (
                      <Pressable
                        key={city}
                        onPress={() =>
                          setDraft((prev) => ({
                            ...prev,
                            location: on ? '' : city,
                          }))
                        }
                        style={[styles.cityChip, on && styles.cityChipOn]}
                      >
                        <Text
                          style={[
                            styles.cityChipText,
                            on && styles.cityChipTextOn,
                          ]}
                        >
                          {city}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              <Text style={[styles.sheetLabel, styles.sheetLabelSpaced]}>
                Job type
              </Text>
              <View style={styles.typeGrid}>
                {JOB_TYPE_FILTERS.map((type) => {
                  const on = draft.type === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setDraft((prev) => ({ ...prev, type }))}
                      style={[styles.typeCard, on && styles.typeCardOn]}
                    >
                      <Text
                        style={[styles.typeCardText, on && styles.typeCardTextOn]}
                      >
                        {type === 'All' ? 'All roles' : type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sheetLabel, styles.sheetLabelSpaced]}>
                Sort by
              </Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map((option) => {
                  const on = draft.sort === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() =>
                        setDraft((prev) => ({ ...prev, sort: option.id }))
                      }
                      style={[styles.sortCard, on && styles.sortCardOn]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={15}
                        color={on ? colors.onDark : colors.ink}
                      />
                      <Text
                        style={[styles.sortCardText, on && styles.sortCardTextOn]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    withSalary: !prev.withSalary,
                  }))
                }
                style={[
                  styles.toggleCard,
                  draft.withSalary && styles.toggleCardOn,
                ]}
              >
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Only roles with pay listed</Text>
                  <Text style={styles.toggleSub}>
                    Hide openings that say pay on apply
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggleCheck,
                    draft.withSalary && styles.toggleCheckOn,
                  ]}
                >
                  {draft.withSalary ? (
                    <Ionicons name="checkmark" size={14} color={colors.onDark} />
                  ) : null}
                </View>
              </Pressable>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable style={styles.resetBtn} onPress={resetDraft}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={applyDraft}>
                <Text style={styles.applyText}>
                  Show {draftMatches} result{draftMatches === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  shelf: {
    marginBottom: 10,
    paddingTop: 8,
    backgroundColor: colors.canvas,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  headLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.35,
    color: colors.heading,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  filterBtnOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: colors.secondary,
  },
  filterBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.accentDeep,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.brand,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  chipTextOn: { color: colors.onDark },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  clearChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.accentDeep,
  },
  activeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.brandSoft,
  },
  activePillText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.ink,
  },
  matchHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  body: {
    paddingHorizontal: 16,
    gap: 10,
  },
  featured: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  featuredAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.secondary,
  },
  featuredInner: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 16,
    gap: 10,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logoWrap: {
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  logo: { width: '100%', height: '100%' },
  logoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  logoInitial: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand,
  },
  featuredTopCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  companyName: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  postedLine: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  featuredRole: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.25,
    color: colors.heading,
  },
  excerpt: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  factRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  factText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  payBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  payLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSoft,
  },
  payValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.accentDeep,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  viewBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.onDark,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 13,
    gap: 9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  cardTopCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardRole: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.heading,
  },
  cardCompany: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  cardExcerpt: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cardPay: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.accentDeep,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardCtaText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.brand,
  },
  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  allBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand,
  },
  pressed: { opacity: 0.94 },
  stateBox: {
    marginHorizontal: 16,
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    gap: 6,
  },
  stateTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  stateText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  retryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.onDark,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.canvas,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.heading,
  },
  sheetSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 260,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  sheetLabel: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  sheetLabelSpaced: {
    marginTop: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
  },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 10,
  },
  cityRow: {
    gap: 8,
    paddingVertical: 2,
  },
  cityChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cityChipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  cityChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  cityChipTextOn: { color: colors.onDark },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  typeCardOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  typeCardText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  typeCardTextOn: { color: colors.onDark },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  sortCardOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  sortCardText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.ink,
  },
  sortCardTextOn: { color: colors.onDark },
  toggleCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  toggleCardOn: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  toggleSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  toggleCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  toggleCheckOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.brand,
  },
  applyText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
}));
