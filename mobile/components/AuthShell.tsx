import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinderBLogo } from './BrandMark';
import { colors, gradients } from '../constants/colors';
import { useBottomInset } from '../hooks/useAppSafeArea';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  const bottomInset = useBottomInset(16);
  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.soft]} style={StyleSheet.absoluteFill} />
      <View style={styles.orbTop} />
      <View style={styles.orbSide} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: 28 + bottomInset }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandRow}>
              <FinderBLogo size={40} />
              <Text style={styles.brandWord}>
                Finder<Text style={styles.brandB}>B</Text>
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              {children}
            </View>

            <View style={styles.footer}>{footer}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: { flex: 1 },
  safe: { flex: 1 },
  orbTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFB07A',
    opacity: 0.4,
  },
  orbSide: {
    position: 'absolute',
    top: 180,
    left: -70,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FF8A9B',
    opacity: 0.22,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  brandWord: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  brandB: {
    color: colors.mango,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#C47840',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  footer: {
    marginTop: 22,
    alignItems: 'center',
  },
});
