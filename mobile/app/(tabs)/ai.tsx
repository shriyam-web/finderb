import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinderBLogo } from '../../components/BrandMark';
import { colors, gradients } from '../../constants/colors';

export default function AiScreen() {
  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.ai]} style={styles.heroBand} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.logoPlate}>
            <FinderBLogo size={64} />
          </View>
          <Text style={styles.title}>
            FinderB <Text style={styles.ai}>AI</Text>
          </Text>
          <Text style={styles.subtitle}>
            Tell us what you need — get matched businesses in seconds.
          </Text>

          <View style={styles.searchCard}>
            <View style={styles.iconBox}>
              <Ionicons name="sparkles" size={18} color={colors.tealDeep} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Dentists near me, salon, CA firm..."
              placeholderTextColor={colors.textSoft}
            />
            <View style={styles.micBox}>
              <Ionicons name="mic" size={18} color={colors.white} />
            </View>
          </View>

          <View style={styles.hintRow}>
            {['Open now', 'Best rated', 'Budget'].map((h) => (
              <View key={h} style={styles.hint}>
                <Text style={styles.hintText}>{h}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            AI UI is live. Real matching connects next.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  heroBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    alignItems: 'center',
  },
  logoPlate: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.6,
  },
  ai: { color: '#D5FFF6' },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 300,
  },
  searchCard: {
    marginTop: 28,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0B7A6C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 8,
    fontWeight: '600',
  },
  micBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hint: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  note: {
    marginTop: 28,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
