import { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors, type ConsoleColors } from '../../constants/consoleColors';

const FAQS = [
  {
    q: 'How do I get more customer leads on FinderB?',
    a: 'FinderB ranks live listings that look complete and respond quickly. Add at least one sharp photo (required to appear in search), fill about, hours, map pin, and services, then verify email and mobile. Reply to every lead the same day — shops that answer fast win the second enquiry. Ten genuine reviews, a paid plan, and a complete profile all lift you above nearby competitors in the same category.',
  },
  {
    q: 'Why is my listing hidden from customers?',
    a: 'A listing stays off search, categories, and the public profile until it has at least one photo and FinderB has approved it as Active. Unverified contact details are also withheld from the public page. If you used “Delete my business”, the listing is set to inactive on purpose — add a photo, restore the details, and write to business@finderb.com if you need it switched back on.',
  },
  {
    q: 'How do I change my category or business name?',
    a: 'Category, legal name, and display name are locked after go-live so customers are not misled. Open Login and security, submit a change request with the new value, and wait for FinderB to review it. Typical turnaround is one to two working days. The rest of the listing — hours, photos, about, map — you can edit yourself from My Business.',
  },
  {
    q: 'How do reviews, the QR card, and flagging work?',
    a: 'Share the FinderB review link or printed QR card so signed-in customers can rate you after a visit. Replies show on your public page. You can flag abusive or fake reviews from the Reviews tab; each business gets a limited number of flags per month, so use them for genuine problems. Listings with 10+ real reviews appear more often in local results.',
  },
  {
    q: 'What does a paid plan unlock?',
    a: 'Starter is free: your listing can still show, but lead phone numbers stay hidden. Growth and Pro unlock the caller’s number, lead alerts, and stronger placement. If you do not have an active subscription, the thin red strip under the header takes you to Plan. Auto-renew, if you turned it on, charges the saved mandate at the end of the cycle.',
  },
  {
    q: 'Can I add teammates without sharing my password?',
    a: 'Yes. Owners invite staff from Login and security with email or mobile. Each invite lasts 48 hours. You choose which tabs they can view or edit (leads, listing, reviews, jobs, plan). Only the owner can hide the listing or manage billing.',
  },
  {
    q: 'What is Merchant ID and why does it matter?',
    a: 'Your Merchant ID is the unique FinderB id for this business. It is shown on the My Business tab with a copy button. Quote it in emails or WhatsApp to support so we can find the right listing without asking you to re-explain the shop name or city.',
  },
  {
    q: 'How are competitor score and average response time calculated?',
    a: 'Competitor score is the average profile-completion percentage of other live listings in your category. Response time is how long you typically take to open a new lead after it arrives. Both sit on Home and My Business so you can see whether you are ahead of nearby shops or leaving enquiries waiting.',
  },
];

const FAB = 52;

let fabShift = { x: 0, y: 0 };

function clampShift(x: number, y: number, bottomOffset: number) {
  const { width, height } = Dimensions.get('window');
  const minX = -(width - FAB - 32);
  const maxX = 8;
  const minY = -(height - bottomOffset - FAB - 96);
  const maxY = Math.max(0, bottomOffset - 24);
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

export function MerchantSupportFab({ bottomOffset }: { bottomOffset: number }) {
  const c = useConsoleColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(FAQS[0]?.q ?? null);
  const bottomRef = useRef(bottomOffset);
  bottomRef.current = bottomOffset;
  const shift = useRef(new Animated.ValueXY(fabShift)).current;
  const pos = useRef({ ...fabShift });
  const grant = useRef({ ...fabShift });
  const moved = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        moved.current = false;
        grant.current = { ...pos.current };
      },
      onPanResponderMove: (_event, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) moved.current = true;
        const next = clampShift(grant.current.x + gesture.dx, grant.current.y + gesture.dy, bottomRef.current);
        pos.current = next;
        shift.setValue(next);
      },
      onPanResponderRelease: () => {
        fabShift = pos.current;
        if (!moved.current) setOpen(true);
      },
    }),
  ).current;

  return (
    <>
      <View pointerEvents="box-none" collapsable={false} style={fabHostStyles.host}>
        <Animated.View
          {...pan.panHandlers}
          style={[
            styles.fab,
            fabHostStyles.fab,
            { bottom: bottomOffset },
            { transform: shift.getTranslateTransform() },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Business support. Drag to move."
        >
          <Ionicons name="chatbubbles" size={22} color="#FFFFFF" />
        </Animated.View>
      </View>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <View style={styles.flex}>
                <Text style={styles.kicker}>Help centre</Text>
                <Text style={styles.title}>How FinderB Business works</Text>
                <Text style={styles.lede}>
                  Short answers to the questions owners ask us most — ranking, photos, reviews, plans, and your
                  Merchant ID.
                </Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={c.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
              {FAQS.map((item, index) => {
                const on = expanded === item.q;
                return (
                  <Pressable
                    key={item.q}
                    onPress={() => setExpanded(on ? null : item.q)}
                    style={[styles.faq, index === 0 && styles.faqFirst]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: on }}
                  >
                    <View style={styles.faqRow}>
                      <Text style={styles.faqQ}>{item.q}</Text>
                      <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
                    </View>
                    {on ? <Text style={styles.faqA}>{item.a}</Text> : null}
                  </Pressable>
                );
              })}
              <View style={styles.help}>
                <Text style={styles.helpTitle}>Talk to FinderB</Text>
                <Text style={styles.helpBody}>
                  Weekdays, 10:00–18:00 IST. Keep your Merchant ID handy so we can open the right listing on the first
                  reply.
                </Text>
                <Pressable
                  onPress={() => void Linking.openURL('mailto:business@finderb.com')}
                  style={styles.helpLink}
                  accessibilityRole="link"
                >
                  <Ionicons name="mail-outline" size={16} color={c.ink} />
                  <Text style={styles.helpLinkText}>business@finderb.com</Text>
                </Pressable>
                <Pressable
                  onPress={() => void Linking.openURL('tel:+919990222346')}
                  style={styles.helpLink}
                  accessibilityRole="link"
                >
                  <Ionicons name="call-outline" size={16} color={c.ink} />
                  <Text style={styles.helpLinkText}>+91 99902 22346</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const fabHostStyles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 9999,
    elevation: 24,
  },
});

function makeStyles(c: ConsoleColors) {
  return StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    shadowColor: '#18181B',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(24,24,27,0.4)',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: c.card,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.lineStrong,
    marginBottom: 10,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: c.muted,
  },
  title: { marginTop: 4, fontFamily: fonts.semiBold, fontSize: 20, color: c.ink },
  lede: { marginTop: 6, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  faqList: { maxHeight: 560 },
  faq: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.line,
    paddingVertical: 14,
  },
  faqFirst: { borderTopWidth: 0 },
  faqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  faqQ: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14.5, lineHeight: 20, color: c.ink },
  faqA: { marginTop: 8, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: c.body },
  help: {
    marginTop: 8,
    marginBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.line,
    paddingTop: 16,
  },
  helpTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  helpBody: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.muted },
  helpLink: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpLinkText: { fontFamily: fonts.medium, fontSize: 14, color: c.ink },
  });
}
