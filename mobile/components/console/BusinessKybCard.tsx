import { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure, type ConsoleOverview } from '../../lib/merchantConsoleApi';
import { Btn, Field, Panel, Tag, createConsoleStyles } from './kit';

type CheckKind = 'pan' | 'udyam' | 'gstin';

const CHECKS: { id: CheckKind; label: string; placeholder: string }[] = [
  { id: 'pan', label: 'PAN', placeholder: 'ABCDE1234F' },
  { id: 'udyam', label: 'Udyam', placeholder: 'UDYAM-UP-43-1234567' },
  { id: 'gstin', label: 'GSTIN', placeholder: '22AAAAA0000A1Z5' },
];

function isVerified(status: string | null | undefined) {
  return /verified|approved/i.test(status || '');
}

export function BusinessKybCard({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { run, refresh } = useMerchantConsole();
  const business = o.business;
  const done = isVerified(business.kycStatus);
  const failed = /rejected|revoked/i.test(business.kycStatus || '');
  const [method, setMethod] = useState<CheckKind>('pan');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const isOwner = o.actor?.isOwner !== false;
  const selected = CHECKS.find((check) => check.id === method) || CHECKS[0];

  async function submit() {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError('');
    setNote('');
    const result = await run<{ success: true; message: string }>('verifyKyb', { method, value });
    setBusy(false);
    if (isFailure(result)) {
      setError(result.error);
      await refresh();
      return;
    }
    setValue('');
    setNote(result.message);
    await refresh();
  }

  return (
    <Panel style={styles.kyc}>
      <View style={styles.kycHead}>
        <Ionicons name={done ? 'shield-checkmark' : 'shield-outline'} size={20} color={c.accent} />
        <Text style={styles.kycTitle}>Business verification</Text>
        <Tag
          label={done ? 'Verified' : failed ? 'Try again' : 'Not started'}
          tone={done ? 'success' : failed ? 'warning' : 'neutral'}
        />
      </View>
      <Text style={styles.kycBody}>{o.kycMessage}</Text>
      {business.kycLegalName ? <Text style={styles.meta}>Registered name: {business.kycLegalName}</Text> : null}
      {business.panMasked ? <Text style={styles.meta}>PAN {business.panMasked}</Text> : null}
      {business.udyamNumber ? <Text style={styles.meta}>Udyam {business.udyamNumber}</Text> : null}
      {business.gstin ? (
        <Text style={styles.meta}>
          GSTIN {business.gstin}
          {business.gstStatus ? ` · ${business.gstStatus}` : ''}
        </Text>
      ) : null}
      {isOwner ? (
        <>
          <View style={styles.choices}>
            {CHECKS.map((check) => {
              const active = method === check.id;
              return (
                <Btn
                  key={check.id}
                  small
                  tone={active ? 'primary' : 'outline'}
                  label={check.label}
                  onPress={() => {
                    setMethod(check.id);
                    setError('');
                  }}
                />
              );
            })}
          </View>
          <Field
            label={selected.label}
            value={value}
            onChangeText={(next) => setValue(next.toUpperCase())}
            placeholder={selected.placeholder}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!busy}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <Btn
            label={method === 'gstin' ? 'Save GSTIN' : 'Verify business'}
            onPress={() => void submit()}
            busy={busy}
            disabled={!value.trim()}
          />
        </>
      ) : (
        <Text style={styles.kycBody}>Only the business owner can run this check.</Text>
      )}
    </Panel>
  );
}

const useStyles = createConsoleStyles((c) => ({
  kyc: { gap: 10 },
  kycHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kycTitle: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  kycBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.muted },
  meta: { fontFamily: fonts.medium, fontSize: 13, color: c.ink },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.danger },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.success },
}));
