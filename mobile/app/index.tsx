import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { FinderBLogo } from '../components/BrandMark';
import { colors, gradients } from '../constants/colors';

export default function SplashScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const pulse = useRef(new Animated.Value(0.4)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.4,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.timing(bar, {
        toValue: 1,
        duration: 1900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2300);

    return () => clearTimeout(timer);
  }, [bar, fade, pulse, router, scale, spin]);

  const barWidth = bar.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '100%'],
  });
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[...gradients.splash]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
      <View style={styles.heatBlob} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fade, transform: [{ scale }] },
        ]}
      >
        <View style={styles.logoPlate}>
          <FinderBLogo size={100} />
        </View>
        <Text style={styles.brand}>
          Finder<Text style={styles.brandAccent}>B</Text>
        </Text>
        <Text style={styles.tagline}>Your city, unlocked</Text>
      </Animated.View>

      <View style={styles.loaderBlock}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <Animated.Text style={[styles.loadingText, { opacity: pulse }]}>
          Warming up discovery…
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  ring: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: 'rgba(255,122,26,0.25)',
    borderStyle: 'dashed',
  },
  heatBlob: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.heat,
    opacity: 0.28,
  },
  content: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 128,
    height: 128,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    marginTop: 20,
    fontSize: 42,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
  },
  brandAccent: {
    color: colors.mango,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  loaderBlock: {
    position: 'absolute',
    bottom: 72,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.mango,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
});
