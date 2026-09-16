import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { FinderBLogo } from './BrandMark';
import { fonts } from '../constants/typography';

const { width: W, height: H } = Dimensions.get('window');
const softOut = Easing.bezier(0.16, 1, 0.3, 1);
const softInOut = Easing.bezier(0.45, 0, 0.2, 1);

const SKY = ['#0A4F96', '#1270C4', '#2A92E4', '#62B8F4'] as const;

type Props = {
  mode?: 'intro' | 'boot';
  message?: string;
};

/**
 * Cinematic brand splash — layered light, restrained motion,
 * premium wordmark reveal (native-feeling, not a spinner gimmick).
 */
export function BrandedSplash({
  mode = 'boot',
  message = 'Preparing your local guide',
}: Props) {
  const scene = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const foot = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const rail = useRef(new Animated.Value(0)).current;
  const orbDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = mode === 'intro';

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scene, {
          toValue: 1,
          duration: intro ? 420 : 280,
          easing: softOut,
          useNativeDriver: true,
        }),
        Animated.timing(bloom, {
          toValue: 1,
          duration: intro ? 520 : 320,
          easing: softOut,
          useNativeDriver: true,
        }),
        Animated.spring(mark, {
          toValue: 1,
          friction: 8,
          tension: 64,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(word, {
          toValue: 1,
          duration: 320,
          easing: softOut,
          useNativeDriver: true,
        }),
        Animated.timing(tag, {
          toValue: 1,
          duration: 280,
          delay: 40,
          easing: softOut,
          useNativeDriver: true,
        }),
        Animated.timing(foot, {
          toValue: 1,
          duration: 260,
          delay: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2800,
          easing: softInOut,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2800,
          easing: softInOut,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rail, {
          toValue: 1,
          duration: 1600,
          easing: softInOut,
          useNativeDriver: true,
        }),
        Animated.timing(rail, {
          toValue: 0,
          duration: 1600,
          easing: softInOut,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbDrift, {
          toValue: 1,
          duration: 5200,
          easing: softInOut,
          useNativeDriver: true,
        }),
        Animated.timing(orbDrift, {
          toValue: 0,
          duration: 5200,
          easing: softInOut,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bloom, breath, foot, mark, mode, orbDrift, rail, scene, sweep, tag, word]);

  const letters = useMemo(() => 'FinderB'.split(''), []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[...SKY]}
        locations={[0, 0.34, 0.68, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric orbs */}
      <Animated.View
        style={[
          styles.orbGold,
          {
            opacity: bloom.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.55],
            }),
            transform: [
              {
                translateY: orbDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
              {
                translateX: orbDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbCool,
          {
            opacity: bloom.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
            transform: [
              {
                translateY: orbDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 22],
                }),
              },
            ],
          },
        ]}
      />

      {/* Soft light field behind brand */}
      <Animated.View
        style={[
          styles.bloom,
          {
            opacity: bloom.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.62],
            }),
            transform: [
              {
                scale: breath.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
            ],
          },
        ]}
      />

      {/* Subtle horizon line */}
      <Animated.View
        style={[
          styles.horizon,
          {
            opacity: scene.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          },
        ]}
      />

      <Animated.View
        style={[
          styles.stage,
          {
            opacity: scene,
            transform: [
              {
                translateY: scene.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.markWrap,
            {
              opacity: mark,
              transform: [
                {
                  scale: mark.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.82, 1],
                  }),
                },
                {
                  rotate: mark.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-4deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <FinderBLogo size={118} />

          {/* Soft shimmer across mark */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              {
                transform: [
                  {
                    translateX: sweep.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-90, 120],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.wordRow,
            {
              opacity: word,
              transform: [
                {
                  translateY: word.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {letters.map((ch, i) => (
            <Animated.Text
              key={`${ch}-${i}`}
              style={[
                styles.wordmark,
                {
                  opacity: word.interpolate({
                    inputRange: [0, 0.35 + i * 0.08, 1],
                    outputRange: [0, 0, 1],
                  }),
                  transform: [
                    {
                      translateY: word.interpolate({
                        inputRange: [0, 0.35 + i * 0.08, 1],
                        outputRange: [10, 10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.tagRow,
            {
              opacity: tag,
              transform: [
                {
                  translateY: tag.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.tagRule} />
          <Text style={styles.tagline}>Trusted locals near you</Text>
          <View style={styles.tagRule} />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: foot }]}>
        <View style={styles.railTrack}>
          <Animated.View
            style={[
              styles.railFill,
              {
                transform: [
                  {
                    translateX: rail.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-72, 72],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>
          {mode === 'boot' ? message : 'Curating nearby places'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A4F96',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbGold: {
    position: 'absolute',
    top: H * 0.08,
    right: -W * 0.18,
    width: W * 0.55,
    height: W * 0.55,
    borderRadius: W,
    backgroundColor: 'rgba(249,184,100,0.22)',
  },
  orbCool: {
    position: 'absolute',
    bottom: H * 0.12,
    left: -W * 0.2,
    width: W * 0.62,
    height: W * 0.62,
    borderRadius: W,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bloom: {
    position: 'absolute',
    top: H * 0.2,
    width: W * 0.95,
    height: W * 0.95,
    borderRadius: W,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  horizon: {
    position: 'absolute',
    top: H * 0.42,
    left: 40,
    right: 40,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stage: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: -28,
  },
  markWrap: {
    marginBottom: 26,
    width: 118,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.28)',
    transform: [{ skewX: '-18deg' }],
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.extraBold,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.6,
    color: '#FFFFFF',
    textShadowColor: 'rgba(4,28,51,0.25)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 16,
  },
  tagRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagRule: {
    width: 18,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(249,184,100,0.95)',
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    left: 48,
    right: 48,
    alignItems: 'center',
    gap: 14,
  },
  railTrack: {
    width: 88,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  railFill: {
    width: 40,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.58)',
  },
});
