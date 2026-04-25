import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { EventCard } from '@/components/event/EventCard';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCityEvents } from '@/hooks/useEvents';
import { fetchCities } from '@/services/api/users';

export default function MapScreen() {
  const { t } = useTranslation('events');
  const { profile, user } = useAuthStore();

  const cityId = profile?.city_id ?? '';
  const { events, loading, refreshing, hasMore, load, refresh, rsvp } = useCityEvents(cityId);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => { if (cityId) load(true); }, [cityId]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
        <View style={styles.viewToggle}>
          <Pressable
            onPress={() => setViewMode('list')}
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: viewMode === 'list' }}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              {t('list_view')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('map')}
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: viewMode === 'map' }}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              {t('map_view')}
            </Text>
          </Pressable>
        </View>
      </View>

      {viewMode === 'map' ? (
        // Map view placeholder — react-native-maps will be added in production build
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapNote}>Mapa wymaga fizycznego urządzenia lub Expo Go.</Text>
          <Pressable onPress={() => setViewMode('list')} style={styles.switchBtn}>
            <Text style={styles.switchBtnText}>Pokaż listę</Text>
          </Pressable>
        </View>
      ) : loading && events.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={refreshing}
          onEndReached={() => { if (hasMore) load(); }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <EventCard event={item} onRSVP={rsvp} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>Brak wydarzeń</Text>
              <Text style={styles.emptyBody}>Nie ma nadchodzących wydarzeń w twoim mieście.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  toggleBtn: { paddingHorizontal: theme.spacing.md, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: theme.colors.accent },
  toggleText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  toggleTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold },
  list: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', gap: theme.spacing.md, paddingTop: theme.spacing.xxxl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textSecondary },
  emptyBody: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, textAlign: 'center' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  mapEmoji: { fontSize: 80 },
  mapNote: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
  switchBtn: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.accent, borderRadius: theme.borderRadius.full, minHeight: 44, justifyContent: 'center' },
  switchBtnText: { color: '#fff', fontWeight: theme.fontWeight.semibold },
});
