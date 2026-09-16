import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { FinderBLogo } from './BrandMark';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

/**
 * Login hero illustration — transparent backdrop, token-driven fills.
 * Works on light & dark auth surfaces without a fixed blue plate.
 */
export function LoginHeroArt() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();

  const float = useRef(new Animated.Value(0)).current;
  const pinA = useRef(new Animated.Value(0)).current;
  const pinB = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (
      value: Animated.Value,
      duration: number,
      delay = 0,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

    const floatAnim = loop(float, 2600);
    const pinAAnim = loop(pinA, 1800, 120);
    const pinBAnim = loop(pinB, 2000, 400);
    const pulseAnim = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    const sparkleAnim = loop(sparkle, 1400, 200);

    floatAnim.start();
    pinAAnim.start();
    pinBAnim.start();
    pulseAnim.start();
    sparkleAnim.start();

    return () => {
      floatAnim.stop();
      pinAAnim.stop();
      pinBAnim.stop();
      pulseAnim.stop();
      sparkleAnim.stop();
    };
  }, [float, pinA, pinB, pulse, sparkle]);

  const phoneY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const phoneScale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });
  const pinAY = pinA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });
  const pinBY = pinB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.18],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.35, 0.18, 0],
  });
  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 1, 0.45],
  });

  const phoneStroke = isDark ? colors.borderStrong : colors.border;
  const screenFill = colors.surface;
  const chromeFill = isDark ? colors.canvasDeep : colors.ink;
  const rowThumb = isDark ? colors.primary200 : colors.primary100;
  const lineMuted = isDark ? colors.primary300 : colors.borderStrong;
  const ambient = isDark ? colors.muted : colors.surface;
  const mapTop = isDark ? colors.surfaceSoft : colors.secondary100;
  const mapBot = isDark ? colors.muted : colors.muted;
  const gridStroke = isDark ? colors.secondary : colors.accent;
  const glowAmber = colors.secondary;
  const glowTeal = colors.teal;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {/* Soft atmosphere — no solid plate; parent owns the background */}
      <Svg width="100%" height="100%" viewBox="0 0 360 300" style={styles.svg}>
        <Defs>
          <LinearGradient id="mapPlate" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={mapTop} stopOpacity="0.95" />
            <Stop offset="1" stopColor={mapBot} stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id="orbAmber" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={glowAmber} stopOpacity="0.28" />
            <Stop offset="1" stopColor={glowAmber} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="orbTeal" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={glowTeal} stopOpacity="0.22" />
            <Stop offset="1" stopColor={glowTeal} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Circle cx="72" cy="78" r="54" fill="url(#orbTeal)" />
        <Circle cx="292" cy="92" r="62" fill="url(#orbAmber)" />
        <Ellipse cx="180" cy="248" rx="132" ry="22" fill={colors.ink} opacity={isDark ? 0.28 : 0.08} />

        {/* Soft clouds */}
        <Ellipse cx="58" cy="52" rx="36" ry="14" fill={ambient} opacity={isDark ? 0.45 : 0.7} />
        <Ellipse cx="84" cy="48" rx="20" ry="10" fill={ambient} opacity={isDark ? 0.3 : 0.5} />
        <Ellipse cx="304" cy="56" rx="40" ry="15" fill={ambient} opacity={isDark ? 0.4 : 0.65} />
        <Ellipse cx="330" cy="50" rx="18" ry="9" fill={ambient} opacity={isDark ? 0.28 : 0.45} />

        {/* Map disc */}
        <Ellipse cx="180" cy="214" rx="108" ry="46" fill="url(#mapPlate)" />
        <Ellipse
          cx="180"
          cy="214"
          rx="108"
          ry="46"
          fill="none"
          stroke={colors.border}
          strokeWidth="1"
          opacity={0.7}
        />
        {/* Streets */}
        <Path
          d="M95 214 H265 M180 178 V248 M120 190 C145 205 155 225 180 214 C205 203 215 230 240 218"
          stroke={gridStroke}
          strokeWidth="1.6"
          opacity={0.28}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M110 228 C140 218 160 238 190 222 C215 208 235 232 255 220"
          stroke={gridStroke}
          strokeWidth="1.2"
          opacity={0.18}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="148" cy="200" r="2.2" fill={colors.teal} opacity={0.7} />
        <Circle cx="214" cy="226" r="2" fill={colors.secondary} opacity={0.8} />
        <Circle cx="192" cy="196" r="1.6" fill={colors.accent} opacity={0.65} />
      </Svg>

      {/* Search-radius pulse under phone */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
            borderColor: colors.secondary,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.phoneWrap,
          { transform: [{ translateY: phoneY }, { scale: phoneScale }] },
        ]}
      >
        <Svg width={148} height={214} viewBox="0 0 148 214">
          <Defs>
            <LinearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={chromeFill} />
              <Stop offset="1" stopColor={isDark ? colors.muted : colors.nightSoft} />
            </LinearGradient>
            <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={screenFill} />
              <Stop offset="1" stopColor={isDark ? colors.surfaceSoft : colors.surfaceSoft} />
            </LinearGradient>
            <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.frost} stopOpacity="0.14" />
              <Stop offset="0.45" stopColor={colors.frost} stopOpacity="0" />
              <Stop offset="1" stopColor={colors.frost} stopOpacity="0.06" />
            </LinearGradient>
          </Defs>

          {/* Device shadow */}
          <Ellipse cx="74" cy="206" rx="46" ry="6" fill={colors.ink} opacity={isDark ? 0.35 : 0.12} />

          {/* Bezel */}
          <Rect x="10" y="4" width="128" height="198" rx="28" fill="url(#bezel)" />
          <Rect
            x="10"
            y="4"
            width="128"
            height="198"
            rx="28"
            fill="none"
            stroke={phoneStroke}
            strokeWidth="1.25"
            opacity={0.9}
          />
          {/* Side highlight */}
          <Path
            d="M18 28 C18 18 26 10 38 10 L42 10"
            stroke={colors.frost}
            strokeWidth="1.5"
            opacity={0.22}
            fill="none"
            strokeLinecap="round"
          />

          {/* Screen */}
          <Rect x="18" y="16" width="112" height="174" rx="20" fill="url(#glass)" />
          <Rect x="18" y="16" width="112" height="174" rx="20" fill="url(#shine)" />

          {/* Status / notch */}
          <Rect x="56" y="22" width="36" height="5" rx="2.5" fill={chromeFill} opacity={0.35} />

          {/* Search pill */}
          <Rect x="28" y="36" width="92" height="24" rx="12" fill={isDark ? colors.muted : colors.muted} />
          <Circle cx="40" cy="48" r="6.5" fill={colors.secondary} opacity={0.95} />
          <Rect x="52" y="44" width="48" height="4.5" rx="2.25" fill={lineMuted} opacity={0.75} />
          <Rect x="52" y="51" width="28" height="3.5" rx="1.75" fill={lineMuted} opacity={0.4} />

          {/* Listing cards */}
          {[0, 1, 2].map((i) => {
            const y = 72 + i * 34;
            return (
              <G key={i}>
                <Rect
                  x="28"
                  y={y}
                  width="92"
                  height="28"
                  rx="9"
                  fill={isDark ? colors.canvasDeep : colors.canvasWarm}
                  opacity={0.95}
                />
                <Rect x="34" y={y + 5} width="18" height="18" rx="5" fill={rowThumb} />
                <Rect
                  x="34"
                  y={y + 5}
                  width="18"
                  height="18"
                  rx="5"
                  fill={i === 1 ? colors.secondary : colors.teal}
                  opacity={0.22}
                />
                <Rect x="58" y={y + 7} width="46" height="4.5" rx="2.25" fill={lineMuted} />
                <Rect
                  x="58"
                  y={y + 15}
                  width={34 - i * 6}
                  height="4"
                  rx="2"
                  fill={colors.secondary}
                  opacity={0.9}
                />
                {/* tiny stars */}
                <Circle cx="108" cy={y + 10} r="1.6" fill={colors.star} />
                <Circle cx="113" cy={y + 10} r="1.6" fill={colors.star} opacity={0.7} />
              </G>
            );
          })}

          {/* Home indicator */}
          <Rect x="58" y="176" width="32" height="4" rx="2" fill={lineMuted} opacity={0.55} />
        </Svg>

        <View style={styles.logoOnPhone}>
          <FinderBLogo size={13} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.pinLeft,
          { transform: [{ translateY: pinAY }], opacity: sparkleOpacity },
        ]}
      >
        <Svg width={52} height={66} viewBox="0 0 52 66">
          <Ellipse cx="26" cy="60" rx="12" ry="3.5" fill={colors.ink} opacity={isDark ? 0.35 : 0.12} />
          <Circle cx="26" cy="24" r="18" fill={glowTeal} opacity={0.18} />
          <Path
            d="M26 4 C14.5 4 6 13 6 24.5 C6 38 26 58 26 58 C26 58 46 38 46 24.5 C46 13 37.5 4 26 4 Z"
            fill={colors.success}
          />
          <Circle cx="26" cy="24" r="9" fill={colors.surface} />
          <Circle cx="26" cy="24" r="4.5" fill={colors.tealDeep} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.pinRight, { transform: [{ translateY: pinBY }] }]}>
        <Svg width={48} height={62} viewBox="0 0 48 62">
          <Ellipse cx="24" cy="56" rx="11" ry="3" fill={colors.ink} opacity={isDark ? 0.35 : 0.12} />
          <Circle cx="24" cy="22" r="16" fill={glowAmber} opacity={0.2} />
          <Path
            d="M24 3 C13.5 3 6 12 6 22.5 C6 35 24 54 24 54 C24 54 42 35 42 22.5 C42 12 34.5 3 24 3 Z"
            fill={colors.secondary}
          />
          <Circle cx="24" cy="22" r="8.5" fill={colors.surface} />
          <Circle cx="24" cy="22" r="4" fill={colors.accentDeep} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.starLeft, { opacity: sparkleOpacity }]}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Path
            d="M9 1 L10.8 6.2 L16.2 6.4 L12 9.8 L13.4 15 L9 12.2 L4.6 15 L6 9.8 L1.8 6.4 L7.2 6.2 Z"
            fill={colors.star}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.starRight, { opacity: sparkleOpacity }]}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path
            d="M7 0.8 L8.2 4.6 L12.2 4.8 L9 7.4 L10 11.2 L7 9.2 L4 11.2 L5 7.4 L1.8 4.8 L5.8 4.6 Z"
            fill={colors.secondary}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const useStyles = createThemedStyles(() => ({
  wrap: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    ...StyleSheet.absoluteFill,
  },
  pulseRing: {
    position: 'absolute',
    bottom: 46,
    width: 150,
    height: 58,
    borderRadius: 999,
    borderWidth: 2,
  },
  phoneWrap: {
    position: 'absolute',
    top: 18,
    alignItems: 'center',
  },
  logoOnPhone: {
    position: 'absolute',
    top: 42,
    left: 34,
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pinLeft: {
    position: 'absolute',
    left: '12%',
    bottom: 58,
  },
  pinRight: {
    position: 'absolute',
    right: '11%',
    bottom: 72,
  },
  starLeft: {
    position: 'absolute',
    left: '22%',
    top: 86,
  },
  starRight: {
    position: 'absolute',
    right: '20%',
    top: 72,
  },
}));
