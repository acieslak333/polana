import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { format, isToday, isTomorrow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { theme } from '@/constants/theme';
import type { EventWithRSVP } from '@/services/api/events';

const EVENT_EMOJIS: Record<string, string> = {
  meetup: '🤝', workshop: '🛠️', sport: '⚽', walk: '🚶',
  coffee: '☕', picnic: '🧺', games: '🎲', talk: '💬', other: '📌',
};

const RSVP_STYLES: Record<string, { bg: string; label: string }> = {
  going: { bg: theme.colors.success, label: 'Idę' },
  maybe: { bg: theme.colors.warmGold, label: 'Może' },
  not_going: { bg: theme.colors.textTertiary, label: 'Nie idę' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return `Dziś, ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Jutro, ${format(d, 'HH:mm')}`;
  return format(d, "d MMM, HH:mm", { locale: pl });
}

type EventCardProps = {
  event: EventWithRSVP;
  onRSVP?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
};

function EventCardBase({ event, onRSVP }: EventCardProps) {
  const rsvpStyle = event.user_rsvp ? RSVP_STYLES[event.user_rsvp] : null;

  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      testID="event-card"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Type icon */}
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{EVENT_EMOJIS[event.event_type] ?? '📌'}</Text>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>

        {/* Meta */}
        <Text style={styles.meta}>
          {formatDate(event.starts_at)} · {event.location_name}
        </Text>

        {/* Gromada badge */}
        {event.gromady && (
          <Text style={styles.gromadaLabel}>{event.gromady.name}</Text>
        )}

        {/* RSVP row */}
        <View style={styles.rsvpRow}>
          <Text style={styles.attendees}>
            {event.rsvp_count} {event.rsvp_count === 1 ? 'osoba idzie' : 'osób idzie'}
          </Text>
          {onRSVP && (
            <View style={styles.rsvpBtns}>
              {(['going', 'maybe', 'not_going'] as const).map((status) => {
                const s = RSVP_STYLES[status];
                const active = event.user_rsvp === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => onRSVP(event.id, status)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={s.label}
                    testID={`rsvp-${status}-button`}
                    style={({ pressed }) => [
                      styles.rsvpBtn,
                      active && { backgroundColor: s.bg },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.rsvpBtnText, active && styles.rsvpBtnTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const EventCard = React.memo(EventCardBase);
export default EventCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: { opacity: 0.75 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 24 },
  content: { flex: 1, gap: theme.spacing.xs },
  title: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  meta: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  gromadaLabel: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.medium },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: 2 },
  attendees: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary, flex: 1 },
  rsvpBtns: { flexDirection: 'row', gap: 4 },
  rsvpBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 28,
    justifyContent: 'center',
  },
  rsvpBtnText: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  rsvpBtnTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold },
});
