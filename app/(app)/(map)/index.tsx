import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { EventCard } from '@/components/event/EventCard';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCityEvents } from '@/hooks/useEvents';
import type { EventWithRSVP } from '@/services/api/events';

type LatLon = { latitude: number; longitude: number };

const CITY_CENTERS: Record<string, LatLon> = {
  warszawa: { latitude: 52.2297, longitude: 21.0122 },
  krakow: { latitude: 50.0647, longitude: 19.9450 },
  wroclaw: { latitude: 51.1079, longitude: 17.0385 },
  lodz: { latitude: 51.7592, longitude: 19.4560 },
  gdansk: { latitude: 54.3520, longitude: 18.6466 },
};

const DEFAULT_CENTER: LatLon = { latitude: 52.2297, longitude: 21.0122 };

function parsePoint(wkt: string | null): LatLon | null {
  if (!wkt) return null;
  const m = wkt.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!m) return null;
  return { longitude: parseFloat(m[1]), latitude: parseFloat(m[2]) };
}

function getCityCenter(cityId: string | null | undefined): LatLon {
  if (!cityId) return DEFAULT_CENTER;
  const normalized = cityId.toLowerCase().replace(/ó/g, 'o').replace(/ł/g, 'l').replace(/ą/g, 'a');
  for (const key of Object.keys(CITY_CENTERS)) {
    if (normalized.includes(key)) return CITY_CENTERS[key];
  }
  return DEFAULT_CENTER;
}

export default function MapScreen() {
  const { t } = useTranslation('events');
  const { profile } = useAuthStore();

  const cityId = profile?.city_id ?? '';
  const { events, loading, refreshing, hasMore, load, refresh, rsvp } = useCityEvents(cityId);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [locationPrimed, setLocationPrimed] = useState(false);

  useEffect(() => { if (cityId) load(true); }, [cityId]);

  const handleMapToggle = useCallback(async () => {
    setViewMode('map');

    if (locationGranted !== null) return;

    setLocationPrimed(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');
    } catch {
      setLocationGranted(false);
    }
  }, [locationGranted]);

  const cityCenter = getCityCenter(profile?.city_id);

  const initialRegion = {
    latitude: cityCenter.latitude,
    longitude: cityCenter.longitude,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
        <View style={styles.viewToggle}>
          <Pressable
            onPress={() => setViewMode('list')}
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            accessibilityLabel={t('list_view')}
            accessibilityRole="radio"
            accessibilityState={{ checked: viewMode === 'list' }}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              {t('list_view')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleMapToggle}
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            accessibilityLabel={t('map_view')}
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
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation={locationGranted === true}
            showsMyLocationButton={locationGranted === true}
            accessibilityLabel={t('events:map_view')}
          >
            {events.map((event) => {
              const coords = parsePoint(event.location_point);
              if (!coords) return null;
              return (
                <Marker
                  key={event.id}
                  coordinate={coords}
                  pinColor={theme.colors.accent}
                >
                  <Callout
                    onPress={() => router.push(`/(app)/(map)/${event.id}` as never)}
                    tooltip={false}
                  >
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <Text style={styles.calloutDate}>
                        {format(new Date(event.starts_at), 'EEE d MMM, HH:mm', { locale: pl })}
                      </Text>
                      <Text style={styles.calloutCta}>{t('events:tap_to_view')}</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>

          {locationGranted === false && locationPrimed && (
            <View style={styles.locationBanner}>
              <Text style={styles.locationBannerText}>
                {t('events:enable_location')}
              </Text>
            </View>
          )}

          <Pressable
            style={styles.fab}
            onPress={() => router.push('/(app)/(map)/create-event' as never)}
            accessibilityLabel={t('events:create_event')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.fabIcon}>+</Text>
          </Pressable>
        </View>
      ) : loading && events.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e: EventWithRSVP) => e.id}
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
              <Text style={styles.emptyTitle}>{t('no_upcoming')}</Text>
              <Pressable
                style={styles.emptyAction}
                onPress={() => router.push('/(app)/(map)/create-event' as never)}
                accessibilityLabel={t('create_event')}
                accessibilityRole="button"
              >
                <Text style={styles.emptyActionText}>{t('create_event')}</Text>
              </Pressable>
            </View>
          }
        />
      )}
      </SafeAreaView>
    </ErrorBoundary>
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
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: theme.colors.accent },
  toggleText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  toggleTextActive: { color: '#fff', fontWeight: theme.fontWeight.semibold },
  list: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  emptyAction: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyActionText: { color: '#fff', fontWeight: theme.fontWeight.semibold },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  callout: {
    padding: theme.spacing.sm,
    maxWidth: 220,
    gap: theme.spacing.xs,
  },
  calloutTitle: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  calloutDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  calloutCta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
  },
  locationBanner: {
    position: 'absolute',
    bottom: theme.spacing.xxxl + theme.spacing.xl,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationBannerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: theme.fontWeight.regular,
    lineHeight: 32,
  },
});
