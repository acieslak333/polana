import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PostCard } from '@/components/feed/PostCard';
import { CommentThread } from '@/components/feed/CommentThread';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchPost, fetchComments, createComment, toggleReaction, type Post, type Comment } from '@/services/api/posts';

export default function PostDetailScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['feed', 'common']);
  const { user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [composerText, setComposerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchPost(id), fetchComments(id)])
      .then(([p, c]) => { setPost(p); setComments(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function handleReply(comment: Comment) {
    setReplyTo(comment);
    inputRef.current?.focus();
  }

  async function handleSubmit() {
    if (!composerText.trim() || !user || !id || submitting) return;
    setSubmitting(true);

    // Optimistic comment
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      post_id: id,
      author_id: user.id,
      parent_comment_id: replyTo?.id ?? null,
      content: composerText.trim(),
      is_hidden: false,
      created_at: new Date().toISOString(),
      profiles: null,
      replies: [],
    };

    if (replyTo) {
      setComments((prev) => insertReply(prev, replyTo.id, optimistic));
    } else {
      setComments((prev) => [...prev, optimistic]);
    }
    setComposerText('');
    setReplyTo(null);

    try {
      const real = await createComment({
        post_id: id,
        author_id: user.id,
        content: optimistic.content,
        parent_comment_id: replyTo?.id ?? null,
      });
      // Replace optimistic
      setComments((prev) => replaceComment(prev, optimistic.id, real));
      setPost((prev) => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev);
    } catch {
      // Revert
      setComments((prev) => removeComment(prev, optimistic.id));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReact(postId: string, emoji: string) {
    if (!user || !post) return;
    const already = post.reactions.some((r) => r.emoji === emoji && r.user_id === user.id);
    setPost((prev) => {
      if (!prev) return prev;
      const reactions = already
        ? prev.reactions.filter((r) => !(r.emoji === emoji && r.user_id === user.id))
        : [...prev.reactions, { emoji, user_id: user.id }];
      return { ...prev, reactions };
    });
    try { await toggleReaction(postId, user.id, emoji, already); }
    catch { /* revert */
      setPost((prev) => {
        if (!prev) return prev;
        const reactions = already
          ? [...prev.reactions, { emoji, user_id: user.id }]
          : prev.reactions.filter((r) => !(r.emoji === emoji && r.user_id === user.id));
        return { ...prev, reactions };
      });
    }
  }

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('feed:title')}</Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={post ? (
            <View style={styles.postContainer}>
              <PostCard post={post} onReact={handleReact} />
              <Text style={styles.commentsLabel}>
                {t('feed:comments_count', { count: post.comment_count })}
              </Text>
            </View>
          ) : null}
          renderItem={({ item }) => (
            <CommentThread comments={[item]} onReply={handleReply} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>{t('feed:no_comments')}</Text>
            </View>
          }
        />

        {/* Composer */}
        <View style={styles.composer}>
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyText}>
                ↩ {replyTo.profiles?.nickname ?? replyTo.profiles?.first_name ?? '?'}
              </Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                <Text style={styles.replyCancel}>✕</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.composerRow}>
            <TextInput
              ref={inputRef}
              style={styles.composerInput}
              placeholder={t('feed:comment_placeholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={composerText}
              onChangeText={(v) => setComposerText(v.slice(0, 2000))}
              multiline
              maxLength={2000}
              accessibilityLabel={t('feed:comment_placeholder')}
            />
            <Pressable
              onPress={handleSubmit}
              disabled={!composerText.trim() || submitting}
              accessibilityRole="button"
              accessibilityLabel={t('common:send')}
              style={({ pressed }) => [
                styles.sendBtn,
                (!composerText.trim() || submitting) && styles.sendBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.sendIcon}>↑</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Tree helpers ──────────────────────────────────────────────────────

function insertReply(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...(c.replies ?? []), reply] };
    if (c.replies?.length) return { ...c, replies: insertReply(c.replies, parentId, reply) };
    return c;
  });
}

function replaceComment(comments: Comment[], oldId: string, replacement: Comment): Comment[] {
  return comments.map((c) => {
    if (c.id === oldId) return replacement;
    if (c.replies?.length) return { ...c, replies: replaceComment(c.replies, oldId, replacement) };
    return c;
  });
}

function removeComment(comments: Comment[], id: string): Comment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => c.replies?.length ? { ...c, replies: removeComment(c.replies, id) } : c);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  list: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.sm },
  postContainer: { gap: theme.spacing.md, marginBottom: theme.spacing.md },
  commentsLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyComments: { paddingTop: theme.spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary },
  composer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
  },
  replyIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs, gap: theme.spacing.sm },
  replyText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.accent },
  replyCancel: { fontSize: 14, color: theme.colors.textTertiary, padding: 4 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm },
  composerInput: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: theme.fontWeight.bold },
});
