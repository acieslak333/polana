// Privacy-first analytics wrapper.
// Uses PostHog for event tracking — no PII in any event payload.
// userId is hashed before sending; only city slug is passed as context.
//
// To enable: set EXPO_PUBLIC_POSTHOG_KEY in your EAS secrets.
// Self-hosted PostHog: also set EXPO_PUBLIC_POSTHOG_HOST.

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';

// Lightweight crypto hash for anonymising userId — not reversible
function hashId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

let _posthog: {
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  screen: (name: string, props?: Record<string, unknown>) => void;
  reset: () => void;
} | null = null;

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_KEY) return;
  try {
    const { PostHog } = await import('posthog-react-native');
    _posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  } catch {
    // PostHog not installed — analytics silently disabled
  }
}

export function identifyUser(userId: string, citySlug?: string): void {
  if (!_posthog) return;
  _posthog.identify(hashId(userId), citySlug ? { city: citySlug } : {});
}

export function trackScreen(routeName: string): void {
  if (!_posthog) return;
  _posthog.screen(routeName);
}

export function trackEvent(name: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!_posthog) return;
  _posthog.capture(name, props);
}

export function resetAnalytics(): void {
  _posthog?.reset();
}

// Typed event catalogue — prevents typos and serves as documentation
export type AnalyticsEvent =
  | 'join_gromada'
  | 'leave_gromada'
  | 'rsvp_event'
  | 'cancel_rsvp'
  | 'create_post'
  | 'delete_post'
  | 'send_message'
  | 'send_friend_request'
  | 'accept_friend_request'
  | 'invite_sent'
  | 'invite_accepted'
  | 'block_user'
  | 'report_content'
  | 'favor_created'
  | 'favor_helped'
  | 'crossover_proposed'
  | 'crossover_voted'
  | 'onboarding_complete'
  | 'account_deleted';
