import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { createConsoleStyles } from './kit';

export type AlertTone = 'danger' | 'warning' | 'info' | 'success';

export type AlertSlide = {
  key: string;
  tone: AlertTone;
  /** Short pill above the title, e.g. "Action needed". */
  kicker: string;
  title: string;
  body: string;
  cta: string;
  art: ImageSourcePropType;
  onPress: () => void;
};

/* eslint-disable @typescript-eslint/no-require-imports */
export const BANNER_ART = {
  leads: require('../../assets/console/leads.png'),
  photos: require('../../assets/console/photos.png'),
  verify: require('../../assets/console/verify.png'),
  growth: require('../../assets/console/growth.png'),
  profile: require('../../assets/console/profile.png'),
} as const;
/* eslint-enable @typescript-eslint/no-require-imports */

const ROTATE_MS = 6000;
const SLIDE_HEIGHT = 148;

type SlideLook = {
  colors: [string, string, string];
  ink: string;
  muted: string;
  kickerBg: string;
  kickerInk: string;
  cta: string;
  ctaInk: string;
  blob: string;
  blobTwo: string;
};

const DAY_LOOKS: Record<string, SlideLook> = {
  photo: {
    colors: ['#FFE4D6', '#FFB199', '#FF7A59'],
    ink: '#4A140C',
    muted: '#7A3328',
    kickerBg: 'rgba(255,255,255,0.62)',
    kickerInk: '#C2410C',
    cta: '#C2410C',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.28)',
    blobTwo: 'rgba(255,90,60,0.28)',
  },
  verify: {
    colors: ['#FFF4CC', '#FFD56A', '#F5A524'],
    ink: '#4A2E00',
    muted: '#7A5410',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#B45309',
    cta: '#B45309',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.32)',
    blobTwo: 'rgba(255,180,40,0.35)',
  },
  leads: {
    colors: ['#D8F8E8', '#8EE0B8', '#34C77B'],
    ink: '#064E3B',
    muted: '#0F766E',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#047857',
    cta: '#047857',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(16,185,129,0.28)',
  },
  'pending-payment': {
    colors: ['#E4F4FF', '#A8D4F5', '#5BA8E0'],
    ink: '#0C4A6E',
    muted: '#155E75',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#0369A1',
    cta: '#0F766E',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(56,189,248,0.28)',
  },
  expired: {
    colors: ['#FFE0E0', '#FF9B9B', '#F04343'],
    ink: '#7F1D1D',
    muted: '#9F2A2A',
    kickerBg: 'rgba(255,255,255,0.6)',
    kickerInk: '#B91C1C',
    cta: '#B91C1C',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.28)',
    blobTwo: 'rgba(248,113,113,0.32)',
  },
  renew: {
    colors: ['#FFE8CC', '#FFC078', '#F59E0B'],
    ink: '#7C2D12',
    muted: '#9A3412',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#C2410C',
    cta: '#C2410C',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(251,146,60,0.32)',
  },
  upgrade: {
    colors: ['#D9F6F0', '#7EDFD0', '#2DD4BF'],
    ink: '#134E4A',
    muted: '#0F766E',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#0F766E',
    cta: '#0F766E',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(45,212,191,0.3)',
  },
  'reviews-visibility': {
    colors: ['#EDE4FF', '#C4B0F5', '#A78BFA'],
    ink: '#4C1D95',
    muted: '#6D28D9',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#6D28D9',
    cta: '#6D28D9',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(167,139,250,0.32)',
  },
  profile: {
    colors: ['#E0EEFF', '#93C5FD', '#60A5FA'],
    ink: '#1E3A8A',
    muted: '#1D4ED8',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#1D4ED8',
    cta: '#1E40AF',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(96,165,250,0.3)',
  },
  danger: {
    colors: ['#FFE4E0', '#FFB4A8', '#FB7185'],
    ink: '#9F1239',
    muted: '#BE123C',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#BE123C',
    cta: '#BE123C',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.28)',
    blobTwo: 'rgba(251,113,133,0.3)',
  },
  warning: {
    colors: ['#FEF3C7', '#FCD34D', '#F59E0B'],
    ink: '#78350F',
    muted: '#92400E',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#B45309',
    cta: '#B45309',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(251,191,36,0.32)',
  },
  info: {
    colors: ['#E0F2FE', '#7DD3FC', '#38BDF8'],
    ink: '#0C4A6E',
    muted: '#0369A1',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#0369A1',
    cta: '#0E7490',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(56,189,248,0.3)',
  },
  success: {
    colors: ['#D1FAE5', '#6EE7B7', '#34D399'],
    ink: '#064E3B',
    muted: '#047857',
    kickerBg: 'rgba(255,255,255,0.58)',
    kickerInk: '#047857',
    cta: '#047857',
    ctaInk: '#FFFFFF',
    blob: 'rgba(255,255,255,0.3)',
    blobTwo: 'rgba(52,211,153,0.3)',
  },
};

function lookFor(slide: AlertSlide): SlideLook {
  return DAY_LOOKS[slide.key] || DAY_LOOKS[slide.tone] || DAY_LOOKS.info;
}

/** Account banners that rotate on their own, like the website dashboard; swipe or tap a dot to jump. */
export function AlertCarousel({ slides }: { slides: AlertSlide[] }) {
  const styles = useStyles();
  const list = useRef<FlatList<AlertSlide>>(null);
  const shown = useRef(0);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [pausedAt, setPausedAt] = useState(0);
  const count = slides.length;
  const active = count ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (count < 2 || !width) return;
    const timer = setInterval(() => {
      const next = (shown.current + 1) % count;
      shown.current = next;
      setIndex(next);
      list.current?.scrollToOffset({ offset: next * width, animated: true });
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, width, pausedAt]);

  if (!count) return null;

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const settled = Math.round(event.nativeEvent.contentOffset.x / width);
    shown.current = settled;
    setIndex(settled);
  };

  const jump = (next: number) => {
    shown.current = next;
    setIndex(next);
    setPausedAt((n) => n + 1);
    list.current?.scrollToOffset({ offset: next * width, animated: true });
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width))}
      accessibilityLabel="Account updates"
    >
      {width ? (
        <FlatList
          ref={list}
          data={slides}
          keyExtractor={(slide) => slide.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setPausedAt((n) => n + 1)}
          onMomentumScrollEnd={onSettle}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item, index: i }) => {
            const look = lookFor(item);
            return (
              <View style={{ width }}>
                <Pressable
                  onPress={item.onPress}
                  style={({ pressed }) => [styles.slide, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Update ${i + 1} of ${count}. ${item.title}. ${item.body}`}
                >
                  <LinearGradient colors={look.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wash}>
                    <View style={[styles.blob, { backgroundColor: look.blob }]} />
                    <View style={[styles.blobTwo, { backgroundColor: look.blobTwo }]} />
                    <View style={[styles.ribbon, { backgroundColor: look.blob }]} />
                    <View style={styles.copy}>
                      <View style={[styles.kicker, { backgroundColor: look.kickerBg }]}>
                        <View style={[styles.kickerDot, { backgroundColor: look.kickerInk }]} />
                        <Text style={[styles.kickerText, { color: look.kickerInk }]} numberOfLines={1}>
                          {item.kicker}
                        </Text>
                      </View>
                      <Text style={[styles.title, { color: look.ink }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.body, { color: look.muted }]} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <View style={[styles.cta, { backgroundColor: look.cta }]}>
                        <Text style={[styles.ctaText, { color: look.ctaInk }]}>{item.cta}</Text>
                        <Ionicons name="arrow-forward" size={14} color={look.ctaInk} />
                      </View>
                    </View>
                    <View style={styles.artWrap}>
                      <Image source={item.art} style={styles.art} resizeMode="contain" fadeDuration={0} alt="" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
      {count > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Pressable
              key={slide.key}
              onPress={() => jump(i)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Show update ${i + 1}`}
              style={[styles.dot, i === active && styles.dotOn]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  slide: {
    height: SLIDE_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  wash: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  blob: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -48,
    right: 72,
  },
  blobTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 28,
    bottom: -28,
    right: 8,
    transform: [{ rotate: '18deg' }],
  },
  ribbon: {
    position: 'absolute',
    width: 220,
    height: 18,
    left: -40,
    bottom: 22,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.35,
  },
  pressed: { opacity: 0.92 },
  copy: { flex: 1, minWidth: 0, paddingVertical: 12, gap: 4, zIndex: 1 },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  kickerDot: { width: 6, height: 6, borderRadius: 3 },
  kickerText: { fontFamily: fonts.semiBold, fontSize: 10.5, letterSpacing: 0.2 },
  title: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  cta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 8,
  },
  ctaText: { fontFamily: fonts.semiBold, fontSize: 12.5 },
  artWrap: {
    width: 128,
    height: SLIDE_HEIGHT,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  art: { width: 124, height: 124 },
  placeholder: { height: SLIDE_HEIGHT },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.lineStrong },
  dotOn: { width: 16, backgroundColor: c.ink },
}));
