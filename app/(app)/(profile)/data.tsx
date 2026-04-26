import { useState } from 'react'
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Share } from 'react-native'
import { useTranslation } from 'react-i18next'

import { theme } from '@/constants/theme'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/services/supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

export default function DataScreen() {
  const { t } = useTranslation(['profile', 'common'])
  const { user } = useAuthStore()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  async function handleExport(): Promise<void> {
    if (!user) return
    setExporting(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('No active session')
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/export-data`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Server error')
      const json = await resp.json()
      await Share.share({
        message: JSON.stringify(json, null, 2),
        title: 'Eksport danych Polana',
      })
    } catch {
      setError(t('profile:data_error'))
    } finally {
      setExporting(false)
    }
  }

  const confirmWord = t('profile:data_delete_confirm_word')

  async function handleDelete(): Promise<void> {
    if (confirmText !== confirmWord) return
    setDeleting(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('No active session')
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Server error')
      await supabase.auth.signOut()
      router.replace('/(auth)/welcome')
    } catch {
      setError(t('profile:data_error'))
      setDeleting(false)
    }
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
        <Text style={styles.title}>{t('profile:data_title')}</Text>
      </View>

      <View style={styles.content}>
        {/* Export */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 {t('profile:data_export_title')}</Text>
          <Text style={styles.cardBody}>
            {t('profile:data_export_description')}
          </Text>
          <Pressable
            style={[styles.btn, styles.btnOutline, exporting && styles.btnDisabled]}
            onPress={() => { void handleExport() }}
            disabled={exporting}
            accessibilityRole="button"
            accessibilityLabel={t('profile:data_export_button')}
            accessibilityState={{ disabled: exporting }}
          >
            {exporting
              ? <ActivityIndicator color={theme.colors.accent} size="small" />
              : <Text style={styles.btnOutlineText}>{t('profile:data_export_button')}</Text>
            }
          </Pressable>
        </View>

        {/* Delete */}
        <View style={[styles.card, styles.cardDanger]}>
          <Text style={styles.cardTitle}>🗑️ {t('profile:data_delete_title')}</Text>
          <Text style={styles.cardBody}>
            {t('profile:data_delete_description')}
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={t('profile:data_delete_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            accessibilityLabel={t('profile:data_delete_input_a11y')}
          />
          <Pressable
            style={[
              styles.btn, styles.btnDanger,
              (confirmText !== confirmWord || deleting) && styles.btnDisabled,
            ]}
            onPress={() => { void handleDelete() }}
            disabled={confirmText !== confirmWord || deleting}
            accessibilityRole="button"
            accessibilityLabel={t('profile:data_delete_button')}
            accessibilityState={{ disabled: confirmText !== confirmWord || deleting }}
          >
            {deleting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnDangerText}>{t('profile:data_delete_button')}</Text>
            }
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: theme.spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  content: { flex: 1, padding: theme.spacing.xl, gap: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.lg, gap: theme.spacing.md,
  },
  cardDanger: { borderColor: theme.colors.error },
  cardTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  cardBody: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, lineHeight: 22 },
  btn: { minHeight: 48, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.accent },
  btnOutlineText: { color: theme.colors.accent, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.body },
  btnDanger: { backgroundColor: theme.colors.error },
  btnDangerText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.body },
  btnDisabled: { opacity: 0.4 },
  confirmInput: {
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, height: 48, fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary, backgroundColor: theme.colors.background,
  },
  error: { fontSize: theme.fontSize.sm, color: theme.colors.error, textAlign: 'center' },
})
