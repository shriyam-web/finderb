import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import type { DayPart, SkyWeather } from '../lib/weather';

const NATIVE = Platform.OS !== 'web';
const CLOUD = 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z';
const MOON = 'M20 13.6A8.2 8.2 0 1 1 10.4 4a6.4 6.4 0 0 0 9.6 9.6z';
const BOLT = 'M13.2 12.5 9.6 18h2.9l-1.1 4.5 4-6h-2.9l1.4-4z';

function useLoop(duration: number) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: NATIVE,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [duration, value]);
  return value;
}

/** Same loop shifted by `offset` of a cycle, so particles fall out of step. */
function phased(value: Animated.Value, offset: number) {
  if (!offset) return value;
  return value.interpolate({
    inputRange: [0, 1 - offset, 1 - offset + 0.001, 1],
    outputRange: [offset, 1, 0, offset],
  });
}

function pingPong(value: Animated.Value, from: number, to: number) {
  return value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from, to, from] });
}

type Ink = {
  sun: string;
  moon: string;
  star: string;
  cloud: string;
  cloudEdge: string;
  rainCloud: string;
  drop: string;
  flake: string;
  fog: string;
};

function inkFor(onLight: boolean, skyWeather: SkyWeather, dayPart?: DayPart): Ink {
  const lowSun = dayPart === 'morning' || dayPart === 'evening';
  return {
    sun: skyWeather === 'heat' ? '#F97316' : lowSun ? '#FB923C' : '#FBBF24',
    moon: onLight ? '#F2B53A' : '#FDE68A',
    star: onLight ? '#F59E0B' : '#FFFFFF',
    cloud: onLight ? '#E2E8F0' : '#F8FAFC',
    cloudEdge: onLight ? '#94A3B8' : 'rgba(255,255,255,0)',
    rainCloud:
      skyWeather === 'storm'
        ? onLight ? '#64748B' : '#94A3B8'
        : onLight ? '#94A3B8' : '#CBD5E1',
    drop: onLight ? '#2563EB' : '#7DD3FC',
    flake: onLight ? '#60A5FA' : '#FFFFFF',
    fog: onLight ? '#94A3B8' : 'rgba(241,245,249,0.9)',
  };
}

function SunRays({ color, spin }: { color: string; spin: Animated.Value }) {
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 24 24">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <Line
              key={i}
              x1={12 + Math.cos(a) * 8}
              y1={12 + Math.sin(a) * 8}
              x2={12 + Math.cos(a) * 10.5}
              y2={12 + Math.sin(a) * 10.5}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

function Sun({ color, spinMs, pulse }: { color: string; spinMs: number; pulse?: boolean }) {
  const spin = useLoop(spinMs);
  const beat = useLoop(1800);
  const scale = pulse ? pingPong(beat, 1, 1.12) : 1;
  return (
    <View style={StyleSheet.absoluteFill}>
      <SunRays color={color} spin={spin} />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={5.2} fill={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Moon({
  color,
  starColor = '#FFFFFF',
  twinkle = true,
}: {
  color: string;
  starColor?: string;
  twinkle?: boolean;
}) {
  const loop = useLoop(2600);
  const opacity = pingPong(loop, 0.15, 1);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 24 24">
        <Path d={MOON} fill={color} />
      </Svg>
      {twinkle ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <Svg width="100%" height="100%" viewBox="0 0 24 24">
            <Path d="M19.5 2.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill={starColor} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Cloud({
  fill,
  edge,
  raised,
  drift,
}: {
  fill: string;
  edge: string;
  raised?: boolean;
  drift?: boolean;
}) {
  const loop = useLoop(4200);
  const translateX = drift ? pingPong(loop, -0.8, 0.8) : 0;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 24 24">
        <G transform={raised ? 'translate(2.2 -2.6) scale(0.82)' : 'translate(0 1.5)'}>
          <Path d={CLOUD} fill={fill} stroke={edge} strokeWidth={1.2} strokeLinejoin="round" />
        </G>
      </Svg>
    </Animated.View>
  );
}

function Falling({
  size,
  color,
  kind,
  count,
}: {
  size: number;
  color: string;
  kind: 'drop' | 'flake';
  count: number;
}) {
  const loop = useLoop(kind === 'drop' ? 900 : 2200);
  const k = size / 24;
  const xs = count === 2 ? [9, 15] : [7, 12, 17];
  return (
    <>
      {xs.map((x, i) => {
        const phase = phased(loop, i / xs.length);
        const translateY = phase.interpolate({ inputRange: [0, 1], outputRange: [0, 5 * k] });
        const opacity = phase.interpolate({
          inputRange: [0, 0.2, 0.75, 1],
          outputRange: [0, 1, 1, 0],
        });
        const w = (kind === 'drop' ? 1.8 : 2.6) * k;
        const h = (kind === 'drop' ? 4 : 2.6) * k;
        return (
          <Animated.View
            key={x}
            style={{
              position: 'absolute',
              left: x * k - w / 2,
              top: 15.5 * k,
              width: w,
              height: h,
              borderRadius: w,
              backgroundColor: color,
              opacity,
              transform: [{ translateY }],
            }}
          />
        );
      })}
    </>
  );
}

function Bolt() {
  const loop = useLoop(2400);
  const opacity = loop.interpolate({
    inputRange: [0, 0.62, 0.66, 0.7, 0.74, 0.8, 1],
    outputRange: [0.85, 0.85, 0.15, 1, 0.2, 0.85, 0.85],
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 24 24">
        <Path d={BOLT} fill="#FACC15" />
      </Svg>
    </Animated.View>
  );
}

function Fog({ size, color }: { size: number; color: string }) {
  const loop = useLoop(3200);
  const k = size / 24;
  return (
    <>
      {[6, 11, 16].map((y, i) => {
        const translateX = pingPong(loop, i % 2 ? 1.6 * k : -1.6 * k, i % 2 ? -1.6 * k : 1.6 * k);
        return (
          <Animated.View
            key={y}
            style={{
              position: 'absolute',
              left: (i === 1 ? 2 : 4) * k,
              top: y * k,
              width: (i === 1 ? 20 : 16) * k,
              height: 2.4 * k,
              borderRadius: 2 * k,
              backgroundColor: color,
              transform: [{ translateX }],
            }}
          />
        );
      })}
    </>
  );
}

/** Small live weather icon: sun turns, rain falls, stars twinkle, lightning flashes. */
export function AnimatedWeatherGlyph({
  skyWeather,
  night,
  dayPart,
  size = 16,
  onLight = false,
}: {
  skyWeather: SkyWeather;
  night: boolean;
  dayPart?: DayPart;
  size?: number;
  onLight?: boolean;
}) {
  const ink = inkFor(onLight, skyWeather, dayPart);
  const corner = { position: 'absolute' as const, top: -size * 0.12, right: -size * 0.14, width: size * 0.62, height: size * 0.62 };

  let scene: ReactNode;
  switch (skyWeather) {
    case 'rain':
      scene = (
        <>
          <Cloud fill={ink.rainCloud} edge={ink.cloudEdge} raised />
          <Falling size={size} color={ink.drop} kind="drop" count={3} />
        </>
      );
      break;
    case 'storm':
      scene = (
        <>
          <Cloud fill={ink.rainCloud} edge={ink.cloudEdge} raised />
          <Bolt />
          <Falling size={size} color={ink.drop} kind="drop" count={2} />
        </>
      );
      break;
    case 'snow':
      scene = (
        <>
          <Cloud fill={ink.cloud} edge={ink.cloudEdge} raised />
          <Falling size={size} color={ink.flake} kind="flake" count={3} />
        </>
      );
      break;
    case 'fog':
      scene = <Fog size={size} color={ink.fog} />;
      break;
    case 'cloudy':
      scene = (
        <>
          <View style={corner}>
            {night ? <Moon color={ink.moon} twinkle={false} /> : <Sun color={ink.sun} spinMs={14000} />}
          </View>
          <Cloud fill={ink.cloud} edge={ink.cloudEdge} drift />
        </>
      );
      break;
    case 'heat':
      scene = <Sun color={ink.sun} spinMs={6000} pulse />;
      break;
    case 'clear':
    default:
      scene = night ? (
        <Moon color={ink.moon} starColor={ink.star} />
      ) : (
        <Sun color={ink.sun} spinMs={12000} />
      );
  }

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {scene}
    </View>
  );
}
