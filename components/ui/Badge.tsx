import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type BadgeVariant = 'default' | 'accent' | 'success' | 'outline';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  emoji?: string;
};

export function Badge({
  label,
  variant = 'default',
  selected = false,
  onPress,
  style,
  emoji,
}: BadgeProps) {
  const content = (
    <>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles[`label_${variant}`],
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          selected && styles.selectedBase,
          pressed && styles.pressed,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Text
      style={[styles.base, styles[variant], selected && styles.selectedBase, style]}
    >
      {content}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundCard,
    minHeight: 32,
  },
  default: {},
  accent: {
    borderColor: theme.colors.accentLight,
    backgroundColor: theme.colors.accentLight,
  },
  success: {
    borderColor: theme.colors.successLight,
    backgroundColor: theme.colors.successLight,
  },
  outline: {
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  selectedBase: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentLight,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  label_default: { color: theme.colors.textSecondary },
  label_accent: { color: theme.colors.accent },
  label_success: { color: theme.colors.success },
  label_outline: { color: theme.colors.textTertiary },
  labelSelected: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  pressed: { opacity: 0.7 },
});
