import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import type { Comment } from '@/services/api/posts';

const MAX_DEPTH = 5;

type CommentThreadProps = {
  comments: Comment[];
  onReply: (comment: Comment) => void;
  depth?: number;
};

type CommentNodeProps = {
  comment: Comment;
  onReply: (comment: Comment) => void;
  depth: number;
};

function CommentNode({ comment, onReply, depth }: CommentNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReplies = (comment.replies?.length ?? 0) > 0;
  const authorName = comment.profiles?.nickname ?? comment.profiles?.first_name ?? 'Ktoś';
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: pl });

  return (
    <View style={[styles.node, depth > 0 && { marginLeft: Math.min(depth, MAX_DEPTH) * 16 }]}>
      {/* Indent line */}
      {depth > 0 && <View style={styles.indentLine} />}

      <View style={styles.commentBody}>
        <View style={styles.header}>
          <ProceduralAvatar config={comment.profiles?.avatar_config} size={28} />
          <View style={styles.meta}>
            <Text style={styles.author}>{authorName}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
          {hasReplies && (
            <Pressable
              onPress={() => setCollapsed((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={collapsed ? 'Rozwiń' : 'Zwiń'}
            >
              <Text style={styles.collapseBtn}>{collapsed ? '▶' : '▼'}</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.content}>{comment.content}</Text>

        <Pressable
          onPress={() => onReply(comment)}
          accessibilityRole="button"
          accessibilityLabel="Odpowiedz"
          style={styles.replyBtn}
        >
          <Text style={styles.replyText}>Odpowiedz</Text>
        </Pressable>
      </View>

      {/* Replies */}
      {!collapsed && hasReplies && depth < MAX_DEPTH && (
        <CommentThread comments={comment.replies!} onReply={onReply} depth={depth + 1} />
      )}
      {!collapsed && hasReplies && depth >= MAX_DEPTH && (
        <Pressable style={styles.continueThread} accessibilityRole="button">
          <Text style={styles.continueText}>Kontynuuj wątek →</Text>
        </Pressable>
      )}
    </View>
  );
}

export function CommentThread({ comments, onReply, depth = 0 }: CommentThreadProps) {
  if (comments.length === 0) return null;
  return (
    <View style={styles.thread}>
      {comments.map((c) => (
        <CommentNode key={c.id} comment={c} onReply={onReply} depth={depth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thread: { gap: theme.spacing.sm },
  node: { position: 'relative' },
  indentLine: {
    position: 'absolute',
    left: -10,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.border,
  },
  commentBody: { gap: theme.spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  meta: { flex: 1 },
  author: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  time: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary },
  collapseBtn: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary, padding: 4 },
  content: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, lineHeight: theme.fontSize.body * 1.4 },
  replyBtn: { alignSelf: 'flex-start', paddingVertical: 2, minHeight: 32, justifyContent: 'center' },
  replyText: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: theme.fontWeight.medium },
  continueThread: { paddingVertical: theme.spacing.xs },
  continueText: { fontSize: theme.fontSize.sm, color: theme.colors.accent },
});
