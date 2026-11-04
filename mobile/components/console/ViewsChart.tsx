import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { createConsoleStyles } from './kit';

const CHART_HEIGHT = 120;
const PAD_TOP = 18;
const PAD_BOTTOM = 6;

function dayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function curve(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 1) return d;
  for (let i = 0; i < points.length - 1; i += 1) {
    const prev = points[Math.max(0, i - 1)];
    const current = points[i];
    const next = points[i + 1];
    const after = points[Math.min(points.length - 1, i + 2)];
    const c1x = current.x + (next.x - prev.x) / 6;
    const c1y = current.y + (next.y - prev.y) / 6;
    const c2x = next.x - (after.x - current.x) / 6;
    const c2y = next.y - (after.y - current.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return d;
}

/** Daily profile views as a filled line. The last point is today. */
export function ViewsChart({ days }: { days: { day: string; views: number }[] }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const [width, setWidth] = useState(0);
  const peak = Math.max(0, ...days.map((day) => day.views));
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const yFor = (views: number) => PAD_TOP + (peak === 0 ? plotHeight : plotHeight - (views / peak) * plotHeight);
  const points =
    width === 0 || days.length === 0
      ? []
      : days.length === 1
        ? [
            { x: 0, y: yFor(days[0].views) },
            { x: width, y: yFor(days[0].views) },
          ]
        : days.map((day, index) => ({
            x: (index / (days.length - 1)) * width,
            y: yFor(day.views),
          }));
  const line = curve(points);
  const area =
    points.length > 1
      ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${CHART_HEIGHT} L ${points[0].x.toFixed(1)} ${CHART_HEIGHT} Z`
      : '';
  const peakIndex = days.reduce((best, day, index) => (day.views > days[best].views ? index : best), 0);
  const peakPoint = days.length <= 1 ? points[1] : points[peakIndex];
  const today = points[points.length - 1];
  const ink = c.isDark ? '#A1A1AA' : '#71717A';
  const showPeak = peak > 0 && peakPoint && !(days.length > 1 && peakIndex === days.length - 1);

  return (
    <View
      accessible
      accessibilityLabel={
        days.length
          ? `Profile views over the last ${days.length} day${days.length === 1 ? '' : 's'}. Highest ${peak} in a day.`
          : 'No profile views in this period.'
      }
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next !== width) setWidth(next);
      }}
    >
      <View style={styles.plot}>
        {width > 0 && points.length > 1 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ink} stopOpacity={c.isDark ? 0.42 : 0.32} />
                <Stop offset="0.72" stopColor={ink} stopOpacity={0.06} />
                <Stop offset="1" stopColor={ink} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Line x1={0} y1={PAD_TOP} x2={width} y2={PAD_TOP} stroke={c.line} strokeWidth={1} />
            <Line
              x1={0}
              y1={PAD_TOP + plotHeight / 2}
              x2={width}
              y2={PAD_TOP + plotHeight / 2}
              stroke={c.line}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
            <Path d={area} fill="url(#viewsFill)" />
            <Path d={line} fill="none" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            {showPeak && peakPoint ? <Circle cx={peakPoint.x} cy={peakPoint.y} r={3} fill={ink} /> : null}
            {today ? (
              <>
                <Circle cx={today.x} cy={today.y} r={7} fill={c.card} />
                <Circle cx={today.x} cy={today.y} r={4.5} fill={ink} />
              </>
            ) : null}
          </Svg>
        ) : null}
        {showPeak && peakPoint ? (
          <Text
            style={[
              styles.peak,
              {
                left: Math.min(width - 28, Math.max(0, peakPoint.x - 8)),
                top: Math.max(0, peakPoint.y - 16),
              },
            ]}
          >
            {peak}
          </Text>
        ) : null}
      </View>
      <View style={styles.axis}>
        <Text style={styles.tick}>{days.length ? dayLabel(days[0].day) : ''}</Text>
        <Text style={[styles.tick, styles.tickToday]}>Today</Text>
      </View>
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  plot: { height: CHART_HEIGHT },
  peak: { position: 'absolute', fontFamily: fonts.semiBold, fontSize: 10, color: c.isDark ? '#A1A1AA' : '#71717A' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontFamily: fonts.regular, fontSize: 11, color: c.faint },
  tickToday: { color: c.isDark ? '#A1A1AA' : '#71717A', fontFamily: fonts.semiBold },
}));
