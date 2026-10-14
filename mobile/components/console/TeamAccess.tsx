import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure } from '../../lib/merchantConsoleApi';
import { Btn, Field, Panel, Section, Tag, createConsoleStyles } from './kit';

type Member = {
  id: string;
  email: string | null;
  mobile: string | null;
  status: 'pending' | 'active' | 'revoked';
};

export function TeamAccess() {
  const styles = useStyles();
  const c = useConsoleColors();
  const { run, notify } = useMerchantConsole();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await run<{ success: true; members: Member[] }>('listTeam');
    if (!isFailure(result)) setMembers(result.members || []);
  }, [run]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async () => {
    setBusy(true);
    const result = await run<{ success: true; warning?: string }>('inviteTeam', { email, mobile });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setEmail('');
    setMobile('');
    notify(result.warning || 'Invite sent. They stay pending until they set a password.');
    await load();
  };

  const resend = async (memberId: string) => {
    setBusy(true);
    const result = await run<{ success: true; warning?: string }>('resendTeam', { memberId });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    notify(result.warning || 'Invite sent again.');
    await load();
  };

  const revoke = (member: Member) => {
    Alert.alert('Remove access?', 'They will no longer be able to sign in to this business.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const result = await run('revokeTeam', { memberId: member.id });
          if (isFailure(result)) {
            notify(result.error, 'bad');
            return;
          }
          await load();
        },
      },
    ]);
  };

  return (
    <Section title="Team access">
      <Panel>
        <Text style={styles.hint}>
          Invite extra emails or mobile numbers. They must open the invite and create a password before they can sign in.
        </Text>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
        <Btn label="Send invite" busy={busy} onPress={() => void invite()} />
      </Panel>
      {members.length ? (
        <Panel flush>
          {members.map((member, index) => (
            <View key={member.id} style={[styles.row, index > 0 && styles.line]}>
              <View style={styles.flex}>
                <Text style={styles.name}>
                  {[member.email, member.mobile ? `+91 ${member.mobile}` : ''].filter(Boolean).join(' · ')}
                </Text>
                <Tag
                  label={member.status === 'active' ? 'Active' : 'Pending invite'}
                  tone={member.status === 'active' ? 'success' : 'warning'}
                />
              </View>
              {member.status === 'pending' ? (
                <Pressable onPress={() => void resend(member.id)} hitSlop={8}>
                  <Text style={[styles.link, { color: c.accent }]}>Resend</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => revoke(member)} hitSlop={8}>
                <Text style={[styles.link, { color: c.danger }]}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </Panel>
      ) : null}
    </Section>
  );
}

const useStyles = createConsoleStyles((c) => ({
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  line: { borderTopWidth: 0.5, borderTopColor: c.line },
  flex: { flex: 1, minWidth: 0, gap: 6 },
  name: { fontFamily: fonts.medium, fontSize: 14, color: c.ink },
  link: { fontFamily: fonts.semiBold, fontSize: 13 },
}));
