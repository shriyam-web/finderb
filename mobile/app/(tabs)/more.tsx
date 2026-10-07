import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Href, useRouter, useScrollToTop } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { goBackOrHome } from '../../lib/navigation';
import { fetchHomeNews, type NewsArticle } from '../../lib/news';
import { openNewsArticle } from '../../lib/openNewsArticle';
import { TabSwipeHost } from '../../lib/tabSwipe';
import {
  fetchTouristPlaces,
  resolveTouristPlaceSlug,
  type TouristPlace,
} from '../../lib/touristPlaces';

const GUTTER = 20;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type IndexItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};

const INDEX: IndexItem[] = [
  { label: 'Places', icon: 'compass-outline', href: '/(tabs)/tourist-places' as Href },
  { label: 'News', icon: 'reader-outline', href: '/(tabs)/news' as Href },
  { label: 'Jobs', icon: 'briefcase-outline', href: '/(tabs)/jobs' as Href },
  { label: 'Guides', icon: 'book-outline', href: '/(tabs)/blog' as Href },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HINDI_MONTHS = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];

function formatShortDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** The news feed sends pre-formatted dates such as "08 Oct 2026" or "08 अक्टू॰ 2026". */
function formatNewsDate(value: string | null | undefined) {
  const text = (value || '').trim();
  const match = text.match(/^(\d{1,2})\s+(\S+)\s+\d{4}$/);
  if (!match) return text === 'हाल ही में' ? 'Recently' : text;
  const word = match[2].replace(/[.॰]/g, '').replace('फर', 'फ़र');
  let month = MONTHS.findIndex((m) => word.toLowerCase().startsWith(m.toLowerCase()));
  if (month < 0) month = HINDI_MONTHS.findIndex((m) => word.startsWith(m));
  return month < 0 ? text : `${Number(match[1])} ${MONTHS[month]}`;
}

/** Feed titles like "Delhi News: Latest News on Politics…" read as just "Delhi News". */
function shortSource(source: string | null | undefined) {
  return (source || '').split(/\s[|–—-]\s|:/)[0].trim();
}

export default function MoreScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const location = useAppLocation();
  const { width } = useWindowDimensions();
  const pad = useTabScrollPadding(28);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const cachedJobs = peekActiveJobs();
  const [jobs, setJobs] = useState<JobListing[]>(cachedJobs?.jobs.slice(0, 4) ?? []);
  const [jobsLoading, setJobsLoading] = useState(!cachedJobs);
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const locationCtx = {
      city: location.city,
      state: location.region,
      coords: location.coords,
    };
    void Promise.all([
      fetchActiveJobs(),
      fetchTouristPlaces(8, locationCtx),
      fetchHomeNews({ limit: 8 }),
      fetchBlogs(8),
    ]).then(([jobsRes, placesRes, newsRes, blogsRes]) => {
      if (!live) return;
      setJobs(jobsRes.jobs.slice(0, 4));
      setJobsLoading(false);
      setPlaces((placesRes.places || []).slice(0, 8));
      setPlacesLoading(false);
      setArticles((newsRes.articles || []).slice(0, 4));
      setNewsLoading(false);
      setBlogs((blogsRes.blogs || []).slice(0, 8));
      setBlogsLoading(false);
    });
    return () => {
      live = false;
    };
  }, [location.city, location.coords, location.region]);

  const city = location.city?.trim() || '';
  const today = WEEKDAYS[new Date().getDay()];
  const featuredWidth = width - GUTTER * 2;
  const [featured, ...morePlaces] = places;
  const open = (href: Href) => router.push(href);

  return (
    <TabSwipeHost>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingBottom: pad }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.masthead}>
              <View style={styles.topRow}>
                <Pressable
                  onPress={() => goBackOrHome(router)}
                  hitSlop={10}
                  style={({ pressed }) => [styles.back, pressed && styles.pressedCell]}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={20} color={colors.heading} />
                </Pressable>
                <Text style={styles.eyebrow}>{city ? `${city} · ${today}` : today}</Text>
              </View>
              <Text style={styles.headline}>Discover</Text>
              <Text style={styles.lede}>Places, stories and work around you.</Text>
            </View>

            <View style={styles.index}>
              {INDEX.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => open(item.href)}
                  style={({ pressed }) => [
                    styles.indexCell,
                    i > 0 && styles.indexDivider,
                    pressed && styles.pressedCell,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.label}`}
                >
                  <Ionicons name={item.icon} size={21} color={colors.heading} />
                  <Text style={styles.indexLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <Section
              title="Places to visit"
              onSeeAll={() => open('/(tabs)/tourist-places' as Href)}
            >
              {placesLoading ? (
                <View style={styles.gutter}>
                  <View style={[styles.skeleton, { height: 232, borderRadius: 20 }]} />
                </View>
              ) : !featured ? (
                <EmptyRow label="Explore places" onPress={() => open('/(tabs)/tourist-places' as Href)} />
              ) : (
                <>
                  <Pressable
                    onPress={() => open(`/(tabs)/tourist-places/${resolveTouristPlaceSlug(featured)}` as Href)}
                    style={({ pressed }) => [styles.gutter, pressed && styles.pressed]}
                  >
                    <View style={[styles.feature, { width: featuredWidth }]}>
                      <Image source={{ uri: featured.image }} alt={featured.name} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                      <LinearGradient
                        colors={['rgba(12,10,9,0)', 'rgba(12,10,9,0.78)']}
                        locations={[0.35, 1]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.featureCopy}>
                        <Text style={styles.featureTitle} numberOfLines={2}>
                          {featured.name}
                        </Text>
                        <Text style={styles.featureMeta} numberOfLines={1}>
                          {[featured.location, featured.distanceLabel].filter(Boolean).join('  ·  ')}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                  {morePlaces.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                      {morePlaces.map((place) => (
                        <Pressable
                          key={place.id}
                          onPress={() => open(`/(tabs)/tourist-places/${resolveTouristPlaceSlug(place)}` as Href)}
                          style={({ pressed }) => [styles.placeCard, pressed && styles.pressed]}
                        >
                          <Image source={{ uri: place.image }} alt={place.name} style={styles.placeImage} contentFit="cover" transition={200} />
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text style={styles.cardMeta} numberOfLines={1}>
                            {place.distanceLabel || place.location}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </>
              )}
            </Section>

            <Section title="News" onSeeAll={() => open('/(tabs)/news' as Href)}>
              {newsLoading ? (
                <View style={styles.gutter}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.storySkeleton}>
                      <View style={{ flex: 1, gap: 8 }}>
                        <View style={[styles.skeleton, { height: 10, width: '35%' }]} />
                        <View style={[styles.skeleton, { height: 14 }]} />
                        <View style={[styles.skeleton, { height: 14, width: '70%' }]} />
                      </View>
                      <View style={[styles.skeleton, styles.storyThumb]} />
                    </View>
                  ))}
                </View>
              ) : articles.length === 0 ? (
                <EmptyRow label="Read the latest news" onPress={() => open('/(tabs)/news' as Href)} />
              ) : (
                <View style={styles.gutter}>
                  {articles.map((article, i) => (
                    <Pressable
                      key={article.id || article.link}
                      onPress={() => openNewsArticle(router, article)}
                      style={({ pressed }) => [styles.story, i > 0 && styles.storyRule, pressed && styles.pressed]}
                    >
                      <View style={styles.storyCopy}>
                        <Text style={styles.storyMeta} numberOfLines={1}>
                          {[shortSource(article.source), formatNewsDate(article.date)].filter(Boolean).join('  ·  ')}
                        </Text>
                        <Text style={styles.storyTitle} numberOfLines={3}>
                          {article.title}
                        </Text>
                      </View>
                      {article.image ? (
                        <Image source={{ uri: article.image }} alt="" style={styles.storyThumb} contentFit="cover" transition={200} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              )}
            </Section>

            <Section title="Jobs" onSeeAll={() => open('/(tabs)/jobs' as Href)}>
              {jobsLoading ? (
                <View style={styles.gutter}>
                  <View style={[styles.skeleton, { height: 148, borderRadius: 18 }]} />
                </View>
              ) : jobs.length === 0 ? (
                <EmptyRow label="Browse open jobs" onPress={() => open('/(tabs)/jobs' as Href)} />
              ) : (
                <View style={[styles.gutter]}>
                  <View style={styles.group}>
                    {jobs.map((job, i) => {
                      const company = job.business?.businessName || 'Company';
                      const place = job.location?.trim() || job.business?.city?.trim() || '';
                      const meta = [formatJobType(job.type), job.salary?.trim(), formatJobPosted(job.created_at)]
                        .filter(Boolean)
                        .join('  ·  ');
                      return (
                        <Pressable
                          key={job.id}
                          onPress={() => open(`/(tabs)/jobs/${job.id}` as Href)}
                          style={({ pressed }) => [styles.jobRow, pressed && styles.pressedCell]}
                        >
                          <View style={styles.jobLogo}>
                            {job.business?.profilePictureUrl ? (
                              <Image source={{ uri: job.business.profilePictureUrl }} alt="" style={styles.jobLogoImg} contentFit="cover" />
                            ) : (
                              <Text style={styles.jobLogoLetter}>{company.slice(0, 1).toUpperCase()}</Text>
                            )}
                          </View>
                          <View style={[styles.jobCopy, i > 0 && styles.jobRule]}>
                            <View style={styles.jobText}>
                              <Text style={styles.jobTitle} numberOfLines={1}>
                                {job.title}
                              </Text>
                              <Text style={styles.jobCompany} numberOfLines={1}>
                                {place ? `${company}, ${place}` : company}
                              </Text>
                              {meta ? (
                                <Text style={styles.jobMeta} numberOfLines={1}>
                                  {meta}
                                </Text>
                              ) : null}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </Section>

            <Section title="Guides" onSeeAll={() => open('/(tabs)/blog' as Href)}>
              {blogsLoading ? (
                <View style={styles.rail}>
                  {[0, 1].map((i) => (
                    <View key={i} style={[styles.skeleton, styles.guideImage]} />
                  ))}
                </View>
              ) : blogs.length === 0 ? (
                <EmptyRow label="Read our guides" onPress={() => open('/(tabs)/blog' as Href)} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                  {blogs.map((blog) => (
                    <Pressable
                      key={blog.id || blog.slug}
                      onPress={() => open(`/(tabs)/blog/${encodeURIComponent(blog.slug || blog.id)}` as Href)}
                      style={({ pressed }) => [styles.guideCard, pressed && styles.pressed]}
                    >
                      <Image source={{ uri: blog.image }} alt="" style={styles.guideImage} contentFit="cover" transition={200} />
                      <Text style={styles.guideTitle} numberOfLines={2}>
                        {blog.title}
                      </Text>
                      {formatShortDate(blog.date) ? (
                        <Text style={styles.cardMeta}>{formatShortDate(blog.date)}</Text>
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </Section>
          </ScrollView>
        </SafeAreaView>
      </View>
    </TabSwipeHost>
  );
}

function Section({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={onSeeAll}
          hitSlop={10}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.heading} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function EmptyRow({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.gutter}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.emptyRow, pressed && styles.pressedCell]}>
        <Text style={styles.emptyText}>{label}</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
      </Pressable>
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
  },
  gutter: {
    paddingHorizontal: GUTTER,
  },
  masthead: {
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: 22,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSoft,
  },
  headline: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.1,
    color: colors.heading,
  },
  lede: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  index: {
    flexDirection: 'row',
    marginHorizontal: GUTTER,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  indexCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  indexDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  indexLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    letterSpacing: -0.1,
    color: colors.heading,
  },
  section: {
    marginTop: 36,
    gap: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GUTTER,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.6,
    color: colors.heading,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 3,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.heading,
  },
  feature: {
    height: 232,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    justifyContent: 'flex-end',
  },
  featureCopy: {
    padding: 18,
    gap: 4,
  },
  featureTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
    color: colors.frost,
  },
  featureMeta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.frostMuted,
  },
  rail: {
    flexDirection: 'row',
    paddingHorizontal: GUTTER,
    gap: 14,
  },
  placeCard: {
    width: 148,
    gap: 3,
  },
  placeImage: {
    width: 148,
    height: 108,
    borderRadius: 14,
    marginBottom: 7,
    backgroundColor: colors.muted,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: -0.2,
    color: colors.heading,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  story: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
  },
  storyRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  storyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  storyMeta: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSoft,
  },
  storyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: colors.heading,
  },
  storyThumb: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  storySkeleton: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
  },
  group: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    gap: 12,
  },
  jobLogo: {
    width: 42,
    height: 42,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobLogoImg: {
    width: '100%',
    height: '100%',
  },
  jobLogoLetter: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.onDark,
  },
  jobCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingRight: 14,
  },
  jobRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  jobText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  jobTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: colors.heading,
  },
  jobCompany: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  jobMeta: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSoft,
  },
  guideCard: {
    width: 236,
    gap: 4,
  },
  guideImage: {
    width: 236,
    height: 148,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.muted,
  },
  guideTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: colors.heading,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  skeleton: {
    borderRadius: 6,
    backgroundColor: colors.muted,
  },
  pressed: { opacity: 0.86 },
  pressedCell: { backgroundColor: colors.canvasDeep },
}));
