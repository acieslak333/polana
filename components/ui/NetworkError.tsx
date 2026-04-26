import { View, Text, Pressable, StyleSheet } from 'react-native'
import { theme } from '@/constants/theme'

interface Props { onRetry: () => void }

export function NetworkError({ onRetry }: Props) {
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.text}>Brak połączenia z internetem</Text>
      <Pressable
        style={styles.retry}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Spróbuj ponownie"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.retryText}>Ponów</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: '#fff',
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  retry: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    minHeight: 32,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: theme.fontSize.sm,
    color: '#fff',
    fontWeight: theme.fontWeight.semibold,
  },
})
