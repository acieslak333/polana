import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { signInWithGoogle } from '@/services/oAuth';

export default function WelcomeScreen() {
  const { t } = useTranslation('auth');
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try { await signInWithGoogle(); } catch { /* handled by onAuthStateChange */ }
    finally { setGoogleLoading(false); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>
          <Text style={styles.title}>{t('welcome_title')}</Text>
          <Text style={styles.subtitle}>{t('welcome_subtitle')}</Text>
          <Text style={styles.description}>{t('welcome_description')}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={t('sign_in_google')}
            variant="secondary"
            size="lg"
            loading={googleLoading}
            onPress={handleGoogle}
            style={styles.primaryBtn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/(auth)/register" asChild>
            <Button label={t('sign_up')} variant="primary" size="lg" style={styles.primaryBtn} />
          </Link>

          <Link href="/(auth)/login" asChild>
            <Button label={t('sign_in')} variant="ghost" size="lg" style={styles.secondaryBtn} />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xxl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.accent,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.fontSize.body * theme.lineHeight.relaxed,
    paddingHorizontal: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.sm,
  },
  primaryBtn: { width: '100%' },
  secondaryBtn: { width: '100%' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
});
