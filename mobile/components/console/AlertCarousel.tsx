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
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
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
  leads: require('../../assets/console/leads.jpg'),
  photos: require('../../assets/console/photos.jpg'),
  verify: require('../../assets/console/verify.jpg'),
  growth: require('../../assets/console/growth.jpg'),
  profile: require('../../assets/console/profile.jpg'),
} as const;
/* eslint-enable @typescript-eslint/no-require-imports */

const ROTATE_MS = 6000;
const SLIDE_HEIGHT = 148;

/** Account banners that rotate on their own, like the website dashboard; swipe or tap a dot to jump. */
export function AlertCarousel({ slides }: { slides: AlertSlide[] }) {
  const styles = useStyles();
  const c = useConsoleColors();
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

  const palette = (tone: AlertTone) =>
    ({
      danger: { wash: c.dangerSoft, ink: c.danger },
      warning: { wash: c.warningSoft, ink: c.warning },
      info: { wash: c.brandSoft, ink: c.brand },
      success: { wash: c.successSoft, ink: c.success },
    })[tone];

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
            const tone = palette(item.tone);
            return (
              <View style={{ width }}>
                <Pressable
                  onPress={item.onPress}
                  style={({ pressed }) => [styles.slide, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Update ${i + 1} of ${count}. ${item.title}. ${item.body}`}
                >
                  <View style={styles.copy}>
                    <View style={[styles.kicker, { backgroundColor: tone.wash }]}>
                      <View style={[styles.kickerDot, { backgroundColor: tone.ink }]} />
                      <Text style={[styles.kickerText, { color: tone.ink }]} numberOfLines={1}>
                        {item.kicker}
                      </Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.body} numberOfLines={2}>
                      {item.body}
                    </Text>
                    <View style={styles.cta}>
                      <Text style={styles.ctaText}>{item.cta}</Text>
                      <Ionicons name="arrow-forward" size={14} color={c.primaryInk} />
                    </View>
                  </View>
                  <View style={styles.artWrap}>
                    <Image source={item.art} style={styles.art} resizeMode="contain" fadeDuration={0} alt="" />
                  </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.isDark ? c.card : '#FFFFFF',
    paddingLeft: 14,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.88 },
  copy: { flex: 1, minWidth: 0, paddingVertical: 12, gap: 4 },
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
  title: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20, color: c.ink },
  body: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.muted },
  cta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 8,
    backgroundColor: c.primary,
  },
  ctaText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.primaryInk },
  artWrap: {
    width: 128,
    height: SLIDE_HEIGHT - 2,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  art: { width: 124, height: 124 },
  placeholder: { height: SLIDE_HEIGHT },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.lineStrong },
  dotOn: { width: 16, backgroundColor: c.primary },
}));
