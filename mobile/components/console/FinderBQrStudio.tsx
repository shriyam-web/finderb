import { Image, Pressable, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { buildReviewInviteUrl } from '../../lib/reviewInvite';
import { PUBLIC_SITE, Sheet, Btn, createConsoleStyles } from './kit';

export function FinderBQrStudio({
  visible,
  businessName,
  category,
  city,
  slugOrId,
  onClose,
}: {
  visible: boolean;
  businessName: string;
  category?: string | null;
  city?: string | null;
  slugOrId: string;
  onClose: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const reviewUrl = buildReviewInviteUrl(slugOrId, PUBLIC_SITE);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=12&data=${encodeURIComponent(reviewUrl)}`;
  const place = [category, city].filter(Boolean).join(' · ');

  const share = () =>
    void Share.share({
      title: `${businessName} on FinderB`,
      message: `Please review ${businessName} on FinderB. Scan or tap: ${reviewUrl}`,
      url: reviewUrl,
    });

  return (
    <Sheet visible={visible} title="FinderB review card" onClose={onClose}>
      <View style={styles.card}>
        <Text style={styles.brand}>FINDERB</Text>
        <Text style={styles.tag}>This business is on FinderB</Text>
        <Text style={styles.name}>{businessName}</Text>
        {place ? <Text style={styles.place}>{place}</Text> : null}
        <View style={styles.qrPlate}>
          <Image source={{ uri: qrUrl }} style={styles.qr} resizeMode="contain" />
        </View>
        <Text style={styles.hint}>Scan to leave a review</Text>
      </View>
      <Text style={styles.url} selectable>
        {reviewUrl}
      </Text>
      <Btn icon="share-social-outline" label="Share review link" onPress={share} />
      <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
        <Ionicons name="close" size={16} color={c.muted} />
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </Sheet>
  );
}

const useStyles = createConsoleStyles((c) => ({
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#12324C',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 3,
    color: '#F9D48A',
  },
  tag: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    lineHeight: 26,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  place: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  qrPlate: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  qr: { width: 220, height: 220 },
  hint: { marginTop: 4, fontFamily: fonts.semiBold, fontSize: 13, color: '#FFFFFF' },
  url: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: c.muted,
    textAlign: 'center',
  },
  close: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  closeText: { fontFamily: fonts.medium, fontSize: 13, color: c.muted },
}));
