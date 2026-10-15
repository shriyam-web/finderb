import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { Btn, createConsoleStyles, DOCK_HEIGHT } from './kit';

const FAQS = [
  {
    q: 'How do I get more customer leads?',
    a: 'Complete your listing, reply to reviews, verify phone and email, and add at least one photo so customers can find and trust you.',
  },
  {
    q: 'Why is my listing hidden?',
    a: 'A listing stays hidden until it has at least one photo and is approved. Unverified contact details are also hidden from customers.',
  },
  {
    q: 'How do I change my category or business name?',
    a: 'Open Login and security and submit a change request. FinderB reviews category, legal name, and display name changes before they go live.',
  },
  {
    q: 'How do reviews work?',
    a: 'Share your FinderB review card or review link. Customers leave ratings after signing in. You can reply and flag abusive reviews from the Reviews tab.',
  },
  {
    q: 'Can I add teammates?',
    a: 'Yes. Owners can invite staff from Login and security with email or mobile. Invites expire after 48 hours.',
  },
];

export function MerchantSupportFab() {
  const styles = useStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.fab, { bottom: DOCK_HEIGHT + insets.bottom + 18 }]}
        accessibilityRole="button"
        accessibilityLabel="Business support"
      >
        <Ionicons name="help-circle-outline" size={26} color="#FFFFFF" />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHead}>
              <View style={styles.flex}>
                <Text style={styles.kicker}>FinderB Business</Text>
                <Text style={styles.title}>Need help?</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={c.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
              {FAQS.map((item) => {
                const on = expanded === item.q;
                return (
                  <Pressable
                    key={item.q}
                    onPress={() => setExpanded(on ? null : item.q)}
                    style={styles.faq}
                    accessibilityRole="button"
                  >
                    <Text style={styles.faqQ}>{item.q}</Text>
                    {on ? <Text style={styles.faqA}>{item.a}</Text> : null}
                  </Pressable>
                );
              })}
              <View style={styles.help}>
                <Text style={styles.helpTitle}>Still need help?</Text>
                <Text style={styles.helpBody}>Our team is here on business hours.</Text>
                <View style={styles.helpActions}>
                  <Btn
                    small
                    tone="outline"
                    icon="mail-outline"
                    label="business@finderb.com"
                    onPress={() => void Linking.openURL('mailto:business@finderb.com')}
                  />
                  <Btn
                    small
                    tone="outline"
                    icon="call-outline"
                    label="+91 99902 22346"
                    onPress={() => void Linking.openURL('tel:+919990222346')}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 40,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#153551',
    elevation: 6,
    shadowColor: '#153551',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#215481',
  },
  title: { marginTop: 4, fontFamily: fonts.semiBold, fontSize: 20, color: '#18181B' },
  faqList: { maxHeight: 520 },
  faq: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  faqQ: { fontFamily: fonts.semiBold, fontSize: 14.5, color: '#18181B' },
  faqA: { marginTop: 8, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: '#52525B' },
  help: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(33,84,129,0.16)',
    backgroundColor: 'rgba(33,84,129,0.04)',
    borderRadius: 14,
    padding: 14,
  },
  helpTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: '#153551' },
  helpBody: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, color: '#52525B' },
  helpActions: { marginTop: 12, gap: 8 },
}));
