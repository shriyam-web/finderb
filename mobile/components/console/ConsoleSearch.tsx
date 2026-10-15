import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import type { ConsoleOverview } from '../../lib/merchantConsoleApi';
import { openConsolePath } from '../../lib/consoleNav';
import { searchConsole, type ConsoleSearchHit } from '../../lib/consoleSearch';
import { createConsoleStyles } from './kit';

export function useConsoleSearch(overview: ConsoleOverview) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const hits = useMemo(() => searchConsole(query, overview), [query, overview]);

  const close = () => {
    setOpen(false);
    Keyboard.dismiss();
  };

  const pick = (href: Href) => {
    setQuery('');
    setOpen(false);
    Keyboard.dismiss();
    openConsolePath(router, href);
  };

  return {
    open,
    input: (
      <ConsoleSearchField
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onSubmit={() => {
          if (hits[0]) pick(hits[0].href);
        }}
      />
    ),
    overlay: open ? (
      <ConsoleSearchOverlay
        query={query}
        hits={hits}
        onClose={close}
        onPick={pick}
      />
    ) : null,
  };
}

function ConsoleSearchField({
  value,
  onChange,
  onFocus,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onSubmit: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  return (
    <View style={styles.field}>
      <Ionicons name="search-outline" size={16} color={c.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onSubmitEditing={onSubmit}
        placeholder="Search"
        placeholderTextColor={c.faint}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        underlineColorAndroid="transparent"
        accessibilityLabel="Search FinderB Business"
        style={styles.input}
      />
      {value ? (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={16} color={c.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ConsoleSearchOverlay({
  query,
  hits,
  onClose,
  onPick,
}: {
  query: string;
  hits: ConsoleSearchHit[];
  onClose: () => void;
  onPick: (href: Href) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  let lastGroup = '';
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close search" />
      <View style={styles.sheet}>
        <Text style={styles.hint}>{query.trim() ? 'Results' : 'Jump to'}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
          {hits.length ? (
            hits.map((hit) => {
              const showGroup = hit.group !== lastGroup;
              lastGroup = hit.group;
              return (
                <View key={hit.id}>
                  {showGroup ? <Text style={styles.group}>{hit.group}</Text> : null}
                  <Pressable
                    onPress={() => onPick(hit.href)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={hit.title}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons name={hit.icon} size={18} color={c.primary} />
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.title} numberOfLines={1}>
                        {hit.title}
                      </Text>
                      {hit.subtitle ? (
                        <Text style={styles.sub} numberOfLines={1}>
                          {hit.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.faint} />
                  </Pressable>
                </View>
              );
            })
          ) : (
            <Text style={styles.empty}>Nothing matches “{query.trim()}”.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  field: {
    flexGrow: 0,
    flexShrink: 1,
    width: 168,
    maxWidth: 168,
    minWidth: 112,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: c.ink,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.scrim,
  },
  sheet: {
    marginHorizontal: 10,
    marginTop: 8,
    maxHeight: '72%',
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
    overflow: 'hidden',
    paddingBottom: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  hint: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  group: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: c.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowPressed: { backgroundColor: c.sunken },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  sub: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  empty: {
    paddingHorizontal: 14,
    paddingVertical: 18,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: c.muted,
  },
}));
