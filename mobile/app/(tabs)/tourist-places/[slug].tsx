import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
// Depth: app/(tabs)/tourist-places → mobile root needs ../../../
import { DestinationExperienceModal } from '../../../components/DestinationExperienceModal';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { useLoginPrompt } from '../../../context/LoginPromptContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import {
  fetchDestinationEngagement,
  type DestinationEngagement,
} from '../../../lib/destinationEngagement';
import {
  fetchTouristPlaceBySlugOrId,
  resolveTouristPlaceSlug,
  splitTouristLines,
  touristPlaceWebPath,
  type TouristPlace,
} from '../../../lib/touristPlaces';

function param(value: string | string[] | undefined): string {
  return typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value[0] || ''
      : '';
}

function FactChip({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.factChip}>
      <View style={styles.factIcon}>
        <Ionicons name={icon} size={16} color={colors.brand} />
      </View>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function BulletSection({
  title,
  icon,
  lines,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  lines: string[];
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (!lines.length) return null;
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={colors.brand} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.bulletList}>
        {lines.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function TouristPlaceDetailScreen() {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = param(params.slug);
  const bottomPad = useTabScrollPadding(28);
  const { width } = useWindowDimensions();

  const [place, setPlace] = useState<TouristPlace | null>(null);
  const [nearby, setNearby] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [heroAspect, setHeroAspect] = useState(4 / 3);
  const [rateOpen, setRateOpen] = useState(false);
  const [engagement, setEngagement] = useState<DestinationEngagement | null>(
    null,
  );

  const loadEngagement = useCallback(
    async (placeId: string) => {
      const data = await fetchDestinationEngagement(placeId, user?.id);
      setEngagement(data);
    },
    [user?.id],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const result = await fetchTouristPlaceBySlugOrId(slug);
      if (cancelled) return;
      setPlace(result.place);
      setNearby(result.nearby);
      setError(result.error || '');
      setLoading(false);
      if (result.place?.id) {
        await loadEngagement(result.place.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadEngagement, slug]);

  const highlights = useMemo(
    () => splitTouristLines(place?.highlights),
    [place?.highlights],
  );
  const tips = useMemo(() => splitTouristLines(place?.tips), [place?.tips]);
  const howToReach = useMemo(
    () => splitTouristLines(place?.howToReach),
    [place?.howToReach],
  );

  const openMaps = () => {
    if (!place) return;
    const q = encodeURIComponent(`${place.name}, ${place.location}`);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const onShare = async () => {
    if (!place) return;
    try {
      await Share.share({
        message: `Explore ${place.name} on FinderB\n${touristPlaceWebPath(place)}`,
        title: place.name,
        url: touristPlaceWebPath(place),
      });
    } catch {
      /* cancelled */
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Destination"
          variant="bar"
          onBack={() => router.replace('/(tabs)/tourist-places')}
          right={
            place ? (
              <Pressable
                onPress={() => void onShare()}
                hitSlop={8}
                style={styles.headerBtn}
                accessibilityLabel="Share destination"
              >
                <Ionicons name="share-outline" size={20} color={colors.ink} />
              </Pressable>
            ) : null
          }
        />

        {loading ? (
          <View style={styles.center}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={styles.loadingText}>Loading destination…</Text>
              <Text style={styles.loadingHint}>Getting photos, tips, and nearby picks</Text>
            </View>
          </View>
        ) : !place ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Destination not found</Text>
            <Text style={styles.emptyText}>
              {error || 'This place may have been removed.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          >
            <View
              style={[
                styles.heroWrap,
                { width, height: Math.min(width / heroAspect, width * 0.85) },
              ]}
            >
              <Image
                source={{ uri: place.image }}
                style={styles.heroImage}
                contentFit="contain"
                onLoad={(e) => {
                  const src = e.source;
                  if (src?.width && src?.height) {
                    setHeroAspect(src.width / src.height);
                  }
                }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(12,10,9,0.55)']}
                style={styles.heroScrim}
              />
              <View style={styles.heroBadges}>
                {place.category ? (
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>{place.category}</Text>
                  </View>
                ) : null}
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color={colors.star} />
                  <Text style={styles.ratingText}>
                    {place.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>{place.name}</Text>
              <View style={styles.locRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textSoft}
                />
                <Text style={styles.location}>{place.location}</Text>
              </View>
              {place.distanceLabel ? (
                <Text style={styles.distance}>{place.distanceLabel}</Text>
              ) : null}

              {place.description ? (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHead}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.brand}
                    />
                    <Text style={styles.sectionTitle}>About this place</Text>
                  </View>
                  <Text style={styles.about}>{place.description}</Text>
                </View>
              ) : null}

              <View style={styles.factsGrid}>
                {place.bestTime ? (
                  <FactChip
                    icon="sunny-outline"
                    label="Best time"
                    value={place.bestTime}
                  />
                ) : null}
                {place.visitDuration ? (
                  <FactChip
                    icon="time-outline"
                    label="Visit duration"
                    value={place.visitDuration}
                  />
                ) : null}
                {place.entryFee ? (
                  <FactChip
                    icon="ticket-outline"
                    label="Entry"
                    value={place.entryFee}
                  />
                ) : null}
                {place.category ? (
                  <FactChip
                    icon="compass-outline"
                    label="Type"
                    value={place.category}
                  />
                ) : null}
              </View>

              <BulletSection
                title="Highlights"
                icon="sparkles-outline"
                lines={highlights}
              />
              <BulletSection
                title="How to reach"
                icon="bus-outline"
                lines={
                  howToReach.length
                    ? howToReach
                    : place.howToReach
                      ? [place.howToReach]
                      : []
                }
              />
              <BulletSection
                title="Visitor tips"
                icon="bulb-outline"
                lines={tips}
              />

              <View style={styles.ctaRow}>
                <Pressable style={styles.primaryCta} onPress={openMaps}>
                  <Ionicons name="navigate" size={18} color={colors.onDark} />
                  <Text style={styles.primaryCtaText}>Get directions</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryCta}
                  onPress={() => void onShare()}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color={colors.ink}
                  />
                  <Text style={styles.secondaryCtaText}>Share</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.rateCard}
                onPress={() => {
                  if (!user) {
                    requestLogin(`/tourist-places/${slug}`);
                    return;
                  }
                  setRateOpen(true);
                }}
              >
                <LinearGradient
                  colors={[...gradients.hero]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rateFill}
                >
                  <View style={styles.rateCopy}>
                    <Text style={styles.rateEyebrow}>Your visit</Text>
                    <Text style={styles.rateTitle}>
                      {engagement?.userRating
                        ? `You rated this ${engagement.userRating}/5`
                        : 'Rate this experience'}
                    </Text>
                    <Text style={styles.rateSub}>
                      {user
                        ? engagement?.userRating
                          ? 'Update your vibe notes anytime'
                          : 'Mood, vibes, and a tip for travellers'
                        : 'Sign in to share how this place felt'}
                    </Text>
                    {engagement && engagement.ratingCount > 0 ? (
                      <Text style={styles.rateMeta}>
                        Community · {engagement.averageRating.toFixed(1)}★ from{' '}
                        {engagement.ratingCount}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.rateIcon}>
                    <Ionicons name="sparkles" size={22} color={colors.secondary} />
                  </View>
                </LinearGradient>
              </Pressable>

              {nearby.length > 0 ? (
                <View style={styles.nearbyBlock}>
                  <Text style={styles.nearbyTitle}>Nearby destinations</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.nearbyRail}
                  >
                    {nearby.map((item) => (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [
                          styles.nearbyCard,
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          router.push(
                            `/(tabs)/tourist-places/${resolveTouristPlaceSlug(item)}` as Href,
                          )
                        }
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={styles.nearbyImage}
                          contentFit="cover"
                        />
                        <Text style={styles.nearbyName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.nearbyLoc} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </ScrollView>
        )}

        {place && user ? (
          <DestinationExperienceModal
            visible={rateOpen}
            placeId={place.id}
            placeName={place.name}
            userId={user.id}
            initialRating={engagement?.userRating}
            initialVibes={engagement?.userVibes}
            initialNote={engagement?.userNote}
            onClose={() => setRateOpen(false)}
            onSubmitted={() => {
              void loadEngagement(place.id);
            }}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  loadingText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.heading,
    marginTop: 14,
  },
  loadingHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loaderCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minWidth: 240,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scroll: { paddingBottom: 24 },
  heroWrap: {
    backgroundColor: colors.muted,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  heroBadges: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.frost,
  },
  catPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    // Frost pill is always light — keep dark ink for contrast in both themes
    color: '#0C0A09',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(12,10,9,0.72)',
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.frost,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.45,
    color: colors.heading,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  distance: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.open,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.heading,
  },
  about: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  factChip: {
    width: '47.5%',
    flexGrow: 1,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: 12,
    gap: 4,
  },
  factIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
    marginBottom: 2,
  },
  factLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  factValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  bulletList: { gap: 8 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.brand,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryCta: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.brand,
  },
  primaryCtaText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  secondaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  secondaryCtaText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  rateCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rateFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rateCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rateEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.secondary,
  },
  rateTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.frost,
  },
  rateSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.frostMuted,
  },
  rateMeta: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.frostMuted,
  },
  rateIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  nearbyBlock: {
    marginTop: 8,
    gap: 12,
  },
  nearbyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.heading,
  },
  nearbyRail: {
    gap: 10,
    paddingRight: 8,
  },
  nearbyCard: {
    width: 148,
    gap: 6,
  },
  nearbyImage: {
    width: 148,
    height: 110,
    borderRadius: 14,
    backgroundColor: colors.muted,
  },
  nearbyName: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  nearbyLoc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
  },
  pressed: { opacity: 0.94 },
}));
