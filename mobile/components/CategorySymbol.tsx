import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

const LUCIDE_TO_ION: Record<string, IconName> = {
  utensils: 'restaurant-outline',
  utensilscrossed: 'restaurant-outline',
  graduationcap: 'school-outline',
  stethoscope: 'medkit-outline',
  hospital: 'medkit-outline',
  heartpulse: 'heart-outline',
  scissors: 'cut-outline',
  sparkles: 'sparkles-outline',
  briefcase: 'briefcase-outline',
  building2: 'business-outline',
  building: 'business-outline',
  dumbbell: 'barbell-outline',
  wrench: 'construct-outline',
  shoppingbag: 'bag-outline',
  store: 'storefront-outline',
  palmtree: 'leaf-outline',
  treepine: 'leaf-outline',
  bookopen: 'book-outline',
  scale: 'document-text-outline',
};

function isRemoteSymbol(icon?: string | null) {
  const value = icon?.trim() || '';
  return (
    value.startsWith('http') ||
    value.startsWith('data:') ||
    value.startsWith('/')
  );
}

function ionFromLucide(icon: string): IconName | null {
  const compact = icon.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (compact && compact in LUCIDE_TO_ION) return LUCIDE_TO_ION[compact];

  const kebab = icon
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
  if (kebab in Ionicons.glyphMap) return kebab as IconName;
  const outlined = `${kebab}-outline`;
  if (outlined in Ionicons.glyphMap) return outlined as IconName;
  return null;
}

export function CategorySymbol({
  category,
  size,
  color,
}: {
  category: { icon?: string | null };
  size: number;
  color: string;
}) {
  const icon = category.icon?.trim() || '';
  if (!icon) return null;

  if (isRemoteSymbol(icon)) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    );
  }

  const ion =
    icon in Ionicons.glyphMap
      ? (icon as IconName)
      : ionFromLucide(icon);

  if (!ion) return null;

  return <Ionicons name={ion} size={size} color={color} />;
}
