import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure } from '../../lib/merchantConsoleApi';
import { Chip } from './kit';

const MAX_SUBCATEGORIES = 5;

export function AlsoServesPicker({
  run,
  notify,
}: {
  run: ReturnType<typeof useMerchantConsole>['run'];
  notify: ReturnType<typeof useMerchantConsole>['notify'];
}) {
  const c = useConsoleColors();
  const [primary, setPrimary] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void run<{ success: true; state: { primary: string; selected: string[]; options: string[] } }>('alsoServes').then((result) => {
      if (!isFailure(result) && 'state' in result) {
        setPrimary(result.state.primary);
        setOptions(result.state.options);
        setSelected(result.state.selected);
      }
      setReady(true);
    });
  }, [run]);

  const toggle = async (leaf: string) => {
    const has = selected.some((item) => item.toLowerCase() === leaf.toLowerCase());
    if (!has && selected.length >= MAX_SUBCATEGORIES - 1) {
      notify(`You can list up to ${MAX_SUBCATEGORIES} subcategories in this category, including the one you already have.`, 'bad');
      return;
    }
    const next = has ? selected.filter((item) => item.toLowerCase() !== leaf.toLowerCase()) : [...selected, leaf];
    setBusy(true);
    const result = await run('saveAlsoServes', { leaves: next });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setSelected(next);
    notify('Extra categories saved');
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted }}>
        {!ready
          ? 'Loading the other subcategories in your category.'
          : primary
            ? `${primary} stays your category. Add other subcategories in that same category, up to ${MAX_SUBCATEGORIES} in total.`
            : 'Extra subcategories could not be loaded. Close this and open it again.'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((leaf) => {
          const active = selected.some((item) => item.toLowerCase() === leaf.toLowerCase());
          return (
            <Chip
              key={leaf}
              label={leaf}
              active={active}
              icon={active ? 'checkmark' : undefined}
              onPress={() => {
                if (!busy) void toggle(leaf);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
