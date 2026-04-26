import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { signInWithEmail } from '@/services/auth';

type FormErrors = { email?: string; password?: string; general?: string };

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'auth:required_field';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'auth:email_invalid';
}

export default function LoginScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = useCallback((): boolean => {
    const next: FormErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) next.email = t(emailErr as any);
    if (!password) next.password = t('common:required_field');
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password, t]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      // onAuthStateChange in root layout handles redirect
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('Invalid login')) {
        setErrors({ general: t('auth:sign_in_error') });
      } else {
        setErrors({ general: t('common:unknown_error') });
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, validateForm, t]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth:sign_in')}</Text>
          </View>

          {/* General error */}
          {errors.general ? (
            <View style={styles.generalError} accessibilityRole="alert">
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <Input
              label={t('auth:email')}
              placeholder={t('auth:email_placeholder')}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <Input
              ref={passwordRef}
              label={t('auth:password')}
              placeholder={t('auth:password_placeholder')}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              error={errors.password}
              secureTextEntry
              showPasswordToggle
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* Submit */}
          <Button
            label={loading ? '' : t('auth:sign_in')}
            loading={loading}
            onPress={handleLogin}
            size="lg"
            style={styles.submitBtn}
          />

          {/* Forgot password */}
          <Link href="/(auth)/forgot-password" asChild>
            <Text style={[styles.link, styles.forgotLink]}>{t('auth:forgot_link')}</Text>
          </Link>

          {/* Footer links */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth:no_account')} </Text>
            <Link href="/(auth)/register" asChild>
              <Text style={styles.link}>{t('auth:sign_up')}</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl,
  },
  header: { marginBottom: theme.spacing.xxl },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  generalError: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  generalErrorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
  },
  form: { marginBottom: theme.spacing.lg },
  submitBtn: { width: '100%', marginBottom: theme.spacing.xl },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  link: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  forgotLink: {
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
