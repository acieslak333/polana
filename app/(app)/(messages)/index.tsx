import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchChatRooms, type ChatRoom } from '@/services/api/messages';

export default function MessagesScreen() {
  const { t } = useTranslation('messages');
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchChatRooms(user.id).then(setRooms).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/(messages)/chat/${item.id}`)}
              style={({ pressed }) => [styles.roomRow, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={item.display_name ?? item.type}
            >
              <ProceduralAvatar config={item.display_avatar} size={48} />
              <View style={styles.roomInfo}>
                <Text style={styles.roomName} numberOfLines={1}>{item.display_name ?? item.type}</Text>
                {item.last_message && (
                  <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message}</Text>
                )}
              </View>
              {item.last_message_at && (
                <Text style={styles.time}>
                  {formatDistanceToNow(new Date(item.last_message_at), { locale: pl, addSuffix: false })}
                </Text>
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>{t('empty_chats')}</Text>
              <Text style={styles.emptyBody}>{t('empty_chats_body')}</Text>
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
  header: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: theme.spacing.xxxl },
  roomRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md, minHeight: 72 },
  roomInfo: { flex: 1 },
  roomName: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  lastMsg: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, marginTop: 2 },
  time: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary },
  separator: { height: 1, backgroundColor: theme.colors.borderSubtle, marginLeft: 76 },
  emptyContainer: { alignItems: 'center', gap: theme.spacing.md, paddingTop: theme.spacing.xxxl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textSecondary },
  emptyBody: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
});
