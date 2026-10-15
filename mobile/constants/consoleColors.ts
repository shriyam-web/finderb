import type { ColorTokens } from './colors';
import { useTheme } from '../context/ThemeContext';

/** Business panel palette: white and zinc with gray actions, plus the app's warm night set. */
export type ConsoleColors = {
  page: string;
  card: string;
  sunken: string;
  line: string;
  lineStrong: string;
  ink: string;
  body: string;
  muted: string;
  faint: string;
  primary: string;
  primaryInk: string;
  primarySoft: string;
  accent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  star: string;
  scrim: string;
  /** FinderB amber, used sparingly for highlights. */
  brand: string;
  brandSoft: string;
  isDark: boolean;
};

const day: ConsoleColors = {
  page: '#FAFAFA',
  card: '#FFFFFF',
  sunken: '#F4F4F5',
  line: '#E4E4E7',
  lineStrong: '#D4D4D8',
  ink: '#18181B',
  body: '#3F3F46',
  muted: '#71717A',
  faint: '#A1A1AA',
  primary: '#3F3F46',
  primaryInk: '#FFFFFF',
  primarySoft: '#F4F4F5',
  accent: '#52525B',
  success: '#067647',
  successSoft: '#ECFDF3',
  warning: '#B54708',
  warningSoft: '#FFF6E5',
  danger: '#B42318',
  dangerSoft: '#FEF3F2',
  star: '#F5A623',
  scrim: 'rgba(24, 24, 27, 0.5)',
  brand: '#D97706',
  brandSoft: '#FEF3E2',
  isDark: false,
};

const night: ConsoleColors = {
  page: '#1F1C1A',
  card: '#272320',
  sunken: '#2F2A27',
  line: '#3A3532',
  lineStrong: '#544E49',
  ink: '#FAFAF9',
  body: '#D6D3D1',
  muted: '#A8A29E',
  faint: '#7E7771',
  primary: '#E7E5E4',
  primaryInk: '#1C1917',
  primarySoft: 'rgba(231,229,228,0.14)',
  accent: '#A8A29E',
  success: '#6EE7A8',
  successSoft: 'rgba(34,197,94,0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.12)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.13)',
  star: '#FBBF24',
  scrim: 'rgba(0, 0, 0, 0.6)',
  brand: '#FBBF24',
  brandSoft: 'rgba(251,191,36,0.12)',
  isDark: true,
};

export function consoleColors(colors: ColorTokens): ConsoleColors {
  return colors.statusBarStyle === 'light' ? night : day;
}

export function useConsoleColors(): ConsoleColors {
  return consoleColors(useTheme().colors);
}
