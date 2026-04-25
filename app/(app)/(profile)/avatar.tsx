import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AvatarEditor } from '@/components/avatar/AvatarEditor';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { updateProfile } from '@/services/auth';
import { type AvatarConfig, generateRandomAvatarConfig, isValidAvatarConfig } from '@/components/avatar/avatarParts';

export default function AvatarScreen() {
  const { t } = useTranslation('profile');
  const { user, profile, setProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const raw = profile?.avatar_config;
  const initial: AvatarConfig = isValidAvatarConfig(raw) ? raw : generateRandomAvatarConfig();

  async function handleSave(config: AvatarConfig) {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, { avatar_config: config });
      setProfile(updated);
      router.back();
    } catch {
      // stay on screen
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('edit_avatar')}</Text>
      </View>
      <AvatarEditor initial={initial} onSave={handleSave} saving={saving} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
});
