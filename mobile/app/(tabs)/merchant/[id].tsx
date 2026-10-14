import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  useWindowDimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectMerchantModal } from '../../../components/ConnectMerchantModal';
import { MerchantOfferBanner } from '../../../components/MerchantOfferBanner';
import { MerchantReviewComposer } from '../../../components/MerchantReviewComposer';
import { PhotoLightbox } from '../../../components/PhotoLightbox';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { fonts } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { useLoginPrompt } from '../../../context/LoginPromptContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  fetchBusinessesByCategory,
  fetchMerchantBySlugOrId,
} from '../../../lib/api';
import { getBusinessOpenStatus, getWeeklyHours } from '../../../lib/businessHours';
import { fetchJobsByBusinessId, type JobListing } from '../../../lib/jobs';
import {
  directionsHref,
  resolveMerchantSlug,
  whatsAppHref,
  type Merchant,
} from '../../../lib/merchants';
import { getDiscountOfferDisplay } from '../../../lib/discountOffer';
import { fetchFavoriteIds, toggleFavorite } from '../../../lib/favoritesApi';
import { recordDirectLead } from '../../../lib/leadsApi';
import { reportBusinessReview } from '../../../lib/reviewsApi';
import { goBackOrHome } from '../../../lib/navigation';
import { formatYearsInBusinessShort } from '../../../lib/establishmentYear';
import { SITE_URL } from '../../../lib/supabase';
import { getRatingDisplay, UNRATED_LABEL } from '../../../lib/ratingDisplay';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { useDrivingDistanceLabel } from '../../../lib/drivingDistance';

const FALLBACK_W = Dimensions.get('window').width || 360;

function cloudinaryOriginal(url: string): string | null {
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const after = url.slice(idx + marker.length);
  const slash = after.indexOf('/');
  if (slash <= 0) return null;
  const first = after.slice(0, slash);
  if (!first.includes('f_jpg')) return null;
  return `${url.slice(0, idx + marker.length)}${after.slice(slash + 1)}`;
}

function GalleryPhoto({
  uri,
  width,
  height,
  priority = 'high',
}: {
  uri: string;
  width: number | '100%';
  height: number | '100%';
  priority?: 'low' | 'normal' | 'high';
}) {
  const [src, setSrc] = useState(uri);
  useEffect(() => {
    setSrc(uri);
  }, [uri]);
  return (
    <Image
      source={{ uri: src }}
      style={{ width, height }}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority={priority}
      onError={() => {
        const plain = cloudinaryOriginal(src);
        if (plain && plain !== src) setSrc(plain);
      }}
    />
  );
}

function maskPhone(value?: string | null): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Hidden until you sign in';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return 'Hidden until you sign in';
  return `${digits.slice(0, 2)}${'•'.repeat(Math.max(2, digits.length - 4))}${digits.slice(-2)}`;
}

function maskEmail(value?: string | null): string {
  const trimmed = (value || '').trim();
  if (!trimmed || !trimmed.includes('@')) return 'Hidden until you sign in';
  const [localPart, domainPart] = trimmed.split('@');
  if (!localPart || !domainPart) return 'Hidden until you sign in';
  return `${localPart.slice(0, 2)}${'•'.repeat(Math.max(2, localPart.length - 2))}@${domainPart}`;
}

/** Subtle 🔥 flicker — mirrors web `animate-fire-flicker`. */
function FlickeringFire() {
  const styles = useStyles();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 2,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 3,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 4,
          duration: 310,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [1, 1.15, 0.92, 1.08, 1],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['0deg', '-8deg', '5deg', '-4deg', '0deg'],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [1, 0.85, 1, 0.9, 1],
  });

  return (
    <Animated.Text
      style={[
        styles.trendingFire,
        { opacity, transform: [{ scale }, { rotate }] },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      🔥
    </Animated.Text>
  );
}

function SectionHead({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionHeadCopy}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
        </View>
      </View>
      {action}
    </View>
  );
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const filled = Math.round(rating);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= filled ? 'star' : 'star-outline'}
          size={size}
          color={colors.star}
        />
      ))}
    </View>
  );
}

function RelatedMeta({ item }: { item: Merchant }) {
  const styles = useStyles();
  const label = useDrivingDistanceLabel(item.latitude, item.longitude);
  return (
    <Text style={styles.relatedMeta} numberOfLines={1}>
      {item.category}
      {label ? ` · ${label}` : ''}
    </Text>
  );
}

export default function MerchantProfileScreen() {
  const windowWidth = useWindowDimensions().width;
  const [heroW, setHeroW] = useState(windowWidth > 0 ? windowWidth : FALLBACK_W);
  const screenW = heroW > 0 ? heroW : FALLBACK_W;
  const heroH = Math.round(screenW * 0.638);

  useEffect(() => {
    if (windowWidth > 0 && heroW <= 0) setHeroW(windowWidth);
  }, [heroW, windowWidth]);
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requestLogin: promptLogin } = useLoginPrompt();
  const params = useLocalSearchParams<{ id?: string | string[]; preview?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const ownerPreview = params.preview === '1';
  const location = useUserLocation(true);
  const bottomPad = useTabScrollPadding(16);
  const galleryRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [related, setRelated] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [compactVisible, setCompactVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [linkCopiedVisible, setLinkCopiedVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportedReviewIds, setReportedReviewIds] = useState<Set<string>>(() => new Set());
  const linkCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const contactRevealed = Boolean(user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !merchant?.id) {
        setSaved(false);
        return;
      }
      const result = await fetchFavoriteIds();
      if (cancelled || 'success' in result) return;
      setSaved(result.favoriteIds.includes(merchant.id));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, merchant?.id]);
  const userHasReviewed = Boolean(
    user && merchant?.reviews.some((review) => review.userId === user.id),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError('Invalid merchant');
        setLoading(false);
        return;
      }
      setLoading(true);
      const key = String(id);
      const ownsKey =
        Boolean(user?.isBusinessAccount) &&
        (ownerPreview || user?.businessId === key || user?.businessSlug === key);
      const result = await fetchMerchantBySlugOrId(key, {
        allowUnlisted: ownsKey,
      });
      if (cancelled) return;
      if (result.merchant) {
        setMerchant(result.merchant);
        setError('');
        const [jobResult, relatedResult] = await Promise.all([
          fetchJobsByBusinessId(result.merchant.id),
          result.merchant.category
            ? fetchBusinessesByCategory(result.merchant.category, {
                page: 1,
                pageSize: 8,
              })
            : Promise.resolve({ merchants: [] as Merchant[] }),
        ]);
        if (!cancelled) {
          setJobs(jobResult.jobs);
          setRelated(
            relatedResult.merchants
              .filter((item) => item.id !== result.merchant!.id)
              .slice(0, 6),
          );
        }
      } else {
        setMerchant(null);
        setJobs([]);
        setRelated([]);
        setError(result.error || 'Merchant not found');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, ownerPreview, user?.isBusinessAccount, user?.businessId, user?.businessSlug]);

  const openStatus = useMemo(
    () => getBusinessOpenStatus(merchant?.timings),
    [merchant?.timings],
  );
  const weeklyHours = useMemo(
    () => getWeeklyHours(merchant?.timings),
    [merchant?.timings],
  );
  const todayHours = weeklyHours.find((row) => row.isToday);

  const photos = merchant?.images?.length
    ? merchant.images
    : merchant?.image
      ? [merchant.image]
      : [];

  useEffect(() => {
    setGalleryIndex(0);
  }, [merchant?.id]);

  useEffect(() => {
    if (photos.length <= 1 || lightboxOpen) return;
    const timer = setInterval(() => {
      setGalleryIndex((prev) => {
        const next = (prev + 1) % photos.length;
        galleryRef.current?.scrollTo({
          x: next * screenW,
          animated: true,
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length, merchant?.id, lightboxOpen, screenW]);

  const openLightbox = (index = 0) => {
    if (!photos.length) return;
    setLightboxIndex(Math.max(0, Math.min(index, photos.length - 1)));
    setLightboxOpen(true);
  };

  const placeLabel = useMemo(() => {
    if (!merchant) return '';
    const address = merchant.businessAddress?.trim();
    if (address) return address;
    const location = merchant.location?.trim() || '';
    const city = merchant.city?.trim() || '';
    const state = merchant.state?.trim() || '';
    if (location) {
      const lower = location.toLowerCase();
      if (city && !lower.includes(city.toLowerCase())) {
        return state && !lower.includes(state.toLowerCase())
          ? `${location}, ${city}, ${state}`
          : `${location}, ${city}`;
      }
      if (state && !lower.includes(state.toLowerCase())) {
        return `${location}, ${state}`;
      }
      return location;
    }
    if (city && state) return `${city}, ${state}`;
    return city || state;
  }, [merchant]);

  const offerDisplay = useMemo(
    () =>
      merchant
        ? getDiscountOfferDisplay(merchant.discountRange, merchant.name)
        : null,
    [merchant],
  );

  const distanceLabel = useDrivingDistanceLabel(merchant?.latitude, merchant?.longitude);

  const mapsUrl = merchant ? directionsHref(merchant, location.coords) : null;
  const waUrl = merchant
    ? whatsAppHref(
        merchant.whatsappNumber || merchant.contact,
        `Hi, I found ${merchant.name} on FinderB.`,
      )
    : null;

  const ratingValue = merchant?.rating ?? null;
  const headerRating = getRatingDisplay(
    ratingValue,
    merchant?.reviewsCount || merchant?.reviews.length || 0,
  );
  const ratingBars = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const review of merchant?.reviews || []) {
      const star = Math.min(5, Math.max(1, Math.round(review.rating)));
      counts[star - 1] += 1;
    }
    const total = Math.max(1, counts.reduce((a, b) => a + b, 0));
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      ratio: counts[star - 1] / total,
      count: counts[star - 1],
    }));
  }, [merchant?.reviews]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [heroH - 120, heroH - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setGalleryIndex(Math.round(x / screenW));
  };

  const requestLogin = () => {
    const slug = merchant ? resolveMerchantSlug(merchant) : String(id || '');
    promptLogin(`/merchant/${slug}`);
  };

  const isOwnBusiness =
    Boolean(user?.isBusinessAccount) &&
    Boolean(merchant) &&
    (user?.businessId === merchant?.id ||
      (!!user?.businessSlug &&
        !!merchant?.slug &&
        user.businessSlug === merchant.slug) ||
      (!!user?.email &&
        !!merchant?.email &&
        user.email.toLowerCase() === merchant.email.toLowerCase()));

  const openBusinessEdit = () => {
    router.push('/business-console/edit' as Href);
  };

  const handleSave = async () => {
    if (!merchant) return;
    if (!user) {
      requestLogin();
      return;
    }
    if (saving) return;
    setSaving(true);
    const result = await toggleFavorite(merchant.id);
    setSaving(false);
    if (!('saved' in result)) {
      if (result.unauthorized) requestLogin();
      return;
    }
    setSaved(result.saved);
  };

  const sendReviewReport = async (reviewId: string, reason: string) => {
    if (!merchant) return;
    const result = await reportBusinessReview({ businessId: merchant.id, reviewId, reason });
    if (!result.success) {
      if (result.unauthorized) requestLogin();
      else Alert.alert('Could not report', result.error);
      return;
    }
    setReportedReviewIds((prev) => new Set(prev).add(reviewId));
    Alert.alert('Thanks for reporting', 'Our team will review it and remove it if it breaks our rules.');
  };

  const handleReportReview = (reviewId: string) => {
    if (!user) {
      requestLogin();
      return;
    }
    Alert.alert('Report this review?', 'Tell us what is wrong with it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam or fake', onPress: () => void sendReviewReport(reviewId, 'Spam or fake review') },
      {
        text: 'Abusive or offensive',
        style: 'destructive',
        onPress: () => void sendReviewReport(reviewId, 'Abusive or offensive content'),
      },
    ]);
  };

  const handleContactAction = (intent: 'call' | 'whatsapp' | 'enquire') => {
    if (!merchant) return;
    if (!contactRevealed) {
      if (intent === 'call' || intent === 'whatsapp') {
        requestLogin();
        return;
      }
      setConnectOpen(true);
      return;
    }
    if (intent === 'enquire') {
      void recordDirectLead({ businessId: merchant.id, channel: 'enquire' });
      setConnectOpen(true);
      return;
    }
    if (intent === 'call' && merchant.contact) {
      void recordDirectLead({ businessId: merchant.id, channel: 'call' });
      void Linking.openURL(`tel:${merchant.contact}`);
      return;
    }
    if (intent === 'whatsapp' && waUrl) {
      void recordDirectLead({ businessId: merchant.id, channel: 'whatsapp' });
      void Linking.openURL(waUrl);
    }
  };

  const shareProfile = async () => {
    if (!merchant) return;
    const slug = resolveMerchantSlug(merchant);
    const url = `${SITE_URL}/business/${slug}`;
    try {
      await Clipboard.setStringAsync(url);
      if (linkCopiedTimer.current) clearTimeout(linkCopiedTimer.current);
      setLinkCopiedVisible(true);
      linkCopiedTimer.current = setTimeout(() => {
        setLinkCopiedVisible(false);
        linkCopiedTimer.current = null;
      }, 1800);
    } catch {
      /* ignore copy failures */
    }
    try {
      await Share.share({
        message: `Check out ${merchant.name} on FinderB\n${url}\n\nOpens in the FinderB app when installed.`,
        url,
        title: merchant.name,
      });
    } catch {
      /* dismissed */
    }
  };

  useEffect(() => {
    return () => {
      if (linkCopiedTimer.current) clearTimeout(linkCopiedTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} size="large" />
        <Text style={styles.loadingText}>Opening storefront…</Text>
      </View>
    );
  }

  if (!merchant) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable
          style={styles.chromeBtnLight}
          onPress={() => goBackOrHome(router)}
        >
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Merchant not found</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <PrimaryButton label="Go back" onPress={() => goBackOrHome(router)} />
        </View>
      </SafeAreaView>
    );
  }

  const about = merchant.about?.trim() || '';
  const aboutLong = about.length > 180;
  const aboutShown =
    aboutExpanded || !aboutLong ? about : `${about.slice(0, 180).trim()}…`;
  const services = merchant.services.slice(0, 10);

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents={compactVisible ? 'box-none' : 'none'}
        style={[
          styles.compactHeader,
          {
            paddingTop: insets.top + 6,
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.compactInner}>
          <Pressable
            style={styles.chromeBtnLight}
            onPress={() => goBackOrHome(router)}
          >
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
          </Pressable>
          <View style={styles.compactCopy}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {merchant.name}
            </Text>
            <Text style={styles.compactSub} numberOfLines={1}>
              {merchant.category || 'Business'}
              {openStatus.status !== 'Unknown' ? ` · ${openStatus.label}` : ''}
            </Text>
          </View>
          <View style={styles.chromeRight}>
            <Pressable
              style={styles.chromeBtnLight}
              onPress={() => void handleSave()}
              disabled={saving}
              accessibilityLabel={saved ? 'Remove from favourites' : 'Save to favourites'}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#E11D48" />
              ) : (
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={16}
                  color={saved ? '#E11D48' : colors.ink}
                />
              )}
            </Pressable>
            <Pressable style={styles.chromeBtnLight} onPress={shareProfile}>
              <Ionicons name="share-outline" size={16} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingBottom: bottomPad + 24,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const y = e.nativeEvent.contentOffset.y;
              setCompactVisible(y > heroH - 80);
            },
          },
        )}
      >
        {isOwnBusiness ? (
          <SafeAreaView edges={['top']} style={styles.manageBannerSafe}>
            <View style={styles.manageBanner}>
              <Ionicons name="storefront-outline" size={16} color="#047857" />
              <Text style={styles.manageBannerText}>You manage this profile</Text>
            </View>
          </SafeAreaView>
        ) : null}
        <View
          style={[styles.hero, { height: heroH }]}
          onLayout={(event) => {
            const next = event.nativeEvent.layout.width;
            if (next > 0 && Math.abs(next - heroW) > 1) setHeroW(next);
          }}
        >
          {photos.length ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={screenW}
              snapToAlignment="center"
              disableIntervalMomentum
              nestedScrollEnabled
              directionalLockEnabled
              removeClippedSubviews={false}
              showsHorizontalScrollIndicator={false}
              onScroll={onGalleryScroll}
              scrollEventThrottle={16}
              style={styles.gallery}
            >
              {photos.map((uri, index) => (
                <Pressable
                  key={`${uri}-${index}`}
                  onPress={() => openLightbox(index)}
                  style={{ width: screenW, height: heroH }}
                  accessibilityLabel={`View photo ${index + 1}`}
                >
                  <GalleryPhoto
                    uri={uri}
                    width={screenW}
                    height={heroH}
                    priority={index === 0 ? 'high' : 'normal'}
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <LinearGradient
              colors={[...gradients.spotlight]}
              style={styles.heroFill}
            />
          )}

          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(12,10,9,0.32)',
              'transparent',
              'rgba(12,10,9,0.18)',
              'rgba(12,10,9,0.42)',
            ]}
            locations={[0, 0.42, 0.82, 1]}
            style={styles.heroShade}
          />

          <SafeAreaView
            edges={['top']}
            style={styles.heroTop}
            pointerEvents="box-none"
          >
            <Pressable
              style={styles.chromeBtn}
              onPress={() => goBackOrHome(router)}
            >
              <Ionicons name="chevron-back" size={20} color="#0C0A09" />
            </Pressable>
            <View style={styles.chromeRight}>
              <Pressable
                style={styles.chromeBtn}
                onPress={() => void handleSave()}
                disabled={saving}
                accessibilityLabel={saved ? 'Remove from favourites' : 'Save to favourites'}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#E11D48" />
                ) : (
                  <Ionicons
                    name={saved ? 'heart' : 'heart-outline'}
                    size={17}
                    color={saved ? '#E11D48' : '#0C0A09'}
                  />
                )}
              </Pressable>
              <Pressable style={styles.chromeBtn} onPress={shareProfile}>
                <Ionicons name="share-outline" size={17} color="#0C0A09" />
              </Pressable>
            </View>
          </SafeAreaView>

          {photos.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {photos.map((uri, index) => (
                <View
                  key={`${uri}-dot`}
                  style={[
                    styles.dot,
                    index === galleryIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          ) : null}

          {photos.length > 0 ? (
            <View style={styles.photoPill} pointerEvents="none">
              <Ionicons name="images-outline" size={12} color={colors.frost} />
              <Text style={styles.photoPillText}>
                {galleryIndex + 1}/{photos.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <View style={styles.identity}>
            <View style={styles.identityTop}>
              <Pressable
                onPress={() => openLightbox(0)}
                disabled={!photos[0]}
                style={styles.avatarWrap}
                accessibilityLabel="View profile photo"
              >
                {photos[0] ? (
                  <GalleryPhoto uri={photos[0]} width={72} height={72} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>
                      {merchant.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.identityCopy}>
                <View style={styles.nameBlock}>
                  <Text style={styles.name}>
                    {merchant.name}
                    {merchant.isVerified ? (
                      <Text
                        onPress={() => {
                          Alert.alert(
                            'Verified on FinderB',
                            "FinderB has confirmed this business's identity and listing details.",
                            [{ text: 'Got it' }],
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Verified on FinderB. FinderB has confirmed this business's identity and listing details."
                        style={styles.verifiedInlineSlot}
                      >
                        {' '}
                        <View style={styles.verifiedMark} pointerEvents="none">
                          <Ionicons
                            name="checkmark"
                            size={11}
                            color={colors.frost}
                          />
                        </View>
                      </Text>
                    ) : null}
                  </Text>
                  <View style={styles.ratingUnderName}>
                    {headerRating.rated ? (
                      <>
                        <View style={styles.ratingBox}>
                          <Ionicons name="star" size={11} color="#FFFFFF" />
                          <Text style={styles.ratingBoxText}>{headerRating.label}</Text>
                        </View>
                        {headerRating.showCount ? (
                          <Text style={styles.metaMuted}>({headerRating.reviewCount} reviews)</Text>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Text style={styles.metaNew}>New</Text>
                        <Text style={styles.metaMuted}>· {UNRATED_LABEL}</Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.nameActions}>
                  {isOwnBusiness ? (
                    <Pressable
                      onPress={openBusinessEdit}
                      style={({ pressed }) => [
                        styles.nameEdit,
                        pressed && styles.pressed,
                      ]}
                      accessibilityLabel="Edit business"
                    >
                      <Ionicons name="create-outline" size={14} color={colors.ink} />
                      <Text style={styles.nameEditText}>Edit</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => handleContactAction('call')}
                    disabled={!merchant.contact}
                    style={({ pressed }) => [
                      styles.nameCall,
                      !merchant.contact && styles.actionDisabled,
                      pressed && merchant.contact && styles.pressed,
                    ]}
                    accessibilityLabel="Call now"
                  >
                    <Ionicons name="call" size={14} color="#FFFFFF" />
                    <Text style={styles.nameCallText}>Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleContactAction('whatsapp')}
                    disabled={contactRevealed ? !waUrl : !merchant.contact}
                    style={({ pressed }) => [
                      styles.nameChat,
                      (contactRevealed ? !waUrl : !merchant.contact) &&
                        styles.actionDisabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel="WhatsApp"
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                    <Text style={styles.nameChatText}>WhatsApp</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.identityBody}>
              <Text style={styles.categoryLine} numberOfLines={1}>
                {merchant.category || 'Business'}
                {formatYearsInBusinessShort(merchant.yearsInBusiness)
                  ? ` · ${formatYearsInBusinessShort(merchant.yearsInBusiness)}`
                  : ''}
              </Text>

              <View style={styles.trendingBadge}>
                <FlickeringFire />
                <Text style={styles.trendingText}>Best in Category</Text>
              </View>

              {(placeLabel || distanceLabel || mapsUrl) ? (
                <View style={styles.placeBlock}>
                  {placeLabel ? (
                    <View style={styles.placeRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={colors.accentDeep}
                      />
                      <Text style={styles.placeText} numberOfLines={2}>
                        {placeLabel}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.placeMeta}>
                    {distanceLabel ? (
                      <Text style={styles.placeDistance}>
                        {distanceLabel.replace(/\s*away$/i, '')}
                      </Text>
                    ) : null}
                    {distanceLabel && mapsUrl ? (
                      <Text style={styles.placeMetaDot}>·</Text>
                    ) : null}
                    {mapsUrl ? (
                      <Pressable
                        onPress={() => Linking.openURL(mapsUrl)}
                        style={({ pressed }) => [
                          styles.placeDirections,
                          pressed && styles.pressed,
                        ]}
                        hitSlop={6}
                      >
                        <Ionicons name="navigate" size={13} color="#1D4ED8" />
                        <Text style={styles.placeDirectionsText}>
                          Get Direction
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {openStatus.status !== 'Unknown' ? (
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          openStatus.status === 'Open'
                            ? colors.open
                            : colors.closed,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusLabel,
                      {
                        color:
                          openStatus.status === 'Open'
                            ? colors.open
                            : colors.closed,
                      },
                    ]}
                  >
                    {openStatus.status === 'Open' ? 'Open now' : 'Closed'}
                  </Text>
                  {todayHours?.hours || openStatus.label ? (
                    <>
                      <Text style={styles.statusDotSep}>·</Text>
                      <Text style={styles.statusHours} numberOfLines={1}>
                        {todayHours?.hours || openStatus.label}
                      </Text>
                    </>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                onPress={() => handleContactAction('enquire')}
                style={({ pressed }) => [
                  styles.nameEnquire,
                  pressed && styles.pressed,
                ]}
                accessibilityLabel="Make enquiry"
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={styles.nameEnquireText}>Make enquiry</Text>
              </Pressable>

              {offerDisplay ? (
                <MerchantOfferBanner
                  headline={offerDisplay.headline}
                  detail={offerDisplay.detail}
                  label={offerDisplay.label}
                />
              ) : null}
            </View>
          </View>

          {jobs.length > 0 ? (
            <View style={styles.hiringStrip}>
              <View style={styles.hiringIcon}>
                <Ionicons name="briefcase" size={14} color={colors.accentDeep} />
              </View>
              <Text style={styles.hiringText}>
                Hiring now · {jobs.length} open role
                {jobs.length === 1 ? '' : 's'}
              </Text>
              <Pressable
                onPress={() =>
                  router.push(`/(tabs)/jobs/${jobs[0].id}` as Href)
                }
                hitSlop={8}
              >
                <Text style={styles.hiringLink}>View</Text>
              </Pressable>
            </View>
          ) : null}

          {services.length ? (
            <View style={styles.section}>
              <SectionHead title="Services" />
              <View style={styles.serviceGrid}>
                {services.map((service, index) => (
                  <View key={service} style={styles.serviceTile}>
                    <Text style={styles.serviceIndex}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <Text style={styles.serviceName}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHead title="Contact" />
            {!contactRevealed ? (
              <Pressable style={styles.gateCard} onPress={requestLogin}>
                <View style={styles.gateIcon}>
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={colors.accentDeep}
                  />
                </View>
                <View style={styles.gateCopy}>
                  <Text style={styles.gateTitle}>Sign in to reveal contact</Text>
                  <Text style={styles.gateBody}>
                    Phone and email stay private until you sign in.
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.ink}
                />
              </Pressable>
            ) : null}

            <View style={styles.contactCard}>
              {merchant.contact ? (
                <Pressable
                  style={styles.contactRow}
                  onPress={() =>
                    contactRevealed
                      ? handleContactAction('call')
                      : requestLogin()
                  }
                >
                  <View style={styles.contactIcon}>
                    <Ionicons name="call-outline" size={16} color={colors.ink} />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>
                      {contactRevealed
                        ? merchant.contact
                        : maskPhone(merchant.contact)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSoft}
                  />
                </Pressable>
              ) : null}

              {merchant.email ? (
                <Pressable
                  style={styles.contactRow}
                  onPress={() =>
                    contactRevealed
                      ? Linking.openURL(`mailto:${merchant.email}`)
                      : requestLogin()
                  }
                >
                  <View style={styles.contactIcon}>
                    <Ionicons name="mail-outline" size={16} color={colors.ink} />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>
                      {contactRevealed
                        ? merchant.email
                        : maskEmail(merchant.email)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSoft}
                  />
                </Pressable>
              ) : null}

              {merchant.website ? (
                <Pressable
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(merchant.website!)}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="globe-outline"
                      size={16}
                      color={colors.ink}
                    />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Website</Text>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {merchant.website.replace(/^https?:\/\//, '')}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSoft}
                  />
                </Pressable>
              ) : null}

              {merchant.businessAddress ? (
                <View style={styles.contactRow}>
                  <View style={styles.contactIcon}>
                    <Ionicons
                      name="home-outline"
                      size={16}
                      color={colors.ink}
                    />
                  </View>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Address</Text>
                    <Text style={styles.contactValue}>
                      {merchant.businessAddress}
                    </Text>
                  </View>
                </View>
              ) : null}

              {!merchant.contact &&
              !merchant.email &&
              !merchant.website &&
              !merchant.businessAddress ? (
                <Text style={styles.emptySoft}>
                  Contact details not listed yet.
                </Text>
              ) : null}
            </View>

            {(merchant.instagramUrl ||
              merchant.facebookUrl ||
              merchant.youtubeUrl ||
              merchant.paymentModes.length > 0) && (
              <View style={styles.extraBlock}>
                {merchant.instagramUrl ||
                merchant.facebookUrl ||
                merchant.youtubeUrl ? (
                  <View style={styles.socialRow}>
                    {merchant.instagramUrl ? (
                      <Pressable
                        style={[styles.socialBtn, styles.socialIg]}
                        onPress={() =>
                          Linking.openURL(merchant.instagramUrl!)
                        }
                        accessibilityLabel="Instagram"
                      >
                        <Ionicons
                          name="logo-instagram"
                          size={22}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    ) : null}
                    {merchant.facebookUrl ? (
                      <Pressable
                        style={[styles.socialBtn, styles.socialFb]}
                        onPress={() => Linking.openURL(merchant.facebookUrl!)}
                        accessibilityLabel="Facebook"
                      >
                        <Ionicons
                          name="logo-facebook"
                          size={22}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    ) : null}
                    {merchant.youtubeUrl ? (
                      <Pressable
                        style={[styles.socialBtn, styles.socialYt]}
                        onPress={() => Linking.openURL(merchant.youtubeUrl!)}
                        accessibilityLabel="YouTube"
                      >
                        <Ionicons
                          name="logo-youtube"
                          size={22}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                {merchant.paymentModes.length ? (
                  <View style={styles.paymentRow}>
                    <Ionicons
                      name="card-outline"
                      size={14}
                      color={colors.textSoft}
                    />
                    <Text style={styles.paymentText}>
                      {merchant.paymentModes.join(' · ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {about ? (
            <View style={styles.section}>
              <SectionHead title="About" />
              <View style={styles.storyCard}>
                <Text style={styles.storyMark}>“</Text>
                <Text style={styles.storyBody}>{aboutShown}</Text>
                {aboutLong ? (
                  <Pressable
                    onPress={() => setAboutExpanded((v) => !v)}
                    hitSlop={8}
                  >
                    <Text style={styles.moreLink}>
                      {aboutExpanded ? 'Show less' : 'Continue reading'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {weeklyHours.length ? (
            <View style={styles.section}>
              <SectionHead
                title="Hours"
                action={
                  <Pressable
                    onPress={() => setHoursExpanded((v) => !v)}
                    hitSlop={8}
                  >
                    <Text style={styles.sectionLink}>
                      {hoursExpanded ? 'Less' : 'Full week'}
                    </Text>
                  </Pressable>
                }
              />
              <View style={styles.hoursCard}>
                <View style={styles.hoursToday}>
                  <View>
                    <Text style={styles.hoursTodayLabel}>Today</Text>
                    <Text style={styles.hoursTodayValue}>
                      {todayHours?.hours || openStatus.label || 'See full week'}
                    </Text>
                  </View>
                  {openStatus.status !== 'Unknown' ? (
                    <View
                      style={[
                        styles.openBadge,
                        openStatus.status === 'Open'
                          ? styles.openBadgeOn
                          : styles.openBadgeOff,
                      ]}
                    >
                      <View
                        style={[
                          styles.openDot,
                          {
                            backgroundColor:
                              openStatus.status === 'Open'
                                ? colors.open
                                : colors.closed,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.openBadgeText,
                          {
                            color:
                              openStatus.status === 'Open'
                                ? colors.open
                                : colors.closed,
                          },
                        ]}
                      >
                        {openStatus.label || openStatus.status}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {hoursExpanded
                  ? weeklyHours.map((row) => (
                      <View
                        key={row.day}
                        style={[
                          styles.hoursRow,
                          row.isToday && styles.hoursRowToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.hoursDay,
                            row.isToday && styles.hoursDayToday,
                          ]}
                        >
                          {row.day}
                        </Text>
                        <Text
                          style={[
                            styles.hoursValue,
                            row.isToday && styles.hoursDayToday,
                          ]}
                        >
                          {row.hours}
                        </Text>
                      </View>
                    ))
                  : null}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHead
              title="Reviews"
              meta={
                ratingValue != null ? `${ratingValue.toFixed(1)} avg` : undefined
              }
            />

            {merchant.reviews.length > 0 ? (
              <View style={styles.ratingSummary}>
                <View style={styles.ratingBig}>
                  <Text style={styles.ratingBigValue}>
                    {ratingValue != null ? ratingValue.toFixed(1) : '—'}
                  </Text>
                  <Stars rating={ratingValue || 0} size={14} />
                  {headerRating.rated && headerRating.showCount ? (
                    <Text style={styles.ratingBigMeta}>{headerRating.reviewCount} reviews</Text>
                  ) : null}
                </View>
                <View style={styles.ratingBars}>
                  {ratingBars.map((row) => (
                    <View key={row.star} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{row.star}</Text>
                      <View style={styles.ratingBarTrack}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            { width: `${Math.round(row.ratio * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <MerchantReviewComposer
              businessId={merchant.id}
              alreadyReviewed={userHasReviewed}
              signedIn={Boolean(user)}
              onRequestLogin={requestLogin}
              onSubmitted={({ reviews, rating }) => {
                setMerchant((prev) =>
                  prev
                    ? {
                        ...prev,
                        reviews,
                        rating,
                        reviewsCount: reviews.length,
                      }
                    : prev,
                );
              }}
            />

            {merchant.reviews.length ? (
              <View style={styles.reviewsList}>
                {merchant.reviews.slice(0, 8).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {(review.author || 'A').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewHeadCopy}>
                        <Text style={styles.reviewAuthor}>{review.author}</Text>
                        <Stars rating={review.rating} />
                      </View>
                      {review.date ? (
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.reviewBody}>{review.content}</Text>
                    {review.merchantReply?.content ? (
                      <View style={styles.replyCard}>
                        <Text style={styles.replyLabel}>Owner reply</Text>
                        <Text style={styles.replyBody}>
                          {review.merchantReply.content}
                        </Text>
                      </View>
                    ) : null}
                    {review.userId && review.userId === user?.id ? null : reportedReviewIds.has(review.id) ? (
                      <Text style={styles.reviewReported}>Reported</Text>
                    ) : (
                      <Pressable
                        onPress={() => handleReportReview(review.id)}
                        hitSlop={8}
                        style={styles.reviewReport}
                        accessibilityRole="button"
                        accessibilityLabel={`Report review by ${review.author || 'customer'}`}
                      >
                        <Ionicons name="flag-outline" size={13} color={colors.textSoft} />
                        <Text style={styles.reviewReportText}>Report</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={22}
                  color={colors.textSoft}
                />
                <Text style={styles.emptySoft}>
                  No public reviews yet. Be the first to share your experience.
                </Text>
              </View>
            )}
          </View>

          {jobs.length ? (
            <View style={styles.section}>
              <SectionHead
                title="Open roles"
                action={
                  <Pressable
                    onPress={() => router.push('/(tabs)/jobs' as Href)}
                    hitSlop={8}
                  >
                    <Text style={styles.sectionLink}>Board</Text>
                  </Pressable>
                }
              />
              {jobs.map((job) => (
                <Pressable
                  key={job.id}
                  style={({ pressed }) => [
                    styles.jobCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    router.push(`/(tabs)/jobs/${job.id}` as Href)
                  }
                >
                  <View style={styles.jobIcon}>
                    <Ionicons
                      name="briefcase-outline"
                      size={16}
                      color={colors.ink}
                    />
                  </View>
                  <View style={styles.jobCopy}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobMeta} numberOfLines={1}>
                      {[job.type, job.location, job.salary]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSoft}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          {related.length > 0 ? (
            <View style={styles.section}>
              <SectionHead title="Similar nearby" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedRail}
                decelerationRate="fast"
              >
                {related.map((item) => {
                  const cover = item.images[0] || item.image;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        router.push(
                          `/merchant/${resolveMerchantSlug(item)}` as Href,
                        )
                      }
                      style={({ pressed }) => [
                        styles.relatedCard,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.relatedPhoto}>
                        {cover ? (
                          <Image
                            source={{ uri: cover }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.relatedFallback}>
                            <Text style={styles.relatedFallbackText}>
                              {item.name.slice(0, 1).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <LinearGradient
                          colors={['transparent', 'rgba(12,10,9,0.82)']}
                          style={styles.relatedScrim}
                        />
                        <View style={styles.relatedBody}>
                          <Text style={styles.relatedName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <RelatedMeta item={item} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      <ConnectMerchantModal
        merchant={merchant}
        visible={connectOpen}
        onClose={() => setConnectOpen(false)}
        contactRevealed={contactRevealed}
        userName={user?.fullName || ''}
        userEmail={user?.email || ''}
        onCall={() => handleContactAction('call')}
        onWhatsApp={() => handleContactAction('whatsapp')}
      />

      <PhotoLightbox
        visible={lightboxOpen}
        uris={photos}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {linkCopiedVisible ? (
        <View
          pointerEvents="none"
          style={[
            styles.linkCopiedToast,
            { bottom: bottomPad + 18 },
          ]}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.frost} />
          <Text style={styles.linkCopiedText}>Link copied</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors, gradients) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas, padding: 20 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: colors.canvas,
  },
  loadingText: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 10,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.heading,
  },
  errorCopy: {
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  compactCopy: { flex: 1, minWidth: 0 },
  compactTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  compactSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  hero: {
    width: '100%',
    backgroundColor: colors.night,
    overflow: 'hidden',
  },
  gallery: { width: '100%', height: '100%' },
  heroFill: { ...StyleSheet.absoluteFill },
  heroShade: { ...StyleSheet.absoluteFill },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chromeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chromeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chromeBtnLight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPill: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(12,10,9,0.55)',
  },
  photoPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.frost,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.frostMuted,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.frost,
  },
  actionDisabled: { opacity: 0.45 },
  linkCopiedToast: {
    position: 'absolute',
    alignSelf: 'center',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(12,10,9,0.92)',
    zIndex: 40,
  },
  linkCopiedText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.frost,
  },
  manageBannerSafe: {
    backgroundColor: '#ECFDF5',
  },
  manageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  manageBannerText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#047857',
  },
  sheet: {
    marginTop: -18,
    zIndex: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.canvas,
    paddingTop: 18,
    minHeight: 420,
  },
  identity: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  identityTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.canvas,
    backgroundColor: colors.muted,
    marginTop: -32,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    fontSize: 25,
    color: colors.onDark,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    paddingRight: 108,
  },
  identityBody: {
    gap: 8,
  },
  nameBlock: {
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  verifiedInlineSlot: {
    fontSize: 22,
    lineHeight: 28,
  },
  verifiedMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 4,
    marginBottom: Platform.OS === 'ios' ? -2 : -1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.verified,
  },
  ratingUnderName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#E6A800',
  },
  ratingBoxText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.frost,
  },
  metaStrong: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  metaMuted: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  metaNew: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 1,
  },
  nameActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
  },
  nameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  nameEditText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  nameCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#15803D',
  },
  nameCallText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  nameChat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#128C7E',
  },
  nameChatText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  nameEnquire: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  nameEnquireText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  categoryLine: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  trendingFire: {
    fontSize: 12,
    lineHeight: 14,
  },
  trendingText: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  placeBlock: {
    gap: 4,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  placeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  placeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 17,
  },
  placeDistance: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  placeMetaDot: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.borderStrong,
  },
  placeDirections: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeDirectionsText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#1D4ED8',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  statusDotSep: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.borderStrong,
  },
  statusHours: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  hiringStrip: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3D5A8',
  },
  hiringIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  hiringText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  hiringLink: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.accentDeep,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 22,
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionHeadCopy: { flex: 1, minWidth: 0 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.35,
    color: colors.heading,
  },
  sectionMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  sectionLink: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.brand,
    paddingBottom: 2,
  },
  serviceGrid: { gap: 8 },
  serviceTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  serviceIndex: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.secondary,
    width: 28,
  },
  serviceName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  storyCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
  },
  storyMark: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    lineHeight: 42,
    color: colors.secondary,
    marginBottom: -8,
  },
  storyBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
  moreLink: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  keyword: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.accentDeep,
  },
  hoursCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  hoursToday: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surfaceSoft,
  },
  hoursTodayLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  hoursTodayValue: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.heading,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  openBadgeOn: {
    backgroundColor: colors.successBg,
    borderColor: '#BBF7D0',
  },
  openBadgeOff: {
    backgroundColor: colors.dangerBg,
    borderColor: '#E8C4C4',
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  hoursRowToday: { backgroundColor: colors.accentSoft },
  hoursDay: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  hoursValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  hoursDayToday: { color: colors.accentDeep },
  gateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3D5A8',
  },
  gateIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  gateCopy: { flex: 1, minWidth: 0, gap: 2 },
  gateTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  gateBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  contactCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  contactCopy: { flex: 1, minWidth: 0, gap: 2 },
  contactLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  contactValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  extraBlock: { gap: 10, marginTop: 4 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIg: {
    backgroundColor: '#E1306C',
  },
  socialFb: {
    backgroundColor: '#1877F2',
  },
  socialYt: {
    backgroundColor: '#FF0000',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  ratingSummary: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ratingBig: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ratingBigValue: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: -1,
    color: colors.heading,
  },
  ratingBigMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
    textAlign: 'center',
  },
  ratingBars: { flex: 1, gap: 5, justifyContent: 'center' },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    width: 10,
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSoft,
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.star,
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewsList: { gap: 10 },
  reviewCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  reviewAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand,
  },
  reviewHeadCopy: { flex: 1, minWidth: 0, gap: 3 },
  reviewAuthor: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  reviewDate: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSoft,
  },
  reviewBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  reviewReport: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewReportText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  reviewReported: {
    alignSelf: 'flex-end',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  replyCard: {
    marginTop: 2,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    gap: 4,
  },
  replyLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.ink,
  },
  replyBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptySoft: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    padding: 8,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  jobIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  jobCopy: { flex: 1, minWidth: 0, gap: 3 },
  jobTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  jobMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  relatedRail: {
    paddingRight: 16,
    gap: 12,
  },
  relatedCard: {
    width: Math.min(220, FALLBACK_W * 0.58),
  },
  relatedPhoto: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  relatedFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  relatedFallbackText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.frost,
  },
  relatedScrim: {
    ...StyleSheet.absoluteFill,
    top: '35%',
  },
  relatedBody: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 3,
  },
  relatedName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.frost,
  },
  relatedMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.frostMuted,
  },
  pressed: { opacity: 0.92 },
}));
