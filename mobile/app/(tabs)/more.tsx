import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { fonts } from '../../constants/typography';
import { useAppLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { fetchBlogs, type BlogPost } from '../../lib/blogs';
import {
  fetchActiveJobs,
  formatJobPosted,
  formatJobType,
  peekActiveJobs,
  type JobListing,
} from '../../lib/jobs';
import { fetchHomeNews, type NewsArticle } from '../../lib/news';
import { openNewsArticle } from '../../lib/openNewsArticle';
import { TabSwipeHost } from '../../lib/tabSwipe';
import {
  fetchTouristPlaces,
  resolveTouristPlaceSlug,
  type TouristPlace,
} from '../../lib/touristPlaces';

type SectionTone = {
  accent: string;
  soft: string;
};

const TONES: Record<string, SectionTone> = {
  jobs: { accent: '#0F766E', soft: 'rgba(15,118,110,0.12)' },
  tourist: { accent: '#C2410C', soft: 'rgba(194,65,12,0.12)' },
  news: { accent: '#1D4ED8', soft: 'rgba(29,78,216,0.12)' },
  blogs: { accent: '#B45309', soft: 'rgba(180,83,9,0.12)' },
};

export default function MoreScreen() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const location = useAppLocation();
  const pad = useTabScrollPadding(28);

  const cachedJobs = peekActiveJobs();
  const [jobs, setJobs] = useState<JobListing[]>(cachedJobs?.jobs ?? []);
  const [jobsLoading, setJobsLoading] = useState(!cachedJobs);
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  const load = useCallback(async () => {
    const locationCtx = {
      city: location.city,
      state: location.region,
      coords: location.coords,
    };
    const [jobsRes, placesRes, newsRes, blogsRes] = await Promise.all([
      fetchActiveJobs(),
      fetchTouristPlaces(8, locationCtx),
      fetchHomeNews({ limit: 8 }),
      fetchBlogs(8),
    ]);
    setJobs(jobsRes.jobs.slice(0, 8));
    setJobsLoading(false);
    setPlaces((placesRes.places || []).slice(0, 8));
    setPlacesLoading(false);
    setArticles((newsRes.articles || []).slice(0, 8));
    setNewsLoading(false);
    setBlogs((blogsRes.blogs || []).slice(0, 8));
    setBlogsLoading(false);
  }, [location.city, location.coords, location.region]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <TabSwipeHost>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader title="More Services" variant="bar" />
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: pad }]}
            showsVerticalScrollIndicator={false}
          >
            <Section
              title="Jobs"
              subtitle="Open roles near you"
              tone={TONES.jobs}
              isDark={isDark}
              icon="briefcase-outline"
              onOpen={() => router.push('/(tabs)/jobs' as Href)}
              loading={jobsLoading}
              empty={!jobsLoading && jobs.length === 0}
            >
              {jobs.map((job) => {
                const company = job.business?.businessName || 'Company';
                const place =
                  job.location?.trim() ||
                  job.business?.city?.trim() ||
                  '';
                const posted = formatJobPosted(job.created_at);
                const typeLabel = formatJobType(job.type);
                return (
                  <Pressable
                    key={job.id}
                    onPress={() =>
                      router.push(`/(tabs)/jobs/${job.id}` as Href)
                    }
                    style={({ pressed }) => [
                      styles.jobTile,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.tileMark}>
                      {job.business?.profilePictureUrl ? (
                        <Image
                          source={{ uri: job.business.profilePictureUrl }}
                          style={styles.tileMarkImg}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.tileMarkLetter}>
                          {company.slice(0, 1).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.tileTitle} numberOfLines={2}>
                      {job.title}
                    </Text>
                    <Text style={styles.tileMeta} numberOfLines={1}>
                      {company}
                    </Text>
                    {place ? (
                      <Text style={styles.tileMeta} numberOfLines={1}>
                        {place}
                      </Text>
                    ) : null}
                    <View style={styles.jobChips}>
                      <Text style={styles.jobChip} numberOfLines={1}>
                        {typeLabel}
                      </Text>
                      {job.salary?.trim() ? (
                        <Text style={styles.jobChip} numberOfLines={1}>
                          {job.salary.trim()}
                        </Text>
                      ) : null}
                    </View>
                    {posted ? (
                      <Text style={styles.jobPosted}>{posted}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </Section>

            <Section
              title="Tourist places"
              subtitle="Nearby spots to explore"
              tone={TONES.tourist}
              isDark={isDark}
              icon="map-outline"
              onOpen={() => router.push('/(tabs)/tourist-places' as Href)}
              loading={placesLoading}
              empty={!placesLoading && places.length === 0}
            >
              {places.map((place) => (
                <Pressable
                  key={place.id}
                  onPress={() =>
                    router.push(
                      `/(tabs)/tourist-places/${resolveTouristPlaceSlug(place)}` as Href,
                    )
                  }
                  style={({ pressed }) => [
                    styles.mediaCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.mediaImageWrap}>
                    {place.image ? (
                      <Image
                        source={{ uri: place.image }}
                        style={styles.mediaImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.mediaImage, styles.photoFallback]}>
                        <Ionicons
                          name="image-outline"
                          size={22}
                          color={colors.textSoft}
                        />
                      </View>
                    )}
                    {place.distanceLabel ? (
                      <View style={styles.distancePill}>
                        <Ionicons name="navigate" size={10} color="#fff" />
                        <Text style={styles.distancePillText}>
                          {place.distanceLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.mediaTitle} numberOfLines={2}>
                    {place.name}
                  </Text>
                  {place.location ? (
                    <Text style={styles.mediaMeta} numberOfLines={1}>
                      {place.location}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </Section>

            <Section
              title="News"
              subtitle="Stories you can read here"
              tone={TONES.news}
              isDark={isDark}
              icon="newspaper-outline"
              onOpen={() => router.push('/(tabs)/news' as Href)}
              loading={newsLoading}
              empty={!newsLoading && articles.length === 0}
            >
              {articles.map((article) => (
                <Pressable
                  key={article.id || article.link}
                  onPress={() => openNewsArticle(router, article)}
                  style={({ pressed }) => [
                    styles.newsTile,
                    pressed && styles.pressed,
                  ]}
                >
                  {article.image ? (
                    <Image
                      source={{ uri: article.image }}
                      style={styles.newsThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.newsThumb, styles.newsThumbFallback]}>
                      <Ionicons
                        name="newspaper-outline"
                        size={18}
                        color={colors.textSoft}
                      />
                    </View>
                  )}
                  <Text style={styles.tileTitle} numberOfLines={3}>
                    {article.title}
                  </Text>
                  {article.source ? (
                    <Text style={styles.tileMeta} numberOfLines={1}>
                      {article.source}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </Section>

            <Section
              title="Blogs"
              subtitle="Guides from FinderB"
              tone={TONES.blogs}
              isDark={isDark}
              icon="book-outline"
              onOpen={() => router.push('/(tabs)/blog' as Href)}
              loading={blogsLoading}
              empty={!blogsLoading && blogs.length === 0}
            >
              {blogs.map((blog) => (
                <Pressable
                  key={blog.id || blog.slug}
                  onPress={() =>
                    router.push(
                      `/(tabs)/blog/${encodeURIComponent(blog.slug || blog.id)}` as Href,
                    )
                  }
                  style={({ pressed }) => [
                    styles.mediaCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.mediaImageWrap}>
                    {blog.image ? (
                      <Image
                        source={{ uri: blog.image }}
                        style={styles.mediaImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.mediaImage, styles.photoFallback]}>
                        <Ionicons
                          name="book-outline"
                          size={22}
                          color={colors.textSoft}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.mediaTitle} numberOfLines={2}>
                    {blog.title}
                  </Text>
                </Pressable>
              ))}
            </Section>
          </ScrollView>
        </SafeAreaView>
      </View>
    </TabSwipeHost>
  );
}

function Section({
  title,
  subtitle,
  tone,
  isDark,
  icon,
  onOpen,
  loading,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  tone: SectionTone;
  isDark: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onOpen: () => void;
  loading?: boolean;
  empty?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  const accent = tone.accent;
  const soft = isDark ? `${accent}22` : tone.soft;

  return (
    <View style={styles.section}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.sectionHead, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
      >
        <View style={[styles.sectionAccent, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.sectionGo, { backgroundColor: soft }]}>
          <Ionicons name="chevron-forward" size={16} color={accent} />
        </View>
      </Pressable>

      {loading ? (
        <View style={styles.sectionLoading}>
          <ActivityIndicator color={accent} />
        </View>
      ) : empty ? (
        <Pressable onPress={onOpen} style={styles.sectionEmpty}>
          <Text style={styles.sectionEmptyText}>Browse all {title}</Text>
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {children}
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => [
              styles.seeAllTile,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.seeAllText, { color: accent }]}>See all</Text>
            <Ionicons name="arrow-forward" size={16} color={accent} />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingTop: 8,
  },
  scroll: {
    paddingTop: 8,
    gap: 22,
  },
  section: {
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionAccent: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  },
  sectionGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLoading: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmpty: {
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sectionEmptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  rail: {
    paddingHorizontal: 16,
    gap: 10,
  },
  jobTile: {
    width: 168,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  tileMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileMarkImg: {
    width: '100%',
    height: '100%',
  },
  tileMarkLetter: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.onDark,
  },
  tileTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  tileMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  jobChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  jobChip: {
    maxWidth: '100%',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.teal,
    backgroundColor: colors.tealSoft,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  jobPosted: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
    marginTop: 2,
  },
  mediaCard: {
    width: 168,
    gap: 8,
  },
  mediaImageWrap: {
    width: 168,
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  mediaTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
    paddingHorizontal: 2,
  },
  mediaMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 2,
    marginTop: -4,
  },
  distancePill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(12,10,9,0.72)',
  },
  distancePillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#fff',
  },
  newsTile: {
    width: 200,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 10,
  },
  newsThumb: {
    width: '100%',
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  newsThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllTile: {
    width: 108,
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  pressed: { opacity: 0.92 },
}));
