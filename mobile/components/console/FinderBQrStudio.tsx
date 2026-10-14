import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Share, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { buildReviewInviteUrl } from '../../lib/reviewInvite';
import { reviewQrCardHtml } from '../../lib/reviewQrCardHtml';
import { downloadQrSourceBase64, saveReviewQrPng } from '../../lib/saveReviewQrPng';
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
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pngBase64, setPngBase64] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQrBase64(null);
      setPngBase64(null);
      return;
    }
    let cancelled = false;
    void downloadQrSourceBase64(qrUrl)
      .then((value) => {
        if (!cancelled) setQrBase64(value);
      })
      .catch(() => {
        if (!cancelled) Alert.alert('Could not prepare the review card', 'Check your connection and try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, qrUrl]);

  const share = () =>
    void Share.share({
      title: `${businessName} on FinderB`,
      message: `Please review ${businessName} on FinderB. Scan or tap: ${reviewUrl}`,
      url: reviewUrl,
    });

  const download = async () => {
    if (!pngBase64) return;
    setBusy(true);
    try {
      const result = await saveReviewQrPng(pngBase64, businessName);
      if (result.ok) {
        Alert.alert(
          result.method === 'saved' ? 'Card saved' : 'Share or save the card',
          result.method === 'saved'
            ? 'The 1080×1350 FinderB review card was saved to the folder you chose.'
            : 'Use Save Image or Save to Files in the share sheet.',
        );
      }
    } catch {
      Alert.alert('Could not save the card', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

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
      <Text style={styles.meta}>
        {pngBase64 ? '1080×1350 PNG is ready to save.' : 'Preparing the high-quality card…'}
      </Text>
      <Btn icon="share-social-outline" label="Share review link" onPress={share} />
      <Btn
        icon="download-outline"
        label={busy ? 'Saving…' : 'Download PNG'}
        onPress={() => void download()}
        disabled={!pngBase64 || busy}
        busy={busy}
      />
      <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
        <Ionicons name="close" size={16} color={c.muted} />
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
      {visible && qrBase64 ? (
        <WebView
          originWhitelist={['*']}
          source={{
            html: reviewQrCardHtml({
              businessName,
              place,
              reviewUrl,
              qrBase64,
            }),
          }}
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data) as { type?: string; data?: string; message?: string };
              if (payload.type === 'png' && payload.data) setPngBase64(payload.data);
              if (payload.type === 'error') {
                Alert.alert('Could not prepare the review card', payload.message || 'Please try again.');
              }
            } catch {
              // Ignore malformed messages from the hidden renderer.
            }
          }}
          style={styles.hiddenWeb}
          pointerEvents="none"
        />
      ) : null}
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
  meta: {
    marginTop: 8,
    marginBottom: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
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
  hiddenWeb: {
    height: 1,
    width: 1,
    opacity: 0,
    position: 'absolute',
  },
}));
