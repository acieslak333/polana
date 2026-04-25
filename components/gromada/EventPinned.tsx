import { Pressable, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { format, isToday, isTomorrow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { theme } from '@/constants/theme';

type EventPinnedProps = {
  event: {
    id: string;
    title: string;
    location_name: string;
    starts_at: string;
    event_type: string;
  };
};

const EVENT_EMOJIS: Record<string, string> = {
  meetup: '🤝', workshop: '🛠️', sport: '⚽', walk: '🚶',
  coffee: '☕', picnic: '🧺', games: '🎲', talk: '💬', other: '📌',
};

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return `Dziś, ${format(date, 'HH:mm')}`;
  if (isTomorrow(date)) return `Jutro, ${format(date, 'HH:mm')}`;
  return format(date, "d MMM, HH:mm", { locale: pl });
}

export function EventPinned({ event }: EventPinnedProps) {
  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{EVENT_EMOJIS[event.event_type] ?? '📌'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Najbliższe spotkanie</Text>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.meta}>
          {formatEventDate(event.starts_at)} · {event.location_name}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.accentLight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: `${theme.colors.accent}40`,
  },
  pressed: { opacity: 0.75 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  label: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  meta: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  chevron: { fontSize: theme.fontSize.xl, color: theme.colors.accent },
});
