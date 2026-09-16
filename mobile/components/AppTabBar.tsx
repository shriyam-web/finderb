import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { TAB_BAR_CONTENT_HEIGHT, useBottomInset } from '../hooks/useAppSafeArea';
import { MAIN_TAB_HREFS } from '../lib/tabSwipe';

const LABELS: Record<string, string> = {
  home: 'Home',
  categories: 'Explore',
  ai: 'FinderB AI',
  more: 'More',
  account: 'Account',
};

const ICONS: Record<
  string,
  { outline: keyof typeof Ionicons.glyphMap; solid: keyof typeof Ionicons.glyphMap }
> = {
  home: { outline: 'home-outline', solid: 'home' },
  categories: { outline: 'compass-outline', solid: 'compass' },
  ai: { outline: 'sparkles-outline', solid: 'sparkles' },
  more: { outline: 'grid-outline', solid: 'grid' },
  account: { outline: 'person-outline', solid: 'person' },
};

const BLUE_WASH = ['#60A5FA', '#2563EB'] as const;

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

function isNestedTab(name: string) {
  return (
    name === 'notifications' ||
    name === 'business' ||
    name.startsWith('merchant') ||
    name.startsWith('category/') ||
    name.startsWith('blog') ||
    name.startsWith('tourist-places') ||
    name.startsWith('jobs') ||
    name.startsWith('news')
  );
}

function firstName(fullName?: string | null) {
  const part = fullName?.trim().split(/\s+/)[0];
  return part || 'You';
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
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
}));

const MAIN_TAB_HREF_BY_NAME: Record<string, Href> = {
  home: MAIN_TAB_HREFS[0],
  categories: MAIN_TAB_HREFS[1],
  ai: MAIN_TAB_HREFS[2],
  more: MAIN_TAB_HREFS[3],
  account: MAIN_TAB_HREFS[4],
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAuth();
  const router = useRouter();
  const bottomInset = useBottomInset(0);
  const lastMainTab = useRef('home');

  const visibleRoutes = state.routes.filter(
    (route: { name: string }) => !isNestedTab(route.name),
  );

  const activeName = state.routes[state.index]?.name ?? '';
  if (activeName && !isNestedTab(activeName)) {
    lastMainTab.current = activeName;
  }

  const highlightName = isNestedTab(activeName)
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
          const isAccount = route.name === 'account';
          const signedIn = Boolean(user);
          const label =
            isAccount && signedIn
              ? firstName(user?.fullName)
              : (LABELS[route.name] ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;
            // Leave nested screens (merchant/*, etc.) via replace so Account
            // never stays stuck on a stale "Merchant not found" route.
            const href = MAIN_TAB_HREF_BY_NAME[route.name];
            if (href && (isNestedTab(activeName) || route.name === 'account')) {
              router.replace(href);
              return;
            }
            navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isAi && styles.aiTab]}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                isAi
                  ? 'FinderB AI'
                  : isAccount && signedIn
                    ? user?.fullName
                    : label
              }
              hitSlop={{ top: isAi ? 18 : 6, bottom: 6, left: 4, right: 4 }}
            >
              {isAi ? (
                <>
                  <View style={styles.aiIconSlot} />
                  <View style={styles.aiOrbWrap} pointerEvents="none">
                    <AiOrb />
                  </View>
                </>
              ) : isAccount && signedIn ? (
                user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={[styles.avatar, focused && styles.avatarOn]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[styles.avatarFallback, focused && styles.avatarOn]}
                  >
                    <Text style={styles.avatarInitial}>
                      {firstName(user?.fullName).slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )
              ) : (
                <Ionicons
                  name={
                    focused
                      ? icons?.solid ?? 'ellipse'
                      : icons?.outline ?? 'ellipse-outline'
                  }
                  size={20}
                  color={focused ? colors.ink : colors.textSoft}
                />
              )}
              <Text
                style={[
                  styles.label,
                  isAccount && styles.compactLabel,
                  focused && styles.labelActive,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
