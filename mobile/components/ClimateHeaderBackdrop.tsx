import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  0.16,
];
const Y_SEEDS = [
  0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.12, 0.18, 0.24, 0.32,
  0.38, 0.08, 0.16, 0.28, 0.36, 0.42, 0.06, 0.14, 0.22, 0.34, 0.44, 0.09, 0.19,
  0.29, 0.39, 0.11, 0.21, 0.31, 0.41, 0.07, 0.17, 0.27, 0.37, 0.13, 0.23, 0.33,
  0.43,
];

function buildStars(width: number, density: 'full' | 'sparse' | 'few'): StarSpec[] {
  const count = density === 'full' ? 44 : density === 'sparse' ? 20 : 10;
  return Array.from({ length: count }, (_, i) => {
    const size = i % 8 === 0 ? 2.5 : i % 3 === 0 ? 1.7 : 1.15;
    return {
      id: `st-${i}`,
      left: Math.round(X_SEEDS[i % X_SEEDS.length]! * (width - 12)) + 4,
      top: Math.round(Y_SEEDS[i % Y_SEEDS.length]! * 215) + 4,
      size,
      baseOpacity: size > 2 ? 0.9 : 0.32 + (i % 5) * 0.08,
      duration: 2100 + (i % 7) * 650,
      delay: (i % 10) * 160,
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
      duration: 7600 + i * 700,
      delay: i * 280,
      driftY: 3 + (i % 3),
      driftX: i % 2 === 0 ? 5 : -4,
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
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: star.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: star.duration * 1.1,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const t = setTimeout(() => loop.start(), star.delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [anim, star.delay, star.duration]);

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      star.baseOpacity * 0.3,
      star.baseOpacity,
      star.baseOpacity * 0.5,
    ],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: star.left,
        top: star.top,
        width: star.size,
        height: star.size,
        borderRadius: star.size,
        backgroundColor: '#F4F7FF',
        opacity,
      }}
    />
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
    outputRange: dimmed ? [0.28, 0.42] : [0.55, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.moonRoot, { top: 12, right: 14, transform: [{ translateY }] }]}
    >
      <Animated.View
        style={[
          styles.moonBloomOuter,
          { opacity: glowOpacity, backgroundColor: 'rgba(180,200,255,0.18)' },
        ]}
      />
      <View style={[styles.moonBloomMid, dimmed && { opacity: 0.55 }]} />
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

  const layout =
    tone === 'dawn'
      ? { top: 28, right: 28, size: 132 }
      : tone === 'dusk'
        ? { top: 22, right: 18, size: 148 }
        : tone === 'heat'
          ? { top: -8, right: -4, size: 168 }
          : { top: -4, right: 2, size: 150 };

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

  const discSize = tone === 'heat' ? 52 : tone === 'dusk' ? 46 : 42;

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
      style={[styles.rayStage, { opacity, top: tone === 'dawn' ? 10 : -6, right: -10 }]}
    >
      {rays.map((deg) => (
        <View
          key={deg}
          style={[
            styles.ray,
            {
              backgroundColor: color,
              transform: [{ rotate: `${deg}deg` }],
              height: tone === 'heat' ? 130 : 110,
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
        <LinearGradient
          colors={[
            'rgba(2,4,14,0.55)',
            'rgba(20,30,70,0.2)',
            'rgba(70,50,110,0.18)',
            'rgba(2,4,14,0)',
          ]}
          locations={[0, 0.35, 0.72, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fill}
        />
        <LinearGradient
          colors={[
            'rgba(200,215,255,0.2)',
            'rgba(140,160,230,0.07)',
            'rgba(40,50,100,0)',
          ]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.92, y: 0 }}
          end={{ x: 0.15, y: 0.85 }}
          style={styles.fill}
        />
        {skyWeather === 'clear' ? (
          <LinearGradient
            colors={[
              'rgba(160,170,255,0)',
              'rgba(150,160,230,0.07)',
              'rgba(180,150,220,0.05)',
              'rgba(160,170,255,0)',
            ]}
            locations={[0, 0.35, 0.55, 1]}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 1, y: 0.55 }}
            style={styles.fill}
          />
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
    if (Platform.OS === 'web') return buildStars(W, 'few');
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

/** Tiny sun/moon for the header weather chip. */
export function WeatherChipOrb({
  night,
  size = 16,
}: {
  night: boolean;
  size?: number;
}) {
  if (night) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E8EEFF',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.55)',
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFE8A8',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,220,140,0.8)',
      }}
    />
  );
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
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonBloomOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  moonBloomMid: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(210,220,255,0.22)',
  },
  moonDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ray: {
    position: 'absolute',
    top: 55,
    width: 3,
    borderRadius: 2,
  },
});
