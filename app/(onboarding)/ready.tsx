import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import { createProfile, updateProfile } from '@/services/auth';
import { saveUserInterests, joinGromada } from '@/services/api/users';
import { generateRandomAvatarConfig } from '@/components/avatar/avatarParts';

export default function ReadyScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const store = useOnboardingStore();
  const { user, setProfile } = useAuthStore();

  const [saving, setSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    async function run() {
    setSaving(true);
    setError(null);

    try {
      const avatarConfig = generateRandomAvatarConfig();

      // Try insert first; if profile exists, update (handles re-runs)
      let profile;
      try {
        profile = await createProfile({
          id: user.id,
          first_name: store.firstName.trim(),
          nickname: store.nickname.trim() || null,
          date_of_birth: store.dateOfBirth || '2000-01-01',
          city_id: store.cityId || null,
          avatar_config: avatarConfig,
          language: 'pl',
          notifications_enabled: store.notificationsEnabled,
          onboarding_completed: true,
        });
      } catch (insertErr: any) {
        if (insertErr?.code === '23505') {
          // duplicate key — profile exists, update instead
          profile = await updateProfile(user.id, {
            first_name: store.firstName.trim(),
            nickname: store.nickname.trim() || null,
            city_id: store.cityId || null,
            avatar_config: avatarConfig,
            notifications_enabled: store.notificationsEnabled,
            onboarding_completed: true,
          });
        } else {
          throw insertErr;
        }
      }

      // Save interests
      if (store.selectedInterestIds.length > 0) {
        await saveUserInterests(user.id, store.selectedInterestIds);
      }

      // Join selected Gromady
      for (const gromadaId of store.joinedGromadaIds) {
        await joinGromada(gromadaId, user.id);
      }

      setProfile(profile);
      store.reset();
    } catch (err: any) {
      setError(err?.message ?? t('common:unknown_error'));
    } finally {
      setSaving(false);
    }
    }

    run();
  }, [user, retryCount]);

  function handleStart() {
    router.replace('/(app)/(feed)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ProgressBar current={7} total={7} />

        {saving ? (
          <View style={styles.saving}>
            <ActivityIndicator color={theme.colors.accent} size="large" />
            <Text style={styles.savingText}>Tworzymy twój profil...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>😬</Text>
            <Text style={styles.errorTitle}>Coś poszło nie tak</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Button label={t('common:retry')} onPress={() => { setError(null); setSaving(true); setRetryCount((n) => n + 1); }} size="lg" style={styles.btn} />
          </View>
        ) : (
          <View style={styles.success}>
            <Text style={styles.emoji}>🌿</Text>
            <Text style={styles.title}>{t('ready_title')}</Text>
            <Text style={styles.subtitle}>{t('ready_subtitle')}</Text>
            <View style={styles.confetti}>
              {['🎉', '🌱', '🔥', '✨', '🤝'].map((e) => (
                <Text key={e} style={styles.confettiEmoji}>{e}</Text>
              ))}
            </View>
            <Button
              label={t('ready_cta')}
              onPress={handleStart}
              size="lg"
              style={styles.btn}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  saving: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  savingText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  errorEmoji: { fontSize: 64 },
  errorTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  errorBody: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center' },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  emoji: { fontSize: 80 },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: theme.fontSize.lg, color: theme.colors.textSecondary, textAlign: 'center' },
  confetti: { flexDirection: 'row', gap: theme.spacing.md },
  confettiEmoji: { fontSize: 32 },
  btn: { width: '100%', marginTop: theme.spacing.lg },
});
