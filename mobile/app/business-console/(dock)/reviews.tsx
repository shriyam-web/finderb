import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { getRatingDisplay } from '../../../lib/ratingDisplay';
import { isFailure, type ConsoleOverview, type ConsoleReview } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import {
  Btn,
  Chip,
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

function ReviewCard({ review, onReply }: { review: ConsoleReview; onReply: () => void }) {
  const styles = useStyles();
  const c = useConsoleColors();
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(review.author || 'C').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.author} numberOfLines={1}>
            {review.author || 'Customer'}
          </Text>
          <View style={styles.cardMeta}>
            <Stars value={review.rating} size={13} />
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
    </View>
  );
}

function ReviewsBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { run, notify, refresh, refreshing } = useMerchantConsole();
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const [target, setTarget] = useState<ConsoleReview | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [template, setTemplate] = useState(o.profile.reviewReply || '');
  const { replyMin, replyMax } = o.limits;

  const open = o.reviews.filter((review) => !review.reply);
  const list = filter === 'open' ? open : o.reviews;

  const startReply = (review: ConsoleReview) => {
    setTarget(review);
    setDraft(review.reply?.content || '');
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
    <ConsolePage
      title="Reviews"
      subtitle={open.length ? `${open.length} waiting for your reply` : 'All reviews answered'}
      onBack={back}
      right={
        <HeaderIcon
          icon="notifications-outline"
          label="Notifications"
          badge={o.notifications.unread}
          onPress={() => router.push('/business-console/alerts')}
        />
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
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
            list.map((review) => <ReviewCard key={review.id} review={review} onReply={() => startReply(review)} />)
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
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  author: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  date: { fontFamily: fonts.regular, fontSize: 12, color: c.faint },
  content: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.body },
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
