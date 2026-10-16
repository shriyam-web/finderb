import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';

/** Short mark shown while a user-side list is pull-refreshing. */
export function PullRefreshMark({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rise.setValue(0);
      return;
    }
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const riseIn = Animated.spring(rise, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    });
    spinLoop.start();
    riseIn.start();
    return () => {
      spinLoop.stop();
      spin.setValue(0);
    };
  }, [active, rise, spin]);

  if (!active) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.host,
        {
          opacity: rise,
          transform: [
            {
              translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: colors.white }]}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="sync" size={16} color={colors.brand} />
        </Animated.View>
        <Text style={[styles.label, { color: colors.ink }]}>Refreshing</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(24,24,27,0.08)',
    shadowColor: '#18181B',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  label: { fontFamily: fonts.semiBold, fontSize: 13 },
});
