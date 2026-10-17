import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { ConsoleGate } from '../../components/console/ConsoleGate';
import { BadgeLabel } from '../../components/PublicBadgeRow';
import { LivingFire } from '../../components/LivingFire';
import { ConsolePage, Panel, createConsoleStyles } from '../../components/console/kit';
import type { ConsoleOverview } from '../../lib/merchantConsoleApi';

type BadgeId = 'verified' | 'best' | 'quickReply' | 'highlyRated' | 'popularMonth' | 'newOnFinderB' | 'trusted';

type Look = {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  border: string;
  ink: string;
  iconColor: string;
  wash: string;
};

const LOOK: Record<BadgeId, Look> = {
  verified: { icon: 'checkmark', bg: '#16A34A', border: '#16A34A', ink: '#FFFFFF', iconColor: '#FFFFFF', wash: '#F0FDF4' },
  best: { icon: 'flame', bg: '#FFF7ED', border: '#FDBA74', ink: '#9A3412', iconColor: '#EA580C', wash: '#FFF7ED' },
  quickReply: { icon: 'flash', bg: 'transparent', border: 'transparent', ink: '#44403C', iconColor: '#059669', wash: 'transparent' },
  highlyRated: { icon: 'star', bg: 'transparent', border: 'transparent', ink: '#44403C', iconColor: '#D97706', wash: 'transparent' },
  popularMonth: { icon: 'trending-up', bg: 'transparent', border: 'transparent', ink: '#44403C', iconColor: '#E11D48', wash: 'transparent' },
  newOnFinderB: { icon: 'leaf', bg: 'transparent', border: 'transparent', ink: '#44403C', iconColor: '#0F766E', wash: 'transparent' },
  trusted: { icon: 'shield-checkmark', bg: '#12263A', border: '#C6A15B', ink: '#FFFFFF', iconColor: '#12263A', wash: 'transparent' },
};

const CARDS: {
  id: BadgeId;
  title: string;
  chip: string;
  eligibility: string[];
  benefits: string[];
}[] = [
  {
    id: 'verified',
    title: 'Verified on FinderB',
    chip: 'Verified',
    eligibility: [
      'FinderB reviews the business and confirms the identity and listing details.',
      'This tick is awarded by FinderB. A business cannot turn it on from the app.',
    ],
    benefits: [
      'A green tick appears beside the business name on the public profile.',
      'The same tick shows in search results and category lists.',
    ],
  },
  {
    id: 'best',
    title: 'Best in Category',
    chip: 'Best in Category',
    eligibility: [
      'Public rating is 4 or above.',
      'At least 3 reviews are visible.',
      'Average reply time is within about 4 hours.',
      'Profile completion is above 90%.',
      'FinderB can force this mark on or off for this business.',
    ],
    benefits: [
      'The fire mark appears on the public profile, under the category line.',
      'Customers see the business as a strong choice in its category.',
    ],
  },
  {
    id: 'quickReply',
    title: 'Quick reply',
    chip: 'Quick reply',
    eligibility: [
      'Average reply time on leads is within 1 hour.',
      'At least 5 leads have been opened.',
    ],
    benefits: [
      'The chip appears on the public profile, beside the usual reply time.',
      'It is stricter than Best in Category, which allows about 4 hours.',
    ],
  },
  {
    id: 'highlyRated',
    title: 'Highly rated',
    chip: 'Highly rated',
    eligibility: ['Public rating is 4.7 or above.', 'At least 10 reviews are visible.'],
    benefits: [
      'The chip appears on the public profile.',
      'It follows review quality only, so a loved shop can earn it even with a slower reply.',
    ],
  },
  {
    id: 'popularMonth',
    title: 'Popular this month',
    chip: 'Popular this month',
    eligibility: [
      'This calendar month, the listing has the most profile views or the most leads among active businesses in the same category and city.',
      'Zero views and zero leads do not qualify.',
      'It resets when the month changes or another business moves ahead.',
    ],
    benefits: [
      'The chip appears on the public profile.',
      'Customers see which nearby listing people are opening and contacting right now.',
    ],
  },
  {
    id: 'newOnFinderB',
    title: 'New on FinderB',
    chip: 'New on FinderB',
    eligibility: ['The listing has been live for fewer than 30 days.'],
    benefits: [
      'The chip appears on the public profile.',
      'A new business can be noticed before it has the reviews for Highly rated or Best in Category.',
    ],
  },
  {
    id: 'trusted',
    title: 'FinderB Trusted',
    chip: 'FinderB Trusted',
    eligibility: [
      'FinderB awards this badge. Ratings, replies, and time on the platform do not turn it on.',
      'An admin can switch it on or off for this business.',
    ],
    benefits: [
      'The chip appears on the public profile.',
      'It is separate from the green tick, which only confirms identity.',
    ],
  },
];

function bestIsOn(o: ConsoleOverview): boolean {
  const responseMs = o.stats.averageResponseMs;
  return (
    (o.stats.rating ?? 0) >= 4 &&
    o.stats.reviewCount >= 3 &&
    responseMs != null &&
    responseMs <= 4 * 60 * 60 * 1000 &&
    o.completion.percent > 90
  );
}

function cardState(id: BadgeId, o: ConsoleOverview): { on: boolean; detail: string } {
  if (id === 'verified') {
    return {
      on: Boolean(o.business.verifiedBadge),
      detail: o.business.verifiedBadge ? 'FinderB has confirmed this listing.' : 'Waiting for a FinderB review.',
    };
  }
  if (id === 'best') {
    const live = (o.badges || []).find((badge) => badge.id === 'bestInCategory');
    if (live) return { on: live.active, detail: live.detail };
    const on = bestIsOn(o);
    return {
      on,
      detail: on
        ? 'Rating, replies, and profile completion all clear the bar.'
        : `${o.stats.rating?.toFixed(1) ?? 'No'} rating · ${o.stats.reviewCount} reviews · profile ${o.completion.percent}%.`,
    };
  }
  const live = (o.badges || []).find((badge) => badge.id === id);
  if (!live) return { on: false, detail: 'Opens once your listing numbers are in.' };
  return { on: live.active, detail: live.detail };
}

function Sample({ id, label }: { id: BadgeId; label: string }) {
  const styles = useStyles();
  const look = LOOK[id];
  if (id === 'verified') {
    return (
      <View style={[styles.sampleWash, { backgroundColor: look.wash }]}>
        <Text style={styles.sampleName}>Your business</Text>
        <View style={styles.verifiedDot}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      </View>
    );
  }
  if (id === 'best') {
    return (
      <View style={[styles.sampleWash, { backgroundColor: look.wash }]}>
        <LivingFire />
        <Text style={styles.bestText}>{label}</Text>
      </View>
    );
  }
  if (id === 'trusted') {
    return (
      <View style={styles.trusted}>
        <View style={styles.medallion}>
          <Ionicons name="shield-checkmark" size={12} color={look.iconColor} />
        </View>
        <Text style={styles.trustedFinder}>FinderB </Text>
        <Text style={styles.trustedWord}>Trusted</Text>
      </View>
    );
  }
  const delay = id === 'highlyRated' ? 450 : id === 'popularMonth' ? 900 : id === 'newOnFinderB' ? 1350 : 0;
  return (
    <View style={styles.mark}>
      <Ionicons name={look.icon} size={15} color={look.iconColor} />
      <BadgeLabel delay={delay} style={[styles.chipText, { color: look.ink }]}>
        {label}
      </BadgeLabel>
    </View>
  );
}

function GrowthBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();

  return (
    <ConsolePage title="Growth opportunity" subtitle="Badges customers see on your public profile" docked>
      <Text style={styles.intro}>
        These badges show on your public profile when you qualify. FinderB can switch any of them on or off for your business, including Best in Category.
      </Text>
      {CARDS.map((card) => {
        const state = cardState(card.id, o);
        return (
          <Panel key={card.id} style={styles.card}>
            <Sample id={card.id} label={card.chip} />
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <View style={[styles.status, state.on ? styles.statusOn : styles.statusOff]}>
                <Text style={[styles.statusText, { color: state.on ? c.success : c.muted }]}>
                  {state.on ? 'On your profile' : 'Not yet'}
                </Text>
              </View>
            </View>
            <Text style={styles.detail}>{state.detail}</Text>
            <Text style={styles.blockLabel}>How to earn it</Text>
            {card.eligibility.map((line) => (
              <View key={line} style={styles.line}>
                <Ionicons name="ellipse" size={6} color={c.primary} style={styles.dot} />
                <Text style={styles.lineText}>{line}</Text>
              </View>
            ))}
            <Text style={styles.blockLabel}>What customers see</Text>
            {card.benefits.map((line) => (
              <View key={line} style={styles.line}>
                <Ionicons name="checkmark" size={14} color={c.success} style={styles.check} />
                <Text style={styles.lineText}>{line}</Text>
              </View>
            ))}
          </Panel>
        );
      })}
    </ConsolePage>
  );
}

export default function GrowthOpportunityScreen() {
  return <ConsoleGate>{(overview) => <GrowthBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  intro: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: c.body,
    paddingHorizontal: 2,
  },
  card: { gap: 8 },
  sampleWash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  sampleName: { fontFamily: fonts.extraBold, fontSize: 18, color: c.ink },
  verifiedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  bestText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#9A3412' },
  mark: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: -0.15 },
  trusted: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#12263A',
    paddingLeft: 3,
    paddingRight: 12,
    paddingVertical: 3,
  },
  medallion: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6A15B',
    marginRight: 6,
  },
  trustedFinder: { fontFamily: fonts.semiBold, fontSize: 13, color: '#FFFFFF' },
  trustedWord: { fontFamily: fonts.medium, fontSize: 13, color: '#F3E2B3' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusOn: { backgroundColor: c.successSoft },
  statusOff: { backgroundColor: c.sunken },
  statusText: { fontFamily: fonts.semiBold, fontSize: 11 },
  detail: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body },
  blockLabel: { marginTop: 4, fontFamily: fonts.semiBold, fontSize: 13, color: c.ink },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { marginTop: 6 },
  check: { marginTop: 2 },
  lineText: { flex: 1, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: c.body },
}));
