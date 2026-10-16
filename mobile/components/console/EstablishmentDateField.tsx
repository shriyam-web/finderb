import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { isValidEstablishmentYear } from '../../lib/establishmentYear';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const EARLIEST_YEAR = new Date().getFullYear() - 500;

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

export function EstablishmentDateField({
  year,
  onChange,
  error,
}: {
  year: number;
  onChange: (year: number) => void;
  error?: string;
}) {
  const c = useConsoleColors();
  const min = new Date(EARLIEST_YEAR, 0, 1);
  const max = new Date();
  const initial = isValidEstablishmentYear(year) ? new Date(year, 0, 1) : max;
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(startOfMonth(initial.getFullYear(), initial.getMonth()));
  const [picked, setPicked] = useState<Date | null>(isValidEstablishmentYear(year) ? initial : null);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor.getFullYear(), cursor.getMonth());
    const lead = first.getDay();
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const items: Array<Date | null> = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= days; day += 1) items.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    return items;
  }, [cursor]);

  const label = picked
    ? picked.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Select start date';

  const shift = (delta: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    if (next < startOfMonth(min.getFullYear(), min.getMonth())) return;
    if (next > startOfMonth(max.getFullYear(), max.getMonth())) return;
    setCursor(next);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: c.muted }}>Year you started</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          minHeight: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? c.danger : c.line,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: c.card,
        }}
        accessibilityRole="button"
        accessibilityLabel="Choose the date your business started"
      >
        <Text style={{ fontFamily: fonts.regular, fontSize: 16, color: picked ? c.ink : c.faint }}>{label}</Text>
        <Ionicons name="calendar-outline" size={18} color={c.primary} />
      </Pressable>
      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: c.muted }}>
        Customers see the year. The earliest year is {EARLIEST_YEAR}.
      </Text>
      {error ? <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: c.danger }}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Pressable onPress={() => shift(-1)} hitSlop={8} accessibilityLabel="Previous month">
                <Ionicons name="chevron-back" size={20} color={c.ink} />
              </Pressable>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: c.ink }}>
                {cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => shift(1)} hitSlop={8} accessibilityLabel="Next month">
                <Ionicons name="chevron-forward" size={20} color={c.ink} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12, color: c.muted }}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {cells.map((day, index) => {
                const disabled = !day || day < min || day > max;
                const selected = Boolean(day && picked && day.toDateString() === picked.toDateString());
                return (
                  <Pressable
                    key={`${cursor.getMonth()}-${index}`}
                    disabled={disabled}
                    onPress={() => {
                      if (!day) return;
                      setPicked(day);
                      onChange(day.getFullYear());
                      setOpen(false);
                    }}
                    style={{
                      width: `${100 / 7}%`,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 20,
                      backgroundColor: selected ? c.primary : 'transparent',
                    }}
                  >
                    <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: disabled ? c.faint : selected ? c.primaryInk : c.ink }}>
                      {day ? day.getDate() : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
