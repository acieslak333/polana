import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ExpoNotifications from 'expo-notifications';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MindfulText } from '@/components/mindful/MindfulText';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function NotificationsScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const { setNotificationsEnabled } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch {
      setNotificationsEnabled(false);
    } finally {
      setLoading(false);
    }
    router.push('/(onboarding)/community-rules');
  }

  function handleSkip() {
    setNotificationsEnabled(false);
    router.push('/(onboarding)/community-rules');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ProgressBar current={5} total={7} />
          <Text style={styles.step}>{t('step_of', { current: 5, total: 7 })}</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.bell}>🔔</Text>
          <Text style={styles.title}>{t('notifications_title')}</Text>
          <MindfulText category="notifications" style={styles.mindful} />
        </View>

        <View style={styles.bullets}>
          {[
            '📅 Nowe wydarzenie w twojej Gromadzie',
            '💬 Wiadomości od znajomych',
            '🤝 Ktoś oferuje pomoc przy twojej prośbie',
          ].map((item) => (
            <View key={item} style={styles.bullet}>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            label={t('notifications_enable')}
            loading={loading}
            onPress={handleEnable}
            size="lg"
            style={styles.btn}
          />
          <Button
            label={t('notifications_skip')}
            variant="ghost"
            onPress={handleSkip}
            size="lg"
            style={styles.btn}
          />
        </View>
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
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xxl,
  },
  header: { gap: theme.spacing.sm },
  step: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  hero: { alignItems: 'center', gap: theme.spacing.lg, flex: 1, justifyContent: 'center' },
  bell: { fontSize: 64 },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  mindful: { paddingHorizontal: theme.spacing.md },
  bullets: { gap: theme.spacing.sm },
  bullet: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bulletText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  actions: { gap: theme.spacing.sm },
  btn: { width: '100%' },
});
