import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { SITE_URL } from '../lib/supabase';
import { getStoredToken } from '../lib/session';

type ReportBusinessMenuProps = {
  businessId: string;
  signedIn: boolean;
  onNeedLogin: () => void;
  iconColor: string;
  buttonStyle?: object;
};

export function ReportBusinessMenu({
  businessId,
  signedIn,
  onNeedLogin,
  iconColor,
  buttonStyle,
}: ReportBusinessMenuProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const openReport = () => {
    setMenuOpen(false);
    if (!signedIn) {
      onNeedLogin();
      return;
    }
    setReason('');
    setNote('');
    setError('');
    setReportOpen(true);
  };

  const submit = async () => {
    const token = await getStoredToken();
    if (!token) {
      setReportOpen(false);
      onNeedLogin();
      return;
    }
    setSending(true);
    setError('');
    try {
      const response = await fetch(`${SITE_URL}/api/business/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId, reason }),
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !data?.success) {
        setError(data?.error || 'Could not send this report.');
        return;
      }
      setNote('Report sent. FinderB will review it.');
      setReason('');
    } catch {
      setError('Could not send this report.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Pressable
        style={buttonStyle}
        onPress={() => setMenuOpen(true)}
        accessibilityLabel="More"
        accessibilityRole="button"
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={iconColor} />
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable onPress={openReport} style={styles.menuItem}>
              <Text style={[styles.menuText, { color: colors.ink }]}>Report this business</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={reportOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReportOpen(false)}>
        <View style={[styles.sheet, { backgroundColor: colors.canvas, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.title, { color: colors.heading }]}>Report this business</Text>
            <Pressable onPress={() => setReportOpen(false)} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={[styles.copy, { color: colors.textMuted }]}>
            Tell FinderB what is wrong with this listing.
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason"
            placeholderTextColor={colors.textSoft}
            multiline
            maxLength={1000}
            style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {note ? <Text style={[styles.success, { color: colors.open }]}>{note}</Text> : null}
          <Pressable
            onPress={() => void submit()}
            disabled={sending || Boolean(note)}
            style={[styles.send, { backgroundColor: colors.ink, opacity: sending || note ? 0.5 : 1 }]}
          >
            {sending ? (
              <ActivityIndicator color={colors.onDark} />
            ) : (
              <Text style={[styles.sendText, { color: colors.onDark }]}>Send report</Text>
            )}
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,10,9,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  menu: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  copy: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    marginTop: 16,
    minHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  error: {
    marginTop: 10,
    color: '#A85A5A',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  success: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  send: {
    marginTop: 18,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
});
