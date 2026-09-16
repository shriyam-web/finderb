import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fonts } from '../../constants/typography';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { SITE_URL } from '../../lib/supabase';

const POINTS = [
  'Appear in local category search',
  'Share phone, address, and timings',
  'Collect reviews from customers',
  'Manage your listing anytime',
];

export default function BusinessScreen() {
  const styles = useStyles();
  const scrollBottomPad = useTabScrollPadding(24);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Business</Text>
          <Text style={styles.subtitle}>
            List your business on FinderB and get found by people nearby.
          </Text>

          <View style={styles.points}>
            {POINTS.map((point) => (
              <Text key={point} style={styles.point}>
                ·  {point}
              </Text>
            ))}
          </View>

          <PrimaryButton
            label="Register business"
            onPress={() => Linking.openURL(`${SITE_URL}/business/register`)}
            style={styles.cta}
          />
          <PrimaryButton
            label="Business login"
            onPress={() => Linking.openURL(`${SITE_URL}/business/dashboard`)}
            variant="secondary"
          />

          <Pressable
            style={styles.helpRow}
            onPress={() => Linking.openURL(`${SITE_URL}/advertisements`)}
          >
            <Text style={styles.helpText}>Advertising options</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.heading,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  points: {
    gap: 10,
    marginBottom: 24,
  },
  point: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  cta: {
    marginBottom: 10,
  },
  helpRow: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 8,
  },
  helpText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
  },
}));
