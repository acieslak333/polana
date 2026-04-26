// Minimal type declarations for @sentry/react-native.
// Run `npx expo install @sentry/react-native` to install.
declare module '@sentry/react-native' {
  export interface SentryEvent {
    [key: string]: unknown;
  }

  export interface InitOptions {
    dsn: string;
    environment?: string;
    enableAutoSessionTracking?: boolean;
    tracesSampleRate?: number;
    beforeSend?: (event: SentryEvent) => SentryEvent | null;
  }

  export function init(options: InitOptions): void;
  export function captureException(error: unknown): void;
  export function setContext(key: string, context: Record<string, string>): void;
}
