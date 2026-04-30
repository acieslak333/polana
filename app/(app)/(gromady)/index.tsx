import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GromadaCard } from '@/components/gromada/GromadaCard';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchMyGromady, type GromadaWithInterests } from '@/services/api/gromady';

export default function GromadyScreen() {
  const { t } = useTranslation('gromady');
  const { user } = useAuthStore();
  const [gromady, setGromady] = useState<GromadaWithInterests[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchMyGromady(user.id);
      setGromady(data);
    } catch { /* show empty state */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe}>
        <FlatList
        data={gromady}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={theme.colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t('title')}</Text>
            <Pressable
              onPress={() => router.push('/(app)/(gromady)/search')}
              style={styles.searchBtn}
              accessibilityRole="button"
              accessibilityLabel={t('common:search_gromady')}
            >
              <Text style={styles.searchIcon}>🔍</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>{t('empty_title')}</Text>
            <Text style={styles.emptyBody}>{t('empty_body')}</Text>
            <Pressable
              onPress={() => router.push('/(app)/(gromady)/search')}
              style={styles.findBtn}
              accessibilityRole="button"
            >
              <Text style={styles.findBtnText}>{t('find_gromada')}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <GromadaCard gromada={item} />}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        ListFooterComponent={
          gromady.length < 3 ? (
            <Pressable
              onPress={() => router.push('/(app)/(gromady)/create')}
              style={styles.createBtn}
              accessibilityRole="button"
            >
              <Text style={styles.createBtnText}>+ {t('create_gromada')}</Text>
            </Pressable>
          ) : null
        }
      />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: theme.spacing.xl, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  searchBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchIcon: { fontSize: 22 },
  emptyContainer: { alignItems: 'center', gap: theme.spacing.md, paddingTop: theme.spacing.xxxl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  emptyBody: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center' },
  findBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    minHeight: 44,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  findBtnText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.body },
  createBtn: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  createBtnText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
});
