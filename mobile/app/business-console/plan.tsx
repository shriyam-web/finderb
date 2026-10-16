import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import {
  isFailure,
  type CheckoutStart,
  type SubscriptionDetails,
  type SubscriptionStatus,
} from '../../lib/merchantConsoleApi';
import { RazorpayCheckout, type CheckoutSuccess } from '../../components/console/RazorpayCheckout';
import { ViewsChart } from '../../components/console/ViewsChart';
import {
  Btn,
  ConsoleHeaderActions,
  ConsolePage,
  Empty,
  HeaderIcon,
  Panel,
  Section,
  Sheet,
  Tag,
  createConsoleStyles,
  inr,
  shortDate,
} from '../../components/console/kit';

type Cycle = 'monthly' | 'annual';

function CurrentPlan({ sub }: { sub: SubscriptionStatus }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const total = sub.billingCycle === 'monthly' ? 30 : 365;
  const left = Math.max(0, sub.daysRemaining ?? 0);
  const ratio = sub.isActive ? Math.min(1, left / total) : 0;
  const headline = sub.isActive ? sub.planName : sub.isExpired && sub.lastPlanName ? `${sub.lastPlanName} (expired)` : 'Free plan';
  const line = sub.isPendingPayment
    ? 'Payment received by the bank. Waiting for confirmation.'
    : sub.isActive
      ? `${sub.billingCycle === 'monthly' ? 'Monthly, auto-debit' : 'Yearly, paid once'}${sub.expiresAtDisplay ? ` · valid till ${sub.expiresAtDisplay}` : ''}`
      : 'Free listing. Lead phone numbers and emails stay hidden.';

  return (
    <Panel>
      <View style={styles.currentTop}>
        <Text style={styles.currentLabel}>Current plan</Text>
        {sub.isActive ? (
          <Tag label="Active" tone="success" icon="checkmark-circle" />
        ) : sub.isPendingPayment ? (
          <Tag label="Confirming" tone="info" icon="time-outline" />
        ) : (
          <Tag label={sub.isExpired ? 'Expired' : 'Free'} tone={sub.isExpired ? 'danger' : 'neutral'} />
        )}
      </View>
      <Text style={styles.currentName}>{headline}</Text>
      <Text style={styles.currentLine}>{line}</Text>
      {sub.isActive && sub.daysRemaining !== null ? (
        <>
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${Math.max(3, ratio * 100)}%` }]} />
          </View>
          <Text style={styles.meterText}>
            {left} day{left === 1 ? '' : 's'} left
            {sub.isMonthlyMandate
              ? sub.autoRenewEnabled
                ? ' · renews automatically'
                : sub.mandateRevokePending
                  ? ' · auto-renew being cancelled'
                  : ' · auto-renew off'
              : ''}
          </Text>
        </>
      ) : null}
      {sub.alertLevel === 'urgent' || sub.alertLevel === 'expired' ? (
        <View style={styles.alert}>
          <Ionicons name="alert-circle-outline" size={16} color={c.danger} />
          <Text style={styles.alertText}>
            {sub.alertLevel === 'expired' ? 'Renew to see your leads’ phone numbers again.' : 'Ending soon. Renew to avoid a gap.'}
          </Text>
        </View>
      ) : null}
    </Panel>
  );
}

function PlanOption({
  cycle,
  selected,
  current,
  name,
  price,
  retail,
  perMonth,
  onPress,
}: {
  cycle: Cycle;
  selected: boolean;
  current: boolean;
  name: string;
  price: number;
  retail: number;
  perMonth?: number;
  onPress: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name}, ${inr(price)} ${cycle === 'monthly' ? 'per month' : 'per year'}`}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.flex}>
        <View style={styles.optionHead}>
          <Text style={styles.optionName}>{name}</Text>
          {cycle === 'annual' ? <Tag label="Best value" tone="info" /> : null}
          {current ? <Tag label="Current" tone="success" /> : null}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{inr(price)}</Text>
          <Text style={styles.per}>{cycle === 'monthly' ? '/month' : '/year'}</Text>
          {retail > price ? <Text style={styles.retail}>{inr(retail)}</Text> : null}
        </View>
        <Text style={styles.optionNote}>
          {cycle === 'monthly'
            ? 'Auto-debit every month via UPI or card. Cancel anytime.'
            : `Pay once for 12 months${perMonth ? `, just ${inr(perMonth)}/month` : ''}. No auto-debit.`}
        </Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={c.isDark ? '#60A5FA' : '#2563EB'} /> : null}
    </Pressable>
  );
}

function CompareCell({ value }: { value: boolean | string }) {
  const styles = useStyles();
  const c = useConsoleColors();
  if (value === true) return <Ionicons name="checkmark-circle" size={18} color={c.success} />;
  if (value === false) return <Ionicons name="remove" size={18} color={c.faint} />;
  return <Text style={styles.compareText}>{value}</Text>;
}

export function PlanBody({ docked = false }: { docked?: boolean }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { run, notify, refresh, overview } = useMerchantConsole();
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [error, setError] = useState('');
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [starting, setStarting] = useState(false);
  const [checkout, setCheckout] = useState<{ start: CheckoutStart; cycle: Cycle } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [paid, setPaid] = useState<SubscriptionStatus | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyCount, setHistoryCount] = useState(10);

  const load = useCallback(async () => {
    const result = await run<SubscriptionDetails>('subscription');
    if (isFailure(result)) {
      setError(result.error);
      return;
    }
    setError('');
    setDetails(result);
    setCycle((current) => current ?? 'annual');
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sub = details?.subscription;
  const pricing = details?.pricing;
  const chosen: Cycle = cycle ?? 'annual';
  const onThis = Boolean(sub?.isActive && sub.billingCycle === chosen);
  const blocked = onThis && !sub?.canRenew;
  const amount = pricing ? (chosen === 'annual' ? pricing.annual.price : pricing.monthly.price) : 0;
  const planName = pricing ? (chosen === 'annual' ? pricing.annual.name : pricing.monthly.name) : '';

  const ctaLabel = !pricing
    ? 'Loading…'
    : !pricing.checkoutAvailable
      ? 'Online payment unavailable'
      : blocked
        ? `You’re on ${planName}`
        : chosen === 'annual'
          ? `${onThis ? 'Renew' : 'Pay'} ${inr(amount)} for ${planName}`
          : `${onThis ? 'Renew' : 'Start'} ${planName} at ${inr(amount)}/month`;

  const begin = async (override?: Cycle) => {
    const next = override ?? chosen;
    const samePlan = Boolean(sub?.isActive && sub.billingCycle === next);
    if (!pricing || (samePlan && !sub?.canRenew)) return;
    setStarting(true);
    const result = await run<CheckoutStart>('startCheckout', { billingCycle: next });
    setStarting(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setCheckout({ start: result, cycle: next });
  };

  const finish = async (payment: CheckoutSuccess) => {
    const used = checkout;
    setCheckout(null);
    if (!used) return;
    setVerifying(true);
    const result = await run<SubscriptionDetails>('completeCheckout', {
      billingCycle: used.cycle,
      razorpayOrderId: payment.razorpay_order_id,
      razorpaySubscriptionId: payment.razorpay_subscription_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      razorpaySignature: payment.razorpay_signature,
    });
    setVerifying(false);
    if (isFailure(result)) {
      Alert.alert(
        'Payment received, confirming',
        `${result.error}\n\nIf money was debited, your plan switches on automatically within a few minutes. Payment ID: ${payment.razorpay_payment_id}`,
      );
      void load();
      void refresh();
      return;
    }
    setDetails(result);
    setPaid(result.subscription);
    void refresh();
  };

  const cancelAutoRenew = () =>
    Alert.alert(
      'Turn off auto-renew?',
      `Your ${sub?.planName || 'plan'} stays active till ${sub?.expiresAtDisplay || 'the end of this cycle'}. After that, lead contacts are hidden until you pay again.`,
      [
        { text: 'Keep auto-renew', style: 'cancel' },
        {
          text: 'Turn off',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const result = await run<SubscriptionDetails>('cancelAutoRenew');
            setCancelling(false);
            if (isFailure(result)) {
              notify(result.error, 'bad');
              return;
            }
            setDetails(result);
            notify(result.message || 'Auto-renew turned off');
            void refresh();
          },
        },
      ],
    );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ConsolePage
      title="Plan & billing"
      subtitle={sub ? (sub.isActive ? `${sub.planName} plan` : 'Free plan') : undefined}
      docked={docked}
      right={
        docked ? (
          <ConsoleHeaderActions>
            <HeaderIcon
              icon="notifications-outline"
              label="Notifications"
              badge={overview?.notifications.unread}
              onPress={() => router.push('/business-console/alerts')}
            />
          </ConsoleHeaderActions>
        ) : undefined
      }
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      footer={
        details ? (
          <Btn
            tone={blocked ? 'outline' : 'success'}
            icon={blocked ? 'checkmark-circle' : 'lock-closed-outline'}
            label={ctaLabel}
            busy={starting || verifying}
            disabled={!pricing?.checkoutAvailable || blocked}
            onPress={() => void begin()}
          />
        ) : undefined
      }
    >
      {error && !details ? (
        <Empty icon="cloud-offline-outline" title="Couldn’t load your plan" body={error} />
      ) : !details || !sub || !pricing ? (
        <ActivityIndicator style={styles.loading} color={c.primary} />
      ) : (
        <>
          <CurrentPlan sub={sub} />
          {overview ? (
            <Section title="Listing performance">
              <Panel>
                <Text style={styles.currentLabel}>Profile views · 30 days</Text>
                <Text style={styles.currentName}>{overview.stats.views30d.toLocaleString('en-IN')}</Text>
                <View style={styles.chart}>
                  <ViewsChart days={overview.stats.viewsDaily} />
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statCell}>
                    <Text style={styles.statValue}>{overview.stats.leadsTotal}</Text>
                    <Text style={styles.statLabel}>Leads</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statValue}>{overview.stats.leadsConverted}</Text>
                    <Text style={styles.statLabel}>Conversion</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statValue}>{overview.stats.reviewCount}</Text>
                    <Text style={styles.statLabel}>Reviews</Text>
                  </View>
                </View>
              </Panel>
            </Section>
          ) : null}
          {verifying ? (
            <Panel style={styles.verifying}>
              <ActivityIndicator color={c.primary} />
              <Text style={styles.verifyingText}>Confirming your payment with the bank…</Text>
            </Panel>
          ) : null}

          {sub.isActive && sub.billingCycle === 'annual' ? (
            sub.canRenew ? (
              <Section title="Renew Pro">
                <Panel>
                  <Text style={styles.currentLine}>
                    Pro stays as it is. A renewal starts after {sub.expiresAtDisplay || 'this plan ends'}, so the days you already paid are kept.
                  </Text>
                </Panel>
                <PlanOption
                  cycle="annual"
                  selected
                  current
                  name={pricing.annual.name}
                  price={pricing.annual.price}
                  retail={pricing.annual.retail}
                  perMonth={pricing.annual.perMonth}
                  onPress={() => setCycle('annual')}
                />
                <Btn
                  tone="success"
                  icon="lock-closed-outline"
                  label={ctaLabel}
                  busy={starting || verifying}
                  disabled={!pricing.checkoutAvailable}
                  onPress={() => void begin('annual')}
                />
              </Section>
            ) : null
          ) : sub.isActive && sub.billingCycle === 'monthly' ? (
            <Section title="Pro, after this plan">
              <Panel>
                <Text style={styles.currentName}>Yearly Pro</Text>
                <Text style={styles.currentLine}>
                  {inr(pricing.annual.perMonth || 0)} a month when you pay {inr(pricing.annual.price)} for the year, instead of {inr(pricing.monthly.price)} every month. The Pro year starts after {sub.expiresAtDisplay || 'Growth ends'}, so this month is not cut short.
                </Text>
              </Panel>
              <PlanOption
                cycle="annual"
                selected={chosen === 'annual'}
                current={false}
                name={pricing.annual.name}
                price={pricing.annual.price}
                retail={pricing.annual.retail}
                perMonth={pricing.annual.perMonth}
                onPress={() => setCycle('annual')}
              />
              <Btn
                tone="success"
                icon="lock-closed-outline"
                label={`Pay ${inr(pricing.annual.price)} for Pro`}
                busy={starting || verifying}
                disabled={!pricing.checkoutAvailable}
                onPress={() => void begin('annual')}
              />
              {sub.canRenew ? (
                <Btn
                  tone="outline"
                  label={`Renew Growth · ${inr(pricing.monthly.price)}/mo`}
                  busy={starting || verifying}
                  disabled={!pricing.checkoutAvailable}
                  onPress={() => void begin('monthly')}
                />
              ) : null}
            </Section>
          ) : (
          <Section title={sub.isActive ? 'Renew or switch' : 'Choose a plan'}>
            {pricing.offerName ? (
              <View style={styles.offer}>
                <Ionicons name="pricetag-outline" size={15} color={c.success} />
                <Text style={styles.offerText}>{pricing.offerName}</Text>
              </View>
            ) : null}
            <PlanOption
              cycle="annual"
              selected={chosen === 'annual'}
              current={Boolean(sub.isActive && sub.billingCycle === 'annual')}
              name={pricing.annual.name}
              price={pricing.annual.price}
              retail={pricing.annual.retail}
              perMonth={pricing.annual.perMonth}
              onPress={() => setCycle('annual')}
            />
            <PlanOption
              cycle="monthly"
              selected={chosen === 'monthly'}
              current={Boolean(sub.isActive && sub.billingCycle === 'monthly')}
              name={pricing.monthly.name}
              price={pricing.monthly.price}
              retail={pricing.monthly.retail}
              onPress={() => setCycle('monthly')}
            />
            <Btn
              tone={blocked ? 'outline' : 'success'}
              icon={blocked ? 'checkmark-circle' : 'lock-closed-outline'}
              label={ctaLabel}
              busy={starting || verifying}
              disabled={!pricing.checkoutAvailable || blocked}
              onPress={() => void begin()}
            />
          </Section>
          )}

          {!sub.isActive ? (
          <>
          <Section title="Both plans include">
            <Panel style={styles.features}>
              {pricing.features.map((feature) => (
                <View key={feature} style={styles.feature}>
                  <Ionicons name="checkmark" size={17} color={c.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </Panel>
          </Section>

          {pricing.compare.length ? (
            <Section title="Compare plans">
              <Panel flush>
                <View style={[styles.compareRow, styles.compareHead]}>
                  <Text style={[styles.compareLabel, styles.compareHeadText]}> </Text>
                  <Text style={[styles.compareCol, styles.compareHeadText]}>Free</Text>
                  <Text style={[styles.compareCol, styles.compareHeadText]}>{pricing.monthly.name}</Text>
                  <Text style={[styles.compareCol, styles.compareHeadText]}>{pricing.annual.name}</Text>
                </View>
                {pricing.compare.map((row) => (
                  <View key={row.label} style={styles.compareRow}>
                    <Text style={styles.compareLabel}>{row.label}</Text>
                    <View style={styles.compareCol}>
                      <CompareCell value={row.free} />
                    </View>
                    <View style={styles.compareCol}>
                      <CompareCell value={row.monthly} />
                    </View>
                    <View style={styles.compareCol}>
                      <CompareCell value={row.annual} />
                    </View>
                  </View>
                ))}
              </Panel>
            </Section>
          ) : null}
          </>
          ) : null}

          {sub.canCancelAutoRenew ? (
            <Btn tone="danger" icon="close-circle-outline" label="Turn off auto-renew" busy={cancelling} onPress={cancelAutoRenew} />
          ) : null}

          <Section title="Payment history">
            {details.history.length ? (
              <Panel flush>
                {details.history.slice(0, historyCount).map((item, index) => (
                  <View key={item.id} style={[styles.bill, index > 0 && styles.billLine]}>
                    <View style={styles.flex}>
                      <Text style={styles.billName}>
                        {item.planName} · {item.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                      </Text>
                      <Text style={styles.billMeta}>
                        {shortDate(item.createdAt)}
                        {item.paymentId ? ` · ${item.paymentId}` : ''}
                      </Text>
                    </View>
                    <View style={styles.billRight}>
                      <Text style={styles.billAmount}>{item.amountDisplay}</Text>
                      <Tag
                        label={item.status}
                        tone={
                          /paid|captured|completed|success|active/i.test(item.status)
                            ? 'success'
                            : /fail/i.test(item.status)
                              ? 'danger'
                              : 'neutral'
                        }
                      />
                    </View>
                  </View>
                ))}
                {historyCount < details.history.length ? (
                  <Btn
                    small
                    tone="text"
                    label={`Load more (${details.history.length - historyCount} left)`}
                    onPress={() => setHistoryCount((count) => count + 10)}
                  />
                ) : null}
              </Panel>
            ) : (
              <Text style={styles.muted}>No payments yet.</Text>
            )}
          </Section>
          <View style={styles.secure}>
            <Ionicons name="shield-checkmark-outline" size={15} color={c.faint} />
            <Text style={styles.fine}>Payments are handled by Razorpay. FinderB never sees your card details or UPI PIN.</Text>
          </View>
        </>
      )}

      <RazorpayCheckout
        key={checkout?.start.order?.id ?? checkout?.start.subscription?.id ?? 'idle'}
        start={checkout?.start ?? null}
        description={
          checkout?.cycle === 'monthly'
            ? `${pricing?.monthly.name ?? 'Growth'} — monthly auto-debit`
            : `${pricing?.annual.name ?? 'Pro'} — 12 months`
        }
        onSuccess={(payment) => void finish(payment)}
        onClose={() => setCheckout(null)}
        onFailed={(message) => {
          setCheckout(null);
          notify(message, 'bad');
          void load();
        }}
      />

      <Sheet
        visible={Boolean(paid)}
        title="Payment successful"
        onClose={() => setPaid(null)}
        footer={<Btn label="Done" onPress={() => setPaid(null)} />}
      >
        <View style={styles.success}>
          <View style={styles.successMark}>
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>You’re on {paid?.planName}</Text>
          <Text style={styles.successBody}>
            {paid?.expiresAtDisplay ? `Active till ${paid.expiresAtDisplay}. ` : ''}Lead phone numbers and emails are now
            unlocked.
          </Text>
        </View>
      </Sheet>
    </ConsolePage>
  );
}

export default function PlanScreen() {
  return <PlanBody docked />;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  loading: { marginTop: 50 },
  muted: { fontFamily: fonts.regular, fontSize: 13.5, color: c.muted },
  currentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  currentName: { marginTop: 6, fontFamily: fonts.semiBold, fontSize: 24, color: c.ink },
  currentLine: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.body },
  chart: { marginTop: 12, height: 88 },
  statRow: { marginTop: 14, flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  statLabel: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  meter: { marginTop: 14, height: 6, borderRadius: 3, backgroundColor: c.sunken, overflow: 'hidden' },
  meterFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
  meterText: { marginTop: 6, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  alert: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: c.dangerSoft,
  },
  alertText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: c.danger },
  verifying: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyingText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.successSoft,
  },
  offerText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13, color: c.success },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  optionOn: {
    borderColor: c.isDark ? '#60A5FA' : '#2563EB',
    borderWidth: 2,
    padding: 15,
    backgroundColor: c.isDark ? 'rgba(37,99,235,0.16)' : '#EFF6FF',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: c.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: { borderColor: c.isDark ? '#60A5FA' : '#2563EB' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.isDark ? '#60A5FA' : '#2563EB' },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  optionName: { fontFamily: fonts.semiBold, fontSize: 17, color: c.ink },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 },
  price: { fontFamily: fonts.semiBold, fontSize: 24, color: c.ink },
  per: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  retail: { marginLeft: 6, fontFamily: fonts.regular, fontSize: 13, color: c.faint, textDecorationLine: 'line-through' },
  optionNote: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.muted },
  features: { gap: 12 },
  feature: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  featureText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.body },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: c.line,
  },
  compareHead: { borderTopWidth: 0, backgroundColor: c.sunken },
  compareHeadText: { fontFamily: fonts.semiBold, fontSize: 12, color: c.muted, textAlign: 'center' },
  compareLabel: { flex: 1.6, fontFamily: fonts.regular, fontSize: 13, color: c.body, textAlign: 'left' },
  compareCol: { flex: 1, alignItems: 'center' },
  compareText: { fontFamily: fonts.regular, fontSize: 12, color: c.body, textAlign: 'center' },
  bill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  billLine: { borderTopWidth: 0.5, borderTopColor: c.line },
  billName: { fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  billMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  billRight: { alignItems: 'flex-end', gap: 4 },
  billAmount: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  fine: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.faint },
  success: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  successMark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12B76A',
  },
  successTitle: { fontFamily: fonts.semiBold, fontSize: 21, color: c.ink },
  successBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.muted, textAlign: 'center' },
}));
