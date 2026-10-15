import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
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
import { listingDetailRows } from '../../../components/console/listingSections';

function ListingBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { refresh, refreshing } = useMerchantConsole();
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
            onPress={() => router.push({ pathname: '/(tabs)/merchant/[id]', params: { id: o.business.id, preview: '1' } })}
          />
        </ConsoleHeaderActions>
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <Panel>
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
        {o.stats.competitorAverage != null ? (
          <Text style={styles.meterNote}>
            Your competitors have an average profile completion score of {o.stats.competitorAverage}%. Try improving
            your score to perform good.
          </Text>
        ) : null}
        {o.stats.averageResponse ? (
          <Text style={styles.meterNote}>Your average response time on leads so far is {o.stats.averageResponse}.</Text>
        ) : null}
        <View style={styles.actions}>
          <Btn
            small
            tone="outline"
            icon="eye-outline"
            label="Preview"
            onPress={() => router.push({ pathname: '/(tabs)/merchant/[id]', params: { id: o.business.id, preview: '1' } })}
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
              accessibilityLabel={`${row.label}, ${row.value}`}
            >
              <View style={styles.flex}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{row.label}</Text>
                  {row.verified ? (
                    <Ionicons name="shield-checkmark" size={16} color="#059669" accessibilityLabel="Verified" />
                  ) : null}
                  {row.missing ? <Tag label="Add" tone="warning" /> : null}
                </View>
                <Text style={styles.sectionSummary} numberOfLines={3}>
                  {row.value}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.faint} />
            </Pressable>
          ))}
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
    </ConsolePage>
  );
}

export default function ListingScreen() {
  return <ConsoleGate>{(overview) => <ListingBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  meterHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  meterLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  meterValue: { marginTop: 2, fontFamily: fonts.semiBold, fontSize: 28, color: c.ink },
  meter: { marginTop: 12, height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
  meterNote: { marginTop: 10, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.body },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  photos: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
  },
  strip: { flexDirection: 'row', gap: 8 },
  thumbWrap: { flex: 1, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: c.sunken },
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
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  sectionSummary: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: c.muted },
}));
