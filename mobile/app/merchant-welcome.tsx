import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BlurTargetView, BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bizColors, useBizColors } from '../constants/businessColors';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { SITE_URL } from '../lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fbMark = require('../assets/fb-mark-clear.png');

const LOADER_MS = 1600;
const TRACK_WIDTH = 168;

const STATS = [
  { icon: 'eye-outline' as const, label: 'Profile views' },
  { icon: 'chatbubbles-outline' as const, label: 'Leads' },
  { icon: 'call-outline' as const, label: 'Calls' },
  { icon: 'star-outline' as const, label: 'Reviews' },
];

type PlanFields = {
  selectedPlan?: string | null;
  paymentStatus?: string | null;
  planExpiresAt?: string | null;
  billingCycle?: string | null;
};

/** Mirrors the website: unpaid or lapsed plans are Starter; a monthly 'pro' purchase is Growth. */
function planLabel(user: PlanFields | null | undefined): string {
  const key = (user?.selectedPlan || '').toLowerCase();
  if (!user || user.paymentStatus !== 'completed') return 'Starter plan';
  const expiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  if (expiresAt && !Number.isNaN(expiresAt.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiresAt.setHours(0, 0, 0, 0);
    if (expiresAt <= today) return 'Starter plan';
  }
  if (key === 'growth') return 'Growth plan';
  if (key === 'pro') return user.billingCycle === 'monthly' ? 'Growth plan' : 'Pro plan';
  return 'Starter plan';
}

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return letters || 'B';
}

function BusinessLoader() {
  const styles = useStyles();
  const [pulse] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    breathe.start();
    Animated.timing(progress, {
      toValue: 1,
      duration: LOADER_MS - 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => breathe.stop();
  }, [pulse, progress]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const halo = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const barX = progress.interpolate({ inputRange: [0, 1], outputRange: [-TRACK_WIDTH, 0] });

  return (
    <View style={styles.loader} accessibilityRole="progressbar" accessibilityLabel="Opening your business dashboard">
      <View style={styles.loaderMarkWrap}>
        <Animated.View style={[styles.loaderHalo, { opacity: halo, transform: [{ scale: haloScale }] }]} />
        <Animated.View style={[styles.loaderMarkPlate, { transform: [{ scale }] }]}>
          <Image source={fbMark} alt="" style={styles.loaderMark} contentFit="contain" />
        </Animated.View>
      </View>
      <View style={styles.loaderWordRow}>
        <Text style={styles.loaderWord}>FinderB</Text>
        <View style={styles.loaderPill}>
          <Text style={styles.loaderPillText}>Business</Text>
        </View>
      </View>
      <Text style={styles.loaderHint}>Opening your dashboard…</Text>
      <View style={styles.loaderTrack}>
        <Animated.View style={[styles.loaderBar, { transform: [{ translateX: barX }] }]} />
      </View>
    </View>
  );
}

function Placeholder({ width, height = 10, strong }: { width: number | `${number}%`; height?: number; strong?: boolean }) {
  const styles = useStyles();
  return <View style={[styles.placeholder, strong && styles.placeholderStrong, { width, height }]} />;
}

/** Dashboard layout shown behind the blur; values are placeholders, never real figures. */
function DashboardPreview() {
  const styles = useStyles();
  const biz = useBizColors();
  return (
    <View
      style={styles.preview}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.statsGrid}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name={stat.icon} size={16} color={biz.blue} />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Placeholder width={56} height={18} strong />
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recent leads</Text>
        {[0, 1, 2].map((row) => (
          <View key={row} style={[styles.leadRow, row > 0 && styles.leadRowBorder]}>
            <View style={styles.leadAvatar} />
            <View style={styles.leadCopy}>
              <Placeholder width="62%" strong />
              <Placeholder width="38%" />
            </View>
            <Placeholder width={44} height={22} />
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Listing health</Text>
        <View style={styles.healthTrack}>
          <View style={styles.healthFill} />
        </View>
        <View style={styles.healthRows}>
          <Placeholder width="80%" />
          <Placeholder width="64%" />
          <Placeholder width="72%" />
        </View>
      </View>
    </View>
  );
}

export default function MerchantWelcomeScreen() {
  const styles = useStyles();
  const biz = useBizColors();
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reveal] = useState(() => new Animated.Value(0));
  const blurTarget = useRef<View>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      Animated.timing(reveal, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, LOADER_MS);
    return () => clearTimeout(timer);
  }, [loading, reveal]);

  const businessName = user?.businessName?.trim() || 'Your business';
  const ownerName = user?.fullName?.trim() || '';
  const lift = reveal.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  const openWebPanel = () => void Linking.openURL(`${SITE_URL}/business/login`);
  const leave = () => router.replace('/(tabs)/home');

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BusinessLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.flex, { opacity: reveal, transform: [{ translateY: lift }] }]}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Image source={fbMark} alt="" style={styles.brandMark} contentFit="contain" />
            <Text style={styles.brandWord}>Business</Text>
          </View>
          <Pressable
            onPress={leave}
            hitSlop={10}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Close business dashboard"
          >
            <Ionicons name="close" size={20} color={biz.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} alt={`${businessName} logo`} style={styles.heroLogo} contentFit="cover" />
            ) : (
              <View style={[styles.heroLogo, styles.heroLogoFallback]}>
                <Text style={styles.heroInitials}>{initialsOf(businessName)}</Text>
              </View>
            )}
            <View style={styles.heroCopy}>
              <Text style={styles.heroName} numberOfLines={2}>
                {businessName}
              </Text>
              {ownerName ? (
                <Text style={styles.heroOwner} numberOfLines={1}>
                  {ownerName}
                </Text>
              ) : null}
              <View style={styles.chips}>
                <View style={styles.chip}>
                  <Ionicons name="storefront" size={12} color={biz.blue} />
                  <Text style={styles.chipText}>Business account</Text>
                </View>
                <View style={[styles.chip, styles.chipMuted]}>
                  <Text style={[styles.chipText, styles.chipTextMuted]}>{planLabel(user)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.lockedArea}>
            <BlurTargetView ref={blurTarget} style={styles.blurTarget}>
              <DashboardPreview />
            </BlurTargetView>
            <BlurView
              blurTarget={blurTarget}
              intensity={isDark ? 45 : 40}
              tint={isDark ? 'dark' : 'light'}
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.blurLayer}
            />
            <View style={styles.wash} />
            <View style={styles.notice} accessibilityRole="summary">
              <View style={styles.noticeIcon}>
                <Ionicons name="desktop-outline" size={22} color={biz.onFill} />
              </View>
              <Text style={styles.noticeTitle}>Coming soon to the app</Text>
              <Text style={styles.noticeBody}>
                Business dashboard will soon be available inside the app. For now, kindly visit the web panel to
                manage your business.
              </Text>
              <Pressable
                onPress={openWebPanel}
                style={({ pressed }) => [styles.noticeCta, pressed && styles.pressed]}
                accessibilityRole="link"
              >
                <Text style={styles.noticeCtaText}>Open web panel</Text>
                <Ionicons name="open-outline" size={16} color={biz.onFill} />
              </Pressable>
              <Pressable onPress={leave} hitSlop={8} style={styles.noticeLink} accessibilityRole="button">
                <Text style={styles.noticeLinkText}>Continue browsing FinderB</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => {
  const b = bizColors(colors);
  const dark = colors.statusBarStyle === 'light';
  return {
    safe: { flex: 1, backgroundColor: b.page },
    flex: { flex: 1 },

    loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    loaderMarkWrap: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
    loaderHalo: {
      position: 'absolute',
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: b.blueTint,
    },
    loaderMarkPlate: {
      width: 84,
      height: 84,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: b.card,
      borderWidth: 1,
      borderColor: b.line,
      ...(Platform.OS === 'ios'
        ? { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }
        : { elevation: 6 }),
    },
    loaderMark: { width: 52, height: 52 },
    loaderWordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22 },
    loaderWord: { fontFamily: fonts.extraBold, fontSize: 24, letterSpacing: -0.5, color: b.ink },
    loaderPill: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: b.blueFill,
    },
    loaderPillText: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.3, color: b.onFill },
    loaderHint: { marginTop: 10, fontFamily: fonts.medium, fontSize: 13, color: b.slate },
    loaderTrack: {
      marginTop: 22,
      width: TRACK_WIDTH,
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: b.cardMuted,
    },
    loaderBar: { width: TRACK_WIDTH, height: 4, borderRadius: 2, backgroundColor: b.blueFill },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandMark: { width: 28, height: 28 },
    brandWord: { fontFamily: fonts.bold, fontSize: 16, color: b.ink },
    close: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: b.cardMuted,
    },

    scroll: { paddingHorizontal: 20, paddingBottom: 32 },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 18,
      borderRadius: 22,
      backgroundColor: b.card,
      borderWidth: 1,
      borderColor: b.line,
    },
    heroLogo: { width: 64, height: 64, borderRadius: 18, backgroundColor: b.cardMuted },
    heroLogoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: b.blueSoft },
    heroInitials: { fontFamily: fonts.extraBold, fontSize: 22, color: b.blue },
    heroCopy: { flex: 1, minWidth: 0 },
    heroName: { fontFamily: fonts.extraBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: b.ink },
    heroOwner: { marginTop: 2, fontFamily: fonts.medium, fontSize: 13, color: b.slate },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 4,
      backgroundColor: b.blueSoft,
    },
    chipMuted: { backgroundColor: b.cardMuted },
    chipText: { fontFamily: fonts.semiBold, fontSize: 11, color: b.blue },
    chipTextMuted: { color: b.slateInk },

    lockedArea: { marginTop: 16, borderRadius: 22, overflow: 'hidden' },
    blurTarget: { backgroundColor: b.page },
    blurLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    wash: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: dark ? 'rgba(31,28,26,0.55)' : 'rgba(255,255,255,0.55)',
    },

    preview: { gap: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flexGrow: 1,
      flexBasis: '45%',
      padding: 14,
      gap: 8,
      borderRadius: 18,
      backgroundColor: b.card,
      borderWidth: 1,
      borderColor: b.line,
    },
    statIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: b.blueSoft,
    },
    statLabel: { fontFamily: fonts.medium, fontSize: 12, color: b.slate },
    panel: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: b.card,
      borderWidth: 1,
      borderColor: b.line,
    },
    panelTitle: { fontFamily: fonts.bold, fontSize: 14, color: b.ink, marginBottom: 6 },
    leadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    leadRowBorder: { borderTopWidth: 1, borderTopColor: b.line },
    leadAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: b.cardMuted },
    leadCopy: { flex: 1, gap: 6 },
    healthTrack: { height: 8, borderRadius: 4, backgroundColor: b.cardMuted, overflow: 'hidden', marginTop: 4 },
    healthFill: { width: '58%', height: 8, borderRadius: 4, backgroundColor: b.blueFill },
    healthRows: { gap: 8, marginTop: 14 },
    placeholder: { borderRadius: 5, backgroundColor: b.cardMuted },
    placeholderStrong: { backgroundColor: b.lineStrong },

    notice: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 22,
    },
    noticeIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: b.blueFill,
      marginBottom: 14,
    },
    noticeTitle: { fontFamily: fonts.extraBold, fontSize: 19, letterSpacing: -0.3, color: b.ink, textAlign: 'center' },
    noticeBody: {
      marginTop: 8,
      maxWidth: 300,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      color: b.body,
      textAlign: 'center',
    },
    noticeCta: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
      paddingHorizontal: 22,
      paddingVertical: 13,
      backgroundColor: b.blueFill,
    },
    noticeCtaText: { fontFamily: fonts.bold, fontSize: 15, color: b.onFill },
    noticeLink: { marginTop: 12, paddingVertical: 6 },
    noticeLinkText: { fontFamily: fonts.semiBold, fontSize: 13, color: b.slate },
    pressed: { opacity: 0.85 },
  };
});
