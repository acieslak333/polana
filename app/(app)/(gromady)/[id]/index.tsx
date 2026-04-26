import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TextInput, Pressable, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { PostCard } from '@/components/feed/PostCard';
import { EventPinned } from '@/components/gromada/EventPinned';
import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useGromadaPosts } from '@/hooks/usePosts';
import { fetchGromada, fetchUpcomingEvents, type GromadaWithInterests } from '@/services/api/gromady';
import { uploadPostImage } from '@/services/api/media';

const MAX_POST = 5000;

// Minimal toast — renders as a floating text overlay for 5 s
function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    const id = setTimeout(onHide, 5000);
    return () => clearTimeout(id);
  }, [onHide]);

  return (
    <View style={toastStyles.container} accessibilityLiveRegion="polite">
      <Text style={toastStyles.text}>{message}</Text>
    </View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});

export default function GromadaPanelScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['gromady', 'feed', 'common']);
  const { user } = useAuthStore();

  const [gromada, setGromada] = useState<GromadaWithInterests | null>(null);
  const [nextEvent, setNextEvent] = useState<{ id: string; title: string; location_name: string; starts_at: string; event_type: string } | null>(null);
  const [gLoading, setGLoading] = useState(true);
  const [composer, setComposer] = useState('');
  const [posting, setPosting] = useState(false);

  // Image attachment state
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  const { posts, loading, refreshing, hasMore, load, refresh, addPost, removePost, react } =
    useGromadaPosts(id!);

  const isElder = gromada?.elder_id === user?.id;
  const isMember = gromada?.gromada_members?.some((m: { user_id: string }) => m.user_id === user?.id) ?? false;
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

  async function pickImage(): Promise<void> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPendingImageUri(result.assets[0].uri);
      }
    } catch {
      setToastMessage('Nie udało się otworzyć galerii');
    }
  }

  async function handlePost(): Promise<void> {
    if ((!composer.trim() && !pendingImageUri) || posting) return;
    setPosting(true);

    let uploadedUrls: string[] = [];

    if (pendingImageUri && user) {
      setUploadingImage(true);
      try {
        const url = await uploadPostImage(user.id, pendingImageUri);
        uploadedUrls = [url];
      } catch {
        setToastMessage('Nie udało się przesłać zdjęcia');
        // Continue posting without the image
      } finally {
        setUploadingImage(false);
      }
    }

    await addPost(composer.trim(), uploadedUrls);
    setComposer('');
    setPendingImageUri(null);
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

  const sendDisabled = (!composer.trim() && !pendingImageUri) || posting;

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
          <View style={styles.composerWrapper}>
            {/* Image preview thumbnail */}
            {pendingImageUri && (
              <View style={styles.previewRow}>
                <Image
                  source={{ uri: pendingImageUri }}
                  style={styles.previewThumb}
                  resizeMode="cover"
                  accessibilityLabel="Podgląd wybranego zdjęcia"
                />
                <Pressable
                  onPress={() => setPendingImageUri(null)}
                  style={styles.previewRemove}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Usuń zdjęcie"
                >
                  <Text style={styles.previewRemoveText}>✕</Text>
                </Pressable>
              </View>
            )}

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

              {/* Image attach button */}
              <Pressable
                onPress={pickImage}
                disabled={posting}
                accessibilityRole="button"
                accessibilityLabel="Dodaj zdjęcie"
                style={({ pressed }) => [
                  styles.attachBtn,
                  pressed && styles.attachBtnPressed,
                  posting && styles.attachBtnDisabled,
                ]}
              >
                <Text style={styles.attachIcon}>📷</Text>
              </Pressable>

              {/* Send button */}
              <Pressable
                onPress={handlePost}
                disabled={sendDisabled}
                accessibilityRole="button"
                accessibilityLabel={t('feed:post_cta')}
                style={({ pressed }) => [
                  styles.sendBtn,
                  sendDisabled && styles.sendBtnDisabled,
                  pressed && styles.sendBtnPressed,
                ]}
              >
                {posting || uploadingImage
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.sendIcon}>↑</Text>}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
      )}
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
  composerWrapper: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  // Image preview above the input row
  previewRow: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewThumb: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
  },
  previewRemove: {
    marginLeft: theme.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRemoveText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
  charCount: { position: 'absolute', right: 100, bottom: 16, fontSize: theme.fontSize.xs },
  // Attach image button
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnPressed: { opacity: 0.7 },
  attachBtnDisabled: { opacity: 0.4 },
  attachIcon: { fontSize: 18 },
  // Send button
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
