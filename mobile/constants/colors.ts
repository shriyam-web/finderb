/**
 * FinderB mobile — warm neutrals + ink.
 * Light & dark palettes share identical keys so theme swaps never leave gaps.
 */

export type ColorTokens = {
  canvas: string;
  canvasWarm: string;
  canvasDeep: string;
  surface: string;
  surfaceSoft: string;
  muted: string;
  heroWash: string;
  night: string;
  nightSoft: string;
  mist: string;

  ink: string;
  text: string;
  textMuted: string;
  textSoft: string;
  heading: string;
  onDark: string;
  onDarkMuted: string;

  brand: string;
  brandSoft: string;
  primary: string;
  primary50: string;
  primary100: string;
  primary200: string;
  primary300: string;
  primary400: string;
  primary500: string;
  primary600: string;
  primary700: string;
  primary800: string;
  primary900: string;

  secondary: string;
  secondary100: string;
  secondary400: string;
  secondary500: string;

  accent: string;
  accentDeep: string;
  accentSoft: string;

  mango: string;
  mangoDeep: string;
  mangoSoft: string;
  teal: string;
  tealDeep: string;
  tealSoft: string;
  heat: string;
  heatSoft: string;
  authBg: string;

  /** Card / sheet fill — light white, dark elevated surface */
  white: string;
  border: string;
  borderStrong: string;

  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  open: string;
  closed: string;
  live: string;

  verified: string;
  verifiedSoft: string;
  star: string;
  starSoft: string;

  /** Modal scrim */
  overlay: string;
  /** Always pure white — icons/text on photos & colored CTAs (never remapped) */
  frost: string;
  frostMuted: string;
  /** Native status bar icon style hint */
  statusBarStyle: 'light' | 'dark';
};

export type GradientTokens = {
  hero: readonly [string, string, string];
  heroWarm: readonly [string, string, string];
  warmWash: readonly [string, string, string];
  splash: readonly [string, string, string];
  ai: readonly [string, string, string];
  soft: readonly [string, string, string];
  promo: readonly [string, string];
  cardOverlay: readonly [string, string];
  spotlight: readonly [string, string, string];
};

export const lightColors: ColorTokens = {
  canvas: '#FFFFFF',
  canvasWarm: '#FFF8EF',
  canvasDeep: '#F6F5F3',
  surface: '#FFFFFF',
  surfaceSoft: '#FAFAF8',
  muted: '#F0EEEB',
  heroWash: '#1C1917',
  night: '#1C1917',
  nightSoft: '#292524',
  mist: '#F6F5F3',

  ink: '#1C1917',
  text: '#1C1917',
  textMuted: '#57534E',
  textSoft: '#78716C',
  heading: '#0C0A09',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.72)',

  brand: '#1C1917',
  brandSoft: '#F5F5F4',
  primary: '#1C1917',
  primary50: '#F6F5F3',
  primary100: '#E7E5E4',
  primary200: '#D6D3D1',
  primary300: '#A8A29E',
  primary400: '#78716C',
  primary500: '#1C1917',
  primary600: '#0C0A09',
  primary700: '#0C0A09',
  primary800: '#0C0A09',
  primary900: '#0C0A09',

  secondary: '#F9B864',
  secondary100: '#FFF4E5',
  secondary400: '#F9B864',
  secondary500: '#F69E32',

  accent: '#E8811E',
  accentDeep: '#C1621A',
  accentSoft: '#FFF4E5',

  mango: '#F69E32',
  mangoDeep: '#E8811E',
  mangoSoft: '#FFF4E5',
  teal: '#0F766E',
  tealDeep: '#115E59',
  tealSoft: '#F0FDFA',
  heat: '#A85A5A',
  heatSoft: '#F8EEEE',
  authBg: '#FFFFFF',

  white: '#ffffff',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',

  danger: '#A85A5A',
  dangerBg: '#F8EEEE',
  success: '#2F7D57',
  successBg: '#EEF7F2',
  open: '#2F7D57',
  closed: '#A85A5A',
  live: '#E8811E',

  verified: '#16A34A',
  verifiedSoft: '#DCFCE7',
  star: '#F5B301',
  starSoft: '#FEF3C7',

  overlay: 'rgba(12,10,9,0.48)',
  frost: '#FFFFFF',
  frostMuted: 'rgba(255,255,255,0.72)',
  statusBarStyle: 'dark',
};

/** Warm ink dark — lifted ~25% off pure black so surfaces stay charcoal, not OLED void. */
export const darkColors: ColorTokens = {
  canvas: '#1F1C1A',
  canvasWarm: '#262220',
  canvasDeep: '#2E2A27',
  surface: '#262220',
  surfaceSoft: '#2E2A27',
  muted: '#3F3A36',
  heroWash: '#1F1C1A',
  night: '#FAFAF9',
  nightSoft: '#E7E5E4',
  mist: '#2E2A27',

  ink: '#FAFAF9',
  text: '#F5F5F4',
  textMuted: '#B5AFA9',
  textSoft: '#8A837C',
  heading: '#FAFAF9',
  onDark: '#1F1C1A',
  onDarkMuted: 'rgba(31,28,26,0.72)',

  brand: '#FAFAF9',
  brandSoft: '#3F3A36',
  primary: '#FAFAF9',
  primary50: '#2E2A27',
  primary100: '#3F3A36',
  primary200: '#57534E',
  primary300: '#8A837C',
  primary400: '#B5AFA9',
  primary500: '#FAFAF9',
  primary600: '#FFFFFF',
  primary700: '#FFFFFF',
  primary800: '#FFFFFF',
  primary900: '#FFFFFF',

  secondary: '#F9B864',
  secondary100: '#4A3420',
  secondary400: '#F9B864',
  secondary500: '#F69E32',

  accent: '#F09A3E',
  accentDeep: '#E8811E',
  accentSoft: '#4A3420',

  mango: '#F69E32',
  mangoDeep: '#E8811E',
  mangoSoft: '#4A3420',
  teal: '#2DD4BF',
  tealDeep: '#14B8A6',
  tealSoft: '#1A5C56',
  heat: '#E8A0A0',
  heatSoft: '#4A2A2A',
  authBg: '#1F1C1A',

  white: '#2E2A27',
  border: '#4A4540',
  borderStrong: '#6B6560',

  danger: '#E8A0A0',
  dangerBg: '#4A2A2A',
  success: '#6EE7A8',
  successBg: '#1A4A32',
  open: '#6EE7A8',
  closed: '#E8A0A0',
  live: '#F09A3E',

  verified: '#4ADE80',
  verifiedSoft: '#1A4A32',
  star: '#F5B301',
  starSoft: '#4A2E0A',

  overlay: 'rgba(31,28,26,0.56)',
  frost: '#FFFFFF',
  frostMuted: 'rgba(255,255,255,0.72)',
  statusBarStyle: 'light',
};

export const lightGradients: GradientTokens = {
  hero: ['#1C1917', '#292524', '#44403C'],
  heroWarm: ['#FFFFFF', '#FAFAF8', '#F6F5F3'],
  warmWash: ['#FFF8EF', '#FFFFFF', '#F6F5F3'],
  splash: ['#0C0A09', '#1C1917', '#292524'],
  // FinderB AI — deep navy → sky (brand blue, not muddy stone)
  ai: ['#0B2744', '#155A96', '#2B8FD4'],
  soft: ['#FFFFFF', '#FAFAF8', '#F6F5F3'],
  promo: ['#C1621A', '#E8811E'],
  cardOverlay: ['rgba(28,25,23,0)', 'rgba(28,25,23,0.88)'],
  spotlight: ['#292524', '#1C1917', '#0C0A09'],
};

export const darkGradients: GradientTokens = {
  hero: ['#1F1C1A', '#2E2A27', '#3F3A36'],
  heroWarm: ['#1F1C1A', '#262220', '#2E2A27'],
  warmWash: ['#262220', '#1F1C1A', '#2E2A27'],
  splash: ['#1F1C1A', '#2E2A27', '#3F3A36'],
  ai: ['#0A2A3F', '#155A96', '#2B8FD4'],
  soft: ['#262220', '#2E2A27', '#3F3A36'],
  promo: ['#C1621A', '#E8811E'],
  cardOverlay: ['rgba(31,28,26,0)', 'rgba(31,28,26,0.88)'],
  spotlight: ['#2E2A27', '#1F1C1A', '#161412'],
};

/** @deprecated Prefer useTheme().colors — kept for non-UI / gradual migration. */
export const colors = lightColors;

/** @deprecated Prefer useTheme().gradients */
export const gradients = lightGradients;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
