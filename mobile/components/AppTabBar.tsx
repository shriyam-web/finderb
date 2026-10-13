import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { TAB_BAR_CONTENT_HEIGHT, useBottomInset } from '../hooks/useAppSafeArea';
import { MAIN_TAB_HREFS } from '../lib/tabSwipe';

const LABELS: Record<string, string> = {
  home: 'Home',
  categories: 'Explore',
  ai: 'FinderB AI',
  more: 'More',
  business: 'Business',
};

const ICONS: Record<
  string,
  { outline: keyof typeof Ionicons.glyphMap; solid: keyof typeof Ionicons.glyphMap }
> = {
  home: { outline: 'home-outline', solid: 'home' },
  categories: { outline: 'compass-outline', solid: 'compass' },
  ai: { outline: 'sparkles-outline', solid: 'sparkles' },
  more: { outline: 'grid-outline', solid: 'grid' },
  business: { outline: 'storefront-outline', solid: 'storefront' },
};

const BLUE_WASH = ['#60A5FA', '#2563EB'] as const;

/** Keep this mark tiny (72px) so the Business tab paints on the first frame. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FB_MARK = require('../assets/fb-mark-tab.png');

const RIBBON_W = 66;
/** Spans the bar from its top border (wrap paddingTop 6) to the bottom of the tab row. */
const RIBBON_TOP = -6;
const RIBBON_H = 54;
/** Height of the rectangular part of the ribbon, above the pointed tail. */
const RIBBON_BODY_H = 40;

const NATIVE_DRIVER = Platform.OS !== 'web';
const BEAM_COLOR = '#BFDBFE';
const FOLD = 10;

/** One loop of the ribbon animation, split into phases as fractions of the cycle. */
const RIBBON_CYCLE_MS = 5600;
const FOLD_FLICK = [0, 0.05, 0.14] as const;
const BEAM_LAP = [0.04, 0.5] as const;
const MARK_POP = [0.48, 0.53, 0.62] as const;
const RING = [0.49, 0.66] as const;

/** Ribbon outline, inset so the beam rides just inside the edge: top-left clockwise to the tail. */
const OUTLINE: Array<[number, number]> = [
  [1.5, 1.5],
  [RIBBON_W - 1.5, 1.5],
  [RIBBON_W - 1.5, RIBBON_BODY_H - 0.5],
  [RIBBON_W / 2, RIBBON_H - 1.5],
  [1.5, RIBBON_BODY_H - 0.5],
  [1.5, 1.5],
];
const OUTLINE_STOPS = (() => {
  const lengths = OUTLINE.slice(1).map(([x, y], i) =>
    Math.hypot(x - OUTLINE[i][0], y - OUTLINE[i][1]),
  );
  const total = lengths.reduce((sum, len) => sum + len, 0);
  let run = 0;
  return [0, ...lengths.map((len) => (run += len) / total)];
})();
const OUTLINE_X = OUTLINE.map(([x]) => x);
const OUTLINE_Y = OUTLINE.map(([, y]) => y);

/** Native-driven interpolation ignores `easing`, so curves are baked into keyframes instead. */
function easedRange(
  [from, to]: readonly [number, number],
  [start, end]: readonly [number, number],
  easing: (t: number) => number,
  steps = 12,
) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    inputRange.push(from + (to - from) * t);
    outputRange.push(start + (end - start) * easing(t));
  }
  return { inputRange, outputRange, extrapolate: 'clamp' as const };
}

/** Head first; each trailing spark sits a little further back, smaller and fainter. */
const BEAM_SPARKS = Array.from({ length: 10 }, (_, i) => ({
  lag: i * 0.011,
  size: Math.max(1.6, 5 - i * 0.38),
  alpha: i === 0 ? 1 : Math.max(0.12, 0.85 - i * 0.08),
}));

/**
 * A light-blue beam leaves the corner fold, traces the ribbon's outline once and lands at the
 * fold again; the fold flicks open as it leaves and the mark pops with a ring when it returns.
 */
function useRibbonClock() {
  const clock = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: RIBBON_CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock]);
  return clock;
}

function RibbonBeam({ clock }: { clock: Animated.Value }) {
  const lap = clock.interpolate(easedRange(BEAM_LAP, [0, 1], Easing.inOut(Easing.sin)));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BEAM_SPARKS.map(({ lag, size, alpha }, i) => {
        const at = Animated.subtract(lap, lag);
        const x = at.interpolate({ inputRange: OUTLINE_STOPS, outputRange: OUTLINE_X, extrapolate: 'clamp' });
        const y = at.interpolate({ inputRange: OUTLINE_STOPS, outputRange: OUTLINE_Y, extrapolate: 'clamp' });
        const opacity = at.interpolate({
          inputRange: [-0.001, 0.01, 0.97, 1],
          outputRange: [0, alpha, alpha, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              bizTabStyles.spark,
              i === 0 && bizTabStyles.sparkHead,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                opacity,
                transform: [{ translateX: x }, { translateY: y }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function BusinessTab({ active }: { active: boolean }) {
  const mid = RIBBON_W / 2;
  const body = active ? '#1D4ED8' : '#64748B';
  const fold = active ? '#60A5FA' : '#94A3B8';
  const clock = useRibbonClock();

  const foldOpen = easedRange([FOLD_FLICK[0], FOLD_FLICK[1]], [1, 1.9], Easing.out(Easing.cubic), 6);
  const foldSettle = easedRange([FOLD_FLICK[1], FOLD_FLICK[2]], [1.9, 1], Easing.out(Easing.back(2.2)), 8);
  const foldScale = clock.interpolate({
    inputRange: [...foldOpen.inputRange, ...foldSettle.inputRange.slice(1)],
    outputRange: [...foldOpen.outputRange, ...foldSettle.outputRange.slice(1)],
    extrapolate: 'clamp',
  });
  const markScale = clock.interpolate({
    inputRange: [...MARK_POP],
    outputRange: [1, 1.14, 1],
    extrapolate: 'clamp',
  });
  const ringScale = clock.interpolate({ inputRange: [...RING], outputRange: [1, 1.75], extrapolate: 'clamp' });
  const ringOpacity = clock.interpolate({
    inputRange: [RING[0] - 0.001, RING[0], RING[1]],
    outputRange: [0, 0.9, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={bizTabStyles.slot}>
      <View style={bizTabStyles.ribbon}>
        <Svg width={RIBBON_W} height={RIBBON_H} style={StyleSheet.absoluteFill}>
          <Path
            d={`M0 0 H${RIBBON_W} V${RIBBON_BODY_H} L${mid} ${RIBBON_H} L0 ${RIBBON_BODY_H} Z`}
            fill={body}
          />
        </Svg>
        <Animated.View style={[bizTabStyles.fold, { transform: [{ scale: foldScale }] }]}>
          <Svg width={FOLD} height={FOLD}>
            <Path d={`M0 0 H${FOLD} L0 ${FOLD} Z`} fill={fold} />
          </Svg>
        </Animated.View>
        <View style={bizTabStyles.plateSlot}>
          <Animated.View
            pointerEvents="none"
            style={[bizTabStyles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <Animated.View style={[bizTabStyles.plate, { transform: [{ scale: markScale }] }]}>
            <Image source={FB_MARK} style={bizTabStyles.mark} resizeMode="contain" fadeDuration={0} alt="" />
          </Animated.View>
        </View>
        <Text style={bizTabStyles.label} numberOfLines={1}>
          Business
        </Text>
        <RibbonBeam clock={clock} />
      </View>
    </View>
  );
}

const bizTabStyles = StyleSheet.create({
  slot: {
    width: RIBBON_W,
    flex: 1,
    overflow: 'visible',
  },
  ribbon: {
    position: 'absolute',
    top: RIBBON_TOP,
    left: 0,
    width: RIBBON_W,
    height: RIBBON_H,
    alignItems: 'center',
    paddingTop: 8,
  },
  fold: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FOLD,
    height: FOLD,
    transformOrigin: 'top left',
  },
  spark: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: BEAM_COLOR,
  },
  sparkHead: {
    backgroundColor: '#FFFFFF',
    shadowColor: BEAM_COLOR,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  plateSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: BEAM_COLOR,
  },
  plate: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 18,
    height: 18,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 9,
    color: '#FFFFFF',
  },
});

function AiOrb({ size = 46 }: { size?: number }) {
  const { colors } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const colorCycle = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    rotate.start();
    colorCycle.start();
    return () => {
      rotate.stop();
      colorCycle.stop();
    };
  }, [pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const reverse = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: size * 1.7,
            height: size * 1.7,
            transform: [{ rotate }],
          }}
        >
          <LinearGradient
            colors={[...BLUE_WASH]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size * 1.7,
            height: size * 1.7,
            opacity: pulse,
            transform: [{ rotate: reverse }],
          }}
        >
          <LinearGradient
            colors={['#C084FC', '#7C3AED', '#D946EF']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
        <Ionicons name="sparkles" size={18} color={colors.frost} />
      </View>
    </View>
  );
}

function businessChildTab(name: string) {
  if (name === 'business-register' || name === 'business-login') return 'business';
  return null;
}

function isNestedTab(name: string) {
  return (
    name === 'notifications' ||
    name === 'account' ||
    name.startsWith('merchant') ||
    name.startsWith('category/') ||
    name.startsWith('blog') ||
    name.startsWith('tourist-places') ||
    name.startsWith('jobs') ||
    name.startsWith('news') ||
    name === 'business-login' ||
    name === 'business-register'
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingHorizontal: 2,
    zIndex: 50,
    elevation: 50,
    overflow: 'visible',
  },
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    overflow: 'visible' as const,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
    minHeight: 48,
    paddingBottom: 2,
  },
  aiTab: {
    overflow: 'visible' as const,
    zIndex: 8,
  },
  aiOrbWrap: {
    position: 'absolute' as const,
    bottom: 24,
    alignSelf: 'center' as const,
  },
  aiIconSlot: {
    width: 20,
    height: 20,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.muted,
  },
  avatarOn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.muted,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.heading,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSoft,
  },
  compactLabel: {
    fontSize: 9,
  },
  labelActive: {
    color: '#1D4ED8',
    fontFamily: fonts.semiBold,
  },
  labelActiveAi: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  bizTab: {
    overflow: 'visible' as const,
    zIndex: 6,
  },
}));

const MAIN_TAB_HREF_BY_NAME: Record<string, Href> = {
  home: MAIN_TAB_HREFS[0],
  categories: MAIN_TAB_HREFS[1],
  ai: MAIN_TAB_HREFS[2],
  more: MAIN_TAB_HREFS[3],
  business: MAIN_TAB_HREFS[4],
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const bottomInset = useBottomInset(0);
  const lastMainTab = useRef('home');

  const visibleRoutes = state.routes.filter(
    (route: { name: string }) => !isNestedTab(route.name),
  );

  const activeName = state.routes[state.index]?.name ?? '';
  const businessParent = businessChildTab(activeName);
  if (businessParent) {
    lastMainTab.current = businessParent;
  } else if (activeName && !isNestedTab(activeName)) {
    lastMainTab.current = activeName;
  }

  const highlightName = businessParent
    ? businessParent
    : isNestedTab(activeName)
      ? lastMainTab.current
      : activeName;

  return (
    <View
      style={[styles.wrap, { paddingBottom: bottomInset }]}
      collapsable={false}
    >
      <View style={[styles.bar, { minHeight: TAB_BAR_CONTENT_HEIGHT - 8 }]}>
        {visibleRoutes.map((route: { key: string; name: string }) => {
          const focused = highlightName === route.name;
          const icons = ICONS[route.name];
          const isAi = route.name === 'ai';
          const isBusiness = route.name === 'business';
          const label = LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;
            // Leave hidden screens (Jobs, merchant, account) by switching
            // the tab. replace() resets the group to Home.
            const href = MAIN_TAB_HREF_BY_NAME[route.name];
            if (href && isNestedTab(activeName)) {
              router.navigate(href);
              return;
            }
            navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isAi && styles.aiTab, isBusiness && styles.bizTab]}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={isAi ? 'FinderB AI' : label}
              hitSlop={{ top: isAi ? 18 : 6, bottom: 6, left: 4, right: 4 }}
            >
              {isAi ? (
                <>
                  <View style={styles.aiIconSlot} />
                  <View style={styles.aiOrbWrap} pointerEvents="none">
                    <AiOrb />
                  </View>
                </>
              ) : isBusiness ? (
                <BusinessTab active={focused} />
              ) : (
                <Ionicons
                  name={
                    focused
                      ? icons?.solid ?? 'ellipse'
                      : icons?.outline ?? 'ellipse-outline'
                  }
                  size={20}
                  color={focused ? '#1D4ED8' : colors.textSoft}
                />
              )}
              {isBusiness ? null : (
                <Text
                  style={[
                    styles.label,
                    focused && (isAi ? styles.labelActiveAi : styles.labelActive),
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
