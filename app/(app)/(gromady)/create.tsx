import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { createGromada } from '@/services/api/gromady';
import { fetchInterests } from '@/services/api/users';
import { generateGromadaName } from '@/utils/nameGenerator';

const SIZE_OPTIONS: { key: 'small' | 'medium' | 'large'; label: string; max: number; desc: string }[] = [
  { key: 'small', label: 'Mała', max: 12, desc: '~12 osób' },
  { key: 'medium', label: 'Średnia', max: 24, desc: '~24 osoby' },
  { key: 'large', label: 'Duża', max: 36, desc: '~36 osób' },
];

type Interest = { id: string; name_pl: string; emoji: string; category: string | null };

export default function CreateGromadaScreen() {
  const { t } = useTranslation(['gromady', 'common']);
  const { user, profile } = useAuthStore();

  const [name, setName] = useState(generateGromadaName());
  const [sizeType, setSizeType] = useState<'small' | 'medium' | 'large'>('medium');
  const [description, setDescription] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterests()
      .then((data) => setInterests(data as Interest[]))
      .catch(() => {});
  }, []);

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 3 ? [...prev, id] : prev,
    );
  }

  async function handleCreate() {
    if (!user || !profile?.city_id) return;
    if (!name.trim()) { setError('Podaj nazwę Gromady'); return; }

    setSaving(true);
    setError('');
    try {
      const maxMembers = SIZE_OPTIONS.find((s) => s.key === sizeType)?.max ?? 24;
      const gromada = await createGromada({
        name: name.trim(),
        city_id: profile.city_id,
        size_type: sizeType,
        max_members: maxMembers,
        description: description.trim() || null,
        elder_id: user.id,
        interest_ids: selectedInterests,
      });
      router.replace(`/(app)/(gromady)/${gromada.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Błąd tworzenia Gromady');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common:back')}>
            <Text style={styles.backText}>‹ {t('common:back')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('gromady:create_gromada')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View style={styles.nameRow}>
            <Input
              label={t('gromady:name_label')}
              value={name}
              onChangeText={setName}
              error={error}
              containerStyle={styles.nameInput}
              autoCapitalize="words"
            />
            <Pressable
              onPress={() => setName(generateGromadaName())}
              style={styles.regenBtn}
              accessibilityRole="button"
              accessibilityLabel={t('gromady:regenerate_name')}
            >
              <Text style={styles.regenIcon}>🎲</Text>
            </Pressable>
          </View>

          {/* Size */}
          <Text style={styles.sectionLabel}>{t('gromady:size_small').replace('~12', '').trim() || 'Rozmiar'}</Text>
          <View style={styles.sizeRow}>
            {SIZE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setSizeType(opt.key)}
                style={[styles.sizeCard, sizeType === opt.key && styles.sizeCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: sizeType === opt.key }}
              >
                <Text style={[styles.sizeLabel, sizeType === opt.key && styles.sizeLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.sizeDesc}>{opt.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Interests */}
          <Text style={styles.sectionLabel}>{t('gromady:interests_label')}</Text>
          <View style={styles.interestsGrid}>
            {interests.map((i) => (
              <Badge
                key={i.id}
                label={i.name_pl}
                emoji={i.emoji}
                selected={selectedInterests.includes(i.id)}
                onPress={() => toggleInterest(i.id)}
              />
            ))}
          </View>

          {/* Description */}
          <Input
            label={t('gromady:description_label')}
            value={description}
            onChangeText={(v) => setDescription(v.slice(0, 300))}
            placeholder="O czym jest wasza Gromada?"
            multiline
            numberOfLines={3}
            style={styles.descInput}
          />

          <Button
            label={saving ? '' : t('gromady:create_gromada')}
            loading={saving}
            onPress={handleCreate}
            size="lg"
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  backText: { fontSize: theme.fontSize.body, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm },
  nameInput: { flex: 1, marginBottom: 0 },
  regenBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border },
  regenIcon: { fontSize: 24 },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sizeRow: { flexDirection: 'row', gap: theme.spacing.sm },
  sizeCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    alignItems: 'center',
    gap: 4,
    minHeight: 68,
    justifyContent: 'center',
  },
  sizeCardActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  sizeLabel: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  sizeLabelActive: { color: theme.colors.accent },
  sizeDesc: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  descInput: { textAlignVertical: 'top', minHeight: 80 },
  btn: { width: '100%', marginTop: theme.spacing.md },
});
