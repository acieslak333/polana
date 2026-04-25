import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { theme } from '@/constants/theme';

type Reaction = { emoji: string; user_id: string };

type ReactionBarProps = {
  reactions: Reaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
};

type GroupedReaction = { emoji: string; count: number; reacted: boolean };

function groupReactions(reactions: Reaction[], userId: string): GroupedReaction[] {
  const map = new Map<string, GroupedReaction>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      if (r.user_id === userId) existing.reacted = true;
    } else {
      map.set(r.emoji, { emoji: r.emoji, count: 1, reacted: r.user_id === userId });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function ReactionBar({ reactions, currentUserId, onToggle }: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const grouped = groupReactions(reactions, currentUserId);

  return (
    <View style={styles.row}>
      {grouped.map((r) => (
        <Pressable
          key={r.emoji}
          onPress={() => onToggle(r.emoji)}
          accessibilityRole="button"
          accessibilityLabel={`${r.emoji} ${r.count}`}
          accessibilityState={{ selected: r.reacted }}
          style={({ pressed }) => [
            styles.chip,
            r.reacted && styles.chipActive,
            pressed && styles.chipPressed,
          ]}
        >
          <Text style={styles.emoji}>{r.emoji}</Text>
          <Text style={[styles.count, r.reacted && styles.countActive]}>{r.count}</Text>
        </Pressable>
      ))}

      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Dodaj reakcję"
        style={({ pressed }) => [styles.addBtn, pressed && styles.chipPressed]}
      >
        <Text style={styles.addIcon}>＋</Text>
      </Pressable>

      <EmojiPicker
        visible={pickerOpen}
        onSelect={(emoji) => onToggle(emoji)}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    minHeight: 32,
  },
  chipActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  chipPressed: { opacity: 0.7 },
  emoji: { fontSize: 16 },
  count: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  countActive: { color: theme.colors.accent },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { fontSize: 16, color: theme.colors.textTertiary },
});
