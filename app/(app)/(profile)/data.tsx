import { useState } from 'react'
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Share } from 'react-native'

import { theme } from '@/constants/theme'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/services/supabase'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

export default function DataScreen() {
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
      if (!token) throw new Error('Brak sesji')
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/export-data`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Błąd serwera')
      const json = await resp.json()
      await Share.share({
        message: JSON.stringify(json, null, 2),
        title: 'Eksport danych Polana',
      })
    } catch {
      setError('Nie udało się wyeksportować danych. Spróbuj ponownie.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (confirmText !== 'USUŃ') return
    setDeleting(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Brak sesji')
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Błąd serwera')
      await supabase.auth.signOut()
      router.replace('/(auth)/welcome')
    } catch {
      setError('Nie udało się usunąć konta. Skontaktuj się z nami: privacy@polana.app')
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
          accessibilityLabel="Wróć"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Twoje dane</Text>
      </View>

      <View style={styles.content}>
        {/* Export */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Eksport danych</Text>
          <Text style={styles.cardBody}>
            Pobierz wszystkie dane powiązane z Twoim kontem: profil, posty, komentarze, wiadomości, RSVPs.
          </Text>
          <Pressable
            style={[styles.btn, styles.btnOutline, exporting && styles.btnDisabled]}
            onPress={() => { void handleExport() }}
            disabled={exporting}
            accessibilityRole="button"
            accessibilityLabel="Eksportuj moje dane"
            accessibilityState={{ disabled: exporting }}
          >
            {exporting
              ? <ActivityIndicator color={theme.colors.accent} size="small" />
              : <Text style={styles.btnOutlineText}>Eksportuj moje dane</Text>
            }
          </Pressable>
        </View>

        {/* Delete */}
        <View style={[styles.card, styles.cardDanger]}>
          <Text style={styles.cardTitle}>🗑️ Usuń konto</Text>
          <Text style={styles.cardBody}>
            Trwale usuwa Twoje konto i wszystkie dane. Tej operacji nie można cofnąć.
            Wpisz USUŃ i potwierdź.
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="Wpisz: USUŃ"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            accessibilityLabel="Pole potwierdzenia usunięcia konta"
          />
          <Pressable
            style={[
              styles.btn, styles.btnDanger,
              (confirmText !== 'USUŃ' || deleting) && styles.btnDisabled,
            ]}
            onPress={() => { void handleDelete() }}
            disabled={confirmText !== 'USUŃ' || deleting}
            accessibilityRole="button"
            accessibilityLabel="Usuń konto na zawsze"
            accessibilityState={{ disabled: confirmText !== 'USUŃ' || deleting }}
          >
            {deleting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnDangerText}>Usuń konto na zawsze</Text>
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
