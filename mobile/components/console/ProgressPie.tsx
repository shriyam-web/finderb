import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';

export function ProgressPie({ percent, color }: { percent: number; color: string }) {
  const c = useConsoleColors();
  const shown = Math.max(0, Math.min(100, Math.round(percent)));
  const size = 42;
  const r = 16;
  const cx = size / 2;
  const cy = size / 2;
  const angle = (shown / 100) * Math.PI * 2;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const large = shown > 50 ? 1 : 0;
  const wedge = shown >= 100
    ? ''
    : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
  const track = c.isDark ? '#44403C' : '#D6D3D1';
  const edge = c.isDark ? '#A8A29E' : '#57534E';
  return (
    <View style={{ width: 46, alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill={track} stroke={edge} strokeWidth={1.5} />
        {shown >= 100 ? <Circle cx={cx} cy={cy} r={r} fill={color} /> : shown > 0 ? <Path d={wedge} fill={color} /> : null}
      </Svg>
      <Text style={{ marginTop: 2, fontFamily: fonts.semiBold, fontSize: 10, lineHeight: 12, color: c.ink }}>{shown}%</Text>
    </View>
  );
}
