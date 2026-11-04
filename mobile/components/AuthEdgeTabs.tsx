import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { TAB_BAR_CONTENT_HEIGHT, useBottomInset } from '../hooks/useAppSafeArea';
import { isBusinessSurface } from '../lib/businessSurface';

const TAB_W = 30;
const TAB_H = 92;
const GAP = 6;
const GROUP_H = TAB_H * 2 + GAP;
const DRAG_SLOP = 6;
const EDGE_MARGIN = 12;

const HIDDEN_ON = ['/business-login', '/business-register'];

type Side = 'left' | 'right';

/** Survives screen changes so the tabs stay where the user parked them. */
let parked: { side: Side; y: number } | null = null;

function EdgeTab({
  label,
  icon,
  color,
  side,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  side: Side;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tab,
        side === 'right' ? styles.tabRight : styles.tabLeft,
        { backgroundColor: color },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.rotated, side === 'left' && styles.rotatedLeft]}>
        <Ionicons name={icon} size={13} color="#FFFFFF" />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/** Login and sign-up tabs on the screen edge while signed out. Drag to move. */
export function AuthEdgeTabs() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarSpace = TAB_BAR_CONTENT_HEIGHT + useBottomInset(0);

  const minY = insets.top + EDGE_MARGIN;
  const maxY = Math.max(minY, height - tabBarSpace - GROUP_H - EDGE_MARGIN);
  const clampY = (y: number) => Math.min(maxY, Math.max(minY, y));
  const edgeX = (side: Side) => (side === 'right' ? width - TAB_W : 0);

  const [side, setSide] = useState<Side>(parked?.side ?? 'right');
  const start = useRef({
    x: edgeX(parked?.side ?? 'right'),
    y: clampY(parked?.y ?? height / 2 - GROUP_H / 2),
  }).current;
  const pos = useRef(new Animated.ValueXY(start)).current;
  const current = useRef(start);

  useEffect(() => {
    const id = pos.addListener((value) => {
      current.current = value;
    });
    return () => pos.removeListener(id);
  }, [pos]);

  const bounds = useRef({ width, clampY, edgeX });
  bounds.current = { width, clampY, edgeX };

  useEffect(() => {
    const nextSide = parked?.side ?? side;
    if (nextSide !== side) setSide(nextSide);
    pos.setValue({ x: edgeX(nextSide), y: clampY(parked?.y ?? current.current.y) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, minY, maxY, pathname]);

  const responder = useMemo(() => {
    const isDrag = (dx: number, dy: number) =>
      Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => isDrag(g.dx, g.dy),
      onMoveShouldSetPanResponderCapture: (_, g) => isDrag(g.dx, g.dy),
      onPanResponderGrant: () => {
        pos.stopAnimation();
        pos.setOffset({ x: current.current.x, y: current.current.y });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        const { width: w, clampY: clamp, edgeX: toEdge } = bounds.current;
        const centerX = current.current.x + TAB_W / 2 + g.vx * 80;
        const nextSide: Side = centerX < w / 2 ? 'left' : 'right';
        const nextY = clamp(current.current.y);
        parked = { side: nextSide, y: nextY };
        setSide(nextSide);
        Animated.spring(pos, {
          toValue: { x: toEdge(nextSide), y: nextY },
          useNativeDriver: false,
          friction: 7,
          tension: 70,
        }).start();
      },
      onPanResponderTerminate: () => {
        pos.flattenOffset();
      },
    });
  }, [pos]);

  if (loading || user || isBusinessSurface(pathname) || HIDDEN_ON.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.wrap, { transform: pos.getTranslateTransform() }]}
    >
      <EdgeTab
        label="Login"
        icon="log-in-outline"
        color="#1D4ED8"
        side={side}
        onPress={() => router.push('/login' as Href)}
      />
      <EdgeTab
        label="Sign up"
        icon="person-add-outline"
        color="#E8811E"
        side={side}
        onPress={() => router.push('/signup' as Href)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TAB_W,
    gap: GAP,
    zIndex: 40,
    elevation: 40,
  },
  tab: {
    width: TAB_W,
    height: TAB_H,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  tabRight: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  tabLeft: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  rotated: {
    width: TAB_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    transform: [{ rotate: '-90deg' }],
  },
  rotatedLeft: {
    transform: [{ rotate: '90deg' }],
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.85 },
});
