import { Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { getRatingDisplay } from '../../../lib/ratingDisplay';
import type { ConsoleOverview } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import { AlertCarousel, type AlertSlide } from '../../../components/console/AlertCarousel';
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

function alertsFor(o: ConsoleOverview, go: (href: Href) => void): AlertSlide[] {
  const slides: AlertSlide[] = [];
  const sub = o.subscription;
  const b = o.business;

  if (!o.hasPublicPhoto) {
    slides.push({
      key: 'photo',
      tone: 'danger',
      icon: 'eye-off-outline',
      title: 'Your listing is hidden from customers',
      body: 'Add at least one photo of your shop or work to go public on FinderB.',
      cta: 'Add photos',
      onPress: () => go('/business-console/photos'),
    });
  }

  if (sub.isPendingPayment) {
    slides.push({
      key: 'pending-payment',
      tone: 'info',
      icon: 'hourglass-outline',
      title: 'Payment is being confirmed',
      body: 'Your plan switches on as soon as the bank confirms the payment.',
      cta: 'Check status',
      onPress: () => go('/business-console/plan'),
    });
  } else if (sub.alertLevel === 'expired') {
    slides.push({
      key: 'expired',
      tone: 'danger',
      icon: 'alert-circle-outline',
      title: `${sub.lastPlanName || 'Your'} plan has expired`,
      body: 'Customer phone numbers are hidden again. Renew to keep getting full leads.',
      cta: 'Renew plan',
      onPress: () => go('/business-console/plan'),
    });
  } else if (sub.isActive && (sub.alertLevel === 'urgent' || sub.alertLevel === 'warning')) {
    slides.push({
      key: 'renew',
      tone: sub.alertLevel === 'urgent' ? 'danger' : 'warning',
      icon: 'time-outline',
      title: `${sub.planName} plan ends in ${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'}`,
      body: sub.autoRenewEnabled
        ? 'Auto-renew is on. Nothing to do unless you want to change plans.'
        : 'Renew now so your leads stay unlocked.',
      cta: sub.autoRenewEnabled ? 'View plan' : 'Renew now',
      onPress: () => go('/business-console/plan'),
    });
  } else if (!sub.isActive) {
    slides.push({
      key: 'upgrade',
      tone: 'info',
      icon: 'rocket-outline',
      title: 'See who wants to reach you',
      body: 'On the free plan, lead phone numbers stay hidden. Growth or Pro shows them instantly.',
      cta: 'See plans',
      onPress: () => go('/business-console/plan'),
    });
  }

  if (!b.emailVerified || !b.mobileVerified) {
    const what = !b.emailVerified && !b.mobileVerified ? 'email and mobile' : !b.emailVerified ? 'email' : 'mobile number';
    slides.push({
      key: 'verify',
      tone: 'warning',
      icon: 'shield-checkmark-outline',
      title: `Verify your ${what}`,
      body: 'Keeps your account recoverable and lets customers and FinderB reach you.',
      cta: 'Verify now',
      onPress: () => go('/business-console/account'),
    });
  }

  if (o.stats.leadsNew > 0) {
    slides.push({
      key: 'leads',
      tone: 'success',
      icon: 'people-outline',
      title: `${o.stats.leadsNew} new lead${o.stats.leadsNew === 1 ? '' : 's'} waiting`,
      body: 'Reply quickly. The first business to respond usually wins the customer.',
      cta: 'Open leads',
      onPress: () => go('/business-console/leads'),
    });
  }

  if (o.completion.percent < 100) {
    const next = o.completion.missing.slice(0, 2).map((field) => field.label.toLowerCase());
    slides.push({
      key: 'profile',
      tone: 'info',
      icon: 'create-outline',
      title: `Your profile is ${o.completion.percent}% complete`,
      body: next.length ? `Add ${next.join(' and ')} to show up in more searches.` : 'A few details are still missing.',
      cta: 'Complete profile',
      onPress: () => go('/business-console/listing'),
    });
  }

  return slides;
}

function ShopCard({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { business, photos, subscription } = o;
  const cover = photos.cover || photos.images[0] || null;
  const place = [business.category, business.city].filter(Boolean).join(' · ');
  const initials =
    business.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'B';
  const plan = subscription.isActive ? `${subscription.planName} plan` : 'Free plan';

  return (
    <Panel>
      <View style={styles.shopRow}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.shopPhoto} contentFit="cover" alt={`${business.name} photo`} />
        ) : (
          <View style={[styles.shopPhoto, styles.shopInitials]}>
            <Text style={styles.shopInitialsText}>{initials}</Text>
          </View>
        )}
        <View style={styles.shopCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.shopName} numberOfLines={1}>
              {business.name}
            </Text>
            {business.verifiedBadge ? <Ionicons name="checkmark-circle" size={16} color={c.accent} /> : null}
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
            <Tag label={plan} tone={subscription.isActive ? 'info' : 'neutral'} />
          </View>
        </View>
      </View>
      <View style={styles.shopActions}>
        <Btn
          small
          tone="outline"
          icon="eye-outline"
          label="View storefront"
          style={styles.flex}
          onPress={() => router.push({ pathname: '/(tabs)/merchant/[id]', params: { id: business.id, preview: '1' } })}
        />
        <Btn
          small
          tone="outline"
          icon="share-social-outline"
          label="Share"
          style={styles.flex}
          onPress={() =>
            void Share.share({
              message: `Find ${business.name} on FinderB: ${PUBLIC_SITE}${business.profilePath}`,
            })
          }
        />
      </View>
    </Panel>
  );
}

function Performance({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const s = o.stats;
  const figures = [
    { label: 'Today', value: s.viewsToday },
    { label: 'Last 7 days', value: s.views7d },
    { label: 'Unique visitors', value: s.visitors30d },
  ];
  return (
    <Panel>
      <View style={styles.perfHead}>
        <View>
          <Text style={styles.perfLabel}>Profile views</Text>
          <Text style={styles.perfValue}>{s.views30d.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={styles.perfRange}>Last 30 days</Text>
      </View>
      <View style={styles.chart}>
        <ViewsChart days={s.viewsDaily} />
      </View>
      <View style={styles.figures}>
        {figures.map((figure, index) => (
          <View key={figure.label} style={[styles.figure, index > 0 && styles.figureLine]}>
            <Text style={styles.figureValue}>{figure.value.toLocaleString('en-IN')}</Text>
            <Text style={styles.figureLabel}>{figure.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.perfFoot}>
        {s.viewsAllTime.toLocaleString('en-IN')} views since you joined · unique visitors counted over 30 days
      </Text>
    </Panel>
  );
}

function StatGrid({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const s = o.stats;
  const rating = getRatingDisplay(s.rating, s.reviewCount);
  const tiles: { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; value: string; note: string; href: Href }[] = [
    {
      key: 'leads',
      icon: 'people-outline',
      label: 'Total leads',
      value: s.leadsTotal.toLocaleString('en-IN'),
      note: s.leads7d ? `${s.leads7d} this week` : 'None this week',
      href: '/business-console/leads',
    },
    {
      key: 'new',
      icon: 'mail-unread-outline',
      label: 'New leads',
      value: String(s.leadsNew),
      note: s.leadsNew ? 'Waiting for reply' : 'All caught up',
      href: '/business-console/leads',
    },
    {
      key: 'rating',
      icon: 'star-outline',
      label: 'Rating',
      value: rating.rated ? rating.label : '–',
      note: s.reviewCount ? `${s.reviewCount} review${s.reviewCount === 1 ? '' : 's'}` : 'No reviews yet',
      href: '/business-console/reviews',
    },
    {
      key: 'converted',
      icon: 'checkmark-done-outline',
      label: 'Converted',
      value: String(s.leadsConverted),
      note: s.leadsTotal ? `${Math.round((s.leadsConverted / s.leadsTotal) * 100)}% of leads` : 'No leads yet',
      href: '/business-console/leads',
    },
  ];
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          onPress={() => router.push(tile.href)}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${tile.label}: ${tile.value}. ${tile.note}`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <Ionicons name={tile.icon} size={17} color={c.faint} />
          </View>
          <Text style={styles.tileValue}>{tile.value}</Text>
          <Text style={styles.tileNote} numberOfLines={1}>
            {tile.note}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function QuickActions() {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const actions: { label: string; icon: keyof typeof Ionicons.glyphMap; href: Href }[] = [
    { label: 'Edit profile', icon: 'create-outline', href: '/business-console/listing' },
    { label: 'Photos', icon: 'images-outline', href: '/business-console/photos' },
    { label: 'Jobs', icon: 'briefcase-outline', href: '/business-console/jobs' },
    { label: 'Plan', icon: 'card-outline', href: '/business-console/plan' },
  ];
  return (
    <View style={styles.actions}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => router.push(action.href)}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <View style={styles.actionIcon}>
            <Ionicons name={action.icon} size={21} color={c.primary} />
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function HomeBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { refresh, refreshing } = useMerchantConsole();
  const slides = alertsFor(o, (href) => router.push(href));
  const openHealth = o.health.items.filter((item) => item.status !== 'complete').slice(0, 3);
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
          onPress={() => router.push('/business-console/alerts')}
        />
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <ShopCard o={o} />

      {slides.length ? <AlertCarousel slides={slides} /> : null}

      <Section title="Performance">
        <Performance o={o} />
        <StatGrid o={o} />
      </Section>

      <Section title="Recent leads" action="See all" onAction={() => router.push('/business-console/leads')}>
        <Panel flush>
          {o.leads.length ? (
            o.leads.slice(0, 4).map((lead, index) => (
              <Pressable
                key={lead.id}
                onPress={() => router.push('/business-console/leads')}
                style={({ pressed }) => [styles.lead, index > 0 && styles.leadLine, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={styles.leadMark}>
                  <Text style={styles.leadInitial}>{(lead.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.leadCopy}>
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
            <Text style={styles.none}>No leads yet. They’ll show up here the moment a customer contacts you.</Text>
          )}
        </Panel>
      </Section>

      <Section title="Profile strength" action="Improve" onAction={() => router.push('/business-console/listing')}>
        <Panel>
          <View style={styles.strengthHead}>
            <Text style={styles.strengthValue}>{o.completion.percent}%</Text>
            <Text style={styles.strengthNote}>{o.health.headline}</Text>
          </View>
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${Math.max(3, o.completion.percent)}%` }]} />
          </View>
          {openHealth.map((item) => (
            <View key={item.id} style={styles.healthItem}>
              <Ionicons
                name={item.status === 'blocked' ? 'close-circle' : item.status === 'review' ? 'time' : 'ellipse-outline'}
                size={16}
                color={item.status === 'blocked' ? c.danger : item.status === 'review' ? c.accent : c.warning}
              />
              <View style={styles.flex}>
                <Text style={styles.healthLabel}>{item.label}</Text>
                <Text style={styles.healthDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </Panel>
      </Section>

      <Section title="Quick actions">
        <QuickActions />
      </Section>
    </ConsolePage>
  );
}

export default function HomeScreen() {
  return <ConsoleGate>{(overview) => <HomeBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  shopRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  shopPhoto: { width: 60, height: 60, borderRadius: 12, backgroundColor: c.sunken },
  shopInitials: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft },
  shopInitialsText: { fontFamily: fonts.semiBold, fontSize: 20, color: c.primary },
  shopCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shopName: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 17, color: c.ink },
  shopMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  shopActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  perfHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  perfLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  perfValue: { marginTop: 2, fontFamily: fonts.semiBold, fontSize: 28, color: c.ink },
  perfRange: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.muted,
    backgroundColor: c.sunken,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chart: { marginTop: 18 },
  figures: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  figure: { flex: 1, alignItems: 'center' },
  figureLine: { borderLeftWidth: 1, borderLeftColor: c.line },
  figureValue: { fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  figureLabel: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  perfFoot: { marginTop: 12, fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16, color: c.faint, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
    padding: 14,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  tileValue: { marginTop: 8, fontFamily: fonts.semiBold, fontSize: 24, color: c.ink },
  tileNote: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: c.faint },
  lead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  leadLine: { borderTopWidth: 0.5, borderTopColor: c.line },
  leadMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  leadInitial: { fontFamily: fonts.semiBold, fontSize: 15, color: c.primary },
  leadCopy: { flex: 1, minWidth: 0 },
  leadName: { fontFamily: fonts.semiBold, fontSize: 14.5, color: c.ink },
  leadMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  none: { padding: 16, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: c.muted },
  strengthHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strengthValue: { fontFamily: fonts.semiBold, fontSize: 24, color: c.ink },
  strengthNote: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body },
  meter: { marginTop: 12, height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
  healthItem: { flexDirection: 'row', gap: 10, marginTop: 14 },
  healthLabel: { fontFamily: fonts.semiBold, fontSize: 13.5, color: c.ink },
  healthDetail: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.muted },
  actions: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  actionLabel: { fontFamily: fonts.regular, fontSize: 12, color: c.body },
}));
