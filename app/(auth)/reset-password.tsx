import { useState } from 'react'
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { theme } from '@/constants/theme'
import { supabase } from '@/services/supabase'

export default function ResetPasswordScreen() {
  const { t } = useTranslation(['auth', 'common'])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdate(): Promise<void> {
    if (password.length < 8) {
      setError(t('auth:reset_password_min_length'))
      return
    }
    if (password !== confirm) {
      setError(t('auth:reset_password_no_match'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
    } catch {
      setError(t('auth:reset_password_error'))
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
            accessibilityLabel={t('auth:forgot_password_back')}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t('auth:reset_password_title')}</Text>

          {done ? (
            <>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.successText}>{t('auth:reset_password_success')}</Text>
              <Button
                label={t('auth:reset_password_login')}
                onPress={() => router.replace('/(auth)/login')}
              />
            </>
          ) : (
            <>
              <Input
                label={t('auth:reset_password_title')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Minimum 8 znaków"
              />
              <Input
                label={t('auth:reset_password_confirm_placeholder')}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder={t('auth:reset_password_confirm_placeholder')}
                error={error ?? undefined}
              />
              <Button
                label={t('auth:reset_password_submit')}
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
