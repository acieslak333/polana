import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { fetchInterests } from '@/services/api/users';

const MIN_INTERESTS = 3;

type Interest = { id: string; name_pl: string; emoji: string; category: string | null };

export default function InterestsScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const { selectedInterestIds, toggleInterest } = useOnboardingStore();

  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchInterests()
      .then((data) => setInterests(data as Interest[]))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const remaining = Math.max(0, MIN_INTERESTS - selectedInterestIds.length);
  const canProceed = selectedInterestIds.length >= MIN_INTERESTS;

  // Group by category
  const grouped = interests.reduce<Record<string, Interest[]>>((acc, i) => {
    const key = i.category ?? 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(i);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <ProgressBar current={2} total={7} />
        <Text style={styles.step}>{t('step_of', { current: 2, total: 7 })}</Text>
        <Text style={styles.title}>{t('interests_title')}</Text>
        <Text style={styles.subtitle}>
          {remaining > 0
            ? t('interests_min', { count: remaining })
            : t('interests_selected', { count: selectedInterestIds.length })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('common:network_error')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(grouped).map(([category, items]) => (
            <View key={category} style={styles.group}>
              {items.map((interest) => (
                <Badge
                  key={interest.id}
                  label={interest.name_pl}
                  emoji={interest.emoji}
                  selected={selectedInterestIds.includes(interest.id)}
                  onPress={() => toggleInterest(interest.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button
          label={t('common:next')}
          onPress={() => router.push('/(onboarding)/city')}
          size="lg"
          disabled={!canProceed}
          disabledReason={remaining > 0 ? t('interests_min', { count: remaining }) : undefined}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  step: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  subtitle: { fontSize: theme.fontSize.body, color: theme.colors.accent, fontWeight: theme.fontWeight.medium },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.body, textAlign: 'center' },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  btn: { width: '100%' },
});
