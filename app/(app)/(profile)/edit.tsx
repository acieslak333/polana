import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { updateProfile } from '@/services/auth';

const MAX_BIO = 200;

export default function EditProfileScreen() {
  const { t } = useTranslation(['profile', 'common']);
  const { user, profile, setProfile } = useAuthStore();

  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string }>({});

  const bioNearLimit = bio.length >= MAX_BIO - 20;
  const bioColor = bio.length >= MAX_BIO
    ? theme.colors.error
    : bio.length >= MAX_BIO - 10
    ? theme.colors.warning
    : theme.colors.textTertiary;

  const handleSave = useCallback(async () => {
    if (!firstName.trim()) {
      setErrors({ firstName: t('common:required_field') });
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const updated = await updateProfile(user.id, {
        first_name: firstName.trim(),
        nickname: nickname.trim() || null,
        bio: bio.trim() || null,
      });
      setProfile(updated);
      router.back();
    } catch {
      // keep form, user can retry
    } finally {
      setSaving(false);
    }
  }, [firstName, nickname, bio, user, t, setProfile]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile:edit_profile')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Input
            label={t('profile:first_name')}
            value={firstName}
            onChangeText={(v) => { setFirstName(v); setErrors({}); }}
            error={errors.firstName}
            autoCapitalize="words"
            autoFocus
          />
          <Input
            label={t('profile:nickname')}
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            hint="Opcjonalna ksywka widoczna dla innych"
          />
          <View style={styles.bioContainer}>
            <Input
              label={t('profile:bio')}
              value={bio}
              onChangeText={(v) => setBio(v.slice(0, MAX_BIO))}
              placeholder={t('profile:bio_placeholder')}
              multiline
              numberOfLines={4}
              style={styles.bioInput}
            />
            {bioNearLimit && (
              <Text style={[styles.charCount, { color: bioColor }]}>
                {MAX_BIO - bio.length}
              </Text>
            )}
          </View>

          <Button
            label={saving ? '' : t('common:save')}
            loading={saving}
            onPress={handleSave}
            size="lg"
            style={styles.btn}
          />
          <Button
            label={t('common:cancel')}
            variant="ghost"
            onPress={() => router.back()}
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
  },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.sm },
  bioContainer: { position: 'relative' },
  bioInput: { textAlignVertical: 'top', minHeight: 100 },
  charCount: { position: 'absolute', bottom: theme.spacing.xs + 4, right: theme.spacing.md, fontSize: theme.fontSize.sm },
  btn: { width: '100%' },
});
