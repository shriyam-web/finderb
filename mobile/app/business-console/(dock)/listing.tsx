import { useState } from 'react';
import { Modal, Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import type { ConsoleOverview } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import {
  Btn,
  ConsoleHeaderActions,
  ConsolePage,
  HeaderIcon,
  PUBLIC_SITE,
  Panel,
  Row,
  Section,
  Tag,
  createConsoleStyles,
  useTabBack,
} from '../../../components/console/kit';
import { listingDetailGaps, listingDetailRows } from '../../../components/console/listingSections';
import { askStorefrontPreview } from '../../../lib/consoleNav';
import { isFailure } from '../../../lib/merchantConsoleApi';

function ListingBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { refresh, refreshing, notify, run } = useMerchantConsole();
  const [copiedId, setCopiedId] = useState(false);
  const [hideStep, setHideStep] = useState<0 | 1 | 2>(0);
  const [hideBusy, setHideBusy] = useState(false);
  const isOwner = o.actor?.isOwner !== false;
  const merchantId = o.business.registrationNumber || '';
  const deletionAt = o.business.deletionScheduledAt;
  const pct = o.completion.percent;
  const publicUrl = `${PUBLIC_SITE}${o.business.profilePath}`;
  const photoCount = o.photos.images.length;
  const missing = o.completion.missing.length;

  const share = () =>
    void Share.share({
      message: `${o.business.name} is on FinderB. See our timings, photos and reviews: ${publicUrl}`,
    });

  return (
    <ConsolePage
      title="My listing"
      subtitle="What customers see on FinderB"
      onBack={back}
      right={
        <ConsoleHeaderActions>
          <HeaderIcon
            icon="eye-outline"
            label="Preview storefront"
            onPress={() => askStorefrontPreview(router, o.business.id)}
          />
        </ConsoleHeaderActions>
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <Panel style={styles.compactPanel}>
        <View style={styles.meterHead}>
          <View style={styles.flex}>
            <Text style={styles.meterLabel}>Profile completion</Text>
            <Text style={styles.meterValue}>{pct}%</Text>
          </View>
          <Tag
            label={o.business.isLive ? 'Live' : o.business.statusLabel || 'In review'}
            tone={o.business.isLive ? 'success' : 'warning'}
            icon={o.business.isLive ? 'radio-button-on' : 'time-outline'}
          />
        </View>
        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${Math.max(3, pct)}%` }]} />
        </View>
        <Text style={styles.meterNote}>
          {pct >= 100
            ? 'Your profile is complete. Keep photos and timings up to date.'
            : `${missing} detail${missing === 1 ? '' : 's'} missing. Complete profiles get more calls.`}
        </Text>
        <View style={styles.actions}>
          <Btn
            small
            tone="outline"
            icon="eye-outline"
            label="Preview"
            onPress={() => askStorefrontPreview(router, o.business.id)}
            style={styles.flex}
          />
          <Btn
            small
            tone="outline"
            icon="share-social-outline"
            label="Share"
            onPress={share}
            disabled={!o.business.isLive}
            style={styles.flex}
          />
        </View>
      </Panel>

      <Section title="Photos" action="Manage" onAction={() => router.push('/business-console/photos')}>
        <Pressable
          onPress={() => router.push('/business-console/photos')}
          style={({ pressed }) => [styles.photos, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Photos, ${photoCount} uploaded`}
        >
          {photoCount ? (
            <View style={styles.strip}>
              {o.photos.images.slice(0, 4).map((uri, index) => (
                <View key={uri} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} contentFit="cover" alt={`Photo ${index + 1}`} />
                  {index === 3 && photoCount > 4 ? (
                    <View style={styles.more}>
                      <Text style={styles.moreText}>+{photoCount - 4}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noPhotos}>
              <Ionicons name="camera-outline" size={22} color={c.danger} />
              <View style={styles.flex}>
                <Text style={styles.noPhotosTitle}>Add your first photo</Text>
                <Text style={styles.noPhotosBody}>Your listing stays hidden until it has at least one photo.</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Section>

      <Section title="Business details">
        <Panel flush>
          {listingDetailRows(o).map((row, index) => (
            <Pressable
              key={row.label}
              onPress={() => router.push({ pathname: '/business-console/edit', params: { section: row.section } })}
              style={({ pressed }) => [styles.section, index > 0 && styles.sectionLine, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${row.label}, ${row.tags?.length ? row.tags.join(', ') : row.value}`}
            >
              <View style={styles.flex}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{row.label}</Text>
                  {row.verified ? (
                    <Ionicons name="shield-checkmark" size={16} color="#059669" accessibilityLabel="Verified" />
                  ) : row.verified === false && row.value !== 'Not set' ? (
                    <View style={styles.unverifiedMark} accessibilityLabel="Not verified">
                      <Ionicons name="shield" size={16} color="#E11D48" />
                      <Ionicons name="close" size={9} color="#FFFFFF" style={styles.unverifiedX} />
                    </View>
                  ) : null}
                  {row.missing ? <Tag label="Add" tone="warning" /> : null}
                </View>
                {row.tags ? (
                  row.tags.length ? (
                    <View style={styles.tagWrap}>
                      {row.tags.map((tag) => (
                        <View key={tag} style={styles.chip}>
                          <Text style={styles.chipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.sectionSummary}>Not set</Text>
                  )
                ) : (
                  <Text style={styles.sectionSummary} numberOfLines={3}>
                    {row.value}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.faint} />
            </Pressable>
          ))}
          <View style={[styles.section, styles.sectionLine]}>
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>Merchant ID</Text>
              <Text style={styles.sectionSummary} selectable>
                {merchantId || 'Not generated'}
              </Text>
            </View>
            {merchantId ? (
              <Pressable
                onPress={() => {
                  void Clipboard.setStringAsync(merchantId).then(() => {
                    setCopiedId(true);
                    notify('Merchant ID copied');
                    setTimeout(() => setCopiedId(false), 1800);
                  });
                }}
                style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Copy merchant ID"
              >
                <Ionicons name={copiedId ? 'checkmark' : 'copy-outline'} size={16} color={c.ink} />
                <Text style={styles.copyText}>{copiedId ? 'Copied' : 'Copy'}</Text>
              </Pressable>
            ) : null}
          </View>
        </Panel>
      </Section>

      <Section title="Hiring">
        <Panel flush>
          <Row
            icon="briefcase-outline"
            label="Job posts"
            value={o.stats.activeJobs ? `${o.stats.activeJobs} open on your storefront` : 'Hire through your FinderB page'}
            onPress={() => router.push('/business-console/jobs')}
            last
          />
        </Panel>
      </Section>

      <Section title="Needs FinderB approval">
        <Panel flush>
          <Row
            icon="pricetag-outline"
            label="Category"
            value={o.business.category || 'Not set'}
            onPress={() => router.push('/business-console/account')}
          />
          <Row
            icon="document-text-outline"
            label="Legal business name"
            value={o.business.legalName || 'Not set'}
            onPress={() => router.push('/business-console/account')}
          />
          <Row
            icon="storefront-outline"
            label="Display name"
            value={o.profile.displayName || o.business.name || 'Not set'}
            onPress={() => router.push('/business-console/account')}
            last
          />
        </Panel>
      </Section>

      {isOwner ? (
        <Section title="Delete account">
          <Panel>
            {deletionAt ? (
              <>
                <Text style={styles.deleteHint}>
                  Your public page is down. This account will be completely deleted on{' '}
                  {new Date(deletionAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  . Log in before then to cancel.
                </Text>
                <Btn
                  label={hideBusy ? 'Cancelling…' : 'Cancel deletion'}
                  busy={hideBusy}
                  onPress={() => {
                    void (async () => {
                      setHideBusy(true);
                      const result = await run<{ success: true; message?: string }>('cancelDeletion');
                      setHideBusy(false);
                      if (isFailure(result)) {
                        notify(result.error, 'bad');
                        return;
                      }
                      notify(result.message || 'Deletion cancelled. Your listing can go live again.');
                      void refresh();
                    })();
                  }}
                />
              </>
            ) : (
              <>
                <Text style={styles.deleteHint}>
                  This will take your public page down. The account will be completely deleted after 90 days. Until then you can log in to cancel the deletion.
                </Text>
                <Btn label="Delete my business" tone="outline" onPress={() => setHideStep(1)} />
              </>
            )}
          </Panel>
        </Section>
      ) : null}

      <Modal visible={hideStep > 0} transparent animationType="fade" onRequestClose={() => !hideBusy && setHideStep(0)}>
        <Pressable style={styles.hideScrim} onPress={() => !hideBusy && setHideStep(0)}>
          <Pressable style={styles.hideCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.hideTitle}>
              {hideStep === 1 ? 'Delete this business?' : 'Confirm 90-day deletion'}
            </Text>
            <Text style={styles.hideBody}>
              {hideStep === 1
                ? 'This will take your public page down. The account will be completely deleted after 90 days. Until then you can log in to cancel the deletion.'
                : 'Customers will stop seeing your page now. After 90 days the account is removed for good. Log in before then if you want to cancel.'}
            </Text>
            <View style={styles.hideActions}>
              <Pressable disabled={hideBusy} onPress={() => setHideStep(hideStep === 2 ? 1 : 0)} style={styles.hideCancel}>
                <Text style={styles.hideCancelText}>{hideStep === 2 ? 'Go back' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                disabled={hideBusy}
                onPress={() => {
                  if (hideStep === 1) {
                    setHideStep(2);
                    return;
                  }
                  void (async () => {
                    setHideBusy(true);
                    const result = await run<{ success: true; message?: string }>('hideBusiness');
                    setHideBusy(false);
                    if (isFailure(result)) {
                      notify(result.error, 'bad');
                      return;
                    }
                    setHideStep(0);
                    notify(result.message || 'Your public page is down. You have 90 days to cancel.');
                    void refresh();
                  })();
                }}
                style={styles.hideConfirm}
              >
                <Text style={styles.hideConfirmText}>
                  {hideBusy ? 'Scheduling…' : hideStep === 1 ? 'Continue' : 'Yes, delete after 90 days'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConsolePage>
  );
}

export default function ListingScreen() {
  return <ConsoleGate>{(overview) => <ListingBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  compactPanel: { paddingVertical: 10, paddingHorizontal: 12 },
  meterHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meterLabel: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  meterValue: { marginTop: 0, fontFamily: fonts.semiBold, fontSize: 20, color: c.ink },
  meter: { marginTop: 8, height: 5, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  meterFill: { height: 5, borderRadius: 3, backgroundColor: c.primary },
  meterNote: { marginTop: 6, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.body },
  insightCard: { marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  insightText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.lineStrong,
    backgroundColor: c.sunken,
  },
  copyText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.ink },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  photos: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
  },
  strip: { flexDirection: 'row', gap: 6 },
  thumbWrap: { flex: 1, height: 62, borderRadius: 8, overflow: 'hidden', backgroundColor: c.sunken },
  thumb: { width: '100%', height: '100%' },
  more: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,24,40,0.55)',
  },
  moreText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#FFFFFF' },
  noPhotos: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 4 },
  noPhotosTitle: { fontFamily: fonts.semiBold, fontSize: 14.5, color: c.ink },
  noPhotosBody: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.muted },
  section: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  sectionLine: { borderTopWidth: 0.5, borderTopColor: c.line },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  sectionIconGap: { backgroundColor: c.warningSoft },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unverifiedMark: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  unverifiedX: { position: 'absolute' },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  sectionSummary: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: c.sunken,
    borderWidth: 1,
    borderColor: c.line,
  },
  chipText: { fontFamily: fonts.semiBold, fontSize: 12, color: c.ink },
  deleteHint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.muted, marginBottom: 12 },
  hideScrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(24,24,27,0.45)',
  },
  hideCard: {
    borderRadius: 16,
    backgroundColor: c.card,
    padding: 18,
    gap: 10,
  },
  hideTitle: { fontFamily: fonts.semiBold, fontSize: 17, color: c.ink },
  hideBody: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20, color: c.body },
  hideActions: { marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  hideCancel: { height: 40, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
  hideCancelText: { fontFamily: fonts.semiBold, fontSize: 14, color: c.muted },
  hideConfirm: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: c.isDark ? '#B91C1C' : c.danger,
  },
  hideConfirmText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
}));
