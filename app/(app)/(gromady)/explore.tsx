import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchAllGromady, type GromadaRow } from '@/services/api/gromady';
import { fetchInterests, joinGromada } from '@/services/api/users';

type InterestChip = {
  id: string;
  name_pl: string;
  emoji: string;
};

type JoinState = 'idle' | 'joined';

type ToastState = {
  visible: boolean;
  message: string;
};

function useToast(): [ToastState, (msg: string) => void] {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message: msg });
    timerRef.current = setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 5000);
  }, []);

  return [toast, show];
}

type GromadaExploreCardProps = {
  gromada: GromadaRow;
  userId: string;
  onJoined: (name: string) => void;
  joinedLabel: string;
  joinLabel: string;
  fullLabel: string;
};

function GromadaExploreCard({ gromada, userId, onJoined, joinedLabel, joinLabel, fullLabel }: GromadaExploreCardProps) {
  const [joinState, setJoinState] = useState<JoinState>('idle');
  const [joining, setJoining] = useState(false);
  const isFull = gromada.member_count >= gromada.max_members;

  async function handleJoin(): Promise<void> {
    if (joinState === 'joined' || joining || isFull) return;
    setJoining(true);
    try {
      await joinGromada(gromada.id, userId);
      setJoinState('joined');
      onJoined(gromada.name);
    } catch {
      // Silently ignore — joinGromada swallows duplicate-key errors
    } finally {
      setJoining(false);
    }
  }

  const isJoined = joinState === 'joined';
  const buttonLabel = isJoined ? joinedLabel : isFull ? fullLabel : joinLabel;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/(gromady)/${gromada.id}`)}
      accessibilityRole="button"
      accessibilityLabel={gromada.name}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <ProceduralAvatar config={gromada.avatar_config} size={52} />

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {gromada.name}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            {gromada.member_count}/{gromada.max_members} osób
          </Text>
          <Text style={styles.cardMetaText}>
            {'🔥 '}
            {gromada.member_count}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleJoin}
        disabled={isJoined || isFull || joining}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled: isJoined || isFull }}
        style={[
          styles.joinBtn,
          (isJoined || isFull) && styles.joinBtnDisabled,
        ]}
      >
        {joining ? (
          <ActivityIndicator size="small" color={theme.colors.textPrimary} />
        ) : (
          <Text
            style={[
              styles.joinBtnText,
              (isJoined || isFull) && styles.joinBtnTextDisabled,
            ]}
          >
            {buttonLabel}
          </Text>
        )}
      </Pressable>
    </Pressable>
  );
}

export default function ExploreScreen(): React.JSX.Element {
  const { profile, user } = useAuthStore();
  const { t } = useTranslation(['gromady', 'common']);
  const cityId = profile?.city_id ?? '';
  const userId = user?.id ?? '';

  const [gromady, setGromady] = useState<GromadaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [interests, setInterests] = useState<InterestChip[]>([]);
  const [toast, showToast] = useToast();

  const loadPage = useCallback(
    async (nextPage: number, interestId: string | null, replace: boolean): Promise<void> => {
      if (!cityId) return;
      try {
        const data = await fetchAllGromady(cityId, nextPage, interestId);
        setGromady((prev) => (replace ? data : [...prev, ...data]));
        setHasMore(data.length === 20);
        setPage(nextPage);
      } catch {
        // Keep existing list visible on error
      }
    },
    [cityId],
  );

  useEffect(() => {
    async function init(): Promise<void> {
      setLoading(true);
      try {
        const data = await fetchInterests();
        setInterests(
          (data ?? []).map((i) => ({
            id: i.id,
            name_pl: i.name_pl,
            emoji: i.emoji,
          })),
        );
      } catch {
        // Non-fatal; chips just won't appear
      }
      await loadPage(0, null, true);
      setLoading(false);
    }
    void init();
  }, [loadPage]);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await loadPage(0, selectedInterestId, true);
    setRefreshing(false);
  }

  async function handleEndReached(): Promise<void> {
    if (!hasMore || loading || refreshing) return;
    await loadPage(page + 1, selectedInterestId, false);
  }

  async function handleSelectInterest(id: string | null): Promise<void> {
    const next = id === selectedInterestId ? null : id;
    setSelectedInterestId(next);
    setLoading(true);
    await loadPage(0, next, true);
    setLoading(false);
  }

  function handleJoined(name: string): void {
    showToast(t('gromady:explore_join_toast', { name }));
  }

  const isEmpty = !loading && gromady.length === 0;
  const joinedLabel = t('gromady:explore_joined');
  const joinLabel = t('gromady:join');
  const fullLabel = t('gromady:gromada_full');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('gromady:explore_title')}</Text>
      </View>

      {/* Interest filter chips */}
      {interests.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          <Pressable
            onPress={() => { void handleSelectInterest(null); }}
            style={[styles.chip, selectedInterestId === null && styles.chipActive]}
            accessibilityRole="checkbox"
            accessibilityLabel={t('gromady:explore_filter_all')}
            accessibilityState={{ checked: selectedInterestId === null }}
          >
            <Text style={[styles.chipText, selectedInterestId === null && styles.chipTextActive]}>
              {t('gromady:explore_filter_all')}
            </Text>
          </Pressable>
          {interests.map((interest) => {
            const isActive = selectedInterestId === interest.id;
            return (
              <Pressable
                key={interest.id}
                onPress={() => { void handleSelectInterest(interest.id); }}
                style={[styles.chip, isActive && styles.chipActive]}
                accessibilityRole="checkbox"
                accessibilityLabel={interest.name_pl}
                accessibilityState={{ checked: isActive }}
              >
                <Text style={styles.chipEmoji}>{interest.emoji}</Text>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {interest.name_pl}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Main list */}
      {loading && gromady.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{t('gromady:explore_empty')}</Text>
          <Pressable
            onPress={() => router.push('/(app)/(gromady)/create')}
            style={styles.emptyBtn}
            accessibilityRole="button"
            accessibilityLabel={t('gromady:explore_create_first')}
          >
            <Text style={styles.emptyBtnText}>{t('gromady:explore_create_first')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={gromady}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GromadaExploreCard
              gromada={item}
              userId={userId}
              onJoined={handleJoined}
              joinedLabel={joinedLabel}
              joinLabel={joinLabel}
              fullLabel={fullLabel}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={() => { void handleEndReached(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore && !refreshing ? (
              <View style={styles.footer}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            ) : null
          }
        />
      )}

      {/* Undo toast — no modal, no confirmation, just info per no-dark-patterns */}
      {toast.visible && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },

  chipsScroll: { maxHeight: 56, flexShrink: 0 },
  chipsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    minHeight: 36,
  },
  chipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentLight,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },

  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  separator: { height: theme.spacing.sm },
  footer: { padding: theme.spacing.lg, alignItems: 'center' },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 76,
  },
  cardPressed: { opacity: 0.75 },
  cardInfo: { flex: 1, gap: theme.spacing.xs },
  cardName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  cardMetaText: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  joinBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    minHeight: 36,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnDisabled: {
    backgroundColor: theme.colors.backgroundElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  joinBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  joinBtnTextDisabled: { color: theme.colors.textDisabled },

  // Toast — sits at bottom, no interaction
  toast: {
    position: 'absolute',
    bottom: theme.spacing.xxxl,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.md,
  },
  toastText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});
