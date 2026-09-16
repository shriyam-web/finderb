import { Platform } from 'react-native';

const JAKARTA_FACES: Array<{ family: string; weight: number; src: string }> = [
  {
    family: 'PlusJakartaSans_400Regular',
    weight: 400,
    src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf',
  },
  {
    family: 'PlusJakartaSans_500Medium',
    weight: 500,
    src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_m07NSg.ttf',
  },
  {
    family: 'PlusJakartaSans_600SemiBold',
    weight: 600,
    src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0nNSg.ttf',
  },
  {
    family: 'PlusJakartaSans_700Bold',
    weight: 700,
    src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf',
  },
  {
    family: 'PlusJakartaSans_800ExtraBold',
    weight: 800,
    src: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KUnNSg.ttf',
  },
];

/** Load Plus Jakarta on web without FontFaceObserver (that overlay froze the app). */
export function ensureWebFonts() {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  if (document.getElementById('finderb-jakarta-faces')) return;

  const style = document.createElement('style');
  style.id = 'finderb-jakarta-faces';
  style.textContent = JAKARTA_FACES.map(
    (face) => `
@font-face {
  font-family: '${face.family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url('${face.src}') format('truetype');
}`,
  ).join('\n');
  document.head.appendChild(style);
}
