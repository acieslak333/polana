import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { theme } from '@/constants/theme'

interface Props { onRetry: () => void }

export function NetworkError({ onRetry }: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.text}>{t('common:offline_banner')}</Text>
      <Pressable
        style={styles.retry}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('common:offline_retry')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.retryText}>{t('common:offline_retry')}</Text>
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
