import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GromadaCard } from '@/components/gromada/GromadaCard';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { searchGromady, type GromadaWithInterests } from '@/services/api/gromady';
import { fetchCities } from '@/services/api/users';

export default function SearchScreen() {
  const { t } = useTranslation(['gromady', 'common']);
  const { profile } = useAuthStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GromadaWithInterests[]>([]);
  const [loading, setLoading] = useState(false);
  const [cityId, setCityId] = useState(profile?.city_id ?? '');
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCities().then((data) => setCities(data as { id: string; name: string }[])).catch(() => {});
    if (cityId) runSearch('');
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      if (!cityId) return;
      setLoading(true);
      try {
        const data = await searchGromady(cityId, q, []);
        setResults(data);
      } catch { /* stay empty */ }
      finally { setLoading(false); }
    },
    [cityId],
  );

  // Debounce: re-search 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel={t('common:back')}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder={t('gromady:find_gromada')}
            placeholderTextColor={theme.colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Szukaj Gromad"
          />
        </View>
      </View>

      {/* City picker */}
      {cities.length > 0 && (
        <View style={styles.cityRow}>
          {cities.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCityId(c.id)}
              style={[styles.cityChip, cityId === c.id && styles.cityChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: cityId === c.id }}
            >
              <Text style={[styles.cityChipText, cityId === c.id && styles.cityChipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <GromadaCard gromada={item} />}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t('gromady:search_empty')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    gap: theme.spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  cityRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  cityChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  cityChipActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  cityChipText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  cityChipTextActive: { color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center' },
  list: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
});
