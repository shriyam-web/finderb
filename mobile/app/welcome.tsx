import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinderBLogo } from '../components/BrandMark';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { hideNativeSplash } from '../lib/nativeSplash';
import { markGuestMode } from '../lib/onboarding';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_BLUE = ['#1478C8', '#1E8ADB', '#3AA0E8'] as const;

const SLIDES = [
  {
    key: 'explore',
    icon: 'compass-outline' as const,
    title: 'Explore local categories',
    body: 'Open Explore to browse businesses, doctors, repairs, and more — then tap a listing for full details.',
  },
  {
    key: 'contact',
    icon: 'call-outline' as const,
    title: 'Call after you sign in',
    body: 'Phone and WhatsApp stay private until you sign in. That way merchants get real, serious leads.',
  },
  {
    key: 'discover',
    icon: 'map-outline' as const,
    title: 'Destinations, news & jobs',
    body: 'See nearby tourist spots, local headlines, and hiring from trusted businesses — all on Home.',
  },
  {
    key: 'ai',
    icon: 'search-outline' as const,
    title: 'Ask FinderB AI',
    body: 'Describe what you need in plain language and get matching local businesses instantly.',
  },
  {
    key: 'account',
    icon: 'person-outline' as const,
    title: 'Sign in for the full app',
    body: 'Create a free account to reveal contacts, save your place, and unlock the complete experience.',
  },
] as const;

export default function WelcomeTourScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const pagerRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const isLast = index === SLIDES.length - 1;

  useEffect(() => {
    hideNativeSplash();
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== index) setIndex(next);
  };

  const goNext = () => {
    if (isLast) {
      router.replace('/login');
      return;
    }
    const next = index + 1;
    pagerRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    setIndex(next);
  };

  const continueAsGuest = async () => {
    await markGuestMode();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[...HERO_BLUE]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View
          style={[
            styles.brandRow,
            { opacity: fade, transform: [{ translateY: rise }] },
          ]}
        >
          <View style={styles.logoPlate}>
            <FinderBLogo size={28} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brand}>FinderB</Text>
            <Text style={styles.brandSub}>How the app works</Text>
          </View>
        </Animated.View>

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.pager}
        >
          {SLIDES.map((slide) => (
            <View key={slide.key} style={[styles.slide, { width: SCREEN_W }]}>
              <View style={styles.iconPlate}>
                <Ionicons name={slide.icon} size={34} color={colors.frost} />
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {isLast ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={() => router.replace('/login')}
              >
                <Text style={styles.primaryText}>Sign in</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={() => router.replace('/signup')}
              >
                <Text style={styles.secondaryText}>Create account</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={goNext}
            >
              <Text style={styles.primaryText}>Next</Text>
            </Pressable>
          )}

          <Pressable onPress={() => void continueAsGuest()} hitSlop={6} style={styles.guestTap}>
            <Text style={styles.guestText}>Continue as guest</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: '#1478C8',
  },
  safe: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  logoPlate: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: {
    gap: 2,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.frost,
  },
  brandSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
  },
  pager: {
    flexGrow: 0,
    marginTop: 36,
  },
  slide: {
    paddingHorizontal: 28,
    alignItems: 'flex-start',
  },
  iconPlate: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.frost,
    marginBottom: 10,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 340,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 28,
    marginTop: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.secondary,
  },
  actions: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 10,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#0A3056',
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.frost,
  },
  pressed: { opacity: 0.9 },
  guestTap: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  guestText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
}));
