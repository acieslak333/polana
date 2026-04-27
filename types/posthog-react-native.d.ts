// Minimal type stub for posthog-react-native.
// Install when ready: npx expo install posthog-react-native
declare module 'posthog-react-native' {
  export class PostHog {
    constructor(apiKey: string, options?: { host?: string });
    capture(event: string, props?: Record<string, unknown>): void;
    identify(id: string, props?: Record<string, unknown>): void;
    screen(name: string, props?: Record<string, unknown>): void;
    reset(): void;
  }
}
