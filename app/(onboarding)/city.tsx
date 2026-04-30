import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { fetchCities } from '@/services/api/users';

type City = { id: string; name: string; emoji: string };

export default function CityScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const { cityId, setCityId } = useOnboardingStore();

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities()
      .then((data) => setCities(data as City[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <ProgressBar current={3} total={7} />
        <Text style={styles.step}>{t('step_of', { current: 3, total: 7 })}</Text>
        <Text style={styles.title} testID="onboarding-step-title">{t('city_title')}</Text>
        <Text style={styles.subtitle}>{t('city_subtitle')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const selected = cityId === item.id;
            return (
              <Pressable
                onPress={() => setCityId(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={item.name}
                style={({ pressed }) => [
                  styles.cityRow,
                  selected && styles.cityRowSelected,
                  pressed && styles.cityRowPressed,
                ]}
              >
                <Text style={styles.cityEmoji}>{item.emoji}</Text>
                <Text style={[styles.cityName, selected && styles.cityNameSelected]}>
                  {item.name}
                </Text>
                {selected && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Button
          label={t('common:next')}
          onPress={() => router.push('/(onboarding)/gromada-pick')}
          size="lg"
          disabled={!cityId}
          disabledReason={!cityId ? t('city_subtitle') : undefined}
          style={styles.btn}
          testID="next-button"
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
    paddingBottom: theme.spacing.lg,
  },
  step: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  subtitle: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    minHeight: 64,
  },
  cityRowSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentLight,
  },
  cityRowPressed: { opacity: 0.75 },
  cityEmoji: { fontSize: 28 },
  cityName: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  cityNameSelected: { color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  check: { fontSize: theme.fontSize.lg, color: theme.colors.accent },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  btn: { width: '100%' },
});
