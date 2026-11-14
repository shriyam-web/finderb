import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { useTheme, type ThemePreference } from '../../../context/ThemeContext';
import { getRatingDisplay, ratingBoxColor } from '../../../lib/ratingDisplay';
import type { ConsoleLead, ConsoleOverview, MissingField, SubscriptionStatus } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import { AlertCarousel, BANNER_ART, type AlertSlide } from '../../../components/console/AlertCarousel';
import { FinderBQrStudio } from '../../../components/console/FinderBQrStudio';
import { ViewsChart } from '../../../components/console/ViewsChart';
import {
  Btn,
  ConsolePage,
  HeaderIcon,
  PUBLIC_SITE,
  Panel,
  Section,
  Tag,
  createConsoleStyles,
  timeAgo,
  leadWhen,
} from '../../../components/console/kit';
import { LEAD_STATUS_TONE, pipelineOf } from '../../../components/console/leadStatus';
import { ShiningNew } from '../../../components/console/ShiningNew';
import { LeadSourceBadge } from '../../../components/console/LeadSourceBadge';
import { LISTING_SECTIONS } from '../../../components/console/listingSections';
import { askStorefrontPreview, openConsolePath } from '../../../lib/consoleNav';
import { buildReviewInviteUrl } from '../../../lib/reviewInvite';
import { competitorScoreIsGood, leadResponseIsGood } from '../../../lib/insightTones';
import { shareMessage } from '../../../lib/shareMessage';
import { getAppVersionLabel } from '../../../lib/appVersion';
import { LAUNCH_PACKAGES, peekPromotionDesk, primePromotionDesk, type PromotionPackageCard } from '../../../lib/promotionDeskCache';

type IconName = keyof typeof Ionicons.glyphMap;
type Go = (href: Href) => void;

const n = (value: number) => value.toLocaleString('en-IN');

function editHref(section: string): Href {
  return { pathname: '/business-console/edit', params: { section } } as Href;
}

/** Where each missing profile field is fixed in the app. */
function missingTarget(field: MissingField): Href {
  if (field.key === 'profilePictureUrl') return '/business-console/photos';
  if (field.action === 'kyc' || ['businessName', 'category', 'publicPhone'].includes(field.key)) {
    return '/business-console/account';
  }
  const section = LISTING_SECTIONS.find((item) => item.fields.includes(field.key));
  return section ? editHref(section.key) : '/business-console/listing';
}

function missingIcon(key: string): IconName {
  const icons: Record<string, IconName> = {
    profilePictureUrl: 'camera-outline',
    about: 'document-text-outline',
    displayName: 'storefront-outline',
    timings: 'time-outline',
    whatsappNumber: 'logo-whatsapp',
    website: 'globe-outline',
    mapLocation: 'map-outline',
    businessAddress: 'location-outline',
    paymentModes: 'card-outline',
    yearsInBusiness: 'calendar-outline',
    ownerInfo: 'person-outline',
    instagramUrl: 'logo-instagram',
    facebookUrl: 'logo-facebook',
    youtubeUrl: 'logo-youtube',
    kyc: 'id-card-outline',
  };
  return icons[key] ?? 'add-circle-outline';
}

function shopPhotoCount(photos: ConsoleOverview['photos']) {
  const gallery = photos.images.filter(Boolean);
  if (photos.cover && !gallery.includes(photos.cover)) return gallery.length + 1;
  return gallery.length;
}

function bannersFor(o: ConsoleOverview, go: Go, openStudio: () => void): AlertSlide[] {
  const slides: AlertSlide[] = [];
  const sub = o.subscription;
  const b = o.business;
  const photoCount = shopPhotoCount(o.photos);

  if (!o.hasPublicPhoto) {
    slides.push({
      key: 'photo',
      tone: 'danger',
      kicker: 'Listing hidden',
      title: 'Add a photo to go live',
      body: 'Customers can’t see you until your shop has at least one photo.',
      cta: 'Add photos',
      art: BANNER_ART.photos,
      onPress: () => go('/business-console/photos'),
    });
  } else if (photoCount < 5) {
    const left = 5 - photoCount;
    slides.push({
      key: 'more-photos',
      tone: 'info',
      kicker: 'Shop photos',
      title: left === 1 ? 'Add 1 more photo' : `Add ${left} more photos`,
      body: `You have ${photoCount} of 5. A full set helps people trust the shop before they call.`,
      cta: 'Add photos',
      art: BANNER_ART.photos,
      onPress: () => go('/business-console/photos'),
    });
  }

  if (!b.emailVerified || !b.mobileVerified) {
    const what = !b.emailVerified && !b.mobileVerified ? 'mobile & email' : !b.emailVerified ? 'email' : 'mobile';
    slides.push({
      key: 'verify',
      tone: 'warning',
      kicker: 'Visibility dropping',
      title: `Verify your ${what}`,
      body: 'Unverified businesses rank lower and get fewer calls.',
      cta: 'Verify now',
      art: BANNER_ART.verify,
      onPress: () => go('/business-console/account'),
    });
  }

  if (o.stats.leadsNew > 0) {
    slides.push({
      key: 'leads',
      tone: 'success',
      kicker: 'New enquiries',
      title: `${o.stats.leadsNew} customer${o.stats.leadsNew === 1 ? '' : 's'} waiting`,
      body: 'Call back fast — customers often ask more than one shop.',
      cta: 'Open leads',
      art: BANNER_ART.leads,
      onPress: () => go('/business-console/leads'),
    });
  }

  if (sub.isPendingPayment) {
    slides.push({
      key: 'pending-payment',
      tone: 'info',
      kicker: 'Payment',
      title: 'Confirming your payment',
      body: 'Your plan switches on as soon as the bank confirms it.',
      cta: 'Check status',
      art: BANNER_ART.growth,
      onPress: () => go('/business-console/plan'),
    });
  } else if (sub.alertLevel === 'expired') {
    slides.push({
      key: 'expired',
      tone: 'danger',
      kicker: 'Plan expired',
      title: `Renew ${sub.lastPlanName || 'your plan'}`,
      body: 'Lead phone numbers are hidden again until you renew.',
      cta: 'Renew plan',
      art: BANNER_ART.growth,
      onPress: () => go('/business-console/plan'),
    });
  } else if (sub.isActive && (sub.alertLevel === 'urgent' || sub.alertLevel === 'warning')) {
    slides.push({
      key: 'renew',
      tone: sub.alertLevel === 'urgent' ? 'danger' : 'warning',
      kicker: 'Renewal',
      title: `Plan ends in ${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'}`,
      body: sub.autoRenewEnabled ? 'Auto-renew is on. Nothing to do.' : 'Renew now so your leads stay unlocked.',
      cta: sub.autoRenewEnabled ? 'View plan' : 'Renew now',
      art: BANNER_ART.growth,
      onPress: () => go('/business-console/plan'),
    });
  } else if (!sub.isActive) {
    slides.push({
      key: 'upgrade',
      tone: 'info',
      kicker: 'Grow faster',
      title: 'See who wants to reach you',
      body: 'Unlock lead phone numbers and rank higher in your area.',
      cta: 'See plans',
      art: BANNER_ART.growth,
      onPress: () => go('/business-console/plan'),
    });
  }

  if (o.stats.reviewCount < 10) {
    slides.push({
      key: 'reviews-visibility',
      tone: 'info',
      kicker: 'Higher visibility',
      title: 'Get 10 reviews to rank higher',
      body: 'Generate your FinderB QR card and send customers a one-tap review link.',
      cta: 'Create QR card',
      art: BANNER_ART.growth,
      onPress: openStudio,
    });
  }

  if (o.completion.percent < 100) {
    slides.push({
      key: 'profile',
      tone: 'info',
      kicker: `${o.completion.percent}% complete`,
      title: 'Finish your shop',
      body: 'A finished shop shows up in more searches.',
      cta: 'Complete now',
      art: BANNER_ART.profile,
      onPress: () => go('/business-console/listing'),
    });
  }

  return slides;
}

type PlanChip = {
  label: string;
  icon: 'close' | 'diamond-outline' | 'diamond';
  background: string;
  color: string;
};

/** Starter is the plain free listing. Growth is the paid step up. Pro is the top plan. */
function planChip(subscription: SubscriptionStatus): PlanChip {
  const name = subscription.planName.trim().toLowerCase();
  const tier =
    subscription.isActive && (name === 'pro' || subscription.billingCycle === 'annual')
      ? 'pro'
      : subscription.isActive && (name === 'growth' || subscription.billingCycle === 'monthly')
        ? 'growth'
        : 'starter';
  if (tier === 'pro') {
    return { label: 'Pro', icon: 'diamond', background: '#153551', color: '#F9B864' };
  }
  if (tier === 'growth') {
    return { label: 'Growth', icon: 'diamond-outline', background: '#D97706', color: '#FFFFFF' };
  }
  return { label: 'Starter', icon: 'close', background: '#71717A', color: '#FFFFFF' };
}

function ShopCard({ o, go, onQr }: { o: ConsoleOverview; go: Go; onQr: () => void }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { notify } = useMerchantConsole();
  const { business, photos, subscription, stats } = o;
  const cover = photos.cover || photos.images[0] || null;
  const place = [business.category, business.city].filter(Boolean).join(' · ');
  const rating = getRatingDisplay(stats.rating, stats.reviewCount);
  const initials =
    business.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'B';
  const plan = planChip(subscription);
  const live = business.isLive;
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, breath]);
  const liveBorder = breath.interpolate({
    inputRange: [0, 1],
    outputRange: ['#15803D', '#4ADE80'],
  });
  const liveGlow = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.45],
  });
  const reviewUrl = buildReviewInviteUrl(business.slug || business.id, PUBLIC_SITE);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(reviewUrl)}`;
  const actions: { label: string; icon: IconName; onPress: () => void }[] = [
    {
      label: 'Preview',
      icon: 'eye-outline',
      onPress: () => askStorefrontPreview(router, business.id),
    },
    {
      label: 'Share',
      icon: 'share-social-outline',
      onPress: () => {
        const url = `${PUBLIC_SITE}${business.profilePath}`;
        void shareMessage({
          title: business.name,
          url,
          message: `Find ${business.name} on FinderB: ${url}`,
        }).then((result) => {
          if (result === 'copied') notify('Listing link copied');
        });
      },
    },
    { label: 'Edit', icon: 'create-outline', onPress: () => go('/business-console/listing') },
    { label: 'Photos', icon: 'images-outline', onPress: () => go('/business-console/photos') },
  ];

  return (
    <Animated.View
      style={[
        styles.shopFrame,
        live
          ? { borderColor: liveBorder, shadowColor: '#16A34A', shadowOpacity: liveGlow, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }
          : { borderColor: '#DC2626' },
      ]}
      accessibilityLabel={live ? `${business.name}, shop is live` : `${business.name}, shop is not live`}
    >
      <View style={styles.shop}>
      <View style={styles.shopTop}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.shopPhoto} contentFit="cover" alt="" />
        ) : (
          <View style={[styles.shopPhoto, styles.shopInitials]}>
            <Text style={styles.shopInitialsText}>{initials}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={styles.shopName} numberOfLines={2}>
              {business.name}
            </Text>
            {business.verifiedBadge ? <Ionicons name="checkmark-circle" size={16} color={c.success} /> : null}
          </View>
          {place ? (
            <Text style={styles.shopMeta} numberOfLines={1}>
              {place}
            </Text>
          ) : null}
          <View style={styles.shopChips}>
            {rating.rated ? (
              <Pressable
                onPress={() => go('/business-console/reviews')}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.shopChip,
                  { backgroundColor: ratingBoxColor(rating.rating) },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Rating ${rating.label}. Open reviews.`}
              >
                <Ionicons name="star" size={11} color="#FFFFFF" />
                <Text style={[styles.shopChipText, styles.shopChipOnColor]}>{rating.label}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => go('/business-console/subscription')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.shopChip,
                { backgroundColor: plan.background },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${plan.label} plan. Open plan.`}
            >
              <Ionicons name={plan.icon} size={11} color={plan.color} />
              <Text style={[styles.shopChipText, { color: plan.color }]}>{plan.label}</Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={onQr}
          style={({ pressed }) => [styles.qrPlate, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open review QR"
        >
          <View style={styles.qrFrame}>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} contentFit="contain" alt="" />
          </View>
          <Text style={styles.qrCaption}>Scan</Text>
        </Pressable>
      </View>
      <View style={styles.shopActions}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [styles.shopAction, index > 0 && styles.shopActionLine, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={16} color={c.ink} />
            <Text style={styles.shopActionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      </View>
    </Animated.View>
  );
}

const VIEW_RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'week', label: 'This week', days: 7 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: 'Past 3 months', days: 90 },
] as const;

function healthHref(id: string): Href {
  if (id === 'subscription') return '/business-console/plan';
  if (id === 'profile') return '/business-console/listing';
  return '/business-console/account';
}

function Performance({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const s = o.stats;
  const [rangeId, setRangeId] = useState<(typeof VIEW_RANGES)[number]['id']>('30');
  const [menu, setMenu] = useState(false);
  const range = VIEW_RANGES.find((item) => item.id === rangeId) ?? VIEW_RANGES[2];
  const daily = s.viewsDaily.slice(-range.days);
  const total = daily.reduce((sum, day) => sum + day.views, 0);
  // Average week across the 23 days before this one.
  const priorWeekly = (Math.max(0, s.views30d - s.views7d) * 7) / 23;
  const trend = rangeId === '30' && priorWeekly >= 1 ? Math.round(((s.views7d - priorWeekly) / priorWeekly) * 100) : null;
  const figures = [
    { label: 'Today', value: n(s.viewsToday) },
    { label: '7 days', value: n(s.views7d) },
    { label: 'Visitors', value: n(s.visitors30d) },
    { label: 'All time', value: n(s.viewsAllTime) },
  ];
  const funnel: { label: string; value: string; note: string; href: Href }[] = [
    { label: 'Leads', value: n(s.leadsTotal), note: `${s.leads7d} this week`, href: '/business-console/leads' },
    { label: 'To contact', value: n(s.leadsNew), note: s.leadsNew ? 'Reply now' : 'All caught up', href: '/business-console/leads' },
    {
      label: 'Conversion',
      value: n(s.leadsConverted),
      note: s.leadsTotal ? `${Math.round((s.leadsConverted / s.leadsTotal) * 100)}% rate` : '—',
      href: '/business-console/leads',
    },
    {
      label: 'To reply',
      value: n(s.reviewsAwaitingReply),
      note: 'reviews',
      href: '/business-console/reviews',
    },
  ];

  return (
    <>
    <Panel>
      <View style={styles.perfHead}>
        <View style={styles.flex}>
        <Pressable
          onPress={() => setMenu(true)}
          style={styles.rangeBtn}
          accessibilityRole="button"
          accessibilityLabel={`Profile views, ${range.label}. Change period.`}
        >
          <Text style={styles.label}>Profile views · {range.label}</Text>
          <Ionicons name="chevron-down" size={14} color={c.muted} />
        </Pressable>
          <View style={styles.perfValueRow}>
            <Text style={styles.perfValue}>{n(total)}</Text>
            {trend != null ? (
              <View style={[styles.trend, { backgroundColor: trend >= 0 ? c.successSoft : c.dangerSoft }]}>
                <Ionicons
                  name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={11}
                  color={trend >= 0 ? c.success : c.danger}
                />
                <Text style={[styles.trendText, { color: trend >= 0 ? c.success : c.danger }]}>
                  {Math.abs(trend)}% this week
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.chart}>
        <ViewsChart days={daily} />
      </View>
      <View style={styles.figures}>
        {figures.map((figure, index) => (
          <View key={figure.label} style={[styles.figure, index > 0 && styles.figureLine]}>
            <Text style={styles.figureValue}>{figure.value}</Text>
            <Text style={styles.figureLabel}>{figure.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.funnel}>
        {funnel.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => go(item.href)}
            style={({ pressed }) => [styles.funnelCell, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}: ${item.value}, ${item.note}`}
          >
            <Text style={styles.funnelValue}>{item.value}</Text>
            <Text style={styles.funnelLabel}>{item.label}</Text>
            <Text style={styles.funnelNote} numberOfLines={1}>
              {item.note}
            </Text>
          </Pressable>
        ))}
      </View>
      <InsightCarousel o={o} />
    </Panel>
    <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
      <Pressable style={styles.menuScrim} onPress={() => setMenu(false)}>
        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>Show views for</Text>
          {VIEW_RANGES.map((item) => {
            const on = item.id === rangeId;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setRangeId(item.id);
                  setMenu(false);
                }}
                style={[styles.menuRow, on && styles.menuRowOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.menuLabel, on && styles.menuLabelOn]}>{item.label}</Text>
                {on ? <Ionicons name="checkmark" size={16} color={c.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
    </>
  );
}

function InsightCarousel({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const responseGood = leadResponseIsGood(o.stats.averageResponse, o.stats.averageResponseMs);
  const scoreGood = competitorScoreIsGood(o.completion.percent, o.stats.competitorAverage);
  const slides = [
    {
      key: 'response',
      eyebrow: 'Average response',
      value: o.stats.averageResponse || '—',
      body: o.stats.averageResponse
        ? 'How quickly you open new leads. Faster replies stay ahead of nearby businesses.'
        : 'Open new leads promptly. This appears after the first few replies.',
      good: responseGood,
      fill: responseGood === false ? '#E11D48' : responseGood === true ? '#059669' : '#0F766E',
    },
    {
      key: 'score',
      eyebrow: 'Competitor score',
      value: o.stats.competitorAverage != null ? `${o.stats.competitorAverage}%` : '—',
      body:
        o.stats.competitorAverage != null
          ? `Nearby businesses average ${o.stats.competitorAverage}% complete. You are at ${o.completion.percent}%.`
          : `Scores in your category are still coming in. You are at ${o.completion.percent}% complete.`,
      good: scoreGood,
      fill: scoreGood === false ? '#E11D48' : scoreGood === true ? '#059669' : '#6D28D9',
    },
  ];

  const go = (index: number) => {
    const next = ((index % slides.length) + slides.length) % slides.length;
    setPage(next);
    if (width) scroller.current?.scrollTo({ x: next * width, animated: true });
  };

  useEffect(() => {
    if (!width) return;
    const timer = setInterval(() => go(page + 1), 3800);
    return () => clearInterval(timer);
  }, [width, page]);

  const slide = slides[page] || slides[0];

  return (
    <View style={[styles.insightShell, { backgroundColor: slide.fill }]}>
      <View style={styles.insightStripHead}>
        <Text style={styles.insightEyebrowLight}>{slide.eyebrow}</Text>
        <View style={styles.insightDots}>
          {slides.map((item, index) => (
            <Pressable key={item.key} onPress={() => go(index)} hitSlop={8} accessibilityLabel={item.eyebrow}>
              <View style={[styles.insightDotLight, page === index && styles.insightDotLightOn]} />
            </Pressable>
          ))}
        </View>
      </View>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width ? (
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / width);
            setPage(next === 1 ? 1 : 0);
          }}
        >
          {slides.map((item) => (
            <View key={item.key} style={{ width }}>
              <View style={styles.insightSlideRow}>
                <View style={styles.flex}>
                  <Text style={styles.insightValueLight} numberOfLines={1}>{item.value}</Text>
                  <Text style={styles.insightBodyLight} numberOfLines={2}>{item.body}</Text>
                </View>
                <View style={styles.insightVote}>
                  <Ionicons
                    name={item.good === false ? 'thumbs-down' : item.good === true ? 'thumbs-up' : 'remove'}
                    size={26}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
      </View>
    </View>
  );
}

function MissingInfo({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const pct = o.completion.percent;
  const missing = o.completion.missing;
  const focus = o.health.items.filter((item) => item.id === 'subscription' || item.id === 'profile');
  const blocked = o.health.items.filter(
    (item) => item.id !== 'subscription' && item.id !== 'profile' && (item.status === 'blocked' || item.status === 'review'),
  );
  const profileGaps = missing.filter((field) => field.key !== 'kyc');
  const celebrated = pct >= 100 && o.subscription.isActive && profileGaps.length === 0;
  if (celebrated) {
    return (
      <Section title="Missing info">
        <Panel>
          <Text style={styles.celebrateMark}>🎉</Text>
          <Text style={styles.celebrateTitle}>Well done</Text>
          <Text style={styles.celebrateBody}>
            Your shop is complete and your plan is active. That helps you rank better in search results.
          </Text>
        </Panel>
      </Section>
    );
  }
  if (pct >= 100 && !focus.length && !blocked.length && !profileGaps.length) return null;
  const shown = profileGaps.slice(0, 6);

  return (
    <Section title="Missing info" action={profileGaps.length > shown.length ? `+${profileGaps.length - shown.length} more` : 'All details'} onAction={() => go('/business-console/listing')}>
      <Panel flush>
        <View style={styles.strength}>
          <View style={styles.strengthHead}>
            <Text style={styles.strengthValue}>{pct}%</Text>
            <Text style={styles.strengthNote} numberOfLines={2}>
              {profileGaps.length
                ? `${profileGaps.length} detail${profileGaps.length === 1 ? '' : 's'} missing. Each one you add helps you show up in more searches.`
                : o.health.headline}
            </Text>
          </View>
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${Math.max(3, pct)}%` }]} />
          </View>
        </View>
        {focus.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => go(healthHref(item.id))}
            style={({ pressed }) => [styles.missingRow, styles.rowLine, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}. ${item.detail}`}
          >
            <View style={[styles.missingIcon, { backgroundColor: item.status === 'complete' ? c.successSoft : item.status === 'blocked' ? c.dangerSoft : c.sunken }]}>
              <Ionicons
                name={item.id === 'subscription' ? 'call-outline' : 'storefront-outline'}
                size={17}
                color={item.status === 'complete' ? c.success : item.status === 'blocked' ? c.danger : c.body}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.missingLabel}>{item.label}</Text>
              <Text style={styles.missingDetail} numberOfLines={2}>
                {item.detail}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.faint} />
          </Pressable>
        ))}
        {blocked.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => go(healthHref(item.id))}
            style={({ pressed }) => [styles.missingRow, styles.rowLine, pressed && styles.rowPressed]}
            accessibilityRole="button"
          >
            <View style={[styles.missingIcon, { backgroundColor: item.status === 'blocked' ? c.dangerSoft : c.sunken }]}>
              <Ionicons
                name={item.status === 'blocked' ? 'close-circle-outline' : 'time-outline'}
                size={17}
                color={item.status === 'blocked' ? c.danger : c.body}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.missingLabel}>{item.label}</Text>
              <Text style={styles.missingDetail} numberOfLines={2}>
                {item.detail}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.faint} />
          </Pressable>
        ))}
        {shown.map((field) => (
          <Pressable
            key={field.key}
            onPress={() => go(missingTarget(field))}
            style={({ pressed }) => [styles.missingRow, styles.rowLine, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Add ${field.label}`}
          >
            <View style={styles.missingIcon}>
              <Ionicons name={missingIcon(field.key)} size={17} color={c.body} />
            </View>
            <Text style={[styles.missingLabel, styles.flex]} numberOfLines={1}>
              {field.label}
            </Text>
            <Text style={styles.addText}>Add</Text>
            <Ionicons name="chevron-forward" size={16} color={c.faint} />
          </Pressable>
        ))}
      </Panel>
    </Section>
  );
}

function RecentLeadRow({
  lead,
  first,
  onPress,
}: {
  lead: ConsoleLead;
  first: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const pipeline = pipelineOf(lead.status);
  const waiting = pipeline === 'To be contacted';
  const [meaning, setMeaning] = useState<{ title: string; body: string } | null>(null);
  const row = (
      <View style={[styles.lead, !waiting && !first && styles.rowLine]}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.leadMain, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel={waiting ? `${lead.name || 'Customer'}, not contacted yet` : lead.name || 'Customer'}
        >
          <View style={[styles.avatar, waiting && styles.avatarHot]}>
            <Text style={[styles.avatarText, waiting && styles.leadOnHot]}>{(lead.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.flex}>
            <View style={styles.leadNameRow}>
              <Text style={[styles.leadName, waiting && styles.leadNameShrink, waiting && styles.leadOnHot]} numberOfLines={1}>
                {lead.name || 'Customer'}
              </Text>
              {waiting ? <ShiningNew /> : null}
            </View>
            <Text style={[styles.leadMeta, waiting && styles.leadMetaOnHot]} numberOfLines={1}>
              {lead.locked ? 'Upgrade to see contact' : lead.category || 'Customer enquiry'}
              {lead.created_at ? ` · ${leadWhen(lead.created_at)}` : ''}
            </Text>
          </View>
        </Pressable>
        <View style={styles.leadBadges}>
          <LeadSourceBadge
            lead={lead}
            align="end"
            onMeaning={(next) => setMeaning((current) => (current?.title === next.title ? null : next))}
          />
          {waiting ? null : (
            <Tag label={pipeline} tone={LEAD_STATUS_TONE[pipeline] ?? 'neutral'} style={styles.leadBadgeEnd} />
          )}
        </View>
      </View>
  );

  const explained = (
    <View>
      {row}
      {meaning ? (
        <View style={[styles.sourceHelp, waiting && styles.sourceHelpHot]}>
          <Text style={[styles.sourceHelpTitle, waiting && styles.leadOnHot]}>{meaning.title}</Text>
          <Text style={[styles.sourceHelpBody, waiting && styles.leadMetaOnHot]}>{meaning.body}</Text>
          <Pressable
            onPress={() => setMeaning(null)}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Text style={[styles.sourceHelpClose, waiting && styles.leadOnHot]}>Got it</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  if (!waiting) return explained;
  return (
    <LinearGradient colors={['#1C4668', '#0E2438']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.leadHot}>
      <View style={styles.hotRule} />
      {explained}
    </LinearGradient>
  );
}

function RecentLeads({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  return (
    <Section title="Recent leads" action="See all" onAction={() => go('/business-console/leads')}>
      <Panel flush>
        {o.leads.length ? (
          o.leads.slice(0, 3).map((lead, index) => (
            <RecentLeadRow key={lead.id} lead={lead} first={index === 0} onPress={() => go('/business-console/leads')} />
          ))
        ) : (
          <Text style={styles.none}>No leads yet. They’ll appear here the moment a customer contacts you.</Text>
        )}
      </Panel>
    </Section>
  );
}

function ReviewsSnapshot({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const s = o.stats;
  const rating = getRatingDisplay(s.rating, s.reviewCount);
  const latest = o.reviews[0];
  const stars = Math.round(s.rating ?? 0);
  return (
    <Section title="Reviews" action="Open" onAction={() => go('/business-console/reviews')}>
      <Panel>
        <View style={styles.reviewHead}>
          <Text style={styles.reviewScore}>{rating.rated ? rating.label : '–'}</Text>
          <View style={styles.flex}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={14} color={c.star} />
              ))}
            </View>
            <Text style={styles.leadMeta}>
              {s.reviewCount ? `${n(s.reviewCount)} review${s.reviewCount === 1 ? '' : 's'}` : 'No reviews yet'}
              {s.reviewsAwaitingReply ? ` · ${s.reviewsAwaitingReply} awaiting reply` : ''}
            </Text>
          </View>
          {s.reviewsAwaitingReply ? (
            <Btn small label="Reply" onPress={() => go('/business-console/reviews')} />
          ) : null}
        </View>
        {latest ? (
          <Pressable
            onPress={() =>
              go({ pathname: '/business-console/reviews', params: { reviewId: latest.id } })
            }
            style={({ pressed }) => [styles.quote, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Review by ${latest.author}. Open it.`}
          >
            <Text style={styles.quoteText} numberOfLines={2}>
              “{latest.content}”
            </Text>
            <View style={styles.quoteFoot}>
              <Text style={styles.quoteBy}>
                {latest.author}
                {latest.date ? ` · ${timeAgo(latest.date)}` : ''}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={c.faint} />
            </View>
          </Pressable>
        ) : (
          <Text style={[styles.quoteText, styles.quoteEmpty]}>
            Ask happy customers to rate you — share your shop link after a sale.
          </Text>
        )}
      </Panel>
    </Section>
  );
}

function PlanCard({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const sub = o.subscription;
  const paid = planChip(sub);
  const look = sub.isExpired && !sub.isActive
    ? {
        label: sub.lastPlanName || 'Plan',
        icon: 'diamond-outline' as const,
        background: '#B42318',
        color: '#FFFFFF',
      }
    : paid;
  const until =
    sub.expiresAtDisplay ||
    (sub.expiresAt
      ? new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : null);
  const total = sub.billingCycle === 'annual' ? 365 : 30;
  const left = Math.max(0, sub.daysRemaining ?? 0);
  const ratio = sub.isActive && sub.daysRemaining != null ? Math.min(1, left / total) : 0;
  const billing = sub.billingCycle === 'annual' ? 'Yearly, paid once' : 'Monthly, auto-debit';
  const renew = !sub.isMonthlyMandate
    ? null
    : sub.autoRenewEnabled
      ? 'renews automatically'
      : sub.mandateRevokePending
        ? 'auto-renew is being cancelled'
        : 'auto-renew is off';
  const pending = sub.isPendingPayment && !sub.isActive;
  const title = pending ? sub.planName || look.label : sub.isActive ? look.label : sub.isExpired ? `${look.label} expired` : 'Starter';
  const subtitle = pending
    ? 'Payment received. Waiting for the bank to confirm.'
    : sub.isActive
      ? billing
      : sub.isExpired
        ? until
          ? `Ended ${until}. Lead numbers are hidden.`
          : 'Lead numbers are hidden until you renew.'
        : 'Free shop. Upgrade to unlock lead numbers.';
  const status = pending
    ? { label: 'Confirming', tone: 'info' as const, icon: 'time-outline' as const }
    : sub.isActive
      ? { label: 'Active', tone: 'success' as const, icon: 'checkmark-circle' as const }
      : sub.isExpired
        ? { label: 'Expired', tone: 'danger' as const, icon: 'alert-circle' as const }
        : { label: 'Free', tone: 'neutral' as const };

  return (
    <Pressable
      onPress={() => go('/business-console/plan')}
      style={({ pressed }) => [styles.planCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={styles.planHead}>
        <View style={[styles.planMark, { backgroundColor: look.background }]}>
          <Ionicons name={look.icon} size={16} color={look.color} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.planTitle}>{title}</Text>
          <Text style={styles.planLine}>{subtitle}</Text>
        </View>
        <Tag label={status.label} tone={status.tone} icon={status.icon} />
      </View>
      {sub.isActive && sub.daysRemaining != null ? (
        <View>
          <View style={styles.planMeter}>
            <View style={[styles.planMeterFill, { width: `${Math.max(4, ratio * 100)}%`, backgroundColor: look.background }]} />
          </View>
          <Text style={styles.planMeterText}>
            {`${left} day${left === 1 ? '' : 's'} left${until ? ` · till ${until}` : ''}${renew ? ` · ${renew}` : ''}`}
          </Text>
        </View>
      ) : null}
      {sub.isActive && sub.alertLevel === 'urgent' ? (
        <Text style={styles.planWarn}>Ending soon. Renew so lead numbers stay visible.</Text>
      ) : null}
    </Pressable>
  );
}

const THEME_CHOICES: { key: ThemePreference; label: string; icon: IconName }[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

function QuickActions({ go, isOwner }: { go: Go; isOwner: boolean }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { preference, setPreference } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const themeIcon = THEME_CHOICES.find((theme) => theme.key === preference)?.icon ?? 'phone-portrait-outline';
  const actions: { label: string; icon: IconName; href?: Href; color: string; onPress?: () => void }[] = [
    { label: 'Details', icon: 'create-outline', href: '/business-console/listing', color: '#153551' },
    { label: 'Timings', icon: 'time-outline', href: editHref('hours'), color: '#C2410C' },
    { label: 'Offers', icon: 'pricetags-outline', href: editHref('offers'), color: '#BE185D' },
    { label: 'Jobs', icon: 'briefcase-outline', href: '/business-console/jobs', color: '#1D4ED8' },
    ...(isOwner
      ? [{
          label: 'Team access',
          icon: 'person-add-outline' as IconName,
          href: { pathname: '/business-console/account', params: { focus: 'team' } } as Href,
          color: '#0F766E',
        }]
      : []),
    { label: 'Security', icon: 'shield-checkmark-outline', href: '/business-console/account', color: '#6D28D9' },
    { label: 'Theme', icon: themeIcon, color: '#0369A1', onPress: () => setThemeOpen((open) => !open) },
    {
      label: 'Contact FinderB',
      icon: 'mail-outline' as IconName,
      color: '#15803D',
      onPress: () => {
        void Linking.openURL(`mailto:support@finderb.com?subject=${encodeURIComponent('FinderB business support')}`);
      },
    },
  ];
  return (
    <Panel flush>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => (action.onPress ? action.onPress() : action.href ? go(action.href) : undefined)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={action.label === 'Theme' ? `Theme, ${preference}` : action.label}
            accessibilityState={action.label === 'Theme' ? { expanded: themeOpen } : undefined}
          >
            <Ionicons name={action.icon} size={22} color={action.color} />
            <Text style={styles.actionLabel} numberOfLines={2}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {themeOpen ? (
        <View style={styles.themeChoices}>
          {THEME_CHOICES.map((theme) => {
            const active = preference === theme.key;
            return (
              <Pressable
                key={theme.key}
                onPress={() => setPreference(theme.key)}
                style={[styles.themeChoice, active && styles.themeChoiceOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${theme.label} theme`}
              >
                <Ionicons name={theme.icon} size={16} color={active ? c.primary : c.muted} />
                <Text style={[styles.themeChoiceText, active && styles.themeChoiceTextOn]}>{theme.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Panel>
  );
}

function growthStatus(o: ConsoleOverview) {
  const reports = o.badges || [];
  if (!reports.length) return 'See which badges you already have, and what is left to earn.';
  const on = (o.business.verifiedBadge ? 1 : 0) + reports.filter((badge) => badge.active).length;
  if (on === 0) return 'None are on your shop yet. See what it takes to earn them.';
  return `You already have ${on}. See which badges are still left.`;
}

function shortAdArea(coverage: string) {
  const radius = coverage.match(/(\d+)\s*[–-]\s*(\d+)\s*km/i);
  if (radius) return `${radius[1]}–${radius[2]} km`;
  if (/district|regional/i.test(coverage)) return 'District';
  return coverage;
}

function defaultAdPlan(plans: PromotionPackageCard[]) {
  return plans.find((plan) => plan.popular)?.id || plans[0]?.id || '';
}

function hoursReady(timings: ConsoleOverview['profile']['timings']) {
  return Object.values(timings || {}).some((day) => Boolean(day && (day.isClosed || day.is24Hours || (day.open && day.close))));
}

function shopBasics(o: ConsoleOverview) {
  const phone = (o.profile.publicPhone || o.business.loginMobile || '').replace(/\D/g, '');
  return {
    photo: o.hasPublicPhoto,
    phone: phone.length >= 10,
    hours: hoursReady(o.profile.timings),
  };
}

function ShopSetup({
  basics,
  live,
  go,
  onEnter,
}: {
  basics: { photo: boolean; phone: boolean; hours: boolean };
  live: boolean;
  go: Go;
  onEnter: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const steps = [
    { done: basics.photo, title: 'Add a photo', body: 'Customers trust a shop they can see.', href: '/business-console/photos' as Href },
    { done: basics.phone, title: 'Add your phone', body: 'This is the number customers can call.', href: '/business-console/account' as Href },
    { done: basics.hours, title: 'Set your hours', body: 'Show when the shop is open.', href: editHref('hours') },
  ];
  if (live) {
    return (
      <Panel>
        <Text style={styles.setupTitle}>You are live</Text>
        <Text style={styles.setupBody}>Customers can see this shop.</Text>
        <Btn label="Open your shop" onPress={onEnter} />
      </Panel>
    );
  }
  return (
    <Panel>
      <Text style={styles.setupTitle}>Set up your shop</Text>
      <Text style={styles.setupBody}>Add a photo, a phone number, and your hours. Then customers can find you.</Text>
      {steps.map((step) => (
        <Pressable
          key={step.title}
          onPress={() => go(step.href)}
          style={({ pressed }) => [styles.setupRow, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityLabel={step.done ? `${step.title}, done` : step.title}
        >
          <Ionicons name={step.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={step.done ? c.success : c.muted} />
          <View style={styles.flex}>
            <Text style={styles.setupStep}>{step.title}</Text>
            <Text style={styles.setupHint}>{step.body}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.faint} />
        </Pressable>
      ))}
    </Panel>
  );
}

function RisingArrow() {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rise, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rise]);
  return (
    <View style={{ width: 16, height: 18, overflow: 'hidden', alignItems: 'center' }}>
      <Animated.View
        style={{
          opacity: rise.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [8, -10] }) }],
        }}
      >
        <Ionicons name="arrow-up" size={15} color="#1C1408" />
      </Animated.View>
    </View>
  );
}

function HomeBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const router = useRouter();
  const { refresh, refreshing, run } = useMerchantConsole();
  const [adPlans, setAdPlans] = useState<PromotionPackageCard[]>(
    () => (peekPromotionDesk()?.packages?.length ? peekPromotionDesk()!.packages : LAUNCH_PACKAGES),
  );
  const [pickedPlan, setPickedPlan] = useState(() =>
    defaultAdPlan(peekPromotionDesk()?.packages?.length ? peekPromotionDesk()!.packages : LAUNCH_PACKAGES),
  );
  useEffect(() => {
    if (!o.promoteOnline) return;
    const cached = peekPromotionDesk();
    if (cached?.packages?.length) {
      setAdPlans(cached.packages);
      return;
    }
    void primePromotionDesk(run)?.then(() => {
      const next = peekPromotionDesk();
      if (next?.packages?.length) setAdPlans(next.packages);
    });
  }, [o.promoteOnline, run]);
  useEffect(() => {
    setPickedPlan((current) => (adPlans.some((plan) => plan.id === current) ? current : defaultAdPlan(adPlans)));
  }, [adPlans]);
  const [qrOpen, setQrOpen] = useState(false);
  const go: Go = (href) => openConsolePath(router, href);
  const slides = bannersFor(o, go, () => setQrOpen(true));
  const firstName = (o.business.ownerName || '').trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const picked = adPlans.find((plan) => plan.id === pickedPlan) || adPlans.find((plan) => plan.id === defaultAdPlan(adPlans));
  const startPlan = () => {
    const id = picked?.id;
    if (!id) return;
    go(`/business-console/promote?plan=${encodeURIComponent(id)}` as Href);
  };
  const basics = shopBasics(o);
  const shopReady = basics.photo && basics.phone && basics.hours;
  const wasIncomplete = useRef(!shopReady);
  const [liveGate, setLiveGate] = useState(false);
  useEffect(() => {
    if (!shopReady) {
      wasIncomplete.current = true;
      return;
    }
    if (wasIncomplete.current) setLiveGate(true);
  }, [shopReady]);
  const showSetup = !shopReady || liveGate;
  return (
    <>
    <ConsolePage
      title="Home"
      brand
      hideBack
      right={
        <HeaderIcon
          icon="notifications-outline"
          label="Notifications"
          badge={o.notifications.unread}
          onPress={() => go('/business-console/alerts')}
        />
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      {showSetup ? (
        <ShopSetup
          basics={basics}
          live={shopReady && liveGate}
          go={go}
          onEnter={() => {
            wasIncomplete.current = false;
            setLiveGate(false);
          }}
        />
      ) : (
      <>
      <Text style={styles.greeting}>{`${greeting}${firstName ? `, ${firstName}` : ''}`}</Text>
      {o.detailsLockedUntil ? (
        <View style={styles.lockBanner}>
          <Text style={styles.lockTitle}>Details locked for 15 days</Text>
          <Text style={styles.lockBody}>
            {`This shop was just transferred. You can change business details after ${new Date(o.detailsLockedUntil).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`}
          </Text>
        </View>
      ) : null}
      <ShopCard o={o} go={go} onQr={() => setQrOpen(true)} />
      {slides.length ? <AlertCarousel slides={slides} /> : null}
      <Section title="Performance">
        <Performance o={o} go={go} />
      </Section>
      <MissingInfo o={o} go={go} />
      <RecentLeads o={o} go={go} />
      {o.promoteOnline ? (
        <View style={styles.promoteCard}>
          <View style={styles.promoteTop}>
            <View style={styles.promoteCopy}>
              <Text style={styles.promoteTitle}>Customers live nearby. They still haven't seen you.</Text>
              <Text style={styles.promoteSub}>
                They are already scrolling Facebook and Instagram. Pick a plan and FinderB puts this shop in front of them.
              </Text>
            </View>
            <Image
              source={require('../../../assets/indian-businessman-cutout.png')}
              style={styles.promotePhoto}
              contentFit="contain"
              contentPosition={{ right: 0, bottom: 0 }}
            />
          </View>
          <View style={styles.promotePlans}>
            {adPlans.map((plan) => {
              const on = plan.id === pickedPlan;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setPickedPlan(plan.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${plan.name}. ${plan.durationDays} days. ${shortAdArea(plan.coverage)}. ₹${plan.priceInr}${plan.popular ? '. Most popular.' : ''}`}
                  style={({ pressed }) => [styles.promotePlan, on && styles.promotePlanOn, pressed && styles.pressed]}
                >
                  <View style={styles.flex}>
                    <View style={styles.promotePlanHead}>
                      <Text style={styles.promotePlanName} numberOfLines={1}>{plan.name}</Text>
                      {plan.popular ? <Text style={styles.promoteHot}>Most popular</Text> : null}
                    </View>
                    <Text style={styles.promotePlanMeta}>
                      {`${plan.durationDays} days · ${shortAdArea(plan.coverage)}`}
                    </Text>
                  </View>
                  <View style={styles.promotePriceCol}>
                    <Text style={styles.promotePrice}>{`₹${plan.priceInr.toLocaleString('en-IN')}`}</Text>
                    {plan.referenceInr > plan.priceInr ? (
                      <Text style={styles.promoteWas}>{`₹${plan.referenceInr.toLocaleString('en-IN')}`}</Text>
                    ) : null}
                  </View>
                  <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={on ? '#F3E6C8' : 'rgba(255,255,255,0.4)'} />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.promoteActions}>
            <Pressable
              onPress={startPlan}
              accessibilityRole="button"
              accessibilityLabel={picked ? `Start ${picked.name} for ₹${picked.priceInr}` : 'Start a plan'}
              style={({ pressed }) => [styles.promoteCta, pressed && styles.pressed]}
            >
              <Text style={styles.promoteCtaText}>
                {picked ? `Start ${picked.name} · ₹${picked.priceInr.toLocaleString('en-IN')}` : 'Start a plan'}
              </Text>
              <Ionicons name="arrow-forward" size={15} color="#10283F" />
            </Pressable>
            <Pressable
              onPress={() => go('/business-console/promotions' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Your ads. Running, pending, draft, and past ads."
              style={({ pressed }) => [styles.promoteSecondary, pressed && styles.pressed]}
            >
              <Text style={styles.promoteSecondaryText}>Your ads</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <ReviewsSnapshot o={o} go={go} />
      <Section title="Your plan">
        <PlanCard o={o} go={go} />
      </Section>
      <Pressable
        onPress={() => go('/business-console/growth')}
        style={({ pressed }) => [styles.growthCard, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Growth opportunity. Badges on your public profile help customers trust the shop before they call or visit."
      >
        <LinearGradient
          colors={['#FFF1CC', '#F6C15B', '#E39B2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.growthWash}
        >
          <View style={styles.growthTitleRow}>
            <Text style={styles.growthTitle}>Growth opportunity</Text>
            <RisingArrow />
          </View>
          <Text style={styles.growthSub}>
            Badges on your public profile help customers trust the shop before they call or visit.
          </Text>
          <View style={styles.growthFoot}>
            <Text style={styles.growthStatus}>{growthStatus(o)}</Text>
            <View style={styles.growthCta}>
              <Text style={styles.growthCtaText}>See your badges</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFF8EC" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
      <Section title="Manage">
        <QuickActions go={go} isOwner={o.actor?.isOwner !== false} />
      </Section>
      <View style={styles.footNote}>
        <View style={styles.footLine}>
          <Text style={styles.footNoteText} numberOfLines={1}>
            App is managed by FinderB IT. Made in India
          </Text>
          <Text style={styles.footFlag}>🇮🇳</Text>
        </View>
        <Text style={styles.footVersion}>{getAppVersionLabel()}</Text>
      </View>
      </>
      )}
    </ConsolePage>
      <FinderBQrStudio
        visible={qrOpen}
        businessName={o.business.name}
        category={o.business.category}
        city={o.business.city}
        slugOrId={o.business.slug || o.business.id}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
}

export default function HomeScreen() {
  return <ConsoleGate>{(overview) => <HomeBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  greeting: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink, paddingHorizontal: 2, marginBottom: -4 },
  setupTitle: { fontFamily: fonts.semiBold, fontSize: 20, color: c.ink },
  setupBody: { marginTop: 6, marginBottom: 8, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.body },
  setupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  setupStep: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  setupHint: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.muted },
  growthCard: { borderRadius: 16, overflow: 'hidden' },
  growthWash: { padding: 12, overflow: 'hidden' },
  growthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  growthTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: '#1C1408' },
  growthSub: { marginTop: 3, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: '#4A320C' },
  growthFoot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  growthStatus: { flexGrow: 1, flexShrink: 1, minWidth: 180, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: '#1C1408' },
  growthCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1C1408',
  },
  growthCtaText: { fontFamily: fonts.semiBold, fontSize: 12, color: '#FFF8EC' },
  promoteCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#10283F',
    padding: 12,
    gap: 10,
  },
  promoteTop: { flexDirection: 'row', alignItems: 'flex-end' },
  promoteCopy: { flex: 1, paddingRight: 8 },
  promoteTitle: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 21, color: '#FFFFFF' },
  promoteSub: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.78)' },
  promotePlans: { gap: 8 },
  promotePlan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(243,230,200,0.28)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promotePlanOn: { borderColor: '#F3E6C8', backgroundColor: 'rgba(243,230,200,0.14)' },
  promotePlanHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promotePlanName: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 13, color: '#FFFFFF' },
  promoteHot: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#1A1408',
    backgroundColor: '#F3E6C8',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  promotePlanMeta: { marginTop: 2, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: '#F3E6C8' },
  promotePriceCol: { alignItems: 'flex-end' },
  promotePrice: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
  promoteWas: { fontFamily: fonts.medium, fontSize: 10, color: 'rgba(243,230,200,0.55)', textDecorationLine: 'line-through' },
  promoteCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F6D58A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  promoteCtaText: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 18, color: '#10283F' },
  promoteActions: { gap: 8 },
  promoteSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(243,230,200,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  promoteSecondaryText: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18, color: '#F3E6C8' },
  promotePhoto: { width: 84, height: 96 },
  lockBanner: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.warning,
    backgroundColor: c.warningSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  lockTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: c.ink },
  lockBody: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.body },
  insight: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17 },
  insightShell: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 108,
  },
  insightStripHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  insightEyebrowLight: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.86)' },
  insightValueLight: { marginTop: 4, fontFamily: fonts.semiBold, fontSize: 26, color: '#FFFFFF' },
  insightBodyLight: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.92)' },
  insightSlideRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 4 },
  insightVote: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  insightDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  insightDotLight: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  insightDotLightOn: { width: 16, backgroundColor: '#FFFFFF' },
  celebrateMark: { fontSize: 28 },
  celebrateTitle: { marginTop: 4, fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  celebrateBody: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: c.muted },
  pressed: { opacity: 0.75 },
  rowPressed: { backgroundColor: c.sunken },
  rowLine: { borderTopWidth: 1, borderTopColor: c.line },
  label: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  rangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  menuScrim: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: 'rgba(24,24,27,0.4)' },
  menuCard: { borderRadius: 16, backgroundColor: c.card, padding: 8 },
  menuTitle: { paddingHorizontal: 12, paddingVertical: 8, fontFamily: fonts.semiBold, fontSize: 13, color: c.muted },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  menuRowOn: { backgroundColor: c.sunken },
  menuLabel: { fontFamily: fonts.medium, fontSize: 15, color: c.ink },
  menuLabelOn: { fontFamily: fonts.semiBold, color: c.primary },

  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.isDark ? 'rgba(251,191,36,0.35)' : '#FDE68A',
    backgroundColor: c.warningSoft,
  },
  warnIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.card,
  },
  warnTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  warnBody: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.body },
  warnCta: { paddingHorizontal: 12, height: 32, borderRadius: 8, justifyContent: 'center', backgroundColor: c.primary },
  warnCtaText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.primaryInk },

  shopFrame: { borderRadius: 20, borderWidth: 2 },
  shop: {
    borderRadius: 18,
    backgroundColor: c.card,
    overflow: 'hidden',
  },
  shopTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 },
  shopPhoto: { width: 72, height: 72, borderRadius: 16, backgroundColor: c.sunken },
  shopInitials: { alignItems: 'center', justifyContent: 'center' },
  shopInitialsText: { fontFamily: fonts.semiBold, fontSize: 20, color: c.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shopName: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 17, letterSpacing: -0.3, color: c.ink },
  shopMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  shopChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  shopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: c.sunken,
  },
  shopChipText: { fontFamily: fonts.semiBold, fontSize: 11, color: c.body },
  shopChipOnColor: { color: '#FFFFFF' },
  qrPlate: { alignItems: 'center', gap: 4 },
  qrFrame: {
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: '#FFFFFF',
  },
  qrImage: { width: 58, height: 58 },
  qrCaption: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 0.3, color: c.muted },
  shopActions: { flexDirection: 'row', backgroundColor: c.sunken },
  shopAction: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  shopActionLine: { borderLeftWidth: 1, borderLeftColor: c.line },
  shopActionText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.ink },

  perfHead: { flexDirection: 'row', alignItems: 'flex-start' },
  perfValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  perfValue: { fontFamily: fonts.semiBold, fontSize: 26, color: c.ink },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  trendText: { fontFamily: fonts.semiBold, fontSize: 11 },
  chart: { marginTop: 14 },
  figures: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line },
  figure: { flex: 1, alignItems: 'center' },
  figureLine: { borderLeftWidth: 1, borderLeftColor: c.line },
  figureValue: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  figureLabel: { marginTop: 1, fontFamily: fonts.regular, fontSize: 11, color: c.muted },
  funnel: { flexDirection: 'row', gap: 6, marginTop: 12 },
  funnelCell: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, backgroundColor: c.sunken, alignItems: 'center' },
  funnelValue: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  funnelLabel: { marginTop: 1, fontFamily: fonts.semiBold, fontSize: 11, color: c.body },
  funnelNote: { marginTop: 1, fontFamily: fonts.regular, fontSize: 10.5, color: c.muted },

  strength: { padding: 12 },
  strengthHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strengthValue: { fontFamily: fonts.semiBold, fontSize: 22, color: c.ink },
  strengthNote: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.body },
  meter: { marginTop: 10, height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: c.success },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  missingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  missingLabel: { fontFamily: fonts.semiBold, fontSize: 13.5, color: c.ink },
  missingDetail: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.muted },
  addText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.accent },

  lead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  leadMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8 },
  leadHot: {
    marginHorizontal: 6,
    marginVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(231,177,90,0.45)',
  },
  hotRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#E7B15A' },
  sourceHelp: {
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: c.sunken,
  },
  sourceHelpHot: { marginHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  sourceHelpTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: c.ink },
  sourceHelpBody: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.body },
  sourceHelpClose: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.ink },
  leadNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leadNameShrink: { flexShrink: 1 },
  leadOnHot: { color: '#FFFFFF' },
  leadMetaOnHot: { color: 'rgba(255,255,255,0.72)' },
  avatarHot: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: '#E7B15A' },
  leadBadges: { marginLeft: 'auto', alignItems: 'flex-end', gap: 4 },
  leadBadgeEnd: { alignSelf: 'flex-end' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  avatarText: { fontFamily: fonts.semiBold, fontSize: 14, color: c.primary },
  leadName: { fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  leadMeta: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  none: { padding: 14, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.muted },

  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewScore: { fontFamily: fonts.semiBold, fontSize: 26, color: c.ink },
  stars: { flexDirection: 'row', gap: 2 },
  quote: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line },
  quoteText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.body },
  quoteEmpty: { marginTop: 10 },
  quoteFoot: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  quoteBy: { flex: 1, fontFamily: fonts.regular, fontSize: 11.5, color: c.muted },

  planCard: {
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planTitle: { fontFamily: fonts.semiBold, fontSize: 16, letterSpacing: -0.2, color: c.ink },
  planLine: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.body },
  planMeter: { height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  planMeterFill: { height: 6, borderRadius: 3 },
  planMeterText: { marginTop: 6, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.muted },
  planWarn: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.danger },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  action: {
    width: '25%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  actionLabel: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.body, textAlign: 'center' },
  themeChoices: { flexDirection: 'row', gap: 8, paddingLeft: 12, paddingRight: 68, paddingBottom: 14 },
  themeChoice: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.line,
  },
  themeChoiceOn: { borderColor: c.primary, backgroundColor: c.primarySoft },
  themeChoiceText: { fontFamily: fonts.regular, fontSize: 12, color: c.body },
  themeChoiceTextOn: { fontFamily: fonts.semiBold, color: c.ink },
  footNote: { alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 12 },
  footLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, maxWidth: '100%' },
  footNoteText: { flexShrink: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: c.faint },
  footFlag: { fontSize: 14, lineHeight: 18 },
  footVersion: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 10, lineHeight: 14, color: c.faint },
}));
