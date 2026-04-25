import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TextInput, Pressable, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PostCard } from '@/components/feed/PostCard';
import { EventPinned } from '@/components/gromada/EventPinned';
import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useGromadaPosts } from '@/hooks/usePosts';
import { fetchGromada, fetchUpcomingEvents, type GromadaWithInterests } from '@/services/api/gromady';

const MAX_POST = 5000;

export default function GromadaPanelScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['gromady', 'feed', 'common']);
  const { user } = useAuthStore();

  const [gromada, setGromada] = useState<GromadaWithInterests | null>(null);
  const [nextEvent, setNextEvent] = useState<any | null>(null);
  const [gLoading, setGLoading] = useState(true);
  const [composer, setComposer] = useState('');
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { posts, loading, refreshing, hasMore, load, refresh, addPost, removePost, react } =
    useGromadaPosts(id!);

  const isElder = gromada?.elder_id === user?.id;
  const isMember = gromada?.gromada_members?.some((m) => m.user_id === user?.id) ?? false;
  const charNearLimit = composer.length >= MAX_POST - 20;
  const charColor = composer.length >= MAX_POST
    ? theme.colors.error
    : composer.length >= MAX_POST - 10
    ? theme.colors.warning
    : theme.colors.textTertiary;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchGromada(id).then(setGromada),
      fetchUpcomingEvents(id).then((evts) => setNextEvent(evts[0] ?? null)),
    ])
      .catch(() => {})
      .finally(() => setGLoading(false));
    load();
  }, [id]);

  async function handlePost() {
    if (!composer.trim() || posting) return;
    setPosting(true);
    await addPost(composer.trim());
    setComposer('');
    setPosting(false);
  }

  const renderHeader = useCallback(() => (
    <View style={styles.panelHeader}>
      {/* Gromada identity */}
      <View style={styles.identity}>
        <ProceduralAvatar config={gromada?.avatar_config} size={56} />
        <View style={styles.identityText}>
          <Text style={styles.gromadaName}>{gromada?.name ?? '…'}</Text>
          <Text style={styles.memberCount}>
            {gromada?.member_count ?? 0}/{gromada?.max_members ?? 24} osób
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(`/(app)/(gromady)/${id}/info`)}
          style={styles.infoBtn}
          accessibilityRole="button"
          accessibilityLabel="O Gromadzie"
        >
          <Text style={styles.infoBtnText}>ℹ️</Text>
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {[
          { label: 'Posty', active: true },
          { label: 'Kalendarz', onPress: () => router.push(`/(app)/(gromady)/${id}/calendar`) },
          { label: 'Członkowie', onPress: () => router.push(`/(app)/(gromady)/${id}/members`) },
        ].map((tab) => (
          <Pressable
            key={tab.label}
            onPress={tab.onPress}
            style={[styles.tab, tab.active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab.active }}
          >
            <Text style={[styles.tabText, tab.active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Pinned event */}
      {nextEvent && (
        <View style={styles.pinnedContainer}>
          <EventPinned event={nextEvent} />
        </View>
      )}
    </View>
  ), [gromada, nextEvent, id]);

  if (gLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.feedList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.accent} />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>{t('feed:empty_title')}</Text>
                <Text style={styles.emptyBody}>{t('feed:empty_body')}</Text>
              </View>
            ) : null
          }
          onEndReached={() => { if (hasMore) load(); }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onReact={react}
              onDelete={removePost}
              isElder={isElder}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        />

        {/* Composer */}
        {isMember && (
          <View style={styles.composer}>
            <TextInput
              ref={inputRef}
              style={styles.composerInput}
              placeholder={t('feed:write_something')}
              placeholderTextColor={theme.colors.textTertiary}
              value={composer}
              onChangeText={(v) => setComposer(v.slice(0, MAX_POST))}
              multiline
              maxLength={MAX_POST}
              accessibilityLabel={t('feed:write_something')}
            />
            {charNearLimit && (
              <Text style={[styles.charCount, { color: charColor }]}>
                {MAX_POST - composer.length}
              </Text>
            )}
            <Pressable
              onPress={handlePost}
              disabled={!composer.trim() || posting}
              accessibilityRole="button"
              accessibilityLabel={t('feed:post_cta')}
              style={({ pressed }) => [
                styles.sendBtn,
                (!composer.trim() || posting) && styles.sendBtnDisabled,
                pressed && styles.sendBtnPressed,
              ]}
            >
              {posting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.sendIcon}>↑</Text>}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panelHeader: { gap: theme.spacing.md, paddingBottom: theme.spacing.md },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  identityText: { flex: 1 },
  gromadaName: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  memberCount: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  infoBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  infoBtnText: { fontSize: 22 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
  },
  tab: { paddingVertical: theme.spacing.md, marginRight: theme.spacing.xl, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: theme.colors.accent },
  tabText: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, fontWeight: theme.fontWeight.medium },
  tabTextActive: { color: theme.colors.accent },
  pinnedContainer: { paddingHorizontal: theme.spacing.xl },
  feedList: { padding: theme.spacing.xl, paddingTop: 0, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  emptyContainer: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xxxl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary },
  emptyBody: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, textAlign: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
  charCount: { position: 'absolute', right: 60, bottom: 16, fontSize: theme.fontSize.xs },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnPressed: { opacity: 0.8 },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: theme.fontWeight.bold },
});
