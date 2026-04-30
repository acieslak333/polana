import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { theme } from '@/constants/theme'
import { useAuthStore } from '@/stores/authStore'
import { createInvite } from '@/services/api/invites'
import { buildDeepLink } from '@/utils/routing'

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const { t } = useTranslation(['gromady', 'common'])
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(): Promise<void> {
    if (!user || !id) return
    setLoading(true)
    setError(null)
    try {
      const invite = await createInvite(id, user.id)
      const url = buildDeepLink({ type: 'invite', code: invite.code })
      setLink(url)
    } catch {
      setError(t('gromady:invite_error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleShare(): Promise<void> {
    if (!link) return
    try {
      await Share.share({ message: `Dołącz do naszej Gromady na Polanie! ${link}`, url: link })
    } catch { /* user dismissed share sheet */ }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title} testID="invite-screen-title">{t('gromady:invite_title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.description}>
          {t('gromady:invite_description')}
        </Text>

        {link ? (
          <>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={2} selectable>{link}</Text>
            </View>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => { void handleShare() }}
              accessibilityRole="button"
              accessibilityLabel={t('gromady:invite_share')}
              testID="share-link-button"
            >
              <Text style={styles.primaryBtnText}>{t('gromady:invite_share')}</Text>
            </Pressable>
            <Pressable
              style={styles.ghostBtn}
              onPress={() => { setLink(null) }}
              accessibilityRole="button"
              accessibilityLabel={t('gromady:invite_new_link')}
            >
              <Text style={styles.ghostBtnText}>{t('gromady:invite_new_link')}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.primaryBtn, loading && styles.disabled]}
            onPress={() => { void handleGenerate() }}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t('gromady:invite_generate')}
            accessibilityState={{ disabled: loading }}
            testID="generate-link-button"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{t('gromady:invite_generate')}</Text>
            }
          </Pressable>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg },
  emoji: { fontSize: 64 },
  description: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  linkBox: {
    width: '100%',
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  linkText: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontFamily: 'monospace' },
  primaryBtn: {
    width: '100%',
    minHeight: 48,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.body },
  ghostBtn: {
    width: '100%',
    minHeight: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.body },
  disabled: { opacity: 0.6 },
  error: { fontSize: theme.fontSize.sm, color: theme.colors.error, textAlign: 'center' },
})
