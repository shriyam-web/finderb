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
    a: 'Competitor score is the average profile-completion percentage of other live listings in your category. Response time is how long you typically take to open a new lead after it arrives. Both sit together on Home. They are not repeated inside Profile completion on My Business.',
  },
  {
    q: 'Why does a lead show Call and WhatsApp for one customer and only Email for another?',
    a: 'Call and WhatsApp appear when the customer’s FinderB account has a verified mobile, or when they typed a phone number on the enquiry. Email is always there if we have an address. On the free plan those buttons stay locked until you upgrade. Job applications are on their own tab, so a hiring enquiry will not sit in the customer list.',
  },
  {
    q: 'What is the Lead ID box for?',
    a: 'Every lead card has a small Lead ID box at the top right. Tap it to copy the full id. Paste that id when you write to business@finderb.com so we can open the exact enquiry instead of searching by name.',
  },
  {
    q: 'How do customer leads differ from job applications?',
    a: 'Leads has two tabs. Customers is for people who called, messaged, or sent an enquiry about your shop. Job applications is only for people who applied to a job you posted. Reply to customers first — that is what average response time measures.',
  },
  {
    q: 'How do I post a job and see who applied?',
    a: 'Open Jobs and save an HR email and mobile before the first post. Salary is a minimum and maximum, per month or per year. Applicants can attach a PDF or Word CV. Tap a job to see applications, then open one to shortlist. Shortlist emails the candidate and, if they have a FinderB account, sends a notification with your HR contact.',
  },
  {
    q: 'Which files can a candidate upload?',
    a: 'Only PDF, DOC, and DOCX, up to 5 MB. FinderB rejects executables, APKs, and files that contain scripts. You can preview a PDF inside the app and download Word files. Do not ask candidates to pay anyone to apply.',
  },
  {
    q: 'Can a customer review my business without showing their name?',
    a: 'Yes. They tick Post anonymously and the review goes up without a reason box. The public name is masked. You still see it in Reviews and can reply or flag it if it is abusive. Flagging is limited each month, so keep flags for real problems.',
  },
  {
    q: 'Why was my business name shortened or rejected?',
    a: 'Legal name and the name customers see are both limited to 50 characters, on registration and on a change request. Very long names break the public profile. If the name is already live, request a change from Login and security rather than editing the locked field.',
  },
  {
    q: 'I paid again before my plan ended. When does the new period start?',
    a: 'The new period is added after the current expiry, so days you already paid are kept. A business on Pro is not asked to upgrade. Growth can move to yearly Pro, and that year starts after the current Growth month ends. Payment history shows the latest 10 charges, then Load more.',
  },
  {
    q: 'What happens when my plan expires?',
    a: 'The listing can stay visible, but lead phone numbers and WhatsApp hide again until you renew. Reviews and photos stay. Renew from Plan before the date on the subscription card if you want no gap in lead access. Turning off auto-renew stops the next debit; it does not cut the days you have already paid.',
  },
  {
    q: 'How do I update hours, photos, or the map pin?',
    a: 'My Business is for the public listing. Photos need at least one image or the listing stays hidden. Hours, about, services, and the map pin save without admin review. Category, legal name, and display name need a change request. Extra sibling categories can be added as “also serves” without waiting for approval.',
  },
  {
    q: 'My WhatsApp number is different from my mobile. How do I verify it?',
    a: 'On registration, tick “I have a different WhatsApp number”. The field becomes editable. Send the WhatsApp OTP to that number and enter it before you continue. If you leave the box unticked, the verified mobile is used as WhatsApp and no second code is required.',
  },
  {
    q: 'A social link would not save. Why?',
    a: 'Instagram, Facebook, and YouTube links are checked when you change them. If the profile does not exist, or the site cannot confirm it, the save is rejected so a dead link never reaches customers. Paste the public profile URL, not a share-sheet link that expires.',
  },
  {
    q: 'How do team invites reach my staff?',
    a: 'From Login and security, invite by email or mobile and choose which tabs they can view or edit. A phone invite opens WhatsApp with the link ready — you tap Send. The link lasts 48 hours. Staff never need your password. Only the owner can hide the listing or change billing.',
  },
  {
    q: 'What is Promote your business online?',
    a: 'It is a managed Facebook and Instagram campaign for your shop. You do not open Ads Manager, build an audience, or top up an ads account. You verify the shop, pick a package and area, send a short shop video, and pay. FinderB makes the ad and runs it. Buying a promotion does not start a Live Leads plan, and buying a plan does not buy these ads.',
  },
  {
    q: 'What has to be ready before an ad can start?',
    a: 'Three things. A live photo of the shop front, taken on the camera while you are at the shop — a gallery picture is not accepted. One proof: GST, Udyam, a shop licence, or Aadhaar or PAN with a recent electricity bill. And the declaration that the shop is genuine and that customer payments stay your responsibility. FinderB reviews this. The ad starts only after that review is approved and payment is confirmed. Your phone’s location is checked so the shop is in India.',
  },
  {
    q: 'What do the promotion packages actually include?',
    a: 'Starter Boost runs about 5 days in a nearby radius. Growth Booster runs about 10 days across a wider city area. Mega Booster runs about 15 days at district or regional reach. The price you see includes GST. Reach, views, and visit figures on a package are a guide, not a promise. After a campaign is completed, FinderB writes the recorded numbers into that promotion. Until then, the app does not show made-up results.',
  },
  {
    q: 'Who changes the campaign status and the results?',
    a: 'FinderB does. You can watch the stage — payment, review, editing, video ready, live, completed — but you cannot set it yourself. Actual reach, views, and visits appear only when the campaign is completed and FinderB has entered them. If a campaign is rejected or cancelled, the reason is shown on the promotion. Refunds, when they apply, are handled by FinderB, not by a button in the app.',
  },
  {
    q: 'What shop video should I send?',
    a: 'A vertical video of the real shop, about 15 to 45 seconds, in mp4 or a quicktime file, up to 60 MB. Film the front, the counter, or the work you do. FinderB checks the length and the shape, then edits it before the ad goes out. A video that is too short, too long, or the wrong shape is not used.',
  },
  {
    q: 'Why must the shop photo be taken on the spot?',
    a: 'The photo is proof that the shop is open where you say it is. Take Shop Photo opens the camera. A picture already saved in the gallery can be old or from somewhere else, so it is refused. Stay at the shop, allow location, and take the photo there. If the camera is blocked, allow it for FinderB in the phone settings and try again.',
  },
  {
    q: 'What is the difference between my public contact and Contact FinderB?',
    a: 'Public contact is the phone, email, WhatsApp, and website customers see on your listing. Change it from Manage → Contact. Contact FinderB, the last item in Manage, writes to support@finderb.com about the app, a payment, a listing, or a promotion. Put your Merchant ID in that email. If the question is about one enquiry, also paste the Lead ID from that card.',
  },
  {
    q: 'How do notes on a lead work?',
    a: 'Each lead has Add note. The note is for your team, not for the customer. After you save one, a short preview sits on the card so you can see a note exists without opening it. Tap that preview and choose edit or remove. The note is not shown on the public listing.',
  },
  {
    q: 'What do the lead statuses and source badges mean?',
    a: 'New means the customer has not been contacted yet. Mark the lead once you have spoken to them, and the status you pick is shown first. Tap the source badge — Direct or another source — to read how that customer reached you. Job applications are a separate list and do not count as customer leads.',
  },
  {
    q: 'Can I list more than one category?',
    a: 'The main category is what customers search. Replacing it needs a change request from Login and security, so a restaurant cannot quietly become a clinic. Extra work you really do can be added as “also serves”. Those sibling categories go on the listing without waiting for approval. Do not add a category you do not offer.',
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
          <Ionicons name="chatbubbles" size={22} color={c.primaryInk} />
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
                  Short answers on ranking, photos, reviews, plans, promotions, jobs, and your Merchant ID.
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
