import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, gradients } from '../../constants/colors';

export default function AccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.soft]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <LinearGradient
            colors={[colors.mango, colors.heat]}
            style={styles.avatar}
          >
            <Ionicons name="person" size={30} color={colors.white} />
          </LinearGradient>
          <Text style={styles.title}>Hey, explorer</Text>
          <Text style={styles.subtitle}>
            Sign in to save favourites, drop reviews, and keep your city in sync.
          </Text>

          <PrimaryButton
            label="Sign in"
            onPress={() => router.push('/login')}
            style={styles.btn}
          />
          <PrimaryButton
            label="Create account"
            onPress={() => router.push('/signup')}
            variant="secondary"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  btn: { marginBottom: 10 },
});
