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

export default function ForgotPasswordScreen() {
  const { t } = useTranslation(['auth', 'common'])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReset(): Promise<void> {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@')) {
      setError(t('auth:forgot_password_invalid_email'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: 'polana://reset-password',
      })
      if (err) throw err
      setSent(true)
    } catch {
      setError(t('auth:forgot_password_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common:back')}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t('auth:forgot_password_title')}</Text>

          {sent ? (
            <>
              <Text style={styles.emoji}>📬</Text>
              <Text style={styles.successText}>
                {t('auth:forgot_password_sent', { email: email.trim() })}
              </Text>
              <Button
                label={t('auth:forgot_password_back')}
                onPress={() => router.replace('/(auth)/login')}
                variant="ghost"
              />
            </>
          ) : (
            <>
              <Text style={styles.description}>
                {t('auth:forgot_password_description')}
              </Text>
              <Input
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="twoj@email.pl"
                error={error ?? undefined}
              />
              <Button
                label={t('auth:forgot_password_send')}
                onPress={() => { void handleReset() }}
                loading={loading}
                disabled={!email.trim()}
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
  description: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, lineHeight: 24 },
  emoji: { fontSize: 64, textAlign: 'center' },
  successText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24 },
})
