import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { getRatingDisplay } from '../../../lib/ratingDisplay';
import type { ConsoleOverview, MissingField } from '../../../lib/merchantConsoleApi';
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
} from '../../../components/console/kit';
import { LEAD_STATUS_TONE, pipelineOf } from '../../../components/console/leadStatus';
import { LeadSourceBadge } from '../../../components/console/LeadSourceBadge';
import { LISTING_SECTIONS } from '../../../components/console/listingSections';
import { askStorefrontPreview, openConsolePath } from '../../../lib/consoleNav';
import { competitorScoreIsGood, leadResponseIsGood } from '../../../lib/insightTones';

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

function bannersFor(o: ConsoleOverview, go: Go, openStudio: () => void): AlertSlide[] {
  const slides: AlertSlide[] = [];
  const sub = o.subscription;
  const b = o.business;

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
      title: 'Finish your profile',
      body: 'Complete profiles show up in more searches.',
      cta: 'Complete now',
      art: BANNER_ART.profile,
      onPress: () => go('/business-console/listing'),
    });
  }

  return slides;
}

function ShopCard({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
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
  const plan = subscription.isActive ? subscription.planName : 'Free';
  const actions: { label: string; icon: IconName; onPress: () => void }[] = [
    {
      label: 'Preview',
      icon: 'eye-outline',
      onPress: () => askStorefrontPreview(router, business.id),
    },
    {
      label: 'Share',
      icon: 'share-social-outline',
      onPress: () =>
        void Share.share({ message: `Find ${business.name} on FinderB: ${PUBLIC_SITE}${business.profilePath}` }),
    },
    { label: 'Edit', icon: 'create-outline', onPress: () => go('/business-console/listing') },
    { label: 'Photos', icon: 'images-outline', onPress: () => go('/business-console/photos') },
  ];

  return (
    <Panel style={styles.shop}>
      <View style={styles.shopRow}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.shopPhoto} contentFit="cover" alt={`${business.name} photo`} />
        ) : (
          <View style={[styles.shopPhoto, styles.shopInitials]}>
            <Text style={styles.shopInitialsText}>{initials}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={styles.shopName} numberOfLines={1}>
              {business.name}
            </Text>
            {business.verifiedBadge ? <Ionicons name="checkmark-circle" size={16} color={c.success} /> : null}
          </View>
          {place ? (
            <Text style={styles.shopMeta} numberOfLines={1}>
              {place}
            </Text>
          ) : null}
          <View style={styles.tags}>
            <Tag
              label={business.isLive ? 'Live' : business.statusLabel || business.status}
              tone={business.isLive ? 'success' : 'warning'}
              icon={business.isLive ? 'radio-button-on' : 'time-outline'}
            />
            <Tag label={`${plan} plan`} tone={subscription.isActive ? 'info' : 'neutral'} />
            {rating.rated ? <Tag label={`★ ${rating.label}`} tone="neutral" /> : null}
          </View>
        </View>
      </View>
      <View style={styles.shopActions}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [styles.shopAction, index > 0 && styles.shopActionLine, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name={action.icon} size={17} color={c.primary} />
            <Text style={styles.shopActionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </Panel>
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
            Your profile is complete and your plan is active. That helps you rank better in search results.
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

function RecentLeads({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  return (
    <Section title="Recent leads" action="See all" onAction={() => go('/business-console/leads')}>
      <Panel flush>
        {o.leads.length ? (
          o.leads.slice(0, 3).map((lead, index) => (
            <Pressable
              key={lead.id}
              onPress={() => go('/business-console/leads')}
              style={({ pressed }) => [styles.lead, index > 0 && styles.rowLine, pressed && styles.rowPressed]}
              accessibilityRole="button"
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(lead.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.leadName} numberOfLines={1}>
                  {lead.name || 'Customer'}
                </Text>
                <Text style={styles.leadMeta} numberOfLines={1}>
                  {lead.locked ? 'Upgrade to see contact' : lead.category || 'Customer enquiry'}
                  {lead.created_at ? ` · ${timeAgo(lead.created_at)}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <LeadSourceBadge lead={lead} />
                <Tag label={pipelineOf(lead.status)} tone={LEAD_STATUS_TONE[pipelineOf(lead.status)] ?? 'neutral'} />
              </View>
            </Pressable>
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
          <View style={styles.quote}>
            <Text style={styles.quoteText} numberOfLines={2}>
              “{latest.content}”
            </Text>
            <Text style={styles.quoteBy}>
              {latest.author}
              {latest.date ? ` · ${timeAgo(latest.date)}` : ''}
            </Text>
          </View>
        ) : (
          <Text style={[styles.quoteText, styles.quoteEmpty]}>
            Ask happy customers to rate you — share your listing link after a sale.
          </Text>
        )}
      </Panel>
    </Section>
  );
}

function PlanCard({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const sub = o.subscription;
  if (sub.isActive) {
    return (
      <Pressable onPress={() => go('/business-console/plan')} style={({ pressed }) => [styles.planRow, pressed && styles.pressed]}>
        <View style={[styles.missingIcon, { backgroundColor: c.successSoft }]}>
          <Ionicons name="ribbon-outline" size={17} color={c.success} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.missingLabel}>{sub.planName} plan active</Text>
          <Text style={styles.missingDetail}>
            {sub.expiresAtDisplay ? `Valid till ${sub.expiresAtDisplay}` : 'Lead contacts unlocked'}
            {sub.daysRemaining != null ? ` · ${sub.daysRemaining} days left` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.faint} />
      </Pressable>
    );
  }
  const perks = ['See every lead’s phone number', 'Rank higher in your city', 'Verified badge on your listing'];
  return (
    <Panel style={styles.planPanel}>
      <View style={styles.planTop}>
        <View style={styles.flex}>
          <Text style={styles.planKicker}>{sub.isExpired ? 'Plan expired' : 'You’re on the Free plan'}</Text>
          <Text style={styles.planTitle}>Turn views into paying customers</Text>
        </View>
        <Ionicons name="rocket-outline" size={22} color={c.brand} />
      </View>
      {perks.map((perk) => (
        <View key={perk} style={styles.perk}>
          <Ionicons name="checkmark-circle" size={15} color={c.success} />
          <Text style={styles.perkText}>{perk}</Text>
        </View>
      ))}
      <Btn label={sub.isExpired ? 'Renew plan' : 'See plans'} icon="arrow-forward" onPress={() => go('/business-console/plan')} style={styles.planBtn} />
    </Panel>
  );
}

function QuickActions({ go }: { go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const actions: { label: string; icon: IconName; href: Href }[] = [
    { label: 'Details', icon: 'create-outline', href: '/business-console/listing' },
    { label: 'Photos', icon: 'images-outline', href: '/business-console/photos' },
    { label: 'Timings', icon: 'time-outline', href: editHref('hours') },
    { label: 'Offers', icon: 'pricetags-outline', href: editHref('offers') },
    { label: 'Jobs', icon: 'briefcase-outline', href: '/business-console/jobs' },
    { label: 'Plan', icon: 'card-outline', href: '/business-console/plan' },
    { label: 'Alerts', icon: 'notifications-outline', href: '/business-console/alerts' },
    { label: 'Security', icon: 'shield-checkmark-outline', href: '/business-console/account' },
  ];
  return (
    <Panel style={styles.actionsPanel}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => go(action.href)}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <View style={styles.actionIcon}>
            <Ionicons name={action.icon} size={20} color={c.primary} />
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </Panel>
  );
}

function HomeBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { refresh, refreshing } = useMerchantConsole();
  const [qrOpen, setQrOpen] = useState(false);
  const go: Go = (href) => openConsolePath(router, href);
  const slides = bannersFor(o, go, () => setQrOpen(true));
  const firstName = (o.business.ownerName || '').trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
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
      <Text style={styles.greeting}>{`${greeting}${firstName ? `, ${firstName}` : ''}`}</Text>
      <Pressable
        onPress={() => go('/business-console/growth')}
        style={({ pressed }) => [styles.growthBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Growth opportunity"
      >
        <View style={styles.growthIcon}>
          <Ionicons name="ribbon-outline" size={18} color={c.primaryInk} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.growthTitle}>Growth opportunity</Text>
          <Text style={styles.growthSub}>See the badges customers see, and how to earn them</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.faint} />
      </Pressable>
      {o.detailsLockedUntil ? (
        <View style={styles.lockBanner}>
          <Text style={styles.lockTitle}>Details locked for 15 days</Text>
          <Text style={styles.lockBody}>
            {`This listing was just transferred. You can change business details after ${new Date(o.detailsLockedUntil).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`}
          </Text>
        </View>
      ) : null}
      <ShopCard o={o} go={go} />
      {slides.length ? <AlertCarousel slides={slides} /> : null}
      <Section title="Performance">
        <Performance o={o} go={go} />
      </Section>
      <MissingInfo o={o} go={go} />
      <RecentLeads o={o} go={go} />
      <ReviewsSnapshot o={o} go={go} />
      <Section title="Your plan">
        <PlanCard o={o} go={go} />
      </Section>
      <Section title="Manage">
        <QuickActions go={go} />
      </Section>
      <Text style={styles.footNote}>App is managed by FinderB Business.</Text>
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
  growthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  growthIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  growthTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  growthSub: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.body },
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

  shop: { padding: 0, overflow: 'hidden' },
  shopRow: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12 },
  shopPhoto: { width: 56, height: 56, borderRadius: 10, backgroundColor: c.sunken },
  shopInitials: { alignItems: 'center', justifyContent: 'center' },
  shopInitialsText: { fontFamily: fonts.semiBold, fontSize: 19, color: c.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shopName: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  shopMeta: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  shopActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line },
  shopAction: { flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  shopActionLine: { borderLeftWidth: 1, borderLeftColor: c.line },
  shopActionText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.primary },

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
  quoteBy: { marginTop: 4, fontFamily: fonts.regular, fontSize: 11.5, color: c.muted },

  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  planPanel: { gap: 6 },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  planKicker: { fontFamily: fonts.semiBold, fontSize: 11.5, color: c.brand },
  planTitle: { marginTop: 2, fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontFamily: fonts.regular, fontSize: 13, color: c.body },
  planBtn: { marginTop: 8 },

  actionsPanel: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4, paddingVertical: 8 },
  action: { width: '25%', alignItems: 'center', gap: 6, paddingVertical: 8 },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  actionLabel: { fontFamily: fonts.regular, fontSize: 11.5, color: c.body },
  footNote: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 11, color: c.faint },
}));
