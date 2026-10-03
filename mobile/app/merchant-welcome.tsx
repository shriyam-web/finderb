import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { SITE_URL } from '../lib/supabase';

export default function MerchantWelcomeScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const name = user?.businessName || 'your business';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <LinearGradient
          colors={['#0B1F2A', '#14532D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.badge}>
            <Ionicons name="storefront" size={18} color="#F2B45A" />
            <Text style={styles.badgeText}>Business account</Text>
          </View>
          <Text style={styles.title}>Welcome back, {name}.</Text>
          <Text style={styles.bodyText}>
            The full merchant dashboard is on the FinderB website for now. Sign in there with the same account to manage your listing, leads, and reviews.
          </Text>
        </LinearGradient>

        <PrimaryButton
          label="Open merchant panel"
          onPress={() => void Linking.openURL(`${SITE_URL}/business/login`)}
          style={styles.cta}
        />
        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.browse}
          hitSlop={8}
        >
          <Text style={styles.browseText}>Browse FinderB</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.canvas },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#F2B45A',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  bodyText: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.86)',
  },
  cta: { marginTop: 22 },
  browse: { alignItems: 'center', paddingVertical: 16 },
  browseText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
}));
