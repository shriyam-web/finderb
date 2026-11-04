import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { buildReviewInviteUrl } from '../../lib/reviewInvite';
import { reviewQrCardHtml } from '../../lib/reviewQrCardHtml';
import { downloadQrSourceBase64, saveReviewQrPng } from '../../lib/saveReviewQrPng';
import { shareMessage } from '../../lib/shareMessage';
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
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [pngBase64, setPngBase64] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQrBase64(null);
      setLogoBase64(null);
      setPngBase64(null);
      return;
    }
    let cancelled = false;
    void Promise.all([
      downloadQrSourceBase64(qrUrl),
      downloadQrSourceBase64(`${PUBLIC_SITE}/businesslogo.png`).catch(() => null),
    ])
      .then(([qr, logo]) => {
        if (cancelled) return;
        setQrBase64(qr);
        setLogoBase64(logo);
      })
      .catch(() => {
        if (!cancelled) Alert.alert('Could not prepare the review card', 'Check your connection and try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [visible, qrUrl]);

  const share = () =>
    void shareMessage({
      title: `${businessName} on FinderB`,
      url: reviewUrl,
      message: `Please review ${businessName} on FinderB. Scan or tap: ${reviewUrl}`,
    }).then((result) => {
      if (result !== 'copied') return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
            ? 'The 1080×1920 FinderB review card was saved to the folder you chose.'
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
        <View style={styles.topRibbon} />
        <Image source={{ uri: `${PUBLIC_SITE}/businesslogo.png` }} style={styles.logo} resizeMode="contain" />
        <Text style={styles.name}>{businessName}</Text>
        {place ? <Text style={styles.place}>{place}</Text> : null}
        <View style={styles.qrPlate}>
          <Image source={{ uri: qrUrl }} style={styles.qr} resizeMode="contain" />
        </View>
        <Text style={styles.hint}>Scan to leave a review</Text>
        <Text style={styles.site}>finderb.com</Text>
        <View style={styles.bottomRibbon} />
      </View>
      <Text style={styles.url} selectable>
        {reviewUrl}
      </Text>
      <Text style={styles.meta}>
        {pngBase64 ? '1080×1920 PNG is ready to save.' : 'Preparing the high-quality card…'}
      </Text>
      <Btn icon="share-social-outline" label={copied ? 'Link copied' : 'Share review link'} onPress={share} />
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
              logoBase64,
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
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.line,
    gap: 6,
  },
  topRibbon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 10,
    backgroundColor: '#153551',
    borderBottomWidth: 4,
    borderBottomColor: '#E8873A',
  },
  bottomRibbon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 10,
    backgroundColor: '#153551',
    borderTopWidth: 4,
    borderTopColor: '#E8873A',
  },
  logo: {
    width: 196,
    height: 48,
    marginTop: 14,
  },
  tag: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 3,
    color: '#E8873A',
  },
  name: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 22,
    lineHeight: 26,
    color: '#153551',
    textAlign: 'center',
  },
  place: { fontFamily: fonts.medium, fontSize: 13, color: '#5B6B7C', textAlign: 'center' },
  qrPlate: {
    marginTop: 8,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBF3',
  },
  qr: { width: 188, height: 188 },
  hint: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#153551',
  },
  site: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#5B6B7C',
    marginBottom: 8,
  },
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
