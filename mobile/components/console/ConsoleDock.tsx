import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { useBottomInset } from '../../hooks/useAppSafeArea';
import { rememberDockTab } from '../../lib/consoleNav';
import { canViewTeamTab, MOBILE_ROUTE_TAB } from '../../lib/teamAccess';
import { createConsoleStyles, DOCK_HEIGHT } from './kit';

type DockItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const ITEMS: DockItem[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'leads', label: 'Leads', icon: 'people-outline', activeIcon: 'people' },
  { name: 'listing', label: 'My Business', icon: 'storefront-outline', activeIcon: 'storefront' },
  { name: 'reviews', label: 'Reviews', icon: 'star-outline', activeIcon: 'star' },
  { name: 'subscription', label: 'Plan', icon: 'card-outline', activeIcon: 'card' },
];

export function ConsoleDock({ state, navigation }: BottomTabBarProps) {
  const styles = useStyles();
  const c = useConsoleColors();
  const bottomInset = useBottomInset();
  const { overview } = useMerchantConsole();
  const isOwner = overview?.actor?.isOwner !== false;
  const badges: Record<string, number> = {
    leads: overview?.stats.leadsNew ?? 0,
    reviews: overview?.stats.reviewsAwaitingReply ?? 0,
  };

  return (
    <View style={[styles.wrap, { paddingBottom: bottomInset }]}>
      {ITEMS.map((item) => {
        const tabKey = MOBILE_ROUTE_TAB[item.name];
        if (tabKey && !canViewTeamTab(overview?.actor?.access, tabKey, isOwner)) return null;
        const index = state.routes.findIndex((route: { name: string }) => route.name === item.name);
        if (index < 0) return null;
        const route = state.routes[index];
        const focused = state.index === index;
        const badge = badges[item.name] ?? 0;
        const tint = focused ? c.primary : c.muted;
        return (
          <Pressable
            key={item.name}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.slot}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${item.label}, ${badge} new` : item.label}
          >
            <View style={[styles.pill, focused && styles.pillOn]}>
              <Ionicons name={focused ? item.activeIcon : item.icon} size={21} color={tint} />
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: tint }, focused && styles.labelOn]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  slot: { flex: 1, height: DOCK_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { width: 52, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: c.isDark ? c.sunken : '#EDEDF0' },
  label: { fontFamily: fonts.regular, fontSize: 11 },
  labelOn: { fontFamily: fonts.semiBold },
  badge: {
    position: 'absolute',
    top: -3,
    right: 4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.danger,
    borderWidth: 1.5,
    borderColor: c.card,
  },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 9.5, color: '#FFFFFF' },
}));
