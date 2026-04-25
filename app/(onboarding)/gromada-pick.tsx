import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { fetchGromadySuggestions } from '@/services/api/users';

type GromadaSuggestion = {
  id: string;
  name: string;
  member_count: number;
  max_members: number;
  size_type: string;
  gromada_interests: { interest_id: string; interests: { name_pl: string; emoji: string } | null }[];
};

export default function GromadaPickScreen() {
  const { t } = useTranslation(['onboarding', 'gromady', 'common']);
  const { cityId, selectedInterestIds, joinedGromadaIds, toggleGromada } = useOnboardingStore();

  const [suggestions, setSuggestions] = useState<GromadaSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityId) return;
    fetchGromadySuggestions(cityId, selectedInterestIds)
      .then((data) => setSuggestions(data as unknown as GromadaSuggestion[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  // Serialise to string so the effect doesn't re-fire on every render due to array identity
  }, [cityId, selectedInterestIds.join(',')]);

  const SIZE_LABELS: Record<string, string> = {
    small: t('gromady:size_small'),
    medium: t('gromady:size_medium'),
    large: t('gromady:size_large'),
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <ProgressBar current={4} total={7} />
        <Text style={styles.step}>{t('step_of', { current: 4, total: 7 })}</Text>
        <Text style={styles.title}>{t('gromada_title')}</Text>
        <Text style={styles.subtitle}>{t('gromada_subtitle')}</Text>
        <Text style={styles.hint}>{t('gromada_pick_one')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Nie znaleźliśmy Gromad w twoim mieście. Będziemy cię czekać!
          </Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const joined = joinedGromadaIds.includes(item.id);
            return (
              <Pressable
                onPress={() => toggleGromada(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: joined }}
                accessibilityLabel={item.name}
                style={({ pressed }) => [
                  styles.card,
                  joined && styles.cardJoined,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Avatar placeholder */}
                <View style={[styles.avatar, joined && styles.avatarJoined]}>
                  <Text style={styles.avatarEmoji}>🌿</Text>
                </View>

                <View style={styles.info}>
                  <Text style={[styles.name, joined && styles.nameJoined]}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.member_count}/{item.max_members} osób · {SIZE_LABELS[item.size_type]}
                  </Text>
                  <View style={styles.interests}>
                    {item.gromada_interests.slice(0, 3).map((gi) =>
                      gi.interests ? (
                        <Badge
                          key={gi.interest_id}
                          label={gi.interests.name_pl}
                          emoji={gi.interests.emoji}
                          variant="default"
                        />
                      ) : null,
                    )}
                  </View>
                </View>

                <View style={[styles.joinBtn, joined && styles.joinBtnActive]}>
                  <Text style={[styles.joinBtnText, joined && styles.joinBtnTextActive]}>
                    {joined ? t('gromada_joined') : t('gromada_join')}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Button
          label={t('common:next')}
          onPress={() => router.push('/(onboarding)/notifications')}
          size="lg"
          style={styles.btn}
        />
        {joinedGromadaIds.length === 0 && (
          <Text style={styles.skipHint}>Możesz dołączyć do Gromady później</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  step: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  subtitle: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  hint: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: { color: theme.colors.textSecondary, textAlign: 'center', fontSize: theme.fontSize.body },
  list: { paddingHorizontal: theme.spacing.xl, gap: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
  },
  cardJoined: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  cardPressed: { opacity: 0.75 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarJoined: { borderColor: theme.colors.accent },
  avatarEmoji: { fontSize: 24 },
  info: { flex: 1, gap: theme.spacing.xs },
  name: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  nameJoined: { color: theme.colors.accent },
  meta: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  joinBtn: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
  },
  joinBtnActive: { backgroundColor: theme.colors.accent },
  joinBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  joinBtnTextActive: { color: '#fff' },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  btn: { width: '100%' },
  skipHint: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, textAlign: 'center' },
});
