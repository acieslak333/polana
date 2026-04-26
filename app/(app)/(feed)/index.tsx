import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { PostCard } from '@/components/feed/PostCard';
import { NetworkError } from '@/components/ui/NetworkError';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchFeedPosts, toggleReaction, deletePost, type Post } from '@/services/api/posts';
import { useCacheStore } from '@/stores/cacheStore';

const PAGE_SIZE = 25;

type Filter = 'all' | 'gromady' | 'friends' | 'discover';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'gromady', label: 'Gromady' },
  { key: 'friends', label: 'Znajomi' },
  { key: 'discover', label: 'Odkrywaj' },
];

export default function FeedScreen() {
  const { t } = useTranslation('feed');
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const pageRef = useRef(0);
  const cachedPosts = useCacheStore((s) => s.feedPosts);

  const load = useCallback(async (reset = false) => {
    if (!user) return;
    if (!hasMore && !reset) return;
    if (reset) { pageRef.current = 0; setHasMore(true); }
    reset ? setRefreshing(true) : setLoading(true);

    try {
      const data = await fetchFeedPosts(user.id, pageRef.current, PAGE_SIZE);
      setPosts((prev) => (reset ? data : [...prev, ...data]));
      if (data.length < PAGE_SIZE) setHasMore(false);
      pageRef.current += 1;
      setIsOffline(false);
      if (reset) useCacheStore.getState().setFeedPosts(data);
    } catch {
      setIsOffline(true);
      if (reset && cachedPosts.length > 0) setPosts(cachedPosts);
    }
    finally { setLoading(false); setRefreshing(false); }
  }, [user, hasMore, cachedPosts]);

  useEffect(() => { load(true); }, [user]);

  const react = useCallback(async (postId: string, emoji: string) => {
    if (!user) return;
    const already = posts.find((p) => p.id === postId)?.reactions.some(
      (r) => r.emoji === emoji && r.user_id === user.id,
    ) ?? false;
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const reactions = already
        ? p.reactions.filter((r) => !(r.emoji === emoji && r.user_id === user.id))
        : [...p.reactions, { emoji, user_id: user.id }];
      return { ...p, reactions };
    }));
    try { await toggleReaction(postId, user.id, emoji, already); }
    catch { load(true); }
  }, [posts, user, load]);

  const remove = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try { await deletePost(postId); } catch { load(true); }
  }, [load]);

  const SkeletonCard = () => (
    <View style={styles.skeleton}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '90%' }]} />
        <View style={[styles.skeletonLine, { width: '75%' }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {isOffline && <NetworkError onRetry={() => { void load(true); }} />}
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f.key }}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={theme.colors.accent}
            />
          }
          onEndReached={() => { if (hasMore) load(); }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <PostCard post={item} onReact={react} onDelete={remove} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏕️</Text>
              <Text style={styles.emptyTitle}>{t('empty_title')}</Text>
              <Text style={styles.emptyBody}>{t('empty_body')}</Text>
            </View>
          }
          ListFooterComponent={loading && posts.length > 0
            ? <ActivityIndicator style={{ padding: theme.spacing.xl }} color={theme.colors.accent} />
            : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  filters: { flexDirection: 'row', paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterTab: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full, minHeight: 32, justifyContent: 'center' },
  filterTabActive: { backgroundColor: theme.colors.accentLight },
  filterText: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, fontWeight: theme.fontWeight.medium },
  filterTextActive: { color: theme.colors.accent },
  list: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  emptyContainer: { alignItems: 'center', gap: theme.spacing.md, paddingTop: theme.spacing.xxxl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textSecondary },
  emptyBody: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, textAlign: 'center' },
  skeletonContainer: { padding: theme.spacing.xl, gap: theme.spacing.md },
  skeleton: { flexDirection: 'row', gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  skeletonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border },
  skeletonLines: { flex: 1, gap: theme.spacing.sm, justifyContent: 'center' },
  skeletonLine: { height: 12, backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.full },
});
