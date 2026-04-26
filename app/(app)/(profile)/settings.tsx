import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { theme } from '@/constants/theme';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/auth';

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

function SettingsRow({ label, value, onPress, rightElement }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightElement}
      accessibilityRole={onPress ? 'button' : 'none'}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {rightElement ?? null}
      {onPress && !rightElement ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation(['profile', 'auth', 'common']);
  const { colorScheme, language, setColorScheme, setLanguage } = usePreferencesStore();
  const { reset } = useAuthStore();

  async function handleSignOut() {
    try { await signOut(); } catch { /* gone */ }
    reset();
  }

  function toggleLanguage() {
    const next = language === 'pl' ? 'en' : 'pl';
    setLanguage(next);
    i18n.changeLanguage(next);
  }

  function cycleTheme() {
    const order: typeof colorScheme[] = ['system', 'dark', 'light'];
    const idx = order.indexOf(colorScheme);
    setColorScheme(order[(idx + 1) % order.length]);
  }

  const THEME_LABELS: Record<string, string> = {
    system: t('profile:theme_system'),
    dark: t('profile:theme_dark'),
    light: t('profile:theme_light'),
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel={t('common:back')}>
          <Text style={styles.backText}>‹ {t('common:back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('profile:settings_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.groupLabel}>WYGLĄD</Text>
        <View style={styles.group}>
          <SettingsRow
            label={t('profile:theme')}
            value={THEME_LABELS[colorScheme]}
            onPress={cycleTheme}
          />
          <SettingsRow
            label={t('profile:language')}
            value={language.toUpperCase()}
            onPress={toggleLanguage}
          />
        </View>

        <Text style={styles.groupLabel}>KONTO</Text>
        <View style={styles.group}>
          <SettingsRow label="Polityka prywatności" onPress={() => router.push('/(auth)/privacy')} />
          <SettingsRow label="Twoje dane (RODO)" onPress={() => router.push('/(app)/(profile)/data')} />
          <SettingsRow label={t('profile:terms')} onPress={() => router.push('/(auth)/terms')} />
        </View>

        <View style={styles.signOutContainer}>
          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel={t('auth:sign_out')}
            style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
          >
            <Text style={styles.signOutText}>{t('auth:sign_out')}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    gap: theme.spacing.xs,
  },
  backBtn: { minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: theme.fontSize.body, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.lg },
  groupLabel: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, letterSpacing: 1, marginBottom: -theme.spacing.sm },
  group: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  rowPressed: { backgroundColor: theme.colors.backgroundCard, opacity: 0.7 },
  rowLabel: { flex: 1, fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  rowValue: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, marginRight: theme.spacing.sm },
  chevron: { fontSize: theme.fontSize.xl, color: theme.colors.textTertiary },
  signOutContainer: { marginTop: theme.spacing.xl },
  signOutBtn: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.errorLight,
    backgroundColor: theme.colors.errorLight,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  signOutBtnPressed: { opacity: 0.7 },
  signOutText: { fontSize: theme.fontSize.body, color: theme.colors.error, fontWeight: theme.fontWeight.semibold },
});
