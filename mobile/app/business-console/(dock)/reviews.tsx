import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { getRatingDisplay } from '../../../lib/ratingDisplay';
import { isFailure, type ConsoleOverview, type ConsoleReview } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import { FinderBQrStudio } from '../../../components/console/FinderBQrStudio';
import {
  Btn,
  Chip,
  ConsoleHeaderActions,
  ConsolePage,
  Empty,
  Field,
  HeaderIcon,
  Panel,
  Section,
  Sheet,
  createConsoleStyles,
  shortDate,
  useTabBack,
} from '../../../components/console/kit';

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const c = useConsoleColors();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={value >= star - 0.5 ? c.star : c.lineStrong}
        />
      ))}
    </View>
  );
}

function Summary({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const rating = getRatingDisplay(o.stats.rating, o.stats.reviewCount);
  const total = o.reviews.length || 1;
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: o.reviews.filter((review) => Math.round(review.rating) === star).length,
  }));
  const replied = o.reviews.filter((review) => review.reply).length;
  return (
    <Panel>
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.big}>{rating.rated ? rating.label : '–'}</Text>
          {rating.rated ? <Stars value={rating.rating} /> : null}
          <Text style={styles.summaryNote}>
            {o.stats.reviewCount ? `${o.stats.reviewCount} review${o.stats.reviewCount === 1 ? '' : 's'}` : 'Not rated yet'}
          </Text>
        </View>
        <View style={styles.bars}>
          {buckets.map((bucket) => (
            <View key={bucket.star} style={styles.barRow}>
              <Text style={styles.barLabel}>{bucket.star}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(bucket.count / total) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{bucket.count}</Text>
            </View>
          ))}
        </View>
      </View>
      {o.reviews.length ? (
        <Text style={styles.replyRate}>
          You replied to {replied} of {o.reviews.length} review{o.reviews.length === 1 ? '' : 's'}
        </Text>
      ) : null}
    </Panel>
  );
}

function ReviewCard({
  review,
  onReply,
  onFlag,
  highlight,
}: {
  review: ConsoleReview;
  onReply: () => void;
  onFlag: () => void;
  highlight?: boolean;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const copyId = async () => {
    await Clipboard.setStringAsync(review.id);
    Alert.alert('Review ID copied', 'Share this ID with FinderB support if they ask for it.');
  };
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <Pressable
        onPress={() => void copyId()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Copy review ID"
        style={styles.idBadge}
      >
        <Text style={styles.idBadgeText}>{review.id.slice(0, 8)}</Text>
      </Pressable>
      <View style={styles.cardHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(review.author || 'C').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.authorRow}>
            <Text style={styles.author} numberOfLines={1}>
              {review.author || 'Customer'}
            </Text>
            {review.anonymous ? <Text style={styles.badge}>Anonymous</Text> : null}
            {review.hidden ? <Text style={styles.badgeHidden}>Hidden</Text> : null}
          </View>
          <View style={styles.cardMeta}>
            <Stars value={review.rating} size={15} />
            {review.date ? <Text style={styles.date}>{shortDate(review.date)}</Text> : null}
          </View>
        </View>
      </View>
      {review.content ? <Text style={styles.content}>{review.content}</Text> : null}
      {review.reply ? (
        <View style={styles.reply}>
          <View style={styles.replyHead}>
            <Ionicons name="return-down-forward-outline" size={15} color={c.accent} />
            <Text style={styles.replyLabel}>Your reply</Text>
            <View style={styles.flex} />
            <Pressable onPress={onReply} hitSlop={8} accessibilityRole="button" accessibilityLabel="Edit reply">
              <Text style={styles.edit}>Edit</Text>
            </Pressable>
          </View>
          <Text style={styles.replyText}>{review.reply.content}</Text>
        </View>
      ) : (
        <Btn small tone="outline" icon="chatbubble-outline" label="Reply" onPress={onReply} style={styles.replyBtn} />
      )}
      <Pressable
        onPress={onFlag}
        hitSlop={10}
        disabled={review.flagged}
        accessibilityRole="button"
        accessibilityLabel={review.flagged ? 'Already flagged' : 'Flag this review'}
        style={styles.flagBtn}
      >
        <Ionicons name={review.flagged ? 'flag' : 'flag-outline'} size={18} color={review.flagged ? '#E11D48' : c.muted} />
      </Pressable>
    </View>
  );
}

function ReviewsBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { reviewId: reviewIdParam } = useLocalSearchParams<{ reviewId?: string }>();
  const focusReviewId = Array.isArray(reviewIdParam) ? reviewIdParam[0] : reviewIdParam;
  const back = useTabBack();
  const { run, notify, refresh, refreshing } = useMerchantConsole();
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const openedFocus = useRef('');
  const [target, setTarget] = useState<ConsoleReview | null>(null);
  const [flagTarget, setFlagTarget] = useState<ConsoleReview | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [template, setTemplate] = useState(o.profile.reviewReply || '');
  const { replyMin, replyMax } = o.limits;

  const open = o.reviews.filter((review) => !review.reply);
  const list = (() => {
    const base = filter === 'open' ? open : o.reviews;
    if (!focusReviewId) return base;
    const hit = base.find((review) => review.id === focusReviewId);
    if (!hit) return base;
    return [hit, ...base.filter((review) => review.id !== focusReviewId)];
  })();

  useEffect(() => {
    if (!focusReviewId || openedFocus.current === focusReviewId) return;
    const review = o.reviews.find((item) => item.id === focusReviewId);
    if (!review) return;
    openedFocus.current = focusReviewId;
    setFilter('all');
  }, [focusReviewId, o.reviews]);

  const startReply = (review: ConsoleReview) => {
    setTarget(review);
    setDraft(review.reply?.content || '');
  };

  const sendFlag = async () => {
    if (!flagTarget) return;
    const reason = flagReason.trim();
    if (reason.length < 8) {
      notify('Tell us why this review should be checked (at least 8 characters).', 'bad');
      return;
    }
    setSaving(true);
    const result = await run('flagReview', { reviewId: flagTarget.id, reason });
    setSaving(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setFlagTarget(null);
    setFlagReason('');
    notify('Flag sent to FinderB admins');
  };

  const sendReply = async () => {
    if (!target) return;
    const content = draft.trim();
    if (content.length < replyMin || content.length > replyMax) {
      notify(`Write between ${replyMin} and ${replyMax} characters.`, 'bad');
      return;
    }
    setSaving(true);
    const result = await run('replyReview', { reviewId: target.id, content });
    setSaving(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setTarget(null);
    notify('Reply posted on your page');
  };

  const saveTemplate = async () => {
    const value = template.trim();
    if (value && (value.length < replyMin || value.length > replyMax)) {
      notify(`Saved reply must be ${replyMin}–${replyMax} characters.`, 'bad');
      return;
    }
    setSaving(true);
    const result = await run('saveProfile', { patch: { reviewReply: value } });
    setSaving(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setTemplateOpen(false);
    notify('Saved reply updated');
  };

  const draftLength = draft.trim().length;

  return (
    <>
    <ConsolePage
      title="Reviews"
      subtitle={
        open.length
          ? `${open.length} waiting for your reply · ${o.reviewFlags?.remaining ?? 10} flags left this month`
          : `All reviews answered · ${o.reviewFlags?.remaining ?? 10} flags left this month`
      }
      onBack={back}
      right={
        <ConsoleHeaderActions>
          <HeaderIcon
            icon="qr-code-outline"
            label="Create review QR"
            onPress={() => setQrOpen(true)}
          />
          <HeaderIcon
            icon="notifications-outline"
            label="Notifications"
            badge={o.notifications.unread}
            onPress={() => router.push('/business-console/alerts')}
          />
        </ConsoleHeaderActions>
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <View style={styles.rankBanner}>
        <Text style={styles.rankBannerKicker}>Higher visibility</Text>
        <Text style={styles.rankBannerTitle}>
          {Math.max(0, 10 - o.stats.reviewCount) > 0
            ? `${Math.max(0, 10 - o.stats.reviewCount)} more review${Math.max(0, 10 - o.stats.reviewCount) === 1 ? '' : 's'} to unlock a stronger rank`
            : 'You crossed 10 reviews — keep the momentum'}
        </Text>
      </View>
      <Summary o={o} />

      <Pressable
        onPress={() => setTemplateOpen(true)}
        style={({ pressed }) => [styles.template, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.templateIcon}>
          <Ionicons name="bookmark-outline" size={18} color={c.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.templateTitle}>Saved reply</Text>
          <Text style={styles.templateBody} numberOfLines={2}>
            {o.profile.reviewReply || 'Write one thank-you note and use it in any reply with a tap.'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.faint} />
      </Pressable>

      {o.reviews.length ? (
        <Section title="Customer reviews">
          <View style={styles.filters}>
            <Chip label="All" count={o.reviews.length} active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="Needs reply" count={open.length} active={filter === 'open'} onPress={() => setFilter('open')} />
          </View>
          {list.length ? (
            list.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                highlight={review.id === focusReviewId}
                onReply={() => startReply(review)}
                onFlag={() => {
                  setFlagTarget(review);
                  setFlagReason('');
                }}
              />
            ))
          ) : (
            <Empty icon="checkmark-done-outline" title="Every review has a reply" body="Nice work. New ones will show up here." />
          )}
        </Section>
      ) : (
        <Empty
          icon="star-outline"
          title="No reviews yet"
          body="Ask happy customers to rate you on FinderB. Sharing your storefront link is the quickest way."
        />
      )}

      <Sheet
        visible={Boolean(target)}
        title={target?.reply ? 'Edit reply' : 'Reply to review'}
        onClose={() => setTarget(null)}
        action={{
          label: target?.reply ? 'Update' : 'Post',
          busy: saving,
          disabled: draftLength < replyMin,
          onPress: () => void sendReply(),
        }}
      >
        {target ? (
          <View style={styles.sheetQuote}>
            <View style={styles.cardMeta}>
              <Text style={styles.author}>{target.author || 'Customer'}</Text>
              <Stars value={target.rating} size={13} />
            </View>
            {target.content ? <Text style={styles.sheetQuoteText}>{target.content}</Text> : null}
          </View>
        ) : null}
        <Field
          label="Your reply"
          multiline
          autoFocus
          value={draft}
          onChangeText={setDraft}
          maxLength={replyMax}
          placeholder="Thank them by name and mention what they liked"
          counter={`${draftLength}/${replyMax}`}
          hint={`Shown publicly under the review. At least ${replyMin} characters.`}
        />
        {o.profile.reviewReply ? (
          <View style={styles.filters}>
            <Chip icon="bookmark-outline" label="Use saved reply" onPress={() => setDraft(o.profile.reviewReply)} />
          </View>
        ) : null}
      </Sheet>

      <Sheet
        visible={Boolean(flagTarget)}
        title="Flag this review"
        onClose={() => setFlagTarget(null)}
        action={{
          label: 'Submit flag',
          busy: saving,
          disabled: flagReason.trim().length < 8,
          onPress: () => void sendFlag(),
        }}
      >
        <Text style={styles.sheetIntro}>
          FinderB admins will check if this review is offensive, untruthful, or abusive. You can flag{' '}
          {o.reviewFlags?.limit ?? 10} reviews per month ({o.reviewFlags?.remaining ?? 10} left).
        </Text>
        {flagTarget?.content ? (
          <View style={styles.sheetQuote}>
            <Text style={styles.author}>{flagTarget.author || 'Customer'}</Text>
            <Text style={styles.sheetQuoteText}>{flagTarget.content}</Text>
          </View>
        ) : null}
        <Field
          label="Why are you flagging this?"
          multiline
          value={flagReason}
          onChangeText={setFlagReason}
          maxLength={500}
          placeholder="What is wrong with this review?"
          counter={`${flagReason.trim().length}/500`}
        />
      </Sheet>

      <Sheet
        visible={templateOpen}
        title="Saved reply"
        onClose={() => setTemplateOpen(false)}
        action={{ label: 'Save', busy: saving, onPress: () => void saveTemplate() }}
      >
        <Text style={styles.sheetIntro}>
          Write a thank-you note once. When you reply to a review, you can drop it in with one tap and edit it.
        </Text>
        <Field
          label="Thank-you note"
          multiline
          value={template}
          onChangeText={setTemplate}
          maxLength={replyMax}
          placeholder="Thank you for visiting us! We’re glad you liked…"
          counter={`${template.trim().length}/${replyMax}`}
          hint="Only you see this. Leave it empty to remove it."
        />
      </Sheet>
    </ConsolePage>
      <FinderBQrStudio
        visible={qrOpen}
        businessName={o.business.name}
        category={o.business.category}
        city={o.business.city}
        slugOrId={o.business.slug || o.business.id}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
}

export default function ReviewsScreen() {
  return <ConsoleGate>{(overview) => <ReviewsBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summaryLeft: { alignItems: 'flex-start', gap: 6, minWidth: 96 },
  big: { fontFamily: fonts.semiBold, fontSize: 38, color: c.ink, lineHeight: 44 },
  summaryNote: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  bars: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 10, fontFamily: fonts.regular, fontSize: 12, color: c.muted, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: c.star },
  barCount: { width: 22, fontFamily: fonts.regular, fontSize: 12, color: c.faint, textAlign: 'right' },
  replyRate: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: c.line,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: c.body,
  },
  template: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
  },
  templateIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  templateTitle: { fontFamily: fonts.semiBold, fontSize: 14.5, color: c.ink },
  templateBody: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.muted },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rankBanner: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#153551',
    gap: 6,
  },
  rankBannerKicker: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#F9D48A',
  },
  rankBannerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 23,
    color: '#FFFFFF',
  },
  card: {
    position: 'relative',
    padding: 16,
    paddingBottom: 44,
    borderRadius: 14,
    backgroundColor: '#F4F8FC',
    borderWidth: 1,
    borderColor: 'rgba(33,84,129,0.18)',
    gap: 12,
  },
  cardHighlight: {
    borderColor: '#E8873A',
    borderWidth: 1.5,
    backgroundColor: '#FFF6EB',
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 72 },
  idBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  idBadgeText: { fontFamily: fonts.medium, fontSize: 12, color: c.ink },
  flagBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  avatarText: { fontFamily: fonts.semiBold, fontSize: 15, color: c.body },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  author: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink, flexShrink: 1 },
  badge: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: c.muted,
    backgroundColor: c.sunken,
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeHidden: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: c.accent,
    backgroundColor: c.primarySoft,
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  date: { fontFamily: fonts.regular, fontSize: 14, color: c.faint },
  content: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: c.body },
  reply: { padding: 12, borderRadius: 10, backgroundColor: c.sunken, gap: 6 },
  replyHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: { fontFamily: fonts.semiBold, fontSize: 13, color: c.accent },
  replyText: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: c.body },
  edit: { fontFamily: fonts.semiBold, fontSize: 13, color: c.accent },
  replyBtn: { alignSelf: 'flex-start' },
  sheetQuote: { padding: 14, borderRadius: 12, backgroundColor: c.sunken, gap: 8 },
  sheetQuoteText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.body },
  sheetIntro: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.body },
}));
