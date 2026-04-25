import { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { theme } from '@/constants/theme';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, showPasswordToggle, secureTextEntry, containerStyle, style, ...rest }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            error ? styles.inputWrapperError : null,
          ]}
        >
          <TextInput
            ref={ref}
            {...rest}
            secureTextEntry={isSecure}
            onFocus={(e) => {
              setIsFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              rest.onBlur?.(e);
            }}
            style={[styles.input, showPasswordToggle && styles.inputWithToggle, style]}
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel={label}
            accessibilityInvalid={!!error}
            accessibilityHint={error ?? hint}
          />
          {showPasswordToggle ? (
            <Pressable
              onPress={() => setIsPasswordVisible((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Ukryj hasło' : 'Pokaż hasło'}
              style={styles.eyeButton}
              hitSlop={8}
            >
              <Text style={styles.eyeIcon}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: theme.colors.borderFocus,
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
  inputWithToggle: {
    paddingRight: 0,
  },
  eyeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
});
