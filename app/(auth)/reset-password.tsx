import { useState } from 'react'
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { theme } from '@/constants/theme'
import { supabase } from '@/services/supabase'

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdate(): Promise<void> {
    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków')
      return
    }
    if (password !== confirm) {
      setError('Hasła nie są identyczne')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
    } catch {
      setError('Nie udało się ustawić hasła. Link mógł wygasnąć — spróbuj ponownie od początku.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Wróć do logowania"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Nowe hasło</Text>

          {done ? (
            <>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.successText}>Hasło zostało zmienione. Możesz się teraz zalogować.</Text>
              <Button
                label="Zaloguj się"
                onPress={() => router.replace('/(auth)/login')}
              />
            </>
          ) : (
            <>
              <Input
                label="Nowe hasło"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Minimum 8 znaków"
              />
              <Input
                label="Powtórz hasło"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="Powtórz nowe hasło"
                error={error ?? undefined}
              />
              <Button
                label="Ustaw nowe hasło"
                onPress={() => { void handleUpdate() }}
                loading={loading}
                disabled={!password || !confirm}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  content: { flex: 1, padding: theme.spacing.xl, gap: theme.spacing.lg, justifyContent: 'center' },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  emoji: { fontSize: 64, textAlign: 'center' },
  successText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24 },
})
