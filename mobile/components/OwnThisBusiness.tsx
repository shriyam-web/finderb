import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { SITE_URL } from '../lib/supabase';
import { getStoredToken } from '../lib/session';

export function OwnThisBusiness({
  businessId,
  businessName,
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  businessId: string;
  businessName: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName || '');
  const [email, setEmail] = useState(defaultEmail || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getStoredToken();
        if (!token) return;
        const res = await fetch(
          `${SITE_URL}/api/ownership-request?businessId=${encodeURIComponent(businessId)}`,
          { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
        );
        const data = (await res.json()) as { pending?: boolean };
        if (!cancelled && data.pending) setPending(true);
      } catch {
        // The button stays available if the status check cannot reach the server.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const token = await getStoredToken();
      const res = await fetch(`${SITE_URL}/api/ownership-request`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ businessId, name, email, phone }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; alreadyPending?: boolean };
      if (!data.success) {
        setError(data.error || 'Could not submit the request.');
        return;
      }
      setPending(true);
      setMessage(data.alreadyPending ? 'You already have a request waiting.' : 'Request sent. FinderB will review it.');
      setOpen(false);
    } catch {
      setError('Could not submit the request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: colors.ink }}>Own this business?</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSoft }}>
        If you run {businessName}, request owner access.
      </Text>
      {message ? <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: '#047857' }}>{message}</Text> : null}
      {open ? (
        <View style={{ gap: 8 }}>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textSoft} style={inputStyle(colors.ink)} />
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textSoft} style={inputStyle(colors.ink)} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Mobile" keyboardType="phone-pad" placeholderTextColor={colors.textSoft} style={inputStyle(colors.ink)} />
          {error ? <Text style={{ color: '#B42318', fontFamily: fonts.regular, fontSize: 12 }}>{error}</Text> : null}
          <Pressable onPress={() => void submit()} disabled={busy} style={{ alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
            <Text style={{ color: colors.white, fontFamily: fonts.semiBold, fontSize: 13 }}>{busy ? 'Sending…' : 'Submit request'}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          disabled={pending}
          style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, opacity: pending ? 0.5 : 1 }}
        >
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink }}>
            {pending ? 'Request sent' : 'Request access'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function inputStyle(color: string) {
  return {
    borderWidth: 1,
    borderColor: 'rgba(24,24,27,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color,
  };
}
