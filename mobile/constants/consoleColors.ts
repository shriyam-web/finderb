import type { ColorTokens } from './colors';
import { useTheme } from '../context/ThemeContext';

/** Business panel palette: the website dashboard's navy on light grey, with the app's warm night set. */
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
  isDark: boolean;
};

const day: ConsoleColors = {
  page: '#F3F5F8',
  card: '#FFFFFF',
  sunken: '#EEF1F5',
  line: '#E2E7EE',
  lineStrong: '#C9D2DD',
  ink: '#101828',
  body: '#344054',
  muted: '#667085',
  faint: '#98A2B3',
  primary: '#153551',
  primaryInk: '#FFFFFF',
  primarySoft: '#E8EEF5',
  accent: '#215481',
  success: '#067647',
  successSoft: '#ECFDF3',
  warning: '#B54708',
  warningSoft: '#FFF6E5',
  danger: '#B42318',
  dangerSoft: '#FEF3F2',
  star: '#F5A623',
  scrim: 'rgba(16, 24, 40, 0.5)',
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
  primary: '#7AB2FF',
  primaryInk: '#0B1A2B',
  primarySoft: 'rgba(122,178,255,0.14)',
  accent: '#8DBDFF',
  success: '#6EE7A8',
  successSoft: 'rgba(34,197,94,0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.12)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.13)',
  star: '#FBBF24',
  scrim: 'rgba(0, 0, 0, 0.6)',
  isDark: true,
};

export function consoleColors(colors: ColorTokens): ConsoleColors {
  return colors.statusBarStyle === 'light' ? night : day;
}

export function useConsoleColors(): ConsoleColors {
  return consoleColors(useTheme().colors);
}
