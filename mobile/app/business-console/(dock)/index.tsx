import { Pressable, Share, Text, View } from 'react-native';
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
import { LEAD_STATUS_TONE } from '../../../components/console/leadStatus';
import { LISTING_SECTIONS } from '../../../components/console/listingSections';

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

function bannersFor(o: ConsoleOverview, go: Go): AlertSlide[] {
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

function VerifyWarning({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const b = o.business;
  if (b.emailVerified && b.mobileVerified) return null;
  const pending = [!b.mobileVerified && 'mobile number', !b.emailVerified && 'email'].filter(Boolean).join(' and ');
  return (
    <Pressable
      onPress={() => go('/business-console/account')}
      style={({ pressed }) => [styles.warn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Verify your ${pending}. Your visibility will drop until you do.`}
    >
      <View style={styles.warnIcon}>
        <Ionicons name="trending-down" size={18} color={c.warning} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.warnTitle}>Your visibility will drop</Text>
        <Text style={styles.warnBody}>
          Verify your {pending} soon. Unverified businesses rank lower in search and get fewer calls and leads.
        </Text>
      </View>
      <View style={styles.warnCta}>
        <Text style={styles.warnCtaText}>Verify</Text>
      </View>
    </Pressable>
  );
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
      onPress: () => router.push({ pathname: '/(tabs)/merchant/[id]', params: { id: business.id, preview: '1' } }),
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

function Performance({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const s = o.stats;
  // Average week across the 23 days before this one.
  const priorWeekly = (Math.max(0, s.views30d - s.views7d) * 7) / 23;
  const trend = priorWeekly >= 1 ? Math.round(((s.views7d - priorWeekly) / priorWeekly) * 100) : null;
  const figures = [
    { label: 'Today', value: n(s.viewsToday) },
    { label: '7 days', value: n(s.views7d) },
    { label: 'Visitors', value: n(s.visitors30d) },
    { label: 'All time', value: n(s.viewsAllTime) },
  ];
  const funnel: { label: string; value: string; note: string; href: Href }[] = [
    { label: 'Leads', value: n(s.leadsTotal), note: `${s.leads7d} this week`, href: '/business-console/leads' },
    { label: 'New', value: n(s.leadsNew), note: s.leadsNew ? 'Reply now' : 'All caught up', href: '/business-console/leads' },
    {
      label: 'Won',
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
    <Panel>
      <View style={styles.perfHead}>
        <View style={styles.flex}>
          <Text style={styles.label}>Profile views · 30 days</Text>
          <View style={styles.perfValueRow}>
            <Text style={styles.perfValue}>{n(s.views30d)}</Text>
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
        <ViewsChart days={s.viewsDaily} />
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
    </Panel>
  );
}

function MissingInfo({ o, go }: { o: ConsoleOverview; go: Go }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const pct = o.completion.percent;
  const missing = o.completion.missing;
  const blocked = o.health.items.filter((item) => item.status === 'blocked' || item.status === 'review');
  if (pct >= 100 && !blocked.length) return null;
  const shown = missing.slice(0, 6);

  return (
    <Section title="Missing info" action={missing.length > shown.length ? `+${missing.length - shown.length} more` : 'All details'} onAction={() => go('/business-console/listing')}>
      <Panel flush>
        <View style={styles.strength}>
          <View style={styles.strengthHead}>
            <Text style={styles.strengthValue}>{pct}%</Text>
            <Text style={styles.strengthNote} numberOfLines={2}>
              {missing.length
                ? `${missing.length} detail${missing.length === 1 ? '' : 's'} missing. Each one you add helps you show up in more searches.`
                : o.health.headline}
            </Text>
          </View>
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${Math.max(3, pct)}%` }]} />
          </View>
        </View>
        {blocked.map((item) => (
          <View key={item.id} style={[styles.missingRow, styles.rowLine]}>
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
          </View>
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
                  {lead.locked ? 'Upgrade to see contact' : lead.phone || lead.email || lead.category}
                  {lead.created_at ? ` · ${timeAgo(lead.created_at)}` : ''}
                </Text>
              </View>
              <Tag label={lead.status} tone={LEAD_STATUS_TONE[lead.status] ?? 'neutral'} />
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
  const router = useRouter();
  const { refresh, refreshing } = useMerchantConsole();
  const go: Go = (href) => router.push(href);
  const slides = bannersFor(o, go);
  const firstName = (o.business.ownerName || '').trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ConsolePage
      title="Home"
      subtitle={`${greeting}${firstName ? `, ${firstName}` : ''}`}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/business' as Href))}
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
      <VerifyWarning o={o} go={go} />
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
      <Text style={styles.footNote}>Pull down to refresh · Numbers update every few minutes</Text>
    </ConsolePage>
  );
}

export default function HomeScreen() {
  return <ConsoleGate>{(overview) => <HomeBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  rowPressed: { backgroundColor: c.sunken },
  rowLine: { borderTopWidth: 1, borderTopColor: c.line },
  label: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },

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
