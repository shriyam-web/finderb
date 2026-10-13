import { Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { createConsoleStyles } from './kit';

const CHART_HEIGHT = 96;

function dayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Daily profile views as plain bars; the last bar is today. */
export function ViewsChart({ days }: { days: { day: string; views: number }[] }) {
  const styles = useStyles();
  const peak = Math.max(1, ...days.map((d) => d.views));
  const last = days.length - 1;

  return (
    <View
      accessible
      accessibilityLabel={`Profile views over the last ${days.length} days. Highest ${peak} in a day.`}
    >
      <View style={styles.plot}>
        <View style={[styles.guide, { top: 0 }]} />
        <View style={[styles.guide, { top: CHART_HEIGHT / 2 }]} />
        <Text style={styles.peak}>{peak}</Text>
        {days.map((d, i) => {
          const height = d.views ? Math.max(4, Math.round((d.views / peak) * CHART_HEIGHT)) : 2;
          return (
            <View key={d.day} style={styles.col}>
              <View style={[styles.bar, { height }, i === last ? styles.barToday : d.views ? null : styles.barEmpty]} />
            </View>
          );
        })}
      </View>
      <View style={styles.axis}>
        <Text style={styles.tick}>{days.length ? dayLabel(days[0].day) : ''}</Text>
        <Text style={[styles.tick, styles.tickToday]}>Today</Text>
      </View>
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  plot: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    paddingRight: 22,
  },
  guide: {
    position: 'absolute',
    left: 0,
    right: 22,
    height: 1,
    backgroundColor: c.line,
  },
  peak: { position: 'absolute', top: -7, right: 0, fontFamily: fonts.regular, fontSize: 10.5, color: c.faint },
  col: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: c.isDark ? '#4A4541' : '#D4D4D8' },
  barToday: { backgroundColor: c.primary },
  barEmpty: { backgroundColor: c.line },
  axis: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 14, marginTop: 6 },
  tick: { fontFamily: fonts.regular, fontSize: 11, color: c.faint },
  tickToday: { color: c.primary, fontFamily: fonts.semiBold },
}));
