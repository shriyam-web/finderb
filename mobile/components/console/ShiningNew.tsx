import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { LivingFire } from '../LivingFire';

/** Compact “New” mark with a light streak, used in place of the uncontacted badge. */
export function ShiningNew() {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const travel = sweep.interpolate({ inputRange: [0, 1], outputRange: [-18, 64] });

  return (
    <View style={styles.pill} accessibilityLabel="New">
      <View style={styles.fire}>
        <LivingFire />
      </View>
      <Text style={styles.text}>New</Text>
      <View pointerEvents="none" style={styles.gleamClip}>
        <Animated.View style={[styles.gleam, { transform: [{ translateX: travel }, { rotate: '20deg' }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    borderRadius: 999,
    paddingLeft: 2,
    paddingRight: 7,
    height: 20,
    backgroundColor: '#E7B15A',
  },
  fire: { width: 16, height: 16, overflow: 'visible' },
  gleamClip: { ...StyleSheet.absoluteFillObject, borderRadius: 999, overflow: 'hidden' },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.3,
    color: '#3A2508',
  },
  gleam: {
    position: 'absolute',
    top: -6,
    width: 8,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
