import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { FinderBLogo } from './BrandMark';
import { fonts } from '../constants/typography';

const CATEGORIES = [
  { label: 'Cafe', icon: 'cup', fill: '#FEF3C7', mark: '#B45309' },
  { label: 'Care', icon: 'plus', fill: '#D1FAE5', mark: '#047857' },
  { label: 'Fix', icon: 'tool', fill: '#DBEAFE', mark: '#1D4ED8' },
  { label: 'Stay', icon: 'bed', fill: '#FCE7F3', mark: '#BE185D' },
] as const;

type Tone = 'warm' | 'blue';

/**
 * Phone scene on user login and registration.
 * The handset shows a nearby search. Cards around it show distance, a save, and a rating.
 */
export function LoginHeroArt({ tone = 'warm' }: { tone?: Tone }) {
  const float = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const phone = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const cards = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    phone.start();
    cards.start();
    return () => {
      phone.stop();
      cards.stop();
    };
  }, [drift, float]);

  const phoneY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const leftY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const rightY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const onBlue = tone === 'blue';
  const ink = onBlue ? 'rgba(255,255,255,0.34)' : 'rgba(28,25,23,0.14)';
  const pin = onBlue ? '#F9B864' : '#E8811E';

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 230" style={styles.backdrop}>
        <Ellipse cx="195" cy="118" rx="132" ry="86" fill="none" stroke={ink} strokeWidth="1.25" />
        <Ellipse cx="195" cy="118" rx="92" ry="58" fill="none" stroke={ink} strokeWidth="1" />
        <Path
          d="M42 124 C 70 116, 96 122, 118 114"
          fill="none"
          stroke={pin}
          strokeWidth="1.6"
          strokeDasharray="3 4"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Path
          d="M42 112 C39.2 112 37 114.1 37 116.8 C37 120.6 42 125 42 125 C42 125 47 120.6 47 116.8 C47 114.1 44.8 112 42 112 Z"
          fill={pin}
        />
        <Circle cx="42" cy="116.6" r="1.5" fill="#FFFFFF" />
        <Circle cx="318" cy="58" r="3.5" fill={onBlue ? '#FFFFFF' : '#0F766E'} opacity={0.55} />
        <Circle cx="78" cy="52" r="2.5" fill={pin} opacity={0.7} />
        <Circle cx="330" cy="156" r="2.2" fill={onBlue ? '#FFFFFF' : '#1D4ED8'} opacity={0.4} />
      </Svg>

      <Animated.View style={[styles.rateChip, { transform: [{ translateY: leftY }] }]}>
        <Ionicons name="star" size={11} color="#B45309" />
        <Text style={styles.rateText}>4.8 nearby</Text>
      </Animated.View>

      <Animated.View style={[styles.phoneWrap, { transform: [{ translateY: phoneY }] }]}>
        <PhoneScreen />
        <View style={styles.logoOnScreen}>
          <FinderBLogo size={18} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.distanceCard, { transform: [{ translateY: leftY }] }]}>
        <View style={styles.navIcon}>
          <Ionicons name="navigate" size={13} color="#1D4ED8" />
        </View>
        <View>
          <Text style={styles.cardTitle}>1.2 km</Text>
          <Text style={styles.cardMeta}>By road</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.savedCard, { transform: [{ translateY: rightY }] }]}>
        <View style={styles.savedHead}>
          <Ionicons name="heart" size={12} color="#BE185D" />
          <Text style={styles.savedLabel}>Saved</Text>
        </View>
        <Text style={styles.cardTitle}>Blue Door</Text>
        <Text style={styles.openMeta}>Open now</Text>
      </Animated.View>
    </View>
  );
}

function PhoneScreen() {
  return (
    <Svg width={156} height={208} viewBox="0 0 156 208">
      <Defs>
        <LinearGradient id="shopPhoto" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F8D7A8" />
          <Stop offset="0.48" stopColor="#E8894A" />
          <Stop offset="1" stopColor="#C2410C" />
        </LinearGradient>
        <LinearGradient id="clinicPhoto" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#99F6E4" />
          <Stop offset="1" stopColor="#0F766E" />
        </LinearGradient>
        <LinearGradient id="bezelShine" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3F3F46" />
          <Stop offset="0.42" stopColor="#18181B" />
          <Stop offset="1" stopColor="#09090B" />
        </LinearGradient>
        <ClipPath id="photoClip">
          <Path d="M30 122 H114 Q128 122 128 132 V142 H18 V132 Q18 122 30 122 Z" />
        </ClipPath>
      </Defs>

      <Ellipse cx="78" cy="204" rx="44" ry="3" fill="#0F172A" opacity={0.16} />
      <Rect x="3" y="1" width="150" height="200" rx="30" fill="url(#bezelShine)" />
      <Rect x="10" y="8" width="136" height="186" rx="24" fill="#F8FAFC" />
      <Rect x="58" y="14" width="40" height="7" rx="3.5" fill="#18181B" />

      <SvgText x="42" y="40" fill="#0F172A" fontSize="11" fontWeight="700">
        FinderB
      </SvgText>
      <SvgText x="42" y="51" fill="#64748B" fontSize="7" fontWeight="600">
        Indiranagar
      </SvgText>
      <Circle cx="126" cy="40" r="8" fill="#FFFFFF" />
      <Path
        d="M126 35.4 C124.3 35.4 123 36.6 123 38.2 C123 40.4 126 43.2 126 43.2 C126 43.2 129 40.4 129 38.2 C129 36.6 127.7 35.4 126 35.4 Z"
        fill="#1D4ED8"
      />
      <Circle cx="126" cy="38.1" r="1.1" fill="#FFFFFF" />

      <Rect x="18" y="58" width="120" height="20" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <Circle cx="30" cy="68" r="2.6" fill="none" stroke="#1D4ED8" strokeWidth="1.2" />
      <Path d="M31.9 69.9 L33.4 71.4" stroke="#1D4ED8" strokeWidth="1.2" strokeLinecap="round" />
      <SvgText x="38" y="71" fill="#94A3B8" fontSize="8" fontWeight="500">
        Cafes, clinics
      </SvgText>
      <Path d="M122 65 H128 M122 68 H126 M122 71 H124" stroke="#94A3B8" strokeWidth="1.1" strokeLinecap="round" />

      {CATEGORIES.map((item, index) => {
        const x = 33 + index * 30;
        return (
          <G key={item.label}>
            <Circle cx={x} cy="94" r="10" fill={item.fill} />
            <CategoryMark kind={item.icon} cx={x} cy={94} color={item.mark} />
            <SvgText x={x} y="112" fill="#475569" fontSize="6.5" fontWeight="600" textAnchor="middle">
              {item.label}
            </SvgText>
          </G>
        );
      })}

      <Rect x="18" y="118" width="120" height="44" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <G clipPath="url(#photoClip)">
        <Rect x="18" y="118" width="120" height="20" fill="url(#shopPhoto)" />
      </G>
      <Rect x="24" y="122" width="26" height="9" rx="4.5" fill="#FFFFFF" />
      <SvgText x="28" y="128.5" fill="#C2410C" fontSize="6" fontWeight="700">
        Open
      </SvgText>
      <SvgText x="24" y="148" fill="#0F172A" fontSize="8" fontWeight="700">
        Blue Door Cafe
      </SvgText>
      <Path
        d="M26 154.2 L27.1 156.4 L29.5 156.6 L27.7 158.1 L28.3 160.4 L26 159.2 L23.7 160.4 L24.3 158.1 L22.5 156.6 L24.9 156.4 Z"
        fill="#F59E0B"
      />
      <SvgText x="32" y="158" fill="#B45309" fontSize="6.5" fontWeight="700">
        4.8
      </SvgText>
      <SvgText x="46" y="158" fill="#64748B" fontSize="6.5" fontWeight="500">
        · 1.2 km · Cafe
      </SvgText>

      <Rect x="18" y="166" width="120" height="22" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <Rect x="22" y="170" width="14" height="14" rx="4" fill="url(#clinicPhoto)" />
      <SvgText x="40" y="176" fill="#0F172A" fontSize="7" fontWeight="700">
        City Clinic
      </SvgText>
      <SvgText x="40" y="184" fill="#64748B" fontSize="6" fontWeight="500">
        Health · 2.4 km
      </SvgText>
      <SvgText x="112" y="178" fill="#047857" fontSize="6" fontWeight="700">
        Open
      </SvgText>
    </Svg>
  );
}

function CategoryMark({
  kind,
  cx,
  cy,
  color,
}: {
  kind: (typeof CATEGORIES)[number]['icon'];
  cx: number;
  cy: number;
  color: string;
}) {
  if (kind === 'cup') {
    return (
      <G>
        <Path
          d={`M${cx - 3.4} ${cy - 2.4} H${cx + 2} V${cy + 1.2} C${cx + 2} ${cy + 3.2} ${cx - 3.4} ${cy + 3.2} ${cx - 3.4} ${cy + 1.2} Z`}
          fill="none"
          stroke={color}
          strokeWidth="1.2"
        />
        <Path
          d={`M${cx + 2} ${cy - 1} H${cx + 3.5} V${cy + 0.4}`}
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </G>
    );
  }
  if (kind === 'plus') {
    return (
      <Path
        d={`M${cx} ${cy - 3.6} V${cy + 3.6} M${cx - 3.6} ${cy} H${cx + 3.6}`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    );
  }
  if (kind === 'tool') {
    return (
      <G>
        <Path d={`M${cx - 3.4} ${cy - 2.6} H${cx + 1} L${cx + 0.2} ${cy - 1} H${cx - 2.6} Z`} fill={color} />
        <Path
          d={`M${cx - 0.8} ${cy - 1} L${cx + 2.8} ${cy + 2.8}`}
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </G>
    );
  }
  return (
    <G>
      <Path d={`M${cx - 4} ${cy + 2} H${cx + 4}`} stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Path
        d={`M${cx - 2.8} ${cy + 2} V${cy - 1.2} H${cx + 2.8} V${cy + 2}`}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </G>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 236,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOnScreen: {
    position: 'absolute',
    left: 20,
    top: 26,
    width: 18,
    height: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  phoneWrap: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateChip: {
    position: 'absolute',
    left: 14,
    top: 22,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rateText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#1C1917',
  },
  distanceCard: {
    position: 'absolute',
    left: 6,
    top: 70,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  navIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCard: {
    position: 'absolute',
    right: 12,
    top: 36,
    zIndex: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 92,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  savedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  savedLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#BE185D',
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  cardMeta: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#64748B',
  },
  openMeta: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#047857',
  },
});
