import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinderBLogo } from '../components/BrandMark';
import { fonts } from '../constants/typography';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { SITE_URL } from '../lib/supabase';

const NAVY = '#102C42';
const GOLD = '#F2B45A';

const PROMISE = [
  { icon: 'storefront-outline' as const, label: 'List' },
  { icon: 'navigate-outline' as const, label: 'Discover' },
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Convert' },
];

export default function BusinessRegisterScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compact = height < 720 || width < 360;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  const openWebPanel = () => {
    void Linking.openURL(`${SITE_URL}/business/login`);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image
        source={require('../assets/indian-businessman-hero.png')}
        style={styles.heroPhoto}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(10,28,44,0.35)',
          'rgba(10,28,44,0.55)',
          'rgba(10,28,44,0.88)',
          '#0A1C2C',
        ]}
        locations={[0, 0.42, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.stage,
            compact && styles.stageCompact,
            { opacity: fade, transform: [{ translateY: rise }] },
          ]}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoPlate}>
              <FinderBLogo size={compact ? 34 : 42} />
            </View>
            <Text style={[styles.brand, compact && styles.brandCompact]}>
              Business
            </Text>
            <Text style={[styles.line, compact && styles.lineCompact]}>
              Business tools will be in this same app. That side is not ready yet, so manage your listing on the web panel for now.
            </Text>
          </View>

          <View style={styles.promiseRow}>
            {PROMISE.map((item, i) => (
              <View key={item.label} style={styles.promiseItem}>
                {i > 0 ? <View style={styles.promiseRule} /> : null}
                <View style={styles.promiseInner}>
                  <Ionicons name={item.icon} size={16} color={GOLD} />
                  <Text style={styles.promiseLabel}>{item.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fade }]}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            onPress={() => router.push('/(tabs)/business-register' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Register now"
          >
            <Text style={styles.ctaText}>Register now</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={openWebPanel}
            accessibilityRole="button"
            accessibilityLabel="Manage on the web panel"
          >
            <Text style={styles.secondaryText}>Manage on web panel</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles(() => ({
  root: { flex: 1, backgroundColor: '#0A1C2C' },
  heroPhoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stage: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 18,
  },
  stageCompact: {
    paddingBottom: 16,
    gap: 14,
  },
  brandBlock: {
    alignItems: 'flex-start',
    gap: 12,
  },
  logoPlate: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: '#fff',
  },
  brandCompact: {
    fontSize: 28,
    lineHeight: 32,
  },
  line: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: 'rgba(255,255,255,0.82)',
    maxWidth: 340,
  },
  lineCompact: {
    fontSize: 15,
    lineHeight: 22,
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  promiseItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  promiseRule: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginRight: 14,
  },
  promiseInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  promiseLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: NAVY,
  },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 18,
  },
  secondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.9 },
}));
