import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/auth';

export default function ProfileScreen() {
  const { t } = useTranslation(['profile', 'auth', 'common']);
  const { profile, user, reset } = useAuthStore();

  async function handleSignOut() {
    try { await signOut(); } catch { /* already gone */ }
    reset();
  }

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), 'd MMMM yyyy', { locale: pl })
    : '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.push('/(app)/(profile)/avatar')}
            accessibilityRole="button"
            accessibilityLabel={t('profile:edit_avatar')}
          >
            <ProceduralAvatar config={profile?.avatar_config} size={80} />
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </Pressable>

          <View style={styles.nameBlock}>
            <Text style={styles.name}>
              {profile?.nickname ?? profile?.first_name ?? '—'}
            </Text>
            {profile?.nickname && profile?.first_name ? (
              <Text style={styles.firstName}>{profile.first_name}</Text>
            ) : null}
            {memberSince ? (
              <Text style={styles.memberSince}>
                {t('profile:member_since', { date: memberSince })}
              </Text>
            ) : null}
          </View>

          <Link href="/(app)/(profile)/edit" asChild>
            <Pressable style={styles.editBtn} accessibilityRole="button" accessibilityLabel={t('profile:edit_profile')}>
              <Text style={styles.editBtnText}>{t('profile:edit_profile')}</Text>
            </Pressable>
          </Link>
        </View>

        {/* Bio */}
        {profile?.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('profile:interests')}</Text>
            <View style={styles.badges}>
              {profile.interests.map((interest) => (
                <Badge key={interest} label={interest} variant="default" />
              ))}
            </View>
          </View>
        ) : null}

        {/* Settings shortcut */}
        <View style={styles.section}>
          <Link href="/(app)/(profile)/settings" asChild>
            <Pressable style={styles.settingsRow} accessibilityRole="button">
              <Text style={styles.settingsLabel}>⚙️ {t('profile:settings_title')}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Link>
        </View>

        {/* Sign out */}
        <Button
          label={t('auth:sign_out')}
          variant="ghost"
          onPress={handleSignOut}
          style={styles.signOutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: { fontSize: 12 },
  nameBlock: { flex: 1 },
  name: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  firstName: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  memberSince: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, marginTop: theme.spacing.xs },
  editBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  editBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  bio: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, lineHeight: theme.fontSize.body * theme.lineHeight.relaxed },
  section: { gap: theme.spacing.sm },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  settingsLabel: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  chevron: { fontSize: theme.fontSize.xl, color: theme.colors.textTertiary },
  signOutBtn: { marginTop: theme.spacing.lg },
});
