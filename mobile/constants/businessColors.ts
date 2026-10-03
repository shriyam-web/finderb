import type { ColorTokens } from './colors';
import { useTheme } from '../context/ThemeContext';

/** Blue-and-slate palette shared by the Business tab, merchant login and registration. */
export type BizColors = {
  page: string;
  card: string;
  cardSoft: string;
  cardMuted: string;
  line: string;
  lineStrong: string;
  ink: string;
  body: string;
  faint: string;
  slate: string;
  slateSoft: string;
  slateInk: string;
  /** Blue text, icons and outlines. */
  blue: string;
  /** Solid blue behind white text. */
  blueFill: string;
  blueDeep: string;
  blueSoft: string;
  blueTint: string;
  blueLine: string;
  danger: string;
  success: string;
  successSoft: string;
  successBright: string;
  warn: string;
  meterOff: string;
  scrim: string;
  onFill: string;
};

const light: BizColors = {
  page: '#FFFFFF',
  card: '#FFFFFF',
  cardSoft: '#F8FAFC',
  cardMuted: '#F1F5F9',
  line: '#E2E8F0',
  lineStrong: '#CBD5E1',
  ink: '#1C1917',
  body: '#57534E',
  faint: '#A8A29E',
  slate: '#64748B',
  slateSoft: '#94A3B8',
  slateInk: '#334155',
  blue: '#2563EB',
  blueFill: '#2563EB',
  blueDeep: '#1D4ED8',
  blueSoft: '#EFF6FF',
  blueTint: '#DBEAFE',
  blueLine: '#BFDBFE',
  danger: '#DC2626',
  success: '#166534',
  successSoft: '#F0FDF4',
  successBright: '#22C55E',
  warn: '#EA580C',
  meterOff: '#E7E5E4',
  scrim: 'rgba(15, 23, 42, 0.45)',
  onFill: '#FFFFFF',
};

const dark: BizColors = {
  page: '#1F1C1A',
  card: '#262220',
  cardSoft: '#2A2624',
  cardMuted: '#332E2B',
  line: '#3F3A36',
  lineStrong: '#57514C',
  ink: '#FAFAF9',
  body: '#B5AFA9',
  faint: '#8A837C',
  slate: '#A8A29E',
  slateSoft: '#8A837C',
  slateInk: '#E7E5E4',
  blue: '#7AB2FF',
  blueFill: '#3B82F6',
  blueDeep: '#A5C8FF',
  blueSoft: 'rgba(59,130,246,0.16)',
  blueTint: '#1E3A5F',
  blueLine: 'rgba(122,178,255,0.45)',
  danger: '#F87171',
  success: '#6EE7A8',
  successSoft: 'rgba(34,197,94,0.14)',
  successBright: '#4ADE80',
  warn: '#FB923C',
  meterOff: '#3F3A36',
  scrim: 'rgba(0, 0, 0, 0.6)',
  onFill: '#FFFFFF',
};

export function bizColors(colors: ColorTokens): BizColors {
  return colors.statusBarStyle === 'light' ? dark : light;
}

export function useBizColors(): BizColors {
  return bizColors(useTheme().colors);
}
