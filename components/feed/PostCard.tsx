import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, ActionSheetIOS, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { ReactionBar } from './ReactionBar';
import { theme } from '@/constants/theme';
import type { Post } from '@/services/api/posts';
import { reportPost, hidePost } from '@/services/api/posts';
import { useAuthStore } from '@/stores/authStore';

const MAX_LINES = 4;

// Maximum images rendered in a grid
const MAX_GRID_IMAGES = 4;

type PostCardProps = {
  post: Post;
  onReact: (postId: string, emoji: string) => void;
  onDelete?: (postId: string) => void;
  isElder?: boolean;
};

function PostCardBase({ post, onReact, onDelete, isElder = false }: PostCardProps) {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const isOwn = post.author_id === user?.id;
  const canModerate = isOwn || isElder;

  const authorName = post.profiles?.nickname ?? post.profiles?.first_name ?? 'Ktoś';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pl });

  const mediaUrls = Array.isArray(post.media_urls)
    ? post.media_urls.slice(0, MAX_GRID_IMAGES)
    : [];
  const hasMedia = mediaUrls.length > 0;
  const isSingle = mediaUrls.length === 1;

  function openMenu() {
    const options = canModerate
      ? ['Ukryj post', 'Usuń post', 'Anuluj']
      : ['Zgłoś post', 'Anuluj'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: canModerate ? 1 : undefined },
        async (idx) => {
          if (canModerate) {
            if (idx === 0) await hidePost(post.id, true);
            if (idx === 1 && onDelete) onDelete(post.id);
          } else {
            if (idx === 0 && user) await reportPost(post.id, user.id, 'inappropriate');
          }
        },
      );
    } else {
      Alert.alert(
        'Opcje posta',
        undefined,
        canModerate
          ? [
              { text: 'Ukryj', onPress: () => hidePost(post.id, true) },
              { text: 'Usuń', style: 'destructive', onPress: () => onDelete?.(post.id) },
              { text: 'Anuluj', style: 'cancel' },
            ]
          : [
              { text: 'Zgłoś', onPress: () => user && reportPost(post.id, user.id, 'inappropriate') },
              { text: 'Anuluj', style: 'cancel' },
            ],
      );
    }
  }

  function handleAuthorPress(): void {
    if (isOwn) {
      router.push('/(app)/(profile)');
    } else {
      router.push(`/(app)/(profile)/${post.author_id}`);
    }
  }

  return (
    <View style={styles.card}>
      {/* Header — author area taps to profile; menu button is independent */}
      <View style={styles.header}>
        <Pressable
          onPress={handleAuthorPress}
          accessibilityRole="button"
          accessibilityLabel={`Profil ${authorName}`}
          style={styles.authorPressable}
        >
          <View accessibilityRole="none">
            <ProceduralAvatar config={post.profiles?.avatar_config} size={36} />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={openMenu}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Opcje"
          style={styles.menuBtn}
        >
          <Text style={styles.menuIcon}>•••</Text>
        </Pressable>
      </View>

      {/* Text content */}
      {post.content ? (
        <View>
          <Text
            style={styles.content}
            numberOfLines={expanded ? undefined : MAX_LINES}
          >
            {post.content}
          </Text>
          {!expanded && post.content.length > 200 && (
            <Pressable
              onPress={() => setExpanded(true)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Pokaż więcej"
            >
              <Text style={styles.expand}>Pokaż więcej</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Media */}
      {hasMedia && isSingle && (
        <Image
          source={{ uri: mediaUrls[0] }}
          style={styles.singleImage}
          resizeMode="cover"
          accessibilityLabel="Zdjęcie w poście"
        />
      )}

      {hasMedia && !isSingle && (
        <View style={styles.imageGrid}>
          {mediaUrls.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              style={styles.gridImage}
              resizeMode="cover"
              accessibilityLabel="Zdjęcie w poście"
            />
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <ReactionBar
          reactions={post.reactions}
          currentUserId={user?.id ?? ''}
          onToggle={(emoji) => onReact(post.id, emoji)}
        />
        <Pressable
          onPress={() => router.push(`/(app)/(feed)/post/${post.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`${post.comment_count} komentarzy`}
          style={styles.commentBtn}
        >
          <Text style={styles.commentIcon}>💬</Text>
          {post.comment_count > 0 && (
            <Text style={styles.commentCount}>{post.comment_count}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export const PostCard = React.memo(PostCardBase);
export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 44,
  },
  authorPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 44,
  },
  authorInfo: { flex: 1 },
  authorName: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  time: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  menuBtn: { padding: theme.spacing.xs, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, letterSpacing: 1 },
  content: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary, lineHeight: theme.fontSize.body * theme.lineHeight.normal },
  expand: { fontSize: theme.fontSize.sm, color: theme.colors.accent, marginTop: 2 },
  // Single image: full width, fixed height
  singleImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
  },
  // Grid: 2-column, each ~48% width
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  gridImage: {
    width: '48%',
    height: 140,
    borderRadius: theme.borderRadius.sm,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, minHeight: 32 },
  commentIcon: { fontSize: 16 },
  commentCount: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
