import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getClimateTheme } from '../lib/climateThemes';
import type { DayPart, LocalWeather, SkyWeather } from '../lib/weather';

type Props = {
  weather: LocalWeather;
};

const CLOUD = require('../assets/weather/cloud-soft.png');

type Particle = {
  id: string;
  left: number;
  top: number;
  size: number;
  opacity: number;
  driftY: number;
  driftX: number;
  duration: number;
  delay: number;
  kind: 'rain' | 'snow' | 'spark' | 'heat';
  rotate?: string;
  width?: number;
  height?: number;
};

type StarSpec = {
  id: string;
  left: number;
  top: number;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
  glow?: boolean;
};

type CloudSpec = {
  id: string;
  size: number;
  top: number;
  left?: number;
  right?: number;
  opacity: number;
  duration: number;
  delay: number;
  driftY: number;
  driftX: number;
};

const X_SEEDS = [
  0.06, 0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86, 0.94, 0.1,
  0.18, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 0.04, 0.28, 0.52,
  0.76, 0.12, 0.44, 0.68, 0.88, 0.2, 0.48, 0.72, 0.96, 0.08, 0.36, 0.6, 0.84,
  0.16, 0.24, 0.4, 0.56, 0.64, 0.8, 0.92, 0.02, 0.32, 0.48, 0.7, 0.85,
];
const Y_SEEDS = [
  0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.12, 0.18, 0.24, 0.32,
  0.38, 0.08, 0.16, 0.28, 0.36, 0.42, 0.06, 0.14, 0.22, 0.34, 0.44, 0.09, 0.19,
  0.29, 0.39, 0.11, 0.21, 0.31, 0.41, 0.07, 0.17, 0.27, 0.37, 0.13, 0.23, 0.33,
  0.43, 0.04, 0.26, 0.48, 0.02, 0.18, 0.36, 0.5, 0.12, 0.3, 0.46,
];

function buildStars(width: number, density: 'full' | 'sparse' | 'few'): StarSpec[] {
  const count = density === 'full' ? 28 : density === 'sparse' ? 16 : 10;
  return Array.from({ length: count }, (_, i) => {
    const size = i % 7 === 0 ? 1.35 : 0.9;
    return {
      id: `st-${i}`,
      left: Math.round(X_SEEDS[i % X_SEEDS.length]! * (width - 10)) + 3,
      top: Math.round(Y_SEEDS[(i * 2) % Y_SEEDS.length]! * 220) + 6,
      size,
      baseOpacity: size > 1.2 ? 0.55 : 0.28 + (i % 4) * 0.05,
      duration: 2000,
      delay: 0,
      glow: false,
    };
  });
}

function buildRain(width: number, count: number, heavy: boolean): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    // Staggered columns so the sheet always has drops in view
    const col = i % 12;
    const row = Math.floor(i / 12);
    return {
      id: `rn-${i}`,
      kind: 'rain' as const,
      left: Math.round(((col + 0.35) / 12) * (width - 6) + (row % 2) * 7),
      // Start above the hero so each loop reads as fresh rainfall
      top: -18 - (i % 7) * 10 - row * 8,
      size: heavy ? 2 : 1.4,
      width: heavy ? 1.7 : 1.25,
      height: heavy ? 14 + (i % 5) * 3 : 10 + (i % 4) * 2,
      opacity: heavy ? 0.42 : 0.34,
      // Fall through the full header height, then wrap
      driftY: 210 + (i % 5) * 18,
      driftX: heavy ? 8 + (i % 4) : 4 + (i % 3),
      duration: heavy ? 1100 + (i % 7) * 140 : 1400 + (i % 7) * 160,
      delay: (i % 14) * 95,
      rotate: '16deg',
    };
  });
}

function buildSnow(width: number, count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sn-${i}`,
    kind: 'snow' as const,
    left: Math.round(X_SEEDS[i % X_SEEDS.length]! * (width - 10)),
    top: Math.round(Y_SEEDS[i % Y_SEEDS.length]! * 170) + 10,
    size: 2.2 + (i % 4),
    opacity: 0.45 + (i % 4) * 0.1,
    driftY: 18 + (i % 5) * 4,
    driftX: (i % 2 === 0 ? 1 : -1) * (5 + (i % 4)),
    duration: 4200 + (i % 6) * 500,
    delay: (i % 9) * 200,
  }));
}

function buildHeatShimmer(width: number): Particle[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `ht-${i}`,
    kind: 'heat' as const,
    left: Math.round(((i + 0.5) / 9) * width),
    top: 90 + (i % 3) * 28,
    size: 0,
    width: 18 + (i % 3) * 8,
    height: 36 + (i % 2) * 12,
    opacity: 0.08 + (i % 3) * 0.03,
    driftY: -10,
    driftX: (i % 2 === 0 ? 1 : -1) * 4,
    duration: 2800 + i * 200,
    delay: i * 180,
  }));
}

function buildClouds(
  weather: LocalWeather,
  width: number,
): CloudSpec[] {
  const { skyWeather, dayPart, isDay } = weather;
  const night = !isDay;
  const mid = Math.round(width * 0.36);
  const tintOpacity = night ? 0.7 : 1;

  const bank = (
    specs: Array<Omit<CloudSpec, 'id' | 'duration' | 'delay' | 'driftY' | 'driftX'>>,
  ): CloudSpec[] =>
    specs.map((s, i) => ({
      ...s,
      id: `cl-${i}`,
      opacity: s.opacity * tintOpacity,
      duration: 9200 + i * 900,
      delay: i * 320,
      driftY: 5 + (i % 4) * 2,
      driftX: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 3),
    }));

  if (skyWeather === 'fog') {
    return bank([
      { size: 200, top: 40, left: -30, opacity: 0.42 },
      { size: 180, top: 90, right: -20, opacity: 0.38 },
      { size: 210, top: 130, left: mid - 40, opacity: 0.34 },
      { size: 160, top: 70, left: mid + 20, opacity: 0.3 },
      { size: 190, top: 160, left: 20, opacity: 0.28 },
    ]);
  }
  if (skyWeather === 'storm') {
    return bank([
      { size: 170, top: 18, left: -20, opacity: 0.4 },
      { size: 150, top: 48, right: 10, opacity: 0.36 },
      { size: 180, top: 86, left: mid - 30, opacity: 0.32 },
      { size: 140, top: 30, left: mid + 30, opacity: 0.28 },
    ]);
  }
  if (skyWeather === 'cloudy') {
    return bank([
      { size: 150, top: 36, left: 4, opacity: night ? 0.26 : 0.38 },
      { size: 130, top: 72, right: 30, opacity: night ? 0.22 : 0.32 },
      { size: 145, top: 110, left: mid - 10, opacity: night ? 0.18 : 0.26 },
      { size: 115, top: 28, left: mid + 20, opacity: night ? 0.16 : 0.24 },
    ]);
  }
  if (skyWeather === 'rain' || skyWeather === 'snow') {
    return bank([
      { size: 155, top: 28, left: -8, opacity: night ? 0.24 : 0.34 },
      { size: 135, top: 68, right: 24, opacity: night ? 0.2 : 0.28 },
      { size: 140, top: 100, left: mid - 20, opacity: night ? 0.16 : 0.22 },
    ]);
  }
  if (skyWeather === 'clear' || skyWeather === 'heat') {
    if (night) {
      return bank([
        { size: 130, top: 48, left: -18, opacity: 0.18 },
        { size: 110, top: 88, right: 40, opacity: 0.14 },
        { size: 120, top: 130, left: mid - 8, opacity: 0.12 },
      ]);
    }
    if (dayPart === 'morning') {
      return bank([
        { size: 120, top: 118, left: -16, opacity: 0.16 },
        { size: 100, top: 95, right: 70, opacity: 0.1 },
      ]);
    }
    if (dayPart === 'afternoon' && skyWeather === 'clear') {
      return bank([{ size: 110, top: 125, left: -12, opacity: 0.12 }]);
    }
    if (dayPart === 'evening') {
      return bank([
        { size: 125, top: 100, left: 8, opacity: 0.14 },
        { size: 105, top: 70, right: 50, opacity: 0.1 },
      ]);
    }
  }
  return [];
}

function TwinkleStar({ star }: { star: StarSpec }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: star.left,
        top: star.top,
        width: star.size,
        height: star.size,
        borderRadius: star.size,
        backgroundColor: '#F7F9FF',
        opacity: star.baseOpacity,
      }}
    />
  );
}

/** Occasional soft shooting star for clear nights. */
function ShootingStar({ width }: { width: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      if (cancelled) return;
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        timeoutId = setTimeout(run, 5200 + Math.random() * 4200);
      });
    };
    timeoutId = setTimeout(run, 1800);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      anim.stopAnimation();
    };
  }, [anim]);

  const startLeft = Math.max(24, width * 0.18);
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.42],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 78],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.12, 0.7, 1],
    outputRange: [0, 0.9, 0.55, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: startLeft,
        top: 28,
        width: 54,
        height: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.92)',
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: '28deg' }],
      }}
    >
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.95)',
          'rgba(180,210,255,0.4)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function DriftParticle({ p }: { p: Particle }) {
  const anim = useRef(new Animated.Value(0)).current;
  const isFalling = p.kind === 'rain' || p.kind === 'snow';

  useEffect(() => {
    // Native-driver loop(timing→1) often sticks at 1; force reset each cycle.
    const cycle = Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: p.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(cycle);
    const t = setTimeout(() => {
      anim.setValue(0);
      loop.start();
    }, p.delay);
    return () => {
      clearTimeout(t);
      loop.stop();
      anim.stopAnimation();
    };
  }, [anim, p.delay, p.duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, p.driftY],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, p.driftX],
  });
  // Rain/snow stay visible mid-fall; heat still soft-pulses
  const opacity = anim.interpolate({
    inputRange: isFalling ? [0, 0.06, 0.88, 1] : [0, 0.15, 0.75, 1],
    outputRange: isFalling
      ? [0, p.opacity, p.opacity, 0]
      : [0, p.opacity, p.opacity, 0],
  });

  const w = p.width ?? p.size;
  const h = p.height ?? p.size;
  const bg =
    p.kind === 'rain'
      ? 'rgba(220,235,255,0.9)'
      : p.kind === 'heat'
        ? 'rgba(255,230,160,0.55)'
        : 'rgba(255,255,255,0.95)';

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: p.left,
        top: p.top,
        width: w,
        height: h,
        borderRadius: p.kind === 'rain' ? 2 : p.kind === 'heat' ? 20 : w / 2,
        backgroundColor: bg,
        opacity,
        transform: [
          { translateX },
          { translateY },
          ...(p.rotate ? [{ rotate: p.rotate }] : []),
        ],
      }}
    />
  );
}

function SoftMoon({ dimmed = false }: { dimmed?: boolean }) {
  const insets = useSafeAreaInsets();
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const translateY = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const glowOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: dimmed ? [0.28, 0.42] : [0.7, 1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.moonRoot,
        {
          // Sit in the top bar row, just left of the weather chip
          top: Math.max(insets.top, 0) + 2,
          right: 102,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.moonBloomOuter,
          {
            opacity: glowOpacity,
            backgroundColor: dimmed
              ? 'rgba(180,200,255,0.16)'
              : 'rgba(200,215,255,0.34)',
          },
        ]}
      />
      <View
        style={[
          styles.moonBloomMid,
          dimmed
            ? { opacity: 0.55 }
            : { opacity: 0.95, backgroundColor: 'rgba(220,230,255,0.32)' },
        ]}
      />
      <View style={[styles.moonDisc, dimmed && { opacity: 0.7 }]}>
        <View style={styles.moonHighlight} />
        <View style={styles.moonShade} />
      </View>
    </Animated.View>
  );
}

type SunTone = 'dawn' | 'day' | 'heat' | 'dusk';

function SoftSun({
  tone,
  veiled = false,
}: {
  tone: SunTone;
  veiled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: tone === 'heat' ? 3600 : 6400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: tone === 'heat' ? 3200 : 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, tone]);

  const translateY = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tone === 'dawn' || tone === 'dusk' ? -3 : -5],
  });
  const glowOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: veiled ? [0.25, 0.4] : [0.55, 0.9],
  });

  // Anchor just left of the weather chip in the sticky top bar
  const layout =
    tone === 'dawn'
      ? { top: Math.max(insets.top, 0), right: 112, size: 78 }
      : tone === 'dusk'
        ? { top: Math.max(insets.top, 0) - 2, right: 108, size: 82 }
        : tone === 'heat'
          ? { top: Math.max(insets.top, 0) - 4, right: 104, size: 88 }
          : { top: Math.max(insets.top, 0) - 2, right: 110, size: 80 };

  const outer =
    tone === 'dawn'
      ? 'rgba(255,190,130,0.32)'
      : tone === 'dusk'
        ? 'rgba(255,140,80,0.34)'
        : tone === 'heat'
          ? 'rgba(255,200,80,0.4)'
          : 'rgba(255,230,140,0.34)';
  const mid =
    tone === 'dawn'
      ? 'rgba(255,210,160,0.4)'
      : tone === 'dusk'
        ? 'rgba(255,170,100,0.42)'
        : tone === 'heat'
          ? 'rgba(255,220,120,0.48)'
          : 'rgba(255,240,180,0.42)';
  const disc =
    tone === 'dawn'
      ? '#FFE2B8'
      : tone === 'dusk'
        ? '#FFB878'
        : tone === 'heat'
          ? '#FFE8A0'
          : '#FFF4C8';

  const discSize = tone === 'heat' ? 36 : tone === 'dusk' ? 34 : 32;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.celestialRoot,
        {
          top: layout.top,
          right: layout.right,
          width: layout.size,
          height: layout.size,
          transform: [{ translateY }],
          opacity: veiled ? 0.55 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.celestialBloom,
          {
            width: layout.size,
            height: layout.size,
            borderRadius: layout.size / 2,
            backgroundColor: outer,
            opacity: glowOpacity,
          },
        ]}
      />
      <View
        style={[
          styles.celestialBloom,
          {
            width: layout.size * 0.62,
            height: layout.size * 0.62,
            borderRadius: layout.size * 0.31,
            backgroundColor: mid,
          },
        ]}
      />
      <View
        style={[
          styles.sunDisc,
          {
            width: discSize,
            height: discSize,
            borderRadius: discSize / 2,
            backgroundColor: disc,
          },
        ]}
      >
        <View style={styles.sunCore} />
      </View>
    </Animated.View>
  );
}

function SunRays({ tone }: { tone: SunTone }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.22],
  });

  const color =
    tone === 'dusk'
      ? 'rgba(255,160,90,0.55)'
      : tone === 'dawn'
        ? 'rgba(255,200,140,0.5)'
        : tone === 'heat'
          ? 'rgba(255,210,100,0.55)'
          : 'rgba(255,240,180,0.45)';

  const rays = [-28, -14, 0, 14, 28];
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.rayStage,
        {
          opacity,
          top: Math.max(insets.top, 0) - 8,
          right: 94,
        },
      ]}
    >
      {rays.map((deg) => (
        <View
          key={deg}
          style={[
            styles.ray,
            {
              backgroundColor: color,
              transform: [{ rotate: `${deg}deg` }],
              height: tone === 'heat' ? 72 : 58,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function FloatingCloud({ cloud }: { cloud: CloudSpec }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: cloud.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: cloud.duration * 0.95,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const t = setTimeout(() => loop.start(), cloud.delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [anim, cloud.delay, cloud.duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -cloud.driftY],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cloud.driftX],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: cloud.top,
        left: cloud.left,
        right: cloud.right,
        width: cloud.size,
        height: cloud.size * 0.62,
        opacity: cloud.opacity,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Image
        source={CLOUD}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

/**
 * Natural breeze pass — soft atmospheric haze, not cartoon ribbons.
 * Runs about every 4s across every weather.
 */
function WindFlow({ night, width }: { night: boolean; width: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const veil = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (cancelled) return;
      progress.setValue(0);
      veil.setValue(0);
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(veil, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(veil, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;
        timeoutId = setTimeout(run, 4000);
      });
    };

    timeoutId = setTimeout(run, 1600);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      progress.stopAnimation();
      veil.stopAnimation();
    };
  }, [progress, veil]);

  // Irregular wisps — thin, staggered, slightly different paths
  const wisps = useMemo(
    () =>
      [
        { top: 0.04, h: 56, lag: 0.0, driftY: 6, w: 0.9, op: 0.09 },
        { top: 0.14, h: 38, lag: 0.06, driftY: -4, w: 0.72, op: 0.07 },
        { top: 0.26, h: 48, lag: 0.03, driftY: 8, w: 0.95, op: 0.08 },
        { top: 0.4, h: 32, lag: 0.1, driftY: -5, w: 0.65, op: 0.06 },
        { top: 0.52, h: 52, lag: 0.05, driftY: 7, w: 0.88, op: 0.085 },
        { top: 0.66, h: 36, lag: 0.12, driftY: -3, w: 0.7, op: 0.065 },
        { top: 0.78, h: 44, lag: 0.08, driftY: 5, w: 0.82, op: 0.07 },
        { top: 0.9, h: 40, lag: 0.14, driftY: -6, w: 0.75, op: 0.06 },
      ].map((w, i) => ({
        ...w,
        id: `wisp-${i}`,
        topPx: Math.round(w.top * 250),
        opacity: night ? w.op * 0.85 : w.op,
      })),
    [night],
  );

  const veilOpacity = veil.interpolate({
    inputRange: [0, 1],
    outputRange: [0, night ? 0.05 : 0.07],
  });

  return (
    <View style={styles.windLayer} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: veilOpacity,
            backgroundColor: night
              ? 'rgba(180,200,240,0.35)'
              : 'rgba(255,255,255,0.45)',
          },
        ]}
      />
      {wisps.map((wisp) => {
        const start = 0.02 + wisp.lag;
        const mid = Math.min(0.72, start + 0.42);
        const end = Math.min(0.96, start + 0.72);
        const bandW = width * wisp.w;
        const translateX = progress.interpolate({
          inputRange: [0, start, mid, end, 1],
          outputRange: [
            -bandW * 0.35,
            -bandW * 0.35,
            width * 0.35,
            width * 0.85,
            width * 0.85,
          ],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, wisp.driftY, wisp.driftY * 0.4],
        });
        const opacity = progress.interpolate({
          inputRange: [0, start, start + 0.12, mid, end, 1],
          outputRange: [0, 0, wisp.opacity, wisp.opacity * 0.7, 0, 0],
        });
        return (
          <Animated.View
            key={wisp.id}
            style={{
              position: 'absolute',
              top: wisp.topPx,
              left: 0,
              width: bandW,
              height: wisp.h,
              opacity,
              transform: [
                { translateX },
                { translateY },
                { rotate: `${wisp.driftY > 0 ? -2.5 : 2}deg` },
              ],
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={
                night
                  ? [
                      'rgba(190,210,245,0)',
                      'rgba(200,220,255,0.35)',
                      'rgba(175,200,240,0.12)',
                      'rgba(190,210,245,0)',
                    ]
                  : [
                      'rgba(255,255,255,0)',
                      'rgba(255,255,255,0.4)',
                      'rgba(255,255,255,0.12)',
                      'rgba(255,255,255,0)',
                    ]
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                'rgba(255,255,255,0.15)',
                'rgba(255,255,255,0)',
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

function StormFlash() {
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled) return;
      timeoutId = setTimeout(() => {
        Animated.sequence([
          Animated.timing(flash, {
            toValue: 1,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(flash, {
            toValue: 0.15,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(flash, {
            toValue: 0.85,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(flash, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished && !cancelled) schedule();
        });
      }, 2800 + Math.random() * 4200);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      flash.stopAnimation();
    };
  }, [flash]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fill,
        { opacity: flash, backgroundColor: 'rgba(230,235,255,0.22)' },
      ]}
    />
  );
}

function sunToneFor(dayPart: DayPart, sky: SkyWeather): SunTone {
  if (sky === 'heat') return 'heat';
  if (dayPart === 'morning') return 'dawn';
  if (dayPart === 'evening') return 'dusk';
  return 'day';
}

function AtmosphereLayers({
  weather,
  washEnd,
}: {
  weather: LocalWeather;
  washEnd: string;
}) {
  const theme = getClimateTheme(weather.mood);
  const { dayPart, skyWeather, isDay } = weather;
  const night = !isDay;

  if (night) {
    return (
      <>
        {/* Deep black crown — reads as true night */}
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.72)',
            'rgba(0,0,0,0.35)',
            'rgba(8,12,28,0.12)',
            'rgba(0,0,0,0)',
          ]}
          locations={[0, 0.28, 0.58, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(18,28,70,0.16)',
            'rgba(50,40,90,0.12)',
            'rgba(0,0,0,0)',
          ]}
          locations={[0, 0.34, 0.7, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            'rgba(160,185,240,0.14)',
            'rgba(110,140,210,0.05)',
            'rgba(40,50,90,0)',
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.9, y: 0 }}
          end={{ x: 0.15, y: 0.85 }}
          style={styles.fill}
        />
        {skyWeather === 'clear' ? (
          <>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                'rgba(180,195,240,0.07)',
                'rgba(255,255,255,0)',
              ]}
              locations={[0, 0.48, 1]}
              start={{ x: 0.08, y: 0.12 }}
              end={{ x: 0.92, y: 0.7 }}
              style={styles.fill}
            />
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0)',
                'rgba(70,55,110,0.14)',
              ]}
              locations={[0, 0.55, 1]}
              start={{ x: 0.5, y: 0.3 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.fill}
            />
          </>
        ) : null}
      </>
    );
  }

  if (dayPart === 'morning') {
    return (
      <>
        <LinearGradient
          colors={[
            'rgba(80,100,170,0.25)',
            'rgba(180,150,180,0.12)',
            'rgba(255,190,130,0)',
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            'rgba(255,200,140,0.34)',
            'rgba(255,180,120,0.1)',
            washEnd,
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.85, y: 0.15 }}
          end={{ x: 0.1, y: 0.9 }}
          style={styles.fill}
        />
        {skyWeather === 'clear' ? (
          <LinearGradient
            colors={[
              washEnd,
              'rgba(255,220,180,0.16)',
              'rgba(255,200,150,0.22)',
            ]}
            start={{ x: 0.5, y: 0.35 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.fill}
          />
        ) : null}
      </>
    );
  }

  if (dayPart === 'evening') {
    return (
      <>
        <LinearGradient
          colors={[
            'rgba(30,20,70,0.45)',
            'rgba(120,40,90,0.22)',
            'rgba(255,120,70,0)',
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            'rgba(255,140,80,0.32)',
            'rgba(255,100,70,0.12)',
            washEnd,
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.9, y: 0.1 }}
          end={{ x: 0.2, y: 0.9 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            washEnd,
            'rgba(255,150,90,0.18)',
            'rgba(255,120,70,0.26)',
          ]}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fill}
        />
      </>
    );
  }

  // Afternoon / heat / default day
  if (skyWeather === 'heat') {
    return (
      <>
        <LinearGradient
          colors={[
            'rgba(255,160,40,0.28)',
            'rgba(255,120,30,0.14)',
            washEnd,
          ]}
          start={{ x: 0.85, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            washEnd,
            'rgba(255,200,100,0.2)',
            'rgba(255,170,60,0.28)',
          ]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fill}
        />
      </>
    );
  }

  return (
    <>
      <LinearGradient
        colors={[
          'rgba(30,100,180,0.22)',
          'rgba(80,170,230,0.1)',
          washEnd,
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.fill}
      />
      <LinearGradient
        colors={[
          'rgba(255,240,170,0.22)',
          'rgba(255,230,140,0.08)',
          washEnd,
        ]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.25, y: 0.85 }}
        style={styles.fill}
      />
      {skyWeather === 'clear' ? (
        <LinearGradient
          colors={[washEnd, theme.washAlt?.[1] || 'rgba(160,215,255,0.14)']}
          start={{ x: 0.5, y: 0.45 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fill}
        />
      ) : null}
    </>
  );
}

/**
 * Full-bleed climate sky — peak atmosphere for every day-part × weather.
 * Symbols (sun/moon/clouds) are accents; gradients + particles carry the feel.
 */
export function ClimateHeaderBackdrop({ weather }: Props) {
  const theme = useMemo(() => getClimateTheme(weather.mood), [weather.mood]);
  const { width: W } = useWindowDimensions();
  const night = !weather.isDay;
  const { dayPart, skyWeather } = weather;

  const clouds = useMemo(() => buildClouds(weather, W), [weather, W]);
  const stars = useMemo(() => {
    if (!night) return [];
    if (skyWeather === 'clear') return buildStars(W, 'full');
    if (skyWeather === 'cloudy') return buildStars(W, 'sparse');
    if (skyWeather === 'rain' || skyWeather === 'storm') {
      return buildStars(W, 'few');
    }
    return [];
  }, [night, skyWeather, W]);

  const particles = useMemo(() => {
    const web = Platform.OS === 'web';
    if (skyWeather === 'rain') return buildRain(W, web ? 10 : 36, false);
    if (skyWeather === 'storm') return buildRain(W, web ? 12 : 48, true);
    if (skyWeather === 'snow') return buildSnow(W, web ? 8 : 26);
    if (skyWeather === 'heat') return buildHeatShimmer(W);
    return [];
  }, [skyWeather, W]);

  const washEnd = theme.wash[0].includes('rgba')
    ? theme.wash[0].replace(/[\d.]+\)$/, '0)')
    : 'rgba(255,255,255,0)';

  const showMoon =
    night &&
    skyWeather !== 'storm' &&
    skyWeather !== 'fog' &&
    skyWeather !== 'rain';
  const moonDimmed = skyWeather === 'cloudy';

  const showSun =
    !night &&
    skyWeather !== 'storm' &&
    skyWeather !== 'fog' &&
    skyWeather !== 'snow';
  const sunVeiled = skyWeather === 'cloudy' || skyWeather === 'rain';
  const sunTone = sunToneFor(dayPart, skyWeather);
  const showRays =
    showSun &&
    !sunVeiled &&
    (skyWeather === 'clear' || skyWeather === 'heat');

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.fill, { backgroundColor: theme.base }]} />

      <LinearGradient
        colors={[...theme.sky]}
        locations={[...(theme.skyLocations || [0, 0.33, 0.66, 1])]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.55, y: 1 }}
        style={styles.fill}
      />

      <LinearGradient
        colors={[theme.wash[0], washEnd]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={styles.fill}
      />

      <AtmosphereLayers weather={weather} washEnd={washEnd} />

      <WindFlow night={night} width={W} />

      {skyWeather === 'fog' ? (
        <>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.15)',
              'rgba(255,255,255,0.42)',
              'rgba(255,255,255,0.2)',
            ]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.85 }}
            style={styles.fill}
          />
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.35)',
              'rgba(255,255,255,0.5)',
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.fill}
          />
        </>
      ) : null}

      {skyWeather === 'storm' ? <StormFlash /> : null}

      <View style={styles.stage}>
        {stars.map((star) => (
          <TwinkleStar key={`${weather.mood}-${star.id}`} star={star} />
        ))}
        {night && skyWeather === 'clear' ? <ShootingStar width={W} /> : null}
        {showRays ? <SunRays tone={sunTone} /> : null}
        {showMoon ? <SoftMoon dimmed={moonDimmed} /> : null}
        {showSun ? <SoftSun tone={sunTone} veiled={sunVeiled} /> : null}
        {clouds.map((c) => (
          <FloatingCloud key={`${weather.mood}-${c.id}`} cloud={c} />
        ))}
        {particles.map((p) => (
          <DriftParticle key={`${weather.mood}-${p.id}`} p={p} />
        ))}
      </View>

      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          theme.horizon[1] || 'rgba(255,255,255,0.1)',
        ]}
        style={styles.horizon}
      />

      <View style={[styles.fill, { backgroundColor: theme.veil }]} />
    </View>
  );
}

/** Single colorful weather emoji for the header chip / hourly sheet. */
export function WeatherChipOrb({
  night,
  size = 16,
  skyWeather = 'clear',
  dayPart,
}: {
  night: boolean;
  size?: number;
  skyWeather?: SkyWeather;
  dayPart?: DayPart;
  color?: string;
}) {
  const symbol = resolveWeatherSymbol({ night, skyWeather, dayPart });

  return (
    <Text
      style={{
        fontSize: size,
        lineHeight: size + 2,
        includeFontPadding: false,
        textAlign: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {symbol}
    </Text>
  );
}

function resolveWeatherSymbol({
  night,
  skyWeather,
  dayPart,
}: {
  night: boolean;
  skyWeather: SkyWeather;
  dayPart?: DayPart;
}): string {
  switch (skyWeather) {
    case 'storm':
      return '⛈️';
    case 'rain':
      return '🌧️';
    case 'snow':
      return '🌨️';
    case 'fog':
      return '🌫️';
    case 'cloudy':
      return night ? '☁️' : '⛅';
    case 'heat':
      return '🌞';
    case 'clear':
    default:
      if (night) return '🌙';
      if (dayPart === 'morning') return '🌅';
      if (dayPart === 'evening') return '🌇';
      return '☀️';
  }
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  windLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
    overflow: 'hidden',
  },
  stage: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    zIndex: 2,
  },
  celestialRoot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celestialBloom: {
    position: 'absolute',
  },
  sunDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  sunCore: {
    width: '42%',
    height: '42%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  moonRoot: {
    position: 'absolute',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonBloomOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  moonBloomMid: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(210,220,255,0.18)',
  },
  moonDisc: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8EEF8',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  moonHighlight: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  moonShade: {
    position: 'absolute',
    right: -2,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(120,140,180,0.18)',
  },
  rayStage: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ray: {
    position: 'absolute',
    top: 36,
    width: 2,
    borderRadius: 2,
  },
});
