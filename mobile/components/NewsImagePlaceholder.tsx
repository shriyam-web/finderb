import type { ComponentProps } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  NEWS_CATEGORIES,
  newsPlaceholderTone,
  type NewsCategorySlug,
} from '../constants/newsCategories';
import { fonts } from '../constants/typography';
import { createThemedStyles } from '../hooks/useThemedStyles';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  categorySlug?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  showLabel?: boolean;
};

/** Clear, solid news placeholder — no stock photography. */
export function NewsImagePlaceholder({
  categorySlug = 'local',
  label,
  style,
  iconSize = 22,
  showLabel = false,
}: Props) {
  const styles = useStyles();
  const slug = (categorySlug || 'local') as NewsCategorySlug;
  const tone = newsPlaceholderTone(slug);
  const cat = NEWS_CATEGORIES.find((c) => c.slug === slug);
  const icon = (cat?.icon ?? 'newspaper-outline') as IconName;
  const text = label || cat?.labelEn || 'News';

  return (
    <View style={[styles.box, { backgroundColor: tone.bg }, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={iconSize} color={tone.fg} />
      </View>
      {showLabel ? (
        <Text style={[styles.label, { color: tone.fg }]} numberOfLines={1}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
}));
