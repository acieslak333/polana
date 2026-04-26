import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'

import { theme } from '@/constants/theme'
import { useAuthStore } from '@/stores/authStore'
import { fetchGromadaMembers, leaveGromada, updateGromada, fetchGromada } from '@/services/api/gromady'
import type { GromadaWithInterests } from '@/services/api/gromady'
import { supabase } from '@/services/supabase'

interface Member {
  user_id: string
  role: string
  first_name: string
  nickname: string | null
}

export default function AdminScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()

  const [gromada, setGromada] = useState<GromadaWithInterests | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [g, m] = await Promise.all([
        fetchGromada(id),
        fetchGromadaMembers(id),
      ])
      setGromada(g)
      setName(g.name)
      setDescription(g.description ?? '')
      setMembers(
        (m as unknown as Array<{ user_id: string; role: string; profiles: { first_name: string; nickname: string | null } }>).map((row) => ({
          user_id: row.user_id,
          role: row.role,
          first_name: row.profiles.first_name,
          nickname: row.profiles.nickname,
        }))
      )
    } catch { /* stay empty */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])

  function showToast(msg: string): void {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  async function handleSave(): Promise<void> {
    if (!id || !name.trim()) return
    setSaving(true)
    try {
      await updateGromada(id, { name: name.trim(), description: description.trim() || null })
      showToast('Zapisano zmiany')
    } catch { showToast('Nie udało się zapisać zmian') }
    finally { setSaving(false) }
  }

  async function handleRemoveMember(memberId: string, memberName: string): Promise<void> {
    setMembers((prev) => prev.filter((m) => m.user_id !== memberId))
    try {
      await leaveGromada(id!, memberId)
      showToast(`Usunięto ${memberName} z Gromady`)
    } catch {
      await load()
      showToast('Nie udało się usunąć członka')
    }
  }

  async function handleTransferElder(newElderId: string, memberName: string): Promise<void> {
    if (!id) return
    try {
      const { error } = await supabase
        .from('gromady')
        .update({ elder_id: newElderId })
        .eq('id', id)
      if (error) throw error
      showToast(`${memberName} jest teraz Starszym Gromady`)
      await load()
    } catch { showToast('Nie udało się przekazać roli') }
  }

  async function handleArchive(): Promise<void> {
    if (!id) return
    try {
      await updateGromada(id, { status: 'archived' })
      showToast('Gromada zarchiwizowana')
      setTimeout(() => router.replace('/(app)/(gromady)'), 2000)
    } catch { showToast('Nie udało się zarchiwizować Gromady') }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View>
      </SafeAreaView>
    )
  }

  const isElder = gromada?.elder_id === user?.id
  if (!isElder) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Tylko Starszy Gromady może wejść do panelu administracyjnego.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Wróć">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Panel Starszego</Text>
      </View>

      <FlatList
        data={members.filter((m) => m.user_id !== user?.id)}
        keyExtractor={(m) => m.user_id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edytuj Gromadę</Text>
            <Text style={styles.label}>Nazwa</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              maxLength={60}
              accessibilityLabel="Nazwa Gromady"
            />
            <Text style={styles.label}>Opis (opcjonalny)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              maxLength={300}
              multiline
              numberOfLines={3}
              accessibilityLabel="Opis Gromady"
            />
            <Pressable
              style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={() => { void handleSave() }}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Zapisz zmiany"
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnPrimaryText}>Zapisz zmiany</Text>
              }
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnOutline]}
              onPress={() => router.push(`/(app)/(gromady)/${id}/invite`)}
              accessibilityRole="button"
              accessibilityLabel="Zaproś do Gromady"
            >
              <Text style={styles.btnOutlineText}>🔗 Zaproś do Gromady</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>Członkowie</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.nickname ?? item.first_name}</Text>
              <Text style={styles.memberRole}>{item.role}</Text>
            </View>
            <View style={styles.memberActions}>
              <Pressable
                style={[styles.memberBtn, styles.memberBtnTransfer]}
                onPress={() => { void handleTransferElder(item.user_id, item.nickname ?? item.first_name) }}
                accessibilityRole="button"
                accessibilityLabel={`Przekaż rolę Starszego użytkownikowi ${item.nickname ?? item.first_name}`}
              >
                <Text style={styles.memberBtnText}>👑</Text>
              </Pressable>
              <Pressable
                style={[styles.memberBtn, styles.memberBtnRemove]}
                onPress={() => { void handleRemoveMember(item.user_id, item.nickname ?? item.first_name) }}
                accessibilityRole="button"
                accessibilityLabel={`Usuń ${item.nickname ?? item.first_name} z Gromady`}
              >
                <Text style={styles.memberBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.section, { marginTop: theme.spacing.xl }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Strefa niebezpieczna</Text>
            <Pressable
              style={[styles.btn, styles.btnDanger]}
              onPress={() => { void handleArchive() }}
              accessibilityRole="button"
              accessibilityLabel="Zarchiwizuj Gromadę"
            >
              <Text style={styles.btnDangerText}>Zarchiwizuj Gromadę</Text>
            </Pressable>
          </View>
        }
      />

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
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
  list: { paddingBottom: theme.spacing.xxxl },
  section: { padding: theme.spacing.xl, gap: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  label: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  input: {
    backgroundColor: theme.colors.backgroundCard, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.body, color: theme.colors.textPrimary, minHeight: 44,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  btn: { minHeight: 48, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl },
  btnPrimary: { backgroundColor: theme.colors.accent },
  btnPrimaryText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.body },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.border },
  btnOutlineText: { color: theme.colors.textPrimary, fontSize: theme.fontSize.body },
  btnDanger: { borderWidth: 1, borderColor: theme.colors.error },
  btnDangerText: { color: theme.colors.error, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.body },
  btnDisabled: { opacity: 0.6 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.md,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, minHeight: 56,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.medium, color: theme.colors.textPrimary },
  memberRole: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  memberActions: { flexDirection: 'row', gap: theme.spacing.sm },
  memberBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberBtnTransfer: { backgroundColor: theme.colors.backgroundElevated, borderWidth: 1, borderColor: theme.colors.border },
  memberBtnRemove: { backgroundColor: theme.colors.errorLight ?? '#FEE2E2' },
  memberBtnText: { fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  errorText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center' },
  toast: {
    position: 'absolute', bottom: theme.spacing.xl, left: theme.spacing.xl, right: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated, borderRadius: theme.borderRadius.md, borderWidth: 1,
    borderColor: theme.colors.border, padding: theme.spacing.md, alignItems: 'center',
  },
  toastText: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary },
})
