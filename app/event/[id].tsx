import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchEvent, upsertRSVP, cancelEvent, type EventWithRSVP } from '@/services/api/events';

const EVENT_EMOJIS: Record<string, string> = {
  meetup: '🤝', workshop: '🛠️', sport: '⚽', walk: '🚶',
  coffee: '☕', picnic: '🧺', games: '🎲', talk: '💬', other: '📌',
};

const RSVP_OPTIONS = [
  { key: 'going' as const, label: 'Idę', emoji: '✅' },
  { key: 'maybe' as const, label: 'Może', emoji: '🤔' },
  { key: 'not_going' as const, label: 'Nie idę', emoji: '❌' },
];

export default function EventDetailScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['events', 'common']);
  const { user } = useAuthStore();

  const [event, setEvent] = useState<EventWithRSVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    fetchEvent(id, user.id).then(setEvent).catch(() => {}).finally(() => setLoading(false));
  }, [id, user]);

  async function handleRSVP(status: 'going' | 'maybe' | 'not_going') {
    if (!user || !id) return;
    setRsvping(true);
    const prev = event?.user_rsvp ?? null;
    setEvent((e) => e ? {
      ...e, user_rsvp: status,
      rsvp_count: status === 'going'
        ? e.rsvp_count + (prev === 'going' ? 0 : 1)
        : e.rsvp_count - (prev === 'going' ? 1 : 0),
    } : e);
    try { await upsertRSVP(id, user.id, status); }
    catch { if (id && user) fetchEvent(id, user.id).then(setEvent); }
    finally { setRsvping(false); }
  }

  if (loading) return (
    <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View></SafeAreaView>
  );
  if (!event) return (
    <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.errorText}>Nie znaleziono wydarzenia</Text></View></SafeAreaView>
  );

  const isCreator = event.created_by === user?.id;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.typeIcon}>
            <Text style={styles.typeEmoji}>{EVENT_EMOJIS[event.event_type] ?? '📌'}</Text>
          </View>
          {event.is_auto_generated && (
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>Propozycja Polany</Text>
            </View>
          )}
          <Text style={styles.title}>{event.title}</Text>
          {event.gromady && (
            <Text style={styles.gromadaTag}>📍 {event.gromady.name}</Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          {[
            { icon: '📅', label: format(new Date(event.starts_at), "EEEE, d MMMM yyyy 'o' HH:mm", { locale: pl }) },
            { icon: '📍', label: event.location_name },
            { icon: '👥', label: `${event.rsvp_count} osób idzie${event.max_attendees ? ` (max ${event.max_attendees})` : ''}` },
          ].map((d) => (
            <View key={d.icon} style={styles.detailRow}>
              <Text style={styles.detailIcon}>{d.icon}</Text>
              <Text style={styles.detailLabel}>{d.label}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Opis</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        {/* RSVP */}
        <View style={styles.rsvpSection}>
          <Text style={styles.sectionLabel}>Twoja odpowiedź</Text>
          <View style={styles.rsvpBtns}>
            {RSVP_OPTIONS.map((opt) => {
              const active = event.user_rsvp === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleRSVP(opt.key)}
                  disabled={rsvping}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  style={({ pressed }) => [
                    styles.rsvpBtn,
                    active && styles.rsvpBtnActive,
                    pressed && { opacity: 0.7 },
                    rsvping && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.rsvpEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.rsvpLabel, active && styles.rsvpLabelActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Cancel — creator only */}
        {isCreator && event.status === 'upcoming' && (
          <Button
            label="Odwołaj wydarzenie"
            variant="destructive"
            onPress={async () => {
              await cancelEvent(event.id);
              router.back();
            }}
            style={styles.cancelBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.body },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  headerTitle: { flex: 1, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  hero: { alignItems: 'center', gap: theme.spacing.sm },
  typeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  typeEmoji: { fontSize: 36 },
  autoBadge: { paddingHorizontal: theme.spacing.md, paddingVertical: 4, backgroundColor: theme.colors.accentLight, borderRadius: theme.borderRadius.full },
  autoBadgeText: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, textAlign: 'center' },
  gromadaTag: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  detailsCard: { backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, gap: theme.spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  detailIcon: { fontSize: 20, width: 28 },
  detailLabel: { flex: 1, fontSize: theme.fontSize.body, color: theme.colors.textPrimary, lineHeight: theme.fontSize.body * 1.5 },
  section: { gap: theme.spacing.sm },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, lineHeight: theme.fontSize.body * 1.6 },
  rsvpSection: { gap: theme.spacing.sm },
  rsvpBtns: { flexDirection: 'row', gap: theme.spacing.sm },
  rsvpBtn: { flex: 1, alignItems: 'center', gap: 4, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundCard, minHeight: 72, justifyContent: 'center' },
  rsvpBtnActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  rsvpEmoji: { fontSize: 24 },
  rsvpLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  rsvpLabelActive: { color: theme.colors.accent },
  cancelBtn: { width: '100%' },
});
