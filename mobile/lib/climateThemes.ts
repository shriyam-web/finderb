import type { ClimateMood } from './weather';

export type ClimateTheme = {
  mood: ClimateMood;
  base: string;
  sky: readonly [string, string, string, string];
  skyLocations?: readonly [number, number, number, number];
  wash: readonly [string, string];
  washAlt?: readonly [string, string];
  horizon: readonly [string, string];
  accentSoft: string;
  spark: string;
  veil: string;
};

/**
 * Peak atmospheric skies — each mood reads as a real time + weather.
 * Color does the heavy lifting; symbols are accents only.
 */
const THEMES: Record<ClimateMood, Omit<ClimateTheme, 'mood'>> = {
  // —— Morning —— cool vault → rose-peach horizon
  morning_clear: {
    base: '#4A5F9A',
    sky: ['#2A3A78', '#5A74B0', '#B8A8C8', '#F4C88A'],
    skyLocations: [0, 0.26, 0.55, 1],
    wash: ['rgba(255,200,150,0.38)', 'transparent'],
    washAlt: ['transparent', 'rgba(255,220,180,0.22)'],
    horizon: ['transparent', 'rgba(255,210,170,0.28)'],
    accentSoft: 'rgba(255,190,130,0.42)',
    spark: 'rgba(255,245,220,0.5)',
    veil: 'rgba(25,35,70,0.05)',
  },
  morning_cloudy: {
    base: '#556578',
    sky: ['#344456', '#5A6E84', '#8FA3B6', '#D0D8E0'],
    skyLocations: [0, 0.3, 0.62, 1],
    wash: ['rgba(230,235,245,0.28)', 'transparent'],
    horizon: ['transparent', 'rgba(255,255,255,0.18)'],
    accentSoft: 'rgba(210,220,235,0.32)',
    spark: 'rgba(255,255,255,0.32)',
    veil: 'rgba(28,36,50,0.07)',
  },
  morning_rain: {
    base: '#354A62',
    sky: ['#1C2E44', '#355570', '#5A7A96', '#8AA8C0'],
    skyLocations: [0, 0.32, 0.66, 1],
    wash: ['rgba(140,185,220,0.2)', 'transparent'],
    horizon: ['transparent', 'rgba(160,195,220,0.16)'],
    accentSoft: 'rgba(150,195,225,0.3)',
    spark: 'rgba(210,230,245,0.45)',
    veil: 'rgba(12,24,40,0.1)',
  },

  // —— Afternoon —— deep azure → luminous mid sky
  afternoon_clear: {
    base: '#1480C8',
    sky: ['#0A4F98', '#1890D8', '#55B8F0', '#B8E4FC'],
    skyLocations: [0, 0.28, 0.58, 1],
    wash: ['rgba(255,248,210,0.26)', 'transparent'],
    washAlt: ['transparent', 'rgba(160,215,255,0.2)'],
    horizon: ['transparent', 'rgba(255,255,255,0.2)'],
    accentSoft: 'rgba(255,235,150,0.34)',
    spark: 'rgba(255,255,255,0.5)',
    veil: 'rgba(6,45,90,0.05)',
  },
  afternoon_heat: {
    base: '#C45A1C',
    sky: ['#8B2E0A', '#D24A10', '#F08A28', '#FFD080'],
    skyLocations: [0, 0.28, 0.55, 1],
    wash: ['rgba(255,230,140,0.42)', 'transparent'],
    horizon: ['transparent', 'rgba(255,200,120,0.28)'],
    accentSoft: 'rgba(255,200,80,0.4)',
    spark: 'rgba(255,245,200,0.5)',
    veil: 'rgba(60,20,0,0.08)',
  },
  afternoon_cloudy: {
    base: '#456480',
    sky: ['#243E58', '#456880', '#708EAA', '#B0C4D6'],
    skyLocations: [0, 0.32, 0.64, 1],
    wash: ['rgba(220,232,242,0.24)', 'transparent'],
    horizon: ['transparent', 'rgba(255,255,255,0.16)'],
    accentSoft: 'rgba(200,218,235,0.3)',
    spark: 'rgba(255,255,255,0.35)',
    veil: 'rgba(18,36,55,0.08)',
  },
  afternoon_rain: {
    base: '#284E6E',
    sky: ['#122838', '#2A5272', '#4A7698', '#7AA0BC'],
    skyLocations: [0, 0.32, 0.66, 1],
    wash: ['rgba(130,180,220,0.2)', 'transparent'],
    horizon: ['transparent', 'rgba(150,195,225,0.14)'],
    accentSoft: 'rgba(140,190,225,0.3)',
    spark: 'rgba(200,225,245,0.45)',
    veil: 'rgba(8,25,45,0.1)',
  },

  // —— Evening —— indigo vault → coral fire horizon
  evening_clear: {
    base: '#5C2E68',
    sky: ['#1A1038', '#5A2E6A', '#D05060', '#F8A868'],
    skyLocations: [0, 0.26, 0.55, 1],
    wash: ['rgba(255,150,100,0.34)', 'transparent'],
    washAlt: ['transparent', 'rgba(255,180,120,0.2)'],
    horizon: ['transparent', 'rgba(255,190,130,0.26)'],
    accentSoft: 'rgba(255,150,90,0.4)',
    spark: 'rgba(255,220,180,0.4)',
    veil: 'rgba(30,12,40,0.08)',
  },
  evening_cloudy: {
    base: '#433850',
    sky: ['#221C30', '#463E58', '#7A6A82', '#B8A090'],
    skyLocations: [0, 0.3, 0.62, 1],
    wash: ['rgba(230,175,155,0.2)', 'transparent'],
    horizon: ['transparent', 'rgba(210,170,150,0.16)'],
    accentSoft: 'rgba(210,160,145,0.28)',
    spark: 'rgba(255,230,220,0.3)',
    veil: 'rgba(25,18,35,0.1)',
  },
  evening_rain: {
    base: '#282440',
    sky: ['#12101F', '#2C2848', '#4A4668', '#6E6A8A'],
    skyLocations: [0, 0.32, 0.66, 1],
    wash: ['rgba(150,130,200,0.16)', 'transparent'],
    horizon: ['transparent', 'rgba(140,130,185,0.14)'],
    accentSoft: 'rgba(160,150,210,0.26)',
    spark: 'rgba(210,210,240,0.4)',
    veil: 'rgba(12,8,28,0.12)',
  },

  // —— Night ——
  night_clear: {
    base: '#070B1A',
    sky: ['#02040C', '#0A1230', '#1A2758', '#3A2F6E'],
    skyLocations: [0, 0.28, 0.62, 1],
    wash: ['rgba(120,150,255,0.14)', 'transparent'],
    horizon: ['transparent', 'rgba(90,70,140,0.22)'],
    accentSoft: 'rgba(180,200,255,0.28)',
    spark: 'rgba(255,255,255,0.85)',
    veil: 'rgba(0,0,12,0.1)',
  },
  night_cloudy: {
    base: '#0C101C',
    sky: ['#05070E', '#101624', '#1E2740', '#2E3650'],
    skyLocations: [0, 0.32, 0.66, 1],
    wash: ['rgba(140,160,200,0.1)', 'transparent'],
    horizon: ['transparent', 'rgba(80,90,130,0.16)'],
    accentSoft: 'rgba(160,180,220,0.18)',
    spark: 'rgba(230,235,255,0.4)',
    veil: 'rgba(0,0,10,0.12)',
  },
  night_rain: {
    base: '#080E18',
    sky: ['#03060C', '#0C1524', '#162438', '#243650'],
    skyLocations: [0, 0.32, 0.66, 1],
    wash: ['rgba(90,140,200,0.12)', 'transparent'],
    horizon: ['transparent', 'rgba(70,110,160,0.14)'],
    accentSoft: 'rgba(120,170,220,0.2)',
    spark: 'rgba(200,225,255,0.45)',
    veil: 'rgba(0,4,12,0.12)',
  },

  // —— Cross-cutting ——
  storm: {
    base: '#0A0E18',
    sky: ['#04060C', '#101828', '#1E2844', '#2E3854'],
    skyLocations: [0, 0.32, 0.65, 1],
    wash: ['rgba(140,130,210,0.14)', 'transparent'],
    horizon: ['transparent', 'rgba(140,150,200,0.12)'],
    accentSoft: 'rgba(190,200,255,0.32)',
    spark: 'rgba(240,245,255,0.6)',
    veil: 'rgba(0,0,10,0.16)',
  },
  fog: {
    base: '#626C78',
    sky: ['#3E4854', '#626C78', '#9AA4AE', '#D0D6DC'],
    skyLocations: [0, 0.32, 0.65, 1],
    wash: ['rgba(255,255,255,0.36)', 'transparent'],
    horizon: ['transparent', 'rgba(255,255,255,0.3)'],
    accentSoft: 'rgba(240,245,250,0.38)',
    spark: 'rgba(255,255,255,0.3)',
    veil: 'rgba(35,45,55,0.05)',
  },
  snow: {
    base: '#4A617A',
    sky: ['#243850', '#4A617A', '#86A0B6', '#D4E2EC'],
    skyLocations: [0, 0.3, 0.62, 1],
    wash: ['rgba(255,255,255,0.32)', 'transparent'],
    horizon: ['transparent', 'rgba(255,255,255,0.24)'],
    accentSoft: 'rgba(235,245,255,0.36)',
    spark: 'rgba(255,255,255,0.65)',
    veil: 'rgba(20,35,55,0.05)',
  },
};

export function getClimateTheme(mood: ClimateMood): ClimateTheme {
  return { mood, ...THEMES[mood] };
}
