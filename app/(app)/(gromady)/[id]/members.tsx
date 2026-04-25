import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/constants/theme';
import { fetchGromadaMembers } from '@/services/api/gromady';

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { id: string; first_name: string; nickname: string | null; avatar_config: Record<string, unknown> } | null;
};

const ROLE_LABELS: Record<string, string> = {
  elder: 'Elder',
  member: 'Członek',
  newcomer: 'Nowicjusz',
};

export default function MembersScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['gromady', 'common']);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchGromadaMembers(id)
      .then((data) => setMembers(data as unknown as Member[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common:back')} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('gromady:members')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.user_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = item.profiles?.nickname ?? item.profiles?.first_name ?? 'Ktoś';
            return (
              <View style={styles.row}>
                <ProceduralAvatar config={item.profiles?.avatar_config} size={44} />
                <Text style={styles.name}>{name}</Text>
                <Badge
                  label={ROLE_LABELS[item.role] ?? item.role}
                  variant={item.role === 'elder' ? 'accent' : 'default'}
                />
                <Pressable
                  onPress={() => router.push(`/(app)/(messages)/friend/${item.user_id}`)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Profil"
                  style={styles.profileBtn}
                >
                  <Text style={styles.profileBtnText}>›</Text>
                </Pressable>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: theme.spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.sm, minHeight: 60 },
  name: { flex: 1, fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.medium, color: theme.colors.textPrimary },
  separator: { height: 1, backgroundColor: theme.colors.borderSubtle },
  profileBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  profileBtnText: { fontSize: 22, color: theme.colors.textTertiary },
});
