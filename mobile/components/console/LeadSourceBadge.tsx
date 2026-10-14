import { Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { leadSourceOf, sourceLabel } from './leadStatus';

export function LeadSourceBadge({
  lead,
}: {
  lead: { source?: string | null; status?: string | null };
}) {
  const source = leadSourceOf(lead);
  if (!source) return null;
  const label = sourceLabel(source);
  if (!label) return null;

  if (source === 'Direct Lead') {
    return (
      <View style={styles.direct}>
        <Text style={styles.directMark}>⚡</Text>
        <Text style={styles.directText}>Direct</Text>
      </View>
    );
  }

  if (source === 'Generated on your profile') {
    return (
      <View style={styles.profile}>
        <View style={styles.profileDot} />
        <Text style={styles.profileText}>On your profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.category}>
      <Text style={styles.categoryMark}>★</Text>
      <Text style={styles.categoryText}>Popular in category</Text>
    </View>
  );
}

const styles = {
  direct: {
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
