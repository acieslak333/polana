import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { createEvent } from '@/services/api/events';

const EVENT_TYPES = [
  { key: 'meetup', label: 'Spotkanie', emoji: '🤝' },
  { key: 'workshop', label: 'Warsztat', emoji: '🛠️' },
  { key: 'sport', label: 'Sport', emoji: '⚽' },
  { key: 'walk', label: 'Spacer', emoji: '🚶' },
  { key: 'coffee', label: 'Kawa', emoji: '☕' },
  { key: 'picnic', label: 'Piknik', emoji: '🧺' },
  { key: 'games', label: 'Gry', emoji: '🎲' },
  { key: 'talk', label: 'Pogadanka', emoji: '💬' },
  { key: 'other', label: 'Inne', emoji: '📌' },
];

type Props = {
  gromadaId?: string | null;
  cityId: string;
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
};

function parseDateInput(input: string): string | null {
  // Accept dd.mm.yyyy HH:mm or dd.mm.yyyy (defaults to 18:00)
  const full = input.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (full) {
    const [, d, m, y, h, min] = full;
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  const dateOnly = input.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dateOnly) {
    const [, d, m, y] = dateOnly;
    const date = new Date(Number(y), Number(m) - 1, Number(d), 18, 0);
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

export function CreateEventForm({ gromadaId, cityId, onSuccess, onCancel }: Props) {
  const { user } = useAuthStore();
  const { t } = useTranslation('common');

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('meetup');
  const [locationName, setLocationName] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [description, setDescription] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(key: string) {
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  async function handleSubmit() {
    if (!user) return;
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Tytuł jest wymagany';
    if (!locationName.trim()) newErrors.location = 'Miejsce jest wymagane';
    const startsAt = parseDateInput(dateInput);
    if (!startsAt) newErrors.date = 'Format: dd.mm.rrrr gg:mm (np. 15.06.2026 18:00)';
    else if (new Date(startsAt) <= new Date()) newErrors.date = 'Data musi być w przyszłości';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const event = await createEvent({
        gromada_id: gromadaId ?? null,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location_name: locationName.trim(),
        city_id: cityId,
        starts_at: startsAt!,
        max_attendees: maxAttendees ? Number(maxAttendees) : null,
        is_public: isPublic,
        event_type: eventType,
      });
      onSuccess(event.id);
    } catch (e: any) {
      setErrors({ form: e?.message ?? 'Błąd tworzenia wydarzenia' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Input
        label="Tytuł *"
        value={title}
        onChangeText={(v) => { setTitle(v.slice(0, 100)); clearError('title'); }}
        error={errors.title}
        autoFocus
        autoCapitalize="sentences"
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Rodzaj</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {EVENT_TYPES.map((et) => (
            <Pressable
              key={et.key}
              onPress={() => setEventType(et.key)}
              style={[styles.typeChip, eventType === et.key && styles.typeChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: eventType === et.key }}
              accessibilityLabel={et.label}
            >
              <Text style={styles.typeEmoji}>{et.emoji}</Text>
              <Text style={[styles.typeLabel, eventType === et.key && styles.typeLabelActive]}>
                {et.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Input
        label="Miejsce *"
        value={locationName}
        onChangeText={(v) => { setLocationName(v.slice(0, 200)); clearError('location'); }}
        error={errors.location}
        placeholder="Park Łazienkowski, Sala 203..."
        autoCapitalize="sentences"
      />

      <Input
        label="Data i godzina *"
        value={dateInput}
        onChangeText={(v) => { setDateInput(v); clearError('date'); }}
        error={errors.date}
        placeholder="15.06.2026 18:00"
        keyboardType="numbers-and-punctuation"
        hint="Format: dd.mm.rrrr gg:mm"
      />

      <Input
        label="Opis (opcjonalnie)"
        value={description}
        onChangeText={(v) => setDescription(v.slice(0, 1000))}
        placeholder="Czego się spodziewać?"
        multiline
        numberOfLines={3}
        style={styles.descInput}
      />

      <Input
        label="Limit uczestników (opcjonalnie)"
        value={maxAttendees}
        onChangeText={(v) => setMaxAttendees(v.replace(/\D/g, ''))}
        placeholder="np. 20"
        keyboardType="number-pad"
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Widoczne dla całego miasta</Text>
          <Text style={styles.toggleHint}>Wyłącz, aby pokazać tylko Gromadzie</Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          thumbColor="#fff"
          accessibilityLabel="Widoczność wydarzenia"
        />
      </View>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <View style={styles.btnRow}>
        <Button label={t('cancel')} variant="ghost" onPress={onCancel} style={styles.btn} />
        <Button
          label={saving ? '' : 'Utwórz wydarzenie'}
          loading={saving}
          onPress={handleSubmit}
          style={styles.btn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  section: { gap: theme.spacing.sm },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: { gap: theme.spacing.sm, paddingBottom: 2 },
  typeChip: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    minWidth: 68,
    minHeight: 64,
    justifyContent: 'center',
  },
  typeChipActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  typeEmoji: { fontSize: 22 },
  typeLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  typeLabelActive: { color: theme.colors.accent, fontWeight: theme.fontWeight.medium },
  descInput: { textAlignVertical: 'top', minHeight: 72 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 68,
  },
  toggleInfo: { flex: 1, gap: 2, paddingRight: theme.spacing.md },
  toggleLabel: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  toggleHint: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  formError: { fontSize: theme.fontSize.sm, color: theme.colors.error, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  btn: { flex: 1 },
});
