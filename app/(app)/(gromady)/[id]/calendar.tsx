import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { theme } from '@/constants/theme';
import { supabase } from '@/services/supabase';

const EVENT_EMOJIS: Record<string, string> = {
  meetup: '🤝', workshop: '🛠️', sport: '⚽', walk: '🚶',
  coffee: '☕', picnic: '🧺', games: '🎲', talk: '💬', other: '📌',
};

type CalEvent = { id: string; title: string; location_name: string; starts_at: string; event_type: string; status: string };

function EventRow({ event }: { event: CalEvent }) {
  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      style={({ pressed }) => [styles.eventRow, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{EVENT_EMOJIS[event.event_type] ?? '📌'}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventMeta}>
          {format(new Date(event.starts_at), 'd MMM yyyy, HH:mm', { locale: pl })} · {event.location_name}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function GromadaCalendarScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['events', 'common']);
  const [upcoming, setUpcoming] = useState<CalEvent[]>([]);
  const [past, setPast] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const now = new Date().toISOString();
    Promise.all([
      supabase.from('events').select('id,title,location_name,starts_at,event_type,status')
        .eq('gromada_id', id).gte('starts_at', now).order('starts_at').limit(20),
      supabase.from('events').select('id,title,location_name,starts_at,event_type,status')
        .eq('gromada_id', id).lt('starts_at', now).order('starts_at', { ascending: false }).limit(20),
    ]).then(([upRes, pastRes]) => {
      setUpcoming((upRes.data ?? []) as CalEvent[]);
      setPast((pastRes.data ?? []) as CalEvent[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('events:title')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>
      ) : (
        <FlatList
          data={[
            { key: 'upcoming-header', type: 'header', label: t('events:upcoming') },
            ...upcoming.map((e) => ({ key: e.id, type: 'event', event: e })),
            { key: 'divider', type: 'divider' },
            { key: 'past-header', type: 'header', label: t('events:past') },
            ...past.map((e) => ({ key: e.id + '-past', type: 'event', event: e })),
          ]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => {
            if (item.type === 'header') return <Text style={styles.sectionLabel}>{item.label}</Text>;
            if (item.type === 'divider') return <View style={styles.divider} />;
            return <EventRow event={item.event} />;
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: theme.spacing.xl, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, minHeight: 68 },
  iconBox: { width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  eventMeta: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  chevron: { fontSize: theme.fontSize.xl, color: theme.colors.textTertiary },
});
