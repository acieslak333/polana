import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import type { Message } from '@/services/api/messages';

type ChatBubbleProps = {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
};

export function ChatBubble({ message, isOwn, showAvatar = true }: ChatBubbleProps) {
  const isOptimistic = message.id.startsWith('opt-');
  const time = format(new Date(message.created_at), 'HH:mm');
  const senderName = message.profiles?.nickname ?? message.profiles?.first_name ?? '';

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && showAvatar ? (
        <ProceduralAvatar config={message.profiles?.avatar_config} size={28} />
      ) : (
        <View style={styles.avatarSpacer} />
      )}

      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && senderName ? (
          <Text style={styles.senderName}>{senderName}</Text>
        ) : null}
        <Text style={[styles.body, isOwn && styles.bodyOwn]}>{message.body}</Text>
        <Text style={[styles.time, isOwn && styles.timeOwn, isOptimistic && styles.timePending]}>
          {isOptimistic ? '…' : time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm, maxWidth: '85%', marginBottom: 2 },
  rowOwn: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatarSpacer: { width: 28 },
  bubble: {
    padding: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 4,
    gap: 2,
    maxWidth: 280,
    backgroundColor: theme.colors.backgroundElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleOwn: {
    backgroundColor: theme.colors.accent,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: 4,
    borderColor: theme.colors.accent,
  },
  bubbleOther: {},
  senderName: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  body: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary, lineHeight: theme.fontSize.body * 1.4 },
  bodyOwn: { color: '#fff' },
  time: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary, alignSelf: 'flex-end' },
  timeOwn: { color: 'rgba(255,255,255,0.6)' },
  timePending: { fontStyle: 'italic' },
});
