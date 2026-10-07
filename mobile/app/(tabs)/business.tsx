import { useRef } from 'react';
import { Href, useRouter, useScrollToTop } from 'expo-router';
import { Image } from 'expo-image';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bizColors, useBizColors } from '../../constants/businessColors';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { goBackOrHome } from '../../lib/navigation';
import { TabSwipeHost } from '../../lib/tabSwipe';
import type { AuthUser } from '../../lib/session';
import { SITE_URL } from '../../lib/supabase';

const PLANS = [
  {
    name: 'Starter',
    tagline: 'List your business and get discovered',
    price: '₹0',
    period: '',
    was: '',
    billed: '',
    note: 'Included',
    features: [
      'Basic business listing and profile',
      'Business name, address, and phone',
      'Up to 3 photos on your listing',
      'Standard search visibility',
    ],
  },
  {
    name: 'Growth',
    tagline: 'Full power, pay as you grow',
    price: '₹499',
    period: '/mo',
    was: '₹2,999/mo',
    billed: '',
    note: 'Everything in Starter, plus',
    features: [
      'Premium listing with a rich profile',
      'Verified partner badge',
      'Priority placement in local search',
      'Lead center with customer contact details',
      'Advanced analytics',
      'Unlimited photos',
      'SMS and email lead alerts',
      'Direct customer chat',
      '24/7 priority support',
    ],
  },
  {
    name: 'Pro',
    tagline: 'Best rate, billed once a year',
    price: '₹299',
    period: '/mo',
    was: '₹35,988/yr',
    billed: '₹3,588/yr',
    note: 'Everything in Growth, paid yearly',
    features: [],
  },
] as const;

type PlanName = (typeof PLANS)[number]['name'];

/** A completed payment that has not expired. Starter never counts. */
function hasActivePaidPlan(user: AuthUser | null | undefined): boolean {
  if (!user?.isBusinessAccount || user.paymentStatus !== 'completed') return false;
  if (!user.planExpiresAt) return true;
  const expires = new Date(user.planExpiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

const POINTS = [
  {
    icon: 'search' as const,
    title: 'Show up in search',
    body: 'When someone nearby looks for your category, your business can appear.',
  },
  {
    icon: 'call' as const,
    title: 'Take the call',
    body: 'Your public number is on the listing, so customers reach you directly.',
  },
  {
    icon: 'star' as const,
    title: 'Collect reviews',
    body: 'People who visit can rate you, and stronger reviews rise in results.',
  },
];

export default function BusinessScreen() {
  const styles = useStyles();
  const biz = useBizColors();
  const router = useRouter();
  const { user } = useAuth();
  const scrollBottomPad = useTabScrollPadding(28);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const isMerchant = Boolean(user?.isBusinessAccount);
  const onStarter = isMerchant && !hasActivePaidPlan(user);
  const visiblePlans = onStarter ? PLANS.filter((plan) => plan.name !== 'Starter') : PLANS;

  const upgrade = (plan: PlanName) => {
    const billing = plan === 'Pro' ? 'annual' : 'monthly';
    const id = user?.businessId;
    const url = id
      ? `${SITE_URL}/business/payment/${encodeURIComponent(id)}?billing=${billing}&checkout=1`
      : `${SITE_URL}/pricing`;
    void Linking.openURL(url);
  };

  return (
    <TabSwipeHost>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.kickerRow}>
                <Pressable
                  onPress={() => goBackOrHome(router)}
                  hitSlop={10}
                  style={styles.back}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={22} color={biz.ink} />
                </Pressable>
                <Image
                  source={require('../../assets/fb-mark-clear.png')}
                  style={styles.mark}
                  contentFit="contain"
                />
                <Text style={styles.kicker}>Business</Text>
              </View>
              <Text style={styles.heroTitle}>{isMerchant ? 'Your business' : 'List your business'}</Text>
              <Text style={styles.heroBody}>
                {isMerchant
                  ? 'Your business is listed on FinderB. People nearby can find your name, category, phone, and reviews.'
                  : 'People search FinderB for businesses near them. Register once so they can see your name, category, phone, and reviews.'}
              </Text>
              <View style={styles.portraitRow}>
                <View style={styles.portraitRing}>
                  <Image
                    source={require('../../assets/more/jobs-face.png')}
                    style={styles.portrait}
                    contentFit="cover"
                    contentPosition="top"
                  />
                </View>
                <View style={[styles.portraitRing, styles.portraitOverlap]}>
                  <Image
                    source={require('../../assets/more/blogs-face.png')}
                    style={styles.portrait}
                    contentFit="cover"
                    contentPosition="top"
                  />
                </View>
                <Text style={styles.portraitCopy}>Businesses already listed on FinderB</Text>
              </View>
            </View>

            <View style={styles.actions}>
              {isMerchant ? (
                <>
                  <Text style={styles.signedIn}>
                    Signed in as {user?.businessName || 'your business'}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() => router.push('/merchant-welcome' as Href)}
                  >
                    <Text style={styles.primaryText}>Open business dashboard</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    onPress={() => router.push('/(tabs)/business-register' as Href)}
                  >
                    <Text style={styles.primaryText}>Register your business</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                    onPress={() => router.push('/(tabs)/business-login' as Href)}
                  >
                    <Text style={styles.secondaryText}>Business login</Text>
                  </Pressable>
                </>
              )}
            </View>

            <Text style={styles.section}>{onStarter ? 'Upgrade' : 'Plans'}</Text>
            <Text style={styles.sectionNote}>
              {onStarter
                ? 'You are on Starter. Growth and Pro are the upgrade options. GST applies.'
                : 'Launch prices. GST applies.'}
            </Text>
            <View style={styles.plans}>
              {visiblePlans.map((plan) => {
                const featured = plan.name === 'Pro';
                return (
                  <View key={plan.name} style={[styles.plan, featured && styles.planFeatured]}>
                    <View style={styles.planHead}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.was ? <Text style={styles.planBadge}>Early bird</Text> : null}
                    </View>
                    <Text style={styles.planTagline}>{plan.tagline}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      {plan.period ? <Text style={styles.planPeriod}>{plan.period}</Text> : null}
                    </View>
                    {plan.was ? (
                      <Text style={styles.planWas}>
                        <Text style={styles.planStruck}>{plan.was}</Text>
                        {plan.billed ? `   ${plan.billed}` : ''}
                      </Text>
                    ) : null}
                    <Text style={styles.planNote}>{plan.note}</Text>
                    {plan.features.map((feature) => (
                      <View key={feature} style={styles.featureRow}>
                        <Ionicons name="checkmark" size={16} color={biz.blue} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                    {onStarter ? (
                      <Pressable
                        style={({ pressed }) => [styles.upgradeBtn, pressed && styles.pressed]}
                        onPress={() => upgrade(plan.name)}
                      >
                        <Text style={styles.upgradeText}>Upgrade</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <Text style={styles.section}>What you get</Text>
            <View style={styles.list}>
              {POINTS.map((point, index) => (
                <View key={point.title} style={[styles.row, index === POINTS.length - 1 && styles.rowLast]}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={point.icon} size={18} color={biz.blue} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{point.title}</Text>
                    <Text style={styles.rowBody}>{point.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.webLink}
              onPress={() => void Linking.openURL(`${SITE_URL}/business/login`)}
            >
              <Text style={styles.webLinkText}>Manage your business on the website</Text>
              <Ionicons name="open-outline" size={16} color={biz.blue} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    </TabSwipeHost>
  );
}

const useStyles = createThemedStyles((colors) => {
  const b = bizColors(colors);
  return {
  root: { flex: 1, backgroundColor: b.page },
  safe: { flex: 1 },
  scroll: { paddingBottom: 24 },
  hero: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  back: {
    width: 36,
    height: 36,
    marginLeft: -8,
    marginRight: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: 28, height: 28 },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: b.blue,
  },
  heroTitle: {
    fontFamily: fonts.medium,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.heading,
  },
  heroBody: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: b.body,
  },
  portraitRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: b.cardSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: b.line,
    padding: 12,
  },
  portraitRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: b.page,
    overflow: 'hidden',
    backgroundColor: b.blueTint,
  },
  portraitOverlap: { marginLeft: -10 },
  portrait: { width: 40, height: 40 },
  portraitCopy: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.heading,
  },
  actions: {
    marginTop: 20,
    marginHorizontal: 20,
    gap: 10,
  },
  signedIn: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: b.body,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueFill,
  },
  primaryText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: b.onFill,
  },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.card,
    borderWidth: 1.5,
    borderColor: b.blue,
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: b.blue,
  },
  section: {
    marginTop: 28,
    marginHorizontal: 20,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.heading,
  },
  sectionNote: {
    marginHorizontal: 20,
    marginBottom: 12,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: b.body,
  },
  plans: {
    marginHorizontal: 20,
    gap: 12,
  },
  plan: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: b.line,
    backgroundColor: b.card,
    padding: 16,
  },
  planFeatured: {
    borderColor: b.blue,
    backgroundColor: b.cardSoft,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planName: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.heading,
  },
  planBadge: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: b.blue,
    backgroundColor: b.blueSoft,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planTagline: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: b.body,
  },
  priceRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: fonts.medium,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  planPeriod: {
    marginBottom: 3,
    marginLeft: 2,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: b.body,
  },
  planWas: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.heading,
  },
  planStruck: {
    color: b.faint,
    textDecorationLine: 'line-through',
  },
  planNote: {
    marginTop: 12,
    marginBottom: 6,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.heading,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: b.body,
  },
  upgradeBtn: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: b.blueFill,
    alignItems: 'center',
    paddingVertical: 12,
  },
  upgradeText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: b.onFill,
  },
  list: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: b.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: b.card,
    borderBottomWidth: 1,
    borderBottomColor: b.line,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueSoft,
  },
  rowCopy: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.heading,
  },
  rowBody: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: b.body,
  },
  webLink: {
    marginTop: 18,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  webLinkText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: b.blue,
  },
  pressed: { opacity: 0.9 },
};
});
