/**
 * FinderB mobile visual system — "Alive Discovery"
 * Warm canvas + ink + mango energy + teal signal.
 * Not a flat navy website clone.
 */
export const colors = {
  // Surfaces
  canvas: '#FFF4E8',
  canvasDeep: '#FFE4C8',
  surface: '#FFFFFF',
  surfaceSoft: '#FFF9F2',
  muted: '#FFF4E8',

  // Ink
  ink: '#1C1410',
  text: '#1C1410',
  textMuted: '#6B5748',
  textSoft: '#A08B7A',

  // Energy (primary actions)
  mango: '#FF7A1A',
  mangoDeep: '#E85F00',
  mangoSoft: '#FFE0C2',
  accent: '#FF7A1A',
  secondary: '#FF7A1A',
  secondary500: '#FF9A4A',
  secondary100: '#FFE8D2',

  // Signal (verified / success / AI)
  teal: '#0F9C8A',
  tealDeep: '#0B7A6C',
  tealSoft: '#D5F5EF',

  // Heat (trending / urgency)
  heat: '#FF4D6D',
  heatSoft: '#FFE0E6',

  // Compat aliases (older screens)
  primary: '#FF7A1A',
  primary50: '#FFF0E3',
  primary100: '#FFE0C2',
  primary200: '#FFC48A',
  primary300: '#FFA04D',
  primary400: '#FF8A2B',
  primary600: '#E85F00',
  primary700: '#1C1410',
  primary800: '#140F0C',
  primary900: '#0C0907',
  authBg: '#FFF4E8',

  white: '#ffffff',
  border: '#F0E0D0',
  borderStrong: '#E2CDB8',

  danger: '#E11D48',
  dangerBg: '#FFF1F2',
  success: '#0F9C8A',
  successBg: '#D5F5EF',
} as const;

export const gradients = {
  hero: ['#FF8A2B', '#FF4D6D'] as const,
  splash: ['#1C1410', '#3D2314', '#FF7A1A'] as const,
  ai: ['#0F9C8A', '#14B8A6'] as const,
  soft: ['#FFF4E8', '#FFE8D2', '#FFD4B8'] as const,
  promo: ['#1C1410', '#3A2418'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
