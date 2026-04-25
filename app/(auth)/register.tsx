import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';
import { signUpWithEmail } from '@/services/auth';

type FormErrors = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  general?: string;
};

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'invalid';
}

export default function RegisterScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const validateForm = useCallback((): boolean => {
    const next: FormErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr === 'required') next.email = t('common:required_field');
    if (emailErr === 'invalid') next.email = t('auth:email_invalid');
    if (!password) next.password = t('common:required_field');
    else if (password.length < 8) next.password = t('auth:password_too_short');
    if (!passwordConfirm) next.passwordConfirm = t('common:required_field');
    else if (password !== passwordConfirm) next.passwordConfirm = t('auth:passwords_no_match');
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password, passwordConfirm, t]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signUpWithEmail(email.trim().toLowerCase(), password);
      setVerificationSent(true);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('already registered') || msg.includes('User already registered')) {
        setErrors({ general: t('auth:email_taken') });
      } else {
        setErrors({ general: t('auth:sign_up_error') });
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, validateForm, t]);

  if (verificationSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.verifyContainer}>
          <Text style={styles.verifyEmoji}>📬</Text>
          <Text style={styles.verifyTitle}>{t('auth:email_not_verified')}</Text>
          <Text style={styles.verifyBody}>
            {t('auth:verification_sent', { email: email.trim().toLowerCase() })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth:sign_up')}</Text>
          </View>

          {errors.general ? (
            <View style={styles.generalError} accessibilityRole="alert">
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

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
              autoComplete="new-password"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />

            <Input
              ref={confirmRef}
              label={t('auth:password_confirm')}
              placeholder={t('auth:password_placeholder')}
              value={passwordConfirm}
              onChangeText={(v) => {
                setPasswordConfirm(v);
                if (errors.passwordConfirm) setErrors((e) => ({ ...e, passwordConfirm: undefined }));
              }}
              error={errors.passwordConfirm}
              secureTextEntry
              showPasswordToggle
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          {/* Terms notice */}
          <Text style={styles.termsText}>
            {t('auth:terms_prefix')}{' '}
            <Link href="/(auth)/terms">
              <Text style={styles.termsLink}>{t('auth:terms_link')}</Text>
            </Link>
            {' '}{t('auth:terms_middle')}{' '}
            <Text style={styles.termsLink}>{t('auth:privacy_link')}</Text>
            .
          </Text>

          <Button
            label={loading ? '' : t('auth:sign_up')}
            loading={loading}
            onPress={handleRegister}
            size="lg"
            style={styles.submitBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth:have_account')} </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>{t('auth:sign_in')}</Text>
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
  generalErrorText: { color: theme.colors.error, fontSize: theme.fontSize.md },
  form: { marginBottom: theme.spacing.md },
  termsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xl,
    lineHeight: theme.fontSize.sm * theme.lineHeight.relaxed,
  },
  termsLink: { color: theme.colors.accent },
  submitBtn: { width: '100%', marginBottom: theme.spacing.xl },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  link: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  verifyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  verifyEmoji: { fontSize: 64 },
  verifyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  verifyBody: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.fontSize.body * theme.lineHeight.relaxed,
  },
});
