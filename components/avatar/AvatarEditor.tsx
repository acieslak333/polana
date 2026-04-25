import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProceduralAvatar } from './ProceduralAvatar';
import {
  AVATAR_PARTS,
  AVATAR_COLORS,
  BASE_EMOJIS,
  HAT_EMOJIS,
  ACCESSORY_EMOJIS,
  type AvatarConfig,
  type AvatarPartKey,
  generateRandomAvatarConfig,
} from './avatarParts';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

type AvatarEditorProps = {
  initial: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  saving?: boolean;
};

type PartMeta = {
  key: AvatarPartKey;
  label: string;
  emojis?: Record<string, string>;
};

const PART_METAS: PartMeta[] = [
  { key: 'base', label: 'avatar_base', emojis: BASE_EMOJIS },
  { key: 'hat', label: 'avatar_hat', emojis: HAT_EMOJIS },
  { key: 'accessories', label: 'avatar_accessory', emojis: ACCESSORY_EMOJIS },
  { key: 'eyes', label: 'avatar_eyes' },
  { key: 'mouth', label: 'avatar_mouth' },
  { key: 'special', label: 'avatar_special' },
];

export function AvatarEditor({ initial, onSave, saving = false }: AvatarEditorProps) {
  const { t } = useTranslation('profile');
  const [config, setConfig] = useState<AvatarConfig>(initial);

  function set(key: AvatarPartKey, value: string) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function randomize() {
    setConfig(generateRandomAvatarConfig());
  }

  return (
    <View style={styles.container}>
      {/* Preview */}
      <View style={styles.preview}>
        <ProceduralAvatar config={config} size={120} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Part pickers */}
        {PART_METAS.map(({ key, label, emojis }) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionLabel}>{t(label as any)}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsRow}
            >
              {AVATAR_PARTS[key].map((value) => {
                const selected = config[key] === value;
                const display = emojis ? (emojis[value] || '—') : value.replace(/_/g, ' ');
                return (
                  <Pressable
                    key={value}
                    onPress={() => set(key, value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={display}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text style={styles.optionLabel}>{display}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ))}

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('avatar_color')}</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.primary.map((color) => (
              <Pressable
                key={color}
                onPress={() => setConfig((c) => ({ ...c, primaryColor: color }))}
                accessibilityRole="radio"
                accessibilityState={{ checked: config.primaryColor === color }}
                accessibilityLabel={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  config.primaryColor === color && styles.colorSwatchSelected,
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label={t('randomize')}
          variant="secondary"
          onPress={randomize}
          style={styles.actionBtn}
        />
        <Button
          label={t('save_avatar')}
          loading={saving}
          onPress={() => onSave(config)}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  preview: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scroll: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxl },
  section: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionsRow: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  option: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  optionPressed: { opacity: 0.7 },
  optionLabel: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: { borderColor: theme.colors.textPrimary, transform: [{ scale: 1.15 }] },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionBtn: { flex: 1 },
});
