import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

type WarmthIndicatorProps = {
  meetingsThisMonth: number;
  favorsExchanged: number;
  memberCount: number;
  compact?: boolean;
};

function calcWarmth(meetings: number, favors: number, members: number): number {
  const raw = meetings * 3 + favors * 2 + members;
  // Normalise to 0–100 (cap at 100)
  return Math.min(100, Math.round(raw));
}

function warmthEmoji(score: number): string {
  if (score >= 80) return '🔥';
  if (score >= 50) return '🌿';
  if (score >= 20) return '🌱';
  return '❄️';
}

function warmthColor(score: number): string {
  if (score >= 80) return theme.colors.accent;
  if (score >= 50) return theme.colors.success;
  if (score >= 20) return theme.colors.warmGold;
  return theme.colors.textTertiary;
}

export function WarmthIndicator({
  meetingsThisMonth,
  favorsExchanged,
  memberCount,
  compact = false,
}: WarmthIndicatorProps) {
  const score = calcWarmth(meetingsThisMonth, favorsExchanged, memberCount);
  const color = warmthColor(score);
  const emoji = warmthEmoji(score);

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.scoreCompact, { color }]}>{score}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>Ciepło Gromady</Text>
        <Text style={[styles.score, { color }]}>{score}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.xs },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  emoji: { fontSize: 16 },
  label: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  score: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  track: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  scoreCompact: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
});
