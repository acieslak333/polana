import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchPublicProfile,
  fetchFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  type PublicProfile,
  type FriendshipStatus,
} from '@/services/api/users';
import { getOrCreateDM } from '@/services/api/messages';

export default function PublicProfileScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);

  const currentUserId = user?.id ?? '';

  const load = useCallback(async (): Promise<void> => {
    if (!id || !currentUserId) return;
    setLoading(true);
    setError(false);
    try {
      const [p, fs] = await Promise.all([
        fetchPublicProfile(id),
        fetchFriendshipStatus(currentUserId, id),
      ]);
      setProfile(p);
      setFriendStatus(fs);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, currentUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFriendAction(): Promise<void> {
    if (!id || friendLoading) return;
    setFriendLoading(true);
    try {
      if (friendStatus === 'none') {
        await sendFriendRequest(currentUserId, id);
        setFriendStatus('pending_sent');
      } else if (friendStatus === 'pending_received') {
        await acceptFriendRequest(id, currentUserId);
        setFriendStatus('accepted');
      }
    } catch {
      // Status unchanged — user can retry
    } finally {
      setFriendLoading(false);
    }
  }

  async function handleMessage(): Promise<void> {
    if (!id || dmLoading) return;
    setDmLoading(true);
    try {
      const roomId = await getOrCreateDM(currentUserId, id);
      router.push(`/(app)/(messages)/friend/${roomId}`);
    } catch {
      // Navigation silently fails; user can tap again
    } finally {
      setDmLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.backRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Wróć"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.backRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Wróć"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Nie można załadować profilu</Text>
          <Pressable
            onPress={() => { void load(); }}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Spróbuj ponownie"
          >
            <Text style={styles.retryBtnText}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile.nickname ?? profile.first_name;

  const friendButtonLabel = (() => {
    switch (friendStatus) {
      case 'none': return 'Dodaj do znajomych';
      case 'pending_sent': return 'Zaproszenie wysłane';
      case 'pending_received': return 'Akceptuj zaproszenie';
      case 'accepted': return 'Znajomi ✓';
    }
  })();

  const friendButtonDisabled =
    friendStatus === 'pending_sent' || friendStatus === 'accepted' || friendLoading;

  const friendButtonGhost =
    friendStatus === 'pending_sent' || friendStatus === 'accepted';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back header */}
      <View style={styles.backRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar */}
        <View style={styles.avatarRow}>
          {profile.custom_avatar_url ? (
            <Image
              source={{ uri: profile.custom_avatar_url }}
              style={styles.customAvatar}
              resizeMode="cover"
              accessibilityLabel={`Zdjęcie profilowe ${displayName}`}
            />
          ) : (
            <ProceduralAvatar config={profile.avatar_config} size={88} />
          )}
        </View>

        {/* Name */}
        <Text style={styles.name}>{displayName}</Text>
        {profile.nickname && profile.first_name !== profile.nickname && (
          <Text style={styles.firstName}>{profile.first_name}</Text>
        )}

        {/* Bio */}
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {/* Friend button — not shown for own profile (guarded in PostCard tap logic) */}
          <Pressable
            onPress={() => { void handleFriendAction(); }}
            disabled={friendButtonDisabled}
            style={[
              styles.actionBtn,
              friendButtonGhost ? styles.actionBtnGhost : styles.actionBtnPrimary,
              friendButtonDisabled && styles.actionBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={friendButtonLabel}
            accessibilityState={{ disabled: friendButtonDisabled }}
          >
            {friendLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            ) : (
              <Text
                style={[
                  styles.actionBtnText,
                  friendButtonGhost && styles.actionBtnTextGhost,
                ]}
              >
                {friendButtonLabel}
              </Text>
            )}
          </Pressable>

          {/* Message button */}
          <Pressable
            onPress={() => { void handleMessage(); }}
            disabled={dmLoading}
            style={[styles.actionBtn, styles.actionBtnGhost]}
            accessibilityRole="button"
            accessibilityLabel="Wyślij wiadomość"
            accessibilityState={{ disabled: dmLoading }}
          >
            {dmLoading ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <Text style={[styles.actionBtnText, styles.actionBtnTextGhost]}>
                Wyślij wiadomość
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
    minHeight: 52,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 28, color: theme.colors.accent },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: theme.fontSize.body,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },

  scroll: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarRow: {
    marginBottom: theme.spacing.sm,
  },
  customAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  firstName: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bio: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.fontSize.body * theme.lineHeight.relaxed,
    paddingHorizontal: theme.spacing.md,
  },

  actions: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  actionBtnPrimary: {
    backgroundColor: theme.colors.accent,
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  actionBtnTextGhost: {
    color: theme.colors.textSecondary,
  },
});
