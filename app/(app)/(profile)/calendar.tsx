import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { theme } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { EventCard } from '@/components/event/EventCard';

interface RSVPEvent {
  id: string
  title: string
  type: string
  starts_at: string
  location_name: string | null
  gromada_id: string | null
  rsvp_status: 'going' | 'maybe'
}

export default function UserCalendarScreen() {
  const { t } = useTranslation('profile');
  const { user } = useAuthStore();
  const [upcoming, setUpcoming] = useState<RSVPEvent[]>([]);
  const [past, setPast] = useState<RSVPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const now = new Date().toISOString();

    Promise.all([
      supabase
        .from('event_rsvps')
        .select('status, events!inner(id, title, type, starts_at, location_name, gromada_id)')
        .eq('user_id', user.id)
        .in('status', ['going', 'maybe'])
        .gte('events.starts_at', now)
        .order('events.starts_at', { ascending: true })
        .limit(20),
      supabase
        .from('event_rsvps')
        .select('status, events!inner(id, title, type, starts_at, location_name, gromada_id)')
        .eq('user_id', user.id)
        .in('status', ['going', 'maybe'])
        .lt('events.starts_at', now)
        .order('events.starts_at', { ascending: false })
        .limit(10),
    ])
      .then(([upcomingRes, pastRes]) => {
        const toEvent = (r: { status: string; events: unknown }): RSVPEvent | null => {
          const ev = r.events as Record<string, unknown> | null;
          if (!ev) return null;
          return {
            id: ev.id as string,
            title: ev.title as string,
            type: ev.type as string,
            starts_at: ev.starts_at as string,
            location_name: ev.location_name as string | null,
            gromada_id: ev.gromada_id as string | null,
            rsvp_status: r.status as 'going' | 'maybe',
          };
        };
        setUpcoming((upcomingRes.data ?? []).map(toEvent).filter(Boolean) as RSVPEvent[]);
        setPast((pastRes.data ?? []).map(toEvent).filter(Boolean) as RSVPEvent[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Mój Kalendarz</Text>

        <Text style={styles.sectionTitle}>Nadchodzące</Text>
        {upcoming.length === 0 ? (
          <Text style={styles.empty}>Brak nadchodzących wydarzeń. Czas to zmienić!</Text>
        ) : (
          <FlatList
            data={upcoming}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EventCard event={item as unknown as Parameters<typeof EventCard>[0]['event']} />}
            scrollEnabled={false}
          />
        )}

        <Text style={[styles.sectionTitle, styles.pastTitle]}>Minione</Text>
        {past.length === 0 ? (
          <Text style={styles.empty}>Brak minionych wydarzeń.</Text>
        ) : (
          <FlatList
            data={past}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EventCard event={item as unknown as Parameters<typeof EventCard>[0]['event']} />}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  heading: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  pastTitle: { marginTop: theme.spacing.xl },
  empty: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, fontStyle: 'italic' },
});
