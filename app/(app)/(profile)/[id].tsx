import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
import { blockUser, unblockUser } from '@/services/api/safety';

export default function PublicProfileScreen(): React.JSX.Element {
  const { t } = useTranslation(['profile', 'common']);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            accessibilityLabel={t('common:back')}
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
            accessibilityLabel={t('common:back')}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('profile:public_error')}</Text>
          <Pressable
            onPress={() => { void load(); }}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common:retry')}
          >
            <Text style={styles.retryBtnText}>{t('common:retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile.nickname ?? profile.first_name;

  const friendButtonLabel = (() => {
    switch (friendStatus) {
      case 'none': return t('profile:public_add_friend');
      case 'pending_sent': return t('profile:public_friend_sent');
      case 'pending_received': return t('profile:public_friend_accept');
      case 'accepted': return t('profile:public_friend_accepted');
    }
  })();

  const friendButtonDisabled =
    friendStatus === 'pending_sent' || friendStatus === 'accepted' || friendLoading;

  const friendButtonGhost =
    friendStatus === 'pending_sent' || friendStatus === 'accepted';

  function showUndoToast(message: string, onUndo: () => void): void {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoToast({ message, onUndo });
    undoTimer.current = setTimeout(() => setUndoToast(null), 7000);
  }

  async function handleBlock(): Promise<void> {
    if (!id || !user) return;
    setMenuVisible(false);
    try {
      await blockUser(user.id, id);
      showUndoToast(
        t('profile:public_blocked', { name: profile?.first_name ?? '' }),
        async () => {
          await unblockUser(user.id, id);
          setUndoToast(null);
        },
      );
    } catch { /* silently ignore — user can retry */ }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back header */}
      <View style={styles.backRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayName}
        </Text>
        <Pressable
          onPress={() => setMenuVisible(true)}
          style={styles.menuBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common:more_options')}
        >
          <Text style={styles.menuDots}>⋯</Text>
        </Pressable>
      </View>

      {/* Safety menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        accessibilityViewIsModal
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Pressable
              style={styles.menuItem}
              onPress={() => { void handleBlock(); }}
              accessibilityRole="button"
              accessibilityLabel={t('profile:public_block')}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
                {t('profile:public_block')}
              </Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Anuluj"
            >
              <Text style={styles.menuItemText}>Anuluj</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Undo toast */}
      {undoToast && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText}>{undoToast.message}</Text>
          <Pressable
            onPress={undoToast.onUndo}
            accessibilityRole="button"
            accessibilityLabel={t('common:undo')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.undoBtn}>{t('common:undo')}</Text>
          </Pressable>
        </View>
      )}

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
            accessibilityLabel={t('profile:public_send_message')}
            accessibilityState={{ disabled: dmLoading }}
          >
            {dmLoading ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <Text style={[styles.actionBtnText, styles.actionBtnTextGhost]}>
                {t('profile:public_send_message')}
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
  menuBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  menuDots: { fontSize: 22, color: theme.colors.textSecondary, letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: theme.colors.backgroundCard,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xxxl,
    overflow: 'hidden',
  },
  menuItem: { minHeight: 56, justifyContent: 'center', paddingHorizontal: theme.spacing.xl },
  menuItemText: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: theme.colors.border },
  undoToast: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  undoText: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, flex: 1 },
  undoBtn: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },

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
