import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function Tongue({
  delay,
  left,
  bottom,
  height,
  width = 4,
  drift = 0,
  tilt = 8,
  lift = -6,
  duration = 760,
  hold = 0,
}: {
  delay: number;
  left: number;
  bottom: number;
  height: number;
  width?: number;
  drift?: number;
  tilt?: number;
  lift?: number;
  duration?: number;
  hold?: number;
}) {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rise, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(delay + hold),
        Animated.timing(rise, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, hold, rise]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [1, lift] });
  const translateX = rise.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = rise.interpolate({ inputRange: [0, 1], outputRange: [`${-tilt}deg`, `${tilt}deg`] });
  const opacity = rise.interpolate({ inputRange: [0, 0.1, 0.55, 1], outputRange: [0, 1, 0.9, 0] });
  const scaleY = rise.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.25, 1, 1.15] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.tongue, { left, bottom, height, width, opacity, transform: [{ translateX }, { translateY }, { rotate }, { scaleY }] }]}
    >
      <LinearGradient
        colors={['#FFF6D4', '#FFD24A', '#FF8C12', '#FF3D00', 'rgba(140,8,0,0)']}
        style={styles.tongueFill}
      />
    </Animated.View>
  );
}

export function LivingFire() {
  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no">
      <Tongue delay={40} left={-2} bottom={1} height={7} width={3} drift={-2} tilt={40} lift={-4} duration={520} />
      <Tongue delay={310} left={2} bottom={10} height={8} width={4} drift={-1} tilt={12} lift={-10} duration={860} />
      <Tongue delay={90} left={12} bottom={2} height={6} width={5} drift={2} tilt={-32} lift={-3} duration={690} />
      <Tongue delay={170} hold={280} left={6} bottom={11} height={7} width={3} tilt={-9} lift={-11} duration={1040} />
      <Tongue delay={530} left={-1} bottom={6} height={5} width={3} tilt={24} lift={-6} duration={440} />
      <Tongue delay={640} hold={120} left={9} bottom={8} height={5} width={3} tilt={-16} lift={-8} duration={910} />
      <Text style={styles.emoji}>🔥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  emoji: { fontSize: 14, lineHeight: 16, textAlign: 'center', includeFontPadding: false },
  tongue: {
    position: 'absolute',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
    zIndex: 2,
  },
  tongueFill: { flex: 1 },
});
