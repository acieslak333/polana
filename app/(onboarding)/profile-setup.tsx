import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useState } from 'react';

export default function ProfileSetupScreen() {
  const { t } = useTranslation('onboarding');
  const { firstName, setFirstName, nickname, setNickname } = useOnboardingStore();
  const [error, setError] = useState<string | undefined>();

  function handleNext() {
    if (!firstName.trim()) {
      setError(t('common:required_field'));
      return;
    }
    router.push('/(onboarding)/interests');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>{t('step_of', { current: 1, total: 7 })}</Text>
          <Text style={styles.title}>{t('profile_title')}</Text>
          <Text style={styles.subtitle}>{t('profile_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('first_name')}
            placeholder={t('first_name_placeholder')}
            value={firstName}
            onChangeText={(v) => { setFirstName(v); setError(undefined); }}
            error={error}
            autoFocus
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Input
            label={t('nickname')}
            placeholder={t('nickname_placeholder')}
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
          />
        </View>

        <Button
          label={t('common:next')}
          onPress={handleNext}
          size="lg"
          style={styles.btn}
          disabledReason={!firstName.trim() ? t('common:required_field') : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  header: { marginBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  step: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  subtitle: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  form: { flex: 1 },
  btn: { width: '100%' },
});
