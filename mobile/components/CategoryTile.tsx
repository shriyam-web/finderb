import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCategory } from '../constants/categories';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  category: AppCategory;
  onPress?: () => void;
};

export function CategoryTile({ category, onPress }: Props) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${category.color}22` }]}>
        <Ionicons
          name={category.icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={category.color}
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

export function CategoryMoreTile({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, styles.moreTile, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.ink }]}>
        <Ionicons name="arrow-forward" size={22} color={colors.onDark} />
      </View>
      <Text style={styles.name}>See all</Text>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  tile: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  moreTile: {
    backgroundColor: colors.canvasDeep,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
}));
