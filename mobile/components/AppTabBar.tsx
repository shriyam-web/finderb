import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { useBottomInset } from '../hooks/useAppSafeArea';

const LABELS: Record<string, string> = {
  home: 'Home',
  categories: 'Explore',
  ai: 'AI',
  business: 'Business',
  account: 'You',
};

const ICONS: Record<
  string,
  { outline: keyof typeof Ionicons.glyphMap; solid: keyof typeof Ionicons.glyphMap }
> = {
  home: { outline: 'home-outline', solid: 'home' },
  categories: { outline: 'compass-outline', solid: 'compass' },
  business: { outline: 'briefcase-outline', solid: 'briefcase' },
  account: { outline: 'person-outline', solid: 'person' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  // Works for gesture nav and classic 3-button Android nav.
  const bottomInset = useBottomInset(12);

  return (
    <View
      style={[styles.wrap, { paddingBottom: bottomInset }]}
      // Keep the bar opaque so system buttons never show through content.
      collapsable={false}
    >
      <View style={styles.bar}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const focused = state.index === index;
          const isAi = route.name === 'ai';
          const label = LABELS[route.name] ?? route.name;
          const icons = ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isAi) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.aiSlot}
                accessibilityRole="button"
                accessibilityLabel="FinderB AI"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <LinearGradient
                  colors={[colors.teal, colors.tealDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.aiButton, focused && styles.aiButtonActive]}
                >
                  <Ionicons name="sparkles" size={22} color={colors.white} />
                </LinearGradient>
                <Text style={[styles.aiLabel, focused && styles.labelActive]}>AI</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <View style={[styles.iconHit, focused && styles.iconHitActive]}>
                <Ionicons
                  name={focused ? icons?.solid ?? 'ellipse' : icons?.outline ?? 'ellipse-outline'}
                  size={22}
                  color={focused ? colors.mangoDeep : colors.textSoft}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 4,
    // Elevate above page content; solid fill for 3-button contrast.
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    // 48dp-ish touch target for Android accessibility / 3-button users.
    minHeight: 48,
    paddingBottom: 2,
  },
  iconHit: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconHitActive: {
    backgroundColor: colors.mangoSoft,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSoft,
  },
  labelActive: {
    color: colors.mangoDeep,
  },
  aiSlot: {
    flex: 1,
    alignItems: 'center',
    // Raise AI above the bar, but keep label inside safe padding.
    marginTop: -22,
    minHeight: 48,
    justifyContent: 'flex-end',
  },
  aiButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.tealDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  aiButtonActive: {
    transform: [{ scale: 1.03 }],
  },
  aiLabel: {
    marginTop: 3,
    marginBottom: 2,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSoft,
  },
});
