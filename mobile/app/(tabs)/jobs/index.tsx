import { Href, useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_JOB_FILTERS,
  JobFilterSheet,
  JobFilterTrigger,
  type JobFilterState,
} from '../../../components/JobFilterSheet';
import { PullRefreshMark } from '../../../components/PullRefreshMark';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import { getAppliedJobIds } from '../../../lib/jobApplications';
import {
  fetchActiveJobs,
  formatJobPosted,
  formatJobType,
  peekActiveJobs,
  type JobListing,
} from '../../../lib/jobs';
import { backToMore } from '../../../lib/navigation';

function CompanyMark({
  name,
  photo,
}: {
  name: string;
  photo?: string | null;
}) {
  const styles = useStyles();
  return (
    <View style={styles.logoWrap}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.logo} contentFit="cover" />
      ) : (
        <View style={styles.logoFallback}>
          <Text style={styles.logoInitial}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

function MetaBit({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.metaBit}>
      <Ionicons name={icon} size={13} color={colors.textSoft} />
      <Text style={styles.metaBitText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function JobsBoardScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const bottomPad = useTabScrollPadding(24);
  const cachedJobs = peekActiveJobs();
  const [jobs, setJobs] = useState<JobListing[]>(cachedJobs?.jobs ?? []);
  const [loading, setLoading] = useState(!cachedJobs);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(cachedJobs?.error || '');
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_JOB_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(() => new Set());

  const loadApplied = useCallback(async () => {
    const ids = await getAppliedJobIds();
    setAppliedIds(ids);
  }, []);

  const load = useCallback(async (force = false) => {
    const [result] = await Promise.all([fetchActiveJobs(force), loadApplied()]);
    setJobs(result.jobs);
    setError(result.error || '');
    setLoading(false);
  }, [loadApplied]);

  useEffect(() => {
    void load(false);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void loadApplied();
    }, [loadApplied]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const matchesFilters = useCallback(
    (job: JobListing, next: JobFilterState, q: string, loc: string) => {
      const company = job.business?.businessName || '';
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        company.toLowerCase().includes(q) ||
        (job.department || '').toLowerCase().includes(q);
      const place = `${job.location || ''} ${job.business?.city || ''}`.toLowerCase();
      const matchesLocation = !loc || place.includes(loc);
      const matchesType =
        next.type === 'All' ||
        formatJobType(job.type).toLowerCase() === next.type.toLowerCase() ||
        (job.type || '').toLowerCase() === next.type.toLowerCase();
      const isApplied = appliedIds.has(job.id);
      const matchesApplied =
        next.applied === 'all' ||
        (next.applied === 'open' && !isApplied) ||
        (next.applied === 'applied' && isApplied);
      return matchesSearch && matchesLocation && matchesType && matchesApplied;
    },
    [appliedIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = locationQuery.trim().toLowerCase();
    return jobs.filter((job) => matchesFilters(job, filters, q, loc));
  }, [filters, jobs, locationQuery, matchesFilters, query]);

  const matchCountForDraft = useCallback(
    (draft: JobFilterState) => {
      const q = query.trim().toLowerCase();
      const loc = locationQuery.trim().toLowerCase();
      return jobs.filter((job) => matchesFilters(job, draft, q, loc)).length;
    },
    [jobs, locationQuery, matchesFilters, query],
  );

  const openJob = (job: JobListing) => {
    router.push(`/(tabs)/jobs/${job.id}` as Href);
  };

  const clearFilters = () => setFilters(DEFAULT_JOB_FILTERS);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Jobs"
          variant="bar"
          onBack={() => backToMore(router)}
          right={
            <JobFilterTrigger
              filters={filters}
              onOpen={() => setFilterOpen(true)}
              onClear={clearFilters}
            />
          }
        />

        <View style={styles.searchDock}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.textSoft} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search jobs, companies, skills"
              placeholderTextColor={colors.textSoft}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textSoft} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.searchSplit} />
          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={18} color={colors.textSoft} />
            <TextInput
              value={locationQuery}
              onChangeText={setLocationQuery}
              placeholder="Location"
              placeholderTextColor={colors.textSoft}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {locationQuery ? (
              <Pressable onPress={() => setLocationQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textSoft} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.loadingText}>Fetching openings…</Text>
          </View>
        ) : (
          <View style={styles.listHost}>
          <PullRefreshMark active={refreshing} />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />
            }
            contentContainerStyle={[
              styles.list,
              { paddingBottom: bottomPad },
              filtered.length === 0 && styles.listEmpty,
            ]}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="briefcase-outline" size={28} color={colors.textSoft} />
                <Text style={styles.emptyTitle}>No matching jobs</Text>
                <Text style={styles.emptyText}>
                  {error || 'Try another title, city, or filter.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const company = item.business?.businessName || 'Company';
              const place = item.location || item.business?.city || '';
              const posted = formatJobPosted(item.created_at);
              const typeLabel = item.type ? formatJobType(item.type) : '';
              const applied = appliedIds.has(item.id);
              return (
                <Pressable
                  onPress={() => openJob(item)}
                  android_ripple={{ color: colors.muted }}
                  style={({ pressed }) => [
                    styles.row,
                    applied && styles.rowApplied,
                    pressed && styles.pressed,
                  ]}
                >
                  <CompanyMark
                    name={company}
                    photo={item.business?.profilePictureUrl}
                  />
                  <View style={styles.rowCopy}>
                    <View style={styles.rowTop}>
                      <Text style={styles.role} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.applyHint,
                          applied && styles.applyHintDone,
                        ]}
                        numberOfLines={1}
                      >
                        {applied ? 'Already applied' : 'Apply'}
                      </Text>
                    </View>
                    <Text style={styles.company} numberOfLines={1}>
                      {company}
                    </Text>
                    <View style={styles.metaRow}>
                      {place ? (
                        <MetaBit icon="location-outline" label={place} />
                      ) : null}
                      {typeLabel ? (
                        <MetaBit icon="briefcase-outline" label={typeLabel} />
                      ) : null}
                      {item.department ? (
                        <MetaBit icon="layers-outline" label={item.department} />
                      ) : null}
                    </View>
                    {item.salary ? (
                      <Text style={styles.salary} numberOfLines={1}>
                        {item.salary}
                      </Text>
                    ) : null}
                    {posted ? (
                      <Text style={styles.posted}>Posted {posted}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
          />
          </View>
        )}

        <JobFilterSheet
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={filters}
          onApply={setFilters}
          matchCount={matchCountForDraft}
        />
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, paddingTop: 8 },

  searchDock: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchSplit: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 10,
  },

  listHost: { flex: 1 },
  list: {
    paddingTop: 0,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 76,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.canvas,
  },
  rowApplied: {
    backgroundColor: colors.surfaceSoft,
    opacity: 0.55,
  },
  pressed: { backgroundColor: colors.surfaceSoft },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  logo: { width: '100%', height: '100%' },
  logoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  logoInitial: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  role: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: colors.heading,
  },
  applyHint: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.teal,
    maxWidth: 110,
    textAlign: 'right',
  },
  applyHintDone: {
    color: colors.textSoft,
    fontFamily: fonts.medium,
  },
  company: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  metaBit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  metaBitText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 160,
  },
  salary: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.success,
  },
  posted: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
}));
