import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { updateGromada } from '@/services/api/gromady';

export default function GromadaSettingsScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['gromady', 'common']);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    import('@/services/api/gromady').then(({ fetchGromada }) =>
      fetchGromada(id).then((g) => { setName(g.name); setDescription(g.description ?? ''); })
    ).catch(() => {});
  }, [id]);

  async function handleSave() {
    if (!id || !name.trim()) { setError('Nazwa jest wymagana'); return; }
    setSaving(true);
    try {
      await updateGromada(id, { name: name.trim(), description: description.trim() || null });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? t('common:unknown_error'));
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('gromady:settings')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label={t('gromady:name_label')}
          value={name}
          onChangeText={(v) => { setName(v); setError(''); }}
          error={error}
          autoFocus
        />
        <Input
          label={t('gromady:description_label')}
          value={description}
          onChangeText={(v) => setDescription(v.slice(0, 300))}
          multiline
          numberOfLines={4}
          style={styles.desc}
        />
        <Button label={saving ? '' : t('common:save')} loading={saving} onPress={handleSave} size="lg" style={styles.btn} />
        <Button label={t('common:cancel')} variant="ghost" onPress={() => router.back()} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.sm },
  desc: { textAlignVertical: 'top', minHeight: 100 },
  btn: { width: '100%', marginTop: theme.spacing.sm },
});
