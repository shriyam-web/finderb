import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { fetchMerchantBySlugOrId } from '../../lib/api';
import type { Merchant } from '../../lib/merchants';
import { MerchantReviewComposer } from '../../components/MerchantReviewComposer';

export default function ReviewInviteScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const key = decodeURIComponent(String(slug || '').trim());
    if (!key) {
      setError('Missing business');
      setLoading(false);
      return;
    }
    void fetchMerchantBySlugOrId(key).then((result) => {
      if (!alive) return;
      setLoading(false);
      if (!result.merchant) {
        setError(result.error || 'This listing is not available.');
        return;
      }
      setMerchant(result.merchant);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  const ownBusiness = Boolean(user?.isBusinessAccount && user.businessId && merchant?.id === user.businessId);
  const alreadyReviewed = Boolean(user && merchant?.reviews.some((review) => review.userId === user.id));

  return (
    <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Review on FinderB</Text>
        <Text style={styles.title}>{merchant?.name || 'Business review'}</Text>
        <Text style={styles.meta}>
          {[merchant?.category, merchant?.city || merchant?.location].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={colors.ink} style={styles.loader} />
        ) : error || !merchant ? (
          <Text style={styles.error}>{error || 'Business not found.'}</Text>
        ) : (
          <MerchantReviewComposer
            businessId={merchant.id}
            category={merchant.category}
            alreadyReviewed={alreadyReviewed}
            signedIn={Boolean(user) && !user?.isBusinessAccount}
            ownBusiness={ownBusiness}
            authorName={user?.fullName}
            onRequestLogin={requestLogin}
            onSubmitted={() => undefined}
          />
        )}
        {merchant ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(tabs)/merchant/[id]', params: { id: merchant.slug || merchant.id } } as Href)
            }
            style={styles.link}
          >
            <Text style={styles.linkText}>View full listing</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  page: { flex: 1, backgroundColor: colors.canvas },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#12324C',
  },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#F9D48A',
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  meta: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  body: { flex: 1, padding: 16 },
  loader: { marginTop: 40 },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },
}));
