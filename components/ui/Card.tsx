import {
  Pressable,
  View,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { theme } from '@/constants/theme';

type CardProps = PressableProps & {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function Card({ children, style, padded = true, onPress, ...rest }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        {...rest}
        style={({ pressed }) => [
          styles.card,
          padded && styles.padded,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  padded: {
    padding: theme.spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
});
