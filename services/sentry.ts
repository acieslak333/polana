import * as Sentry from '@sentry/react-native'

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''
const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as 'development' | 'staging' | 'production'

export function initSentry(): void {
  if (!SENTRY_DSN) return

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    enableAutoSessionTracking: true,
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // Strip breadcrumb data to avoid leaking PII — breadcrumbs.values may be an iterator
      return event
    },
  })
}

export function captureError(error: unknown, context?: Record<string, string>): void {
  if (context) Sentry.setContext('app', context)
  Sentry.captureException(error)
}
