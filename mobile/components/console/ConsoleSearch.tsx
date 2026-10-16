import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { consoleColors, useConsoleColors } from '../../constants/consoleColors';
import { useTheme } from '../../context/ThemeContext';
import type { ConsoleOverview } from '../../lib/merchantConsoleApi';
import { openConsolePath } from '../../lib/consoleNav';
import { searchConsole, type ConsoleSearchHit } from '../../lib/consoleSearch';

export function useConsoleSearch(
  overview: ConsoleOverview | null | undefined,
  options?: { embedQuery?: boolean },
) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const embedQuery = Boolean(options?.embedQuery);
  const hits = useMemo(
    () => (overview ? searchConsole(query, overview) : []),
    [query, overview],
  );

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
    icon: (
      <ConsoleSearchIcon
        onPress={() => {
          setOpen(true);
        }}
      />
    ),
    overlay: open ? (
      <ConsoleSearchOverlay
        query={query}
        hits={hits}
        embedQuery={embedQuery}
        onChange={(value) => setQuery(value)}
        onClose={close}
        onPick={pick}
      />
    ) : null,
  };
}

function ConsoleSearchIcon({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const c = useConsoleColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Search FinderB Business"
    >
      <Ionicons name="search-outline" size={22} color={c.ink} />
    </Pressable>
  );
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
  embedQuery,
  onChange,
  onClose,
  onPick,
}: {
  query: string;
  hits: ConsoleSearchHit[];
  embedQuery: boolean;
  onChange: (value: string) => void;
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
        {embedQuery ? (
          <View style={styles.sheetField}>
            <Ionicons name="search-outline" size={16} color={c.muted} />
            <TextInput
              value={query}
              onChangeText={onChange}
              placeholder="Search pages, listing, team…"
              placeholderTextColor={c.faint}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              underlineColorAndroid="transparent"
              accessibilityLabel="Search FinderB Business"
              onSubmitEditing={() => {
                if (hits[0]) onPick(hits[0].href);
              }}
              style={styles.sheetInput}
            />
            {query ? (
              <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={16} color={c.faint} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Text style={styles.hint}>{query.trim() ? 'Results' : 'Jump to'}</Text>
        )}
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
            <Text style={styles.empty}>
              {query.trim() ? `Nothing matches “${query.trim()}”.` : 'Type to search every screen and listing field.'}
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
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
          borderColor: consoleColors(colors).line,
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
          color: consoleColors(colors).ink,
        },
        iconBtn: {
          width: 42,
          height: 42,
          borderRadius: 21,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconBtnPressed: { backgroundColor: consoleColors(colors).sunken },
        overlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10050,
        },
        scrim: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: consoleColors(colors).scrim,
        },
        sheet: {
          marginHorizontal: 10,
          marginTop: 8,
          maxHeight: '72%',
          borderRadius: 14,
          backgroundColor: consoleColors(colors).card,
          borderWidth: 1,
          borderColor: consoleColors(colors).line,
          overflow: 'hidden',
          paddingBottom: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        },
        sheetField: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginHorizontal: 10,
          marginTop: 10,
          marginBottom: 4,
          height: 40,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: consoleColors(colors).line,
          backgroundColor: consoleColors(colors).sunken,
        },
        sheetInput: {
          flex: 1,
          minWidth: 0,
          paddingVertical: 0,
          includeFontPadding: false,
          fontFamily: fonts.regular,
          fontSize: 15,
          color: consoleColors(colors).ink,
        },
        hint: {
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 4,
          fontFamily: fonts.semiBold,
          fontSize: 12,
          color: consoleColors(colors).muted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        group: {
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: 2,
          fontFamily: fonts.medium,
          fontSize: 11,
          color: consoleColors(colors).faint,
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
        rowPressed: { backgroundColor: consoleColors(colors).sunken },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: consoleColors(colors).primarySoft,
        },
        copy: { flex: 1, minWidth: 0 },
        title: { fontFamily: fonts.semiBold, fontSize: 15, color: consoleColors(colors).ink },
        sub: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12.5, color: consoleColors(colors).muted },
        empty: {
          paddingHorizontal: 14,
          paddingVertical: 18,
          fontFamily: fonts.regular,
          fontSize: 14,
          color: consoleColors(colors).muted,
        },
      }),
    [colors],
  );
}
