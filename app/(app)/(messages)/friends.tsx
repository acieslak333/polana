import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchFriends,
  fetchPendingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  type PublicProfile,
} from '@/services/api/users';

export default function FriendsScreen() {
  const { t } = useTranslation(['messages', 'common']);
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [pending, setPending] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        fetchFriends(user.id),
        fetchPendingRequests(user.id),
      ]);
      setFriends(f);
      setPending(p);
    } catch { /* stay empty */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleAccept(requesterId: string) {
    if (!user) return;
    setActing(requesterId);
    try {
      await acceptFriendRequest(requesterId, user.id);
      await load();
    } finally { setActing(null); }
  }

  async function handleDecline(requesterId: string) {
    if (!user) return;
    setActing(requesterId);
    try {
      await declineFriendRequest(requesterId, user.id);
      setPending((prev) => prev.filter((p) => p.id !== requesterId));
    } finally { setActing(null); }
  }

  const displayName = (p: PublicProfile) => p.nickname ?? p.first_name;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('messages:friends')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>
      ) : (
        <FlatList
          data={[
            ...pending.map((p) => ({ type: 'pending' as const, profile: p })),
            ...friends.map((f) => ({ type: 'friend' as const, profile: f })),
          ]}
          keyExtractor={(item) => `${item.type}-${item.profile.id}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            pending.length > 0 ? (
              <Text style={styles.sectionLabel}>
                {t('messages:friend_request_received')} ({pending.length})
              </Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const showFriendsHeader =
              item.type === 'friend' &&
              (index === 0 || (index > 0 && (pending.length === 0 || index === pending.length)));

            return (
              <>
                {showFriendsHeader && (
                  <Text style={[styles.sectionLabel, index > 0 && styles.sectionLabelSpaced]}>
                    {t('messages:friends')} ({friends.length})
                  </Text>
                )}
                <Pressable
                  onPress={() => router.push(`/(app)/(messages)/friend/${item.profile.id}`)}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel={displayName(item.profile)}
                >
                  <ProceduralAvatar config={item.profile.avatar_config} size={44} />
                  <Text style={styles.name}>{displayName(item.profile)}</Text>

                  {item.type === 'pending' && (
                    <View style={styles.pendingBtns}>
                      <Button
                        label={t('messages:accept')}
                        size="sm"
                        loading={acting === item.profile.id}
                        onPress={() => handleAccept(item.profile.id)}
                        style={styles.acceptBtn}
                      />
                      <Button
                        label={t('messages:decline')}
                        size="sm"
                        variant="ghost"
                        loading={acting === item.profile.id}
                        onPress={() => handleDecline(item.profile.id)}
                      />
                    </View>
                  )}
                </Pressable>
              </>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🤝</Text>
              <Text style={styles.emptyTitle}>{t('messages:no_friends')}</Text>
              <Text style={styles.emptyBody}>{t('messages:no_friends_body')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: theme.spacing.xxxl },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  sectionLabelSpaced: { marginTop: theme.spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 68,
  },
  name: {
    flex: 1,
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  pendingBtns: { flexDirection: 'row', gap: theme.spacing.sm },
  acceptBtn: { minWidth: 72 },
  separator: { height: 1, backgroundColor: theme.colors.borderSubtle, marginLeft: 76 },
  emptyContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textSecondary },
  emptyBody: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, textAlign: 'center' },
});
