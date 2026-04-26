import React, { Component, type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { theme } from '@/constants/theme'
import { captureError } from '@/services/sentry'
import i18n from '@/i18n'

interface Props {
  children: ReactNode
  fallbackLabel?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack ?? '' })
  }

  reset = (): void => this.setState({ hasError: false, error: null })

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>{i18n.t('common:error_boundary_title')}</Text>
        <Text style={styles.body}>
          {this.props.fallbackLabel ?? i18n.t('common:error_boundary_body')}
        </Text>
        <Pressable
          style={styles.btn}
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common:error_boundary_button')}
        >
          <Text style={styles.btnText}>{i18n.t('common:error_boundary_button')}</Text>
        </Pressable>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.fontSize.body * theme.lineHeight.relaxed,
    marginBottom: theme.spacing.xxl,
  },
  btn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
})
