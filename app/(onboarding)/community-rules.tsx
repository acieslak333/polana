import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const RULES = [
  { key: 'rule_1', emoji: '🤝' },
  { key: 'rule_2', emoji: '🦄' },
  { key: 'rule_3', emoji: '🛡️' },
] as const;

export default function CommunityRulesScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const { setRulesAccepted } = useOnboardingStore();
  const [agreed, setAgreed] = useState(false);

  function handleContinue() {
    setRulesAccepted(true);
    router.push('/(onboarding)/ready');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ProgressBar current={6} total={7} />
          <Text style={styles.step}>{t('step_of', { current: 6, total: 7 })}</Text>
          <Text style={styles.title}>{t('rules_title')}</Text>
        </View>

        <View style={styles.rules}>
          {RULES.map((rule, i) => (
            <View key={rule.key} style={styles.ruleCard}>
              <View style={styles.ruleNumber}>
                <Text style={styles.ruleEmoji}>{rule.emoji}</Text>
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>{t(`${rule.key}_title` as any)}</Text>
                <Text style={styles.ruleBody}>{t(`${rule.key}_body` as any)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Checkbox agreement */}
        <Pressable
          onPress={() => setAgreed((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel={t('rules_agree')}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>{t('rules_agree')}</Text>
        </Pressable>

        <Button
          label={t('common:next')}
          onPress={handleContinue}
          size="lg"
          disabled={!agreed}
          disabledReason={!agreed ? t('rules_agree') : undefined}
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xl,
  },
  header: { gap: theme.spacing.sm },
  step: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  rules: { gap: theme.spacing.md },
  ruleCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
  },
  ruleNumber: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleEmoji: { fontSize: 22 },
  ruleContent: { flex: 1, gap: theme.spacing.xs },
  ruleTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  ruleBody: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, lineHeight: theme.fontSize.md * theme.lineHeight.relaxed },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: theme.fontWeight.bold },
  checkLabel: { flex: 1, fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  btn: { width: '100%' },
});
