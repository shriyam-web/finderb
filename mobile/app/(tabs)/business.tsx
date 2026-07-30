import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, gradients } from '../../constants/colors';

export default function BusinessScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.soft]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="briefcase" size={28} color={colors.mangoDeep} />
          </View>
          <Text style={styles.title}>Grow on FinderB</Text>
          <Text style={styles.subtitle}>
            Get discovered by people searching your category. Leads, profile, and
            insights — coming to mobile next.
          </Text>
          <PrimaryButton label="Register business (soon)" onPress={() => {}} />
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
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.mangoSoft,
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
});
