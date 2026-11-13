import { Pressable, Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { leadSourceOf, sourceLabel, sourceMeaning } from './leadStatus';

export function LeadSourceBadge({
  lead,
  align = 'start',
  plain = false,
  onMeaning,
}: {
  lead: { source?: string | null; status?: string | null };
  align?: 'start' | 'end';
  plain?: boolean;
  onMeaning?: (meaning: { title: string; body: string }) => void;
}) {
  const source = leadSourceOf(lead);
  if (!source) return null;
  const label = sourceLabel(source);
  const meaning = sourceMeaning(source);
  if (!label || !meaning) return null;
  const edge = align === 'end' ? styles.end : null;

  if (plain) {
    return (
      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          onMeaning?.({ title: label, body: meaning });
        }}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Show what this means`}
      >
        <Text style={[styles.word, edge]}>{label}</Text>
      </Pressable>
    );
  }

  const badge =
    source === 'Direct Lead' ? (
      <View style={[styles.direct, edge]}>
        <Text style={styles.directMark}>⚡</Text>
        <Text style={styles.directText}>Direct</Text>
      </View>
    ) : source === 'Generated on your profile' ? (
      <View style={[styles.profile, edge]}>
        <View style={styles.profileDot} />
        <Text style={styles.profileText}>On your profile</Text>
      </View>
    ) : (
      <View style={[styles.category, edge]}>
        <Text style={styles.categoryMark}>★</Text>
        <Text style={styles.categoryText}>Popular in category</Text>
      </View>
    );

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onMeaning?.({ title: label, body: meaning });
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Show what this means`}
    >
      {badge}
    </Pressable>
  );
}

const styles = {
  end: { alignSelf: 'flex-end' as const },
  word: {
    alignSelf: 'flex-start' as const,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#71717A',
  },
  direct: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#5B21B6',
  },
  directMark: { fontSize: 10, color: '#FDE68A' },
  directText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    color: '#FFFFFF',
  },
  profile: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: '#12324C',
    borderWidth: 1,
    borderColor: '#0B2236',
  },
  profileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3DD6C6',
  },
  profileText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: '#D7E8F7',
  },
  category: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F6C63D',
    borderWidth: 1,
    borderColor: '#D7A21A',
  },
  categoryMark: { fontSize: 10, color: '#5A3B04' },
  categoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.2,
    color: '#5A3B04',
  },
};
