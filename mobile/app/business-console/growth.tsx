import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { ConsolePage, Panel, createConsoleStyles } from '../../components/console/kit';

const BADGES = [
  {
    id: 'verified',
    title: 'Verified on FinderB',
    eligibility: [
      'FinderB reviews the business and confirms the identity and listing details.',
      'This tick is awarded by FinderB. A business cannot turn it on from the app.',
    ],
    benefits: [
      'A green tick appears beside the business name on the public profile.',
      'The same tick shows in search results and category lists.',
      'Customers can see that FinderB has checked this listing.',
    ],
  },
  {
    id: 'best',
    title: 'Best in Category',
    eligibility: [
      'Public rating is 4 or above.',
      'At least 3 reviews are visible.',
      'Average reply time is within about 4 hours.',
      'Profile completion is above 90%.',
    ],
    benefits: [
      'The fire badge appears on the public profile, under the category line.',
      'Customers see the business as a strong choice in its category.',
    ],
  },
] as const;

function VerifiedSample() {
  const styles = useStyles();
  return (
    <View style={styles.sampleRow}>
      <Text style={styles.sampleName}>Your business</Text>
      <View style={styles.verified}>
        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
      </View>
    </View>
  );
}

function BestSample() {
  const styles = useStyles();
  return (
    <View style={styles.sampleRow}>
      <Text style={styles.fire}>🔥</Text>
      <Text style={styles.bestText}>Best in Category</Text>
    </View>
  );
}

export default function GrowthOpportunityScreen() {
  const styles = useStyles();
  const c = useConsoleColors();

  return (
    <ConsolePage title="Growth opportunity" subtitle="Badges customers see on your public profile">
      <Text style={styles.intro}>
        These are the badges a customer sees on FinderB. Each one uses the same look as the public profile.
      </Text>
      {BADGES.map((badge) => (
        <Panel key={badge.id} style={styles.card}>
          <Text style={styles.kicker}>How it looks</Text>
          {badge.id === 'verified' ? <VerifiedSample /> : <BestSample />}
          <Text style={styles.cardTitle}>{badge.title}</Text>
          <Text style={styles.blockLabel}>Eligibility</Text>
          {badge.eligibility.map((line) => (
            <View key={line} style={styles.line}>
              <Ionicons name="ellipse" size={6} color={c.primary} style={styles.dot} />
              <Text style={styles.lineText}>{line}</Text>
            </View>
          ))}
          <Text style={styles.blockLabel}>Benefits</Text>
          {badge.benefits.map((line) => (
            <View key={line} style={styles.line}>
              <Ionicons name="checkmark" size={14} color={c.success} style={styles.check} />
              <Text style={styles.lineText}>{line}</Text>
            </View>
          ))}
        </Panel>
      ))}
    </ConsolePage>
  );
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
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: c.faint,
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: c.page,
  },
  sampleName: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: c.ink,
  },
  verified: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  fire: { fontSize: 14, lineHeight: 18 },
  bestText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: c.body,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: c.ink,
  },
  blockLabel: {
    marginTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: c.ink,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: { marginTop: 6 },
  check: { marginTop: 2 },
  lineText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: c.body,
  },
}));
