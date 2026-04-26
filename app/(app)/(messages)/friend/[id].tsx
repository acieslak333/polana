import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchPublicProfile,
  fetchFriendshipStatus,
  sendFriendRequest,
  type PublicProfile,
  type FriendshipStatus,
} from '@/services/api/users';
import { getOrCreateDM } from '@/services/api/messages';

export default function FriendProfileScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([
      fetchPublicProfile(id),
      fetchFriendshipStatus(user.id, id),
    ])
      .then(([p, s]) => { setProfile(p); setFriendStatus(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, user]);

  async function handleAddFriend() {
    if (!user || !id) return;
    setActing(true);
    try {
      await sendFriendRequest(user.id, id);
      setFriendStatus('pending_sent');
    } catch { /* toast */}
    finally { setActing(false); }
  }

  async function handleDM() {
    if (!user || !id) return;
    setActing(true);
    try {
      const roomId = await getOrCreateDM(user.id, id);
      router.push(`/(app)/(messages)/chat/${roomId}`);
    } finally { setActing(false); }
  }

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
    </SafeAreaView>
  );

  if (!profile) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><Text style={styles.errorText}>Nie znaleziono profilu</Text></View>
    </SafeAreaView>
  );

  const displayName = profile.nickname ?? profile.first_name;
  const isOwnProfile = id === user?.id;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <ProceduralAvatar config={profile.avatar_config} size={80} />
          <Text style={styles.name}>{displayName}</Text>
          {profile.nickname && (
            <Text style={styles.firstName}>{profile.first_name}</Text>
          )}
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}
        </View>

        {!isOwnProfile && (
          <View style={styles.actions}>
            {friendStatus === 'accepted' && (
              <Button
                label="Wyślij wiadomość"
                onPress={handleDM}
                loading={acting}
                size="lg"
                style={styles.btn}
              />
            )}

            {friendStatus === 'none' && (
              <Button
                label="Dodaj do znajomych"
                onPress={handleAddFriend}
                loading={acting}
                size="lg"
                style={styles.btn}
              />
            )}

            {friendStatus === 'pending_sent' && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Zaproszenie wysłane</Text>
              </View>
            )}

            {friendStatus === 'pending_received' && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Czeka na Twoją odpowiedź</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  identity: { alignItems: 'center', gap: theme.spacing.sm },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  firstName: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary },
  bio: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.fontSize.body * 1.5,
  },
  actions: { gap: theme.spacing.sm },
  btn: { width: '100%' },
  statusBadge: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statusText: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary },
});
