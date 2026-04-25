import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { theme } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  disabledReason?: string;
};

export function Button({
  label,
  loading = false,
  variant = 'primary',
  size = 'md',
  disabled,
  disabledReason,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <>
      <Pressable
        {...rest}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          styles[`size_${size}`],
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
          style as ViewStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? theme.colors.background : theme.colors.accent}
            size="small"
          />
        ) : (
          <Text style={[styles.label, styles[`label_${variant}`], styles[`label_${size}`]]}>
            {label}
          </Text>
        )}
      </Pressable>
      {disabledReason && isDisabled && !loading ? (
        <Text style={styles.disabledReason}>{disabledReason}</Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    minHeight: 48,
  } as ViewStyle,

  primary: {
    backgroundColor: theme.colors.accent,
  } as ViewStyle,
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  } as ViewStyle,
  ghost: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  destructive: {
    backgroundColor: theme.colors.error,
  } as ViewStyle,

  size_sm: { paddingHorizontal: theme.spacing.md, minHeight: 36 } as ViewStyle,
  size_md: { paddingHorizontal: theme.spacing.xl } as ViewStyle,
  size_lg: { paddingHorizontal: theme.spacing.xxl, minHeight: 56 } as ViewStyle,

  disabled: { opacity: 0.45 } as ViewStyle,
  pressed: { opacity: 0.8 } as ViewStyle,

  label: {
    fontWeight: theme.fontWeight.semibold,
  } as TextStyle,
  label_primary: { color: '#fff' } as TextStyle,
  label_secondary: { color: theme.colors.accent } as TextStyle,
  label_ghost: { color: theme.colors.accent } as TextStyle,
  label_destructive: { color: '#fff' } as TextStyle,

  label_sm: { fontSize: theme.fontSize.sm } as TextStyle,
  label_md: { fontSize: theme.fontSize.body } as TextStyle,
  label_lg: { fontSize: theme.fontSize.lg } as TextStyle,

  disabledReason: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  } as TextStyle,
});
