# CLAUDE.md — Polana: Coding Agent Reference

> This file is the single source of truth for the coding agent. Read it before every task.

---

## What Polana IS

**Polana** is an anti-addictive mobile social platform (iOS + Android) for building local micro-communities based on shared interests.

- Users join small groups called **Gromady** (15–50 people)
- Gromady meet in real life, help each other, and create crossovers between groups
- Success = real-world meetups, NOT screen time
- Model: Nonprofit / B-corp
- Name origin: *polana* = forest clearing, a natural meeting place. Groups = *Gromady*.
- Launch market: Poland — 5 cities (Warszawa, Kraków, Wrocław, Łódź, Gdańsk), architecture ready for international expansion

---

## What Polana IS NOT

- NOT a feed-addiction machine — no algorithmic ranking, ever
- NOT a follower/like economy — no public like counts, no follower counts
- NOT a dark-pattern app — no streak guilt, no FOMO notifications, no engagement bait
- NOT a data-selling product — user data never sold, never fed to external AI
- NOT a global social network — intentionally small, local, capped group sizes
- NOT a "move fast" startup — community safety and trust first

**Concrete prohibitions (hardcoded into design):**
- No like buttons on posts (emoji reactions only, Slack-style)
- No follower counts visible anywhere
- No algorithmic feed reordering — always chronological (created_at DESC)
- No autoplay video with sound
- No notification inflation for engagement
- No confirmation modals for reversible actions — use undo toasts instead
- No permission requests without contextual priming

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| Expo | ~55 | Build toolchain, native modules |
| React Native | ^0.85 | UI framework |
| React | ^19 | UI library |
| Expo Router | ~55 | File-based routing |
| TypeScript | strict | Required everywhere, no `any` |
| Zustand | ^5 | Global state management |
| React Native Reanimated | ~3.16 | Animations (only when needed) |
| expo-secure-store | ~14 | Encrypted token storage |
| expo-location | ~18 | Geolocation |
| expo-notifications | ~0.29 | Push notifications |
| expo-image-picker | ~16 | Photo selection |
| expo-auth-session | ~6 | OAuth flows |
| i18next + react-i18next | ^23/^15 | Internationalisation |
| date-fns | ^4 | Date formatting with locale |

### Backend (Supabase)
| Feature | Usage |
|---|---|
| Supabase Auth | email/password, Google OAuth, Apple Sign-In |
| PostgreSQL + PostGIS | Relational DB with geolocation |
| Supabase Realtime | Chat subscriptions |
| Supabase Storage | Avatars, post images |
| Supabase Edge Functions | Cron jobs, event generation, push notifications |
| Row Level Security | Security enforced at DB level on every table |

**Why Supabase:** Open-source, self-hostable in EU (GDPR), PostGIS for geo, free tier (50k MAU), Realtime built-in, RLS as last defence line.

### Additional Tools
- **Plausible / PostHog (self-hosted)** — privacy-first analytics only. No Google Analytics.
- **Sentry** — error monitoring
- **Expo EAS** — build & distribution

---

## Styling Rules (Non-Negotiable)

- Use **native React Native components** only: `View`, `Text`, `Pressable`, `FlatList`, `ScrollView`, etc.
- Use **`StyleSheet.create()`** for all styles
- **`constants/theme.ts` is the ONLY place** to define colors, spacing, font sizes, border radii
- **Do NOT install UI libraries** (NativeBase, Tamagui, RN Paper, etc.) unless explicitly instructed
- All theme values referenced via `theme.colors.*`, `theme.spacing.*`, `theme.fontSize.*`, etc.
- Support dark/light mode via theme provider

```typescript
// constants/theme.ts — reference, not to be duplicated
export const theme = {
  colors: {
    background: '#1A1612',
    backgroundCard: 'rgba(255,255,255,0.03)',
    textPrimary: '#F2E6D9',
    textSecondary: '#9B8B7A',
    textTertiary: '#8A7D6F',
    accent: '#C4705A',       // terracotta
    success: '#7A9E7E',      // sage green
    warmGold: '#D4956A',
    border: 'rgba(255,255,255,0.06)',
    // ... full definition in constants/theme.ts
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 },
  borderRadius: { xs: 4, sm: 8, md: 12, lg: 14, xl: 20, xxl: 28, full: 999 },
  fontSize: { xs: 10, sm: 12, md: 14, body: 15, lg: 16, xl: 20, xxl: 28, title: 32 },
} as const;
```

---

## Security Rules

- Tokens (access + refresh) stored in **`expo-secure-store` only** — NEVER AsyncStorage
- JWT access token TTL: 1h, auto-refreshed by Supabase client
- **RLS on every table** — DB is the last line of defence, even if API checks pass
- Rate limiting on Edge Functions (login, registration)
- Input validation on both frontend (UX) AND backend (security)
- HTTPS everywhere (Supabase default)
- Sanitise all user-generated content before saving (XSS prevention)

---

## Auth Methods (MVP → Later)

1. **Email + password** (MVP) — with email verification
2. **Google OAuth** (MVP) — via `expo-auth-session` + Supabase OAuth
3. **Apple Sign-In** (Sprint 2) — required by App Store if Google is present
4. **Magic link** (future) — passwordless option

---

## Database

Full schema lives in `supabase/migrations/`. Do not re-define schema in code — reference it.

**Core tables:** `cities`, `interests`, `profiles`, `user_interests`, `gromady`, `gromada_interests`, `gromada_members`, `events`, `event_rsvps`, `posts`, `comments`, `reactions`, `reports`, `favor_requests`, `favor_offers`, `crossover_proposals`, `chat_rooms`, `messages`, `chat_mutes`, `friendships`, `gromada_allies`, `name_adjectives`, `name_animals`, `name_suffixes`

**Key constraints (enforced by DB triggers):**
- Max 3 Gromady per user
- Max 3 interests per Gromada
- Max 5 upcoming events per Gromada
- `newcomer` role auto-assigned when joining a Gromada older than 30 days
- Chat room auto-created for every new Gromada

---

## Folder Structure

```
app/
  _layout.tsx              # Root: session hydration, auth events
  index.tsx                # Redirect guard → welcome / onboarding / feed
  (auth)/                  # Unauthenticated group
    welcome.tsx
    login.tsx
    register.tsx
    terms.tsx
  (onboarding)/            # Post-registration, pre-app
    profile-setup.tsx
    interests.tsx
    city.tsx
    gromada-pick.tsx
    notifications.tsx
    community-rules.tsx
    ready.tsx
  (app)/                   # Authenticated main app
    _layout.tsx            # Tab navigator (5 tabs)
    (feed)/index.tsx       # Tab 1: chronological posts feed
    (gromady)/             # Tab 2: your Gromady grid + search
    (map)/                 # Tab 3: city map with event pins
    (messages)/            # Tab 4: chats + friends
    (profile)/             # Tab 5: profile, avatar editor, settings

components/
  ui/          Button, Input, Card, Badge, Avatar, EmojiPicker, LoadingSpinner
  feed/        PostCard, CommentThread, ReactionBar
  gromada/     GromadaCard, GromadaHeader, EventPinned, WarmthIndicator
  event/       EventCard, EventMap, CreateEventForm
  map/         CityMap, EventPin, EventListItem
  chat/        ChatBubble, ChatInput, ChatRoomItem
  avatar/      ProceduralAvatar, AvatarEditor, avatarParts.ts
  mindful/     MindfulText

constants/
  theme.ts           # THE ONLY place for visual tokens
  mindfulTexts.ts    # Calming texts for empty states / loading
  config.ts          # Supabase URL, limits, city IDs

stores/
  authStore.ts         # session, user, profile, isOnboardingComplete
  onboardingStore.ts   # wizard state
  preferencesStore.ts  # colorScheme, language, reduceMotion

services/
  supabase.ts          # Singleton client (SecureStore adapter)
  auth.ts              # signIn, signUp, signOut, getProfile, updateProfile
  api/
    gromady.ts / events.ts / posts.ts / messages.ts / users.ts
  notifications.ts
  eventGenerator.ts

hooks/
  useAuth, useGromady, useEvents, usePosts, useFavors,
  useMessages, useFriends, useLocation, useMap, useNotifications

i18n/
  index.ts             # i18next config, PL primary + EN fallback
  locales/pl/          common, auth, onboarding, feed, gromady, events, messages, profile
  locales/en/          (same namespaces)

supabase/
  migrations/          001_initial_schema, 002_rls_policies, 003_seed_data
  functions/           generate-events/, expire-favors/, dormant-check/, send-notification/

utils/
  dates.ts / geo.ts / validation.ts / nameGenerator.ts
```

---

## Procedural Avatar System

Every user gets a randomly generated animal avatar on registration.

```typescript
// components/avatar/avatarParts.ts
export const AVATAR_PARTS = {
  base: ['cat', 'dog', 'owl', 'fox', 'bear', 'bunny', 'frog', 'hedgehog', 'otter', 'capybara'],
  eyes: ['round', 'sleepy', 'happy', 'surprised', 'wink', 'heart'],
  nose: ['button', 'triangle', 'dot', 'heart'],
  mouth: ['smile', 'grin', 'tongue', 'neutral', 'happy'],
  accessories: ['none', 'glasses', 'sunglasses', 'monocle', 'bow_tie'],
  hat: ['none', 'beanie', 'flower_crown', 'top_hat', 'bandana', 'chef_hat'],
  special: ['none', 'blush', 'freckles', 'scar', 'star', 'leaf'],
} as const;

export const AVATAR_COLORS = {
  primary: ['#C4705A', '#7A9E7E', '#D4956A', '#8B6F47', '#6B7B8D'],
  secondary: ['#F2E6D9', '#E8DFD4', '#C4A882', '#9B8B7A'],
} as const;
```

---

## Auto Event Generation (Edge Function)

Daily at 20:00 local city time:
1. Find Gromady with no upcoming events in the next 3 days
2. Generate a suggestion based on Gromada interests (dog walks → park walk, coffee → café meetup, etc.)
3. Mark as `is_auto_generated = true`

Sunday at 20:00: generate a larger weekly event (picnic, group cooking, bike ride, film night).

---

## Sprint Status

> Full task breakdown with per-item checkboxes lives in **`.claude/SPRINTS.md`**.
> Update that file as work completes. Below is the current high-level status.

| Sprint | Goal | Status |
|--------|------|--------|
| Sprint 1 — Foundation | Project setup, DB schema, auth flow, routing | ✅ DONE |
| Sprint 2 — Onboarding + Profile | Full onboarding wizard, avatar editor, profile screens | 🔄 NEXT |
| Sprint 3 — Gromady | Gromady grid, panel, posts, comments, reactions | ⏳ |
| Sprint 4 — Feed + Events | Main feed, city map, RSVP, event chatrooms | ⏳ |
| Sprint 5 — Community | Realtime chat, DMs, friends, push notifications, favors | ⏳ |
| Sprint 6 — Polish + Beta | Edge Functions, crossovers, allies, stats, Sentry, EAS | ⏳ |

**Before starting any sprint:** read the corresponding section in `.claude/SPRINTS.md`, work through items top-to-bottom, check each off as it is completed.

---

## Coding Rules (Non-Negotiable)

1. **TypeScript everywhere** — no plain JS, no `any`, no type assertions without comment
2. **One theme file** — all colors, spacing, border-radius in `constants/theme.ts` only
3. **Native RN components only** — no UI libraries unless explicitly instructed
4. **i18n from day one** — no hardcoded strings; everything through `t('namespace:key')`
5. **RLS on every table** — DB-level security, not just API-level
6. **Chronological feeds** — always `ORDER BY created_at DESC`, never algorithmic
7. **No likes, no follower counts, no dark patterns** — period
8. **Expo Router file-based routing** — file = route, no manual navigation stacks
9. **Zustand for global state** — React `useState` for local/component state only
10. **Supabase client as singleton** — import from `services/supabase.ts` only
11. **Error handling** — `try/catch` everywhere async, user-facing messages in Polish
12. **Accessibility** — `accessibilityLabel` on every interactive element
13. **Offline graceful degradation** — show cached data when offline, never crash

---

## UX Rules (Non-Negotiable Defaults)

Deviate only with explicit instruction.

### Core principles
- Every interaction answers 3 questions in <100ms: Did my tap register? Is something happening? What's next?
- Optimistic first, reconcile later — never block UI on network for user-initiated actions
- Platform-native feel: iOS HIG on iOS, Material 3 on Android — no forced parity
- Reduce, don't confirm: prefer undo over "Are you sure?" for anything reversible

### Tap targets & buttons
- Tappable areas ≥ 44×44pt (iOS) / 48×48dp (Android). Icon can be smaller; hit area must not.
- Use verbs on buttons ("Send message", "Create account"). Never "Submit" or "OK".
- Show WHY a button is disabled (helper text). Never silently gray it out.
- Lock buttons during async work, swap label to loading state. No double-submission.
- Destructive red only for truly destructive actions. Prefer 5s undo toast.

### Input boxes
- Correct keyboard type: `email`, `tel`, `url`, `number-pad`, `decimal-pad`
- Auto-grow composer up to ~6 lines then scroll. No fixed single-line message inputs.
- Inline validation with 300–500ms debounce. Never only on submit.
- Preserve user input on error. Never clear the form.
- Autofocus first field on modals/login. Enter submits single-field forms.
- Show password visibility toggle (eye icon).
- Support paste-and-auto-format for phones, OTP, URLs.
- Floating labels. Placeholder = format example, not field name.

### Messaging
- Send optimistically: message shows instantly with "sending" → "sent" → "delivered/read"
- Persist drafts locally per thread. Never lose draft on backgrounding/navigation.
- Swipe-right-to-reply with haptic at ~60pt threshold (light impact)
- Long-press reaction/context menu: 500ms delay, medium haptic on reveal
- Debounce typing indicator: send after 1s typing, clear after 3s inactivity
- Support `@` mentions and `/` commands with filterable inline picker
- Allow paste-image directly into composer. No forced "attach file" dialog.
- Enter sends on mobile; Shift+Enter for newline (configurable on web)

### Posts & composer
- Auto-save drafts every few seconds with subtle "Saved" indicator
- Drag-to-reorder multi-image (long-press 400ms + light haptic)
- Link preview on URL paste (Open Graph fetch, client-side)
- Character counter only when near limit (last 20 chars): gray → orange → red
- Preview step for rich-format posts. Never publish public content silently.

### Feeds, lists & scrolling
- Pull-to-refresh with spring animation + haptic at release threshold
- Skeleton screens for initial load. Never generic spinners for content-shaped views.
- Preload next N items at ~80% scroll
- Restore scroll position on back navigation. Never auto-snap to top.
- Autoplay feed videos muted; pause when <50% in viewport. Never sound.
- Progressive image loading (blurhash / LQIP). Never blank boxes.
- Virtualized lists: FlashList / RecyclerView / UICollectionView with prefetching
- Tap status bar to scroll to top (iOS)
- Swipe list items: left = destructive (red), right = constructive (blue/green)

### Navigation
- Bottom tab bar, max 5 items. Rare/destructive actions go deeper.
- Preserve per-tab navigation state and scroll position on tab switch
- iOS edge-swipe back, Android predictive back (Android 14+)
- Prefer bottom sheets over full-screen modals for quick actions. Drag handle + swipe-down-to-dismiss.
- Shared-element transitions for feed → detail

### Feedback
- Visual feedback within 100ms of any tap
- Haptics: iOS (`UIImpactFeedbackGenerator`, `UISelectionFeedbackGenerator`, `UINotificationFeedbackGenerator`), Android (`CONFIRM`, `GESTURE_START`, `LONG_PRESS`, `REJECT`)
- Toast/snackbar for non-blocking confirmations (3s auto-dismiss), Undo for reversible (5–7s)
- Never alert dialogs for success
- Loading: skeleton → progress (determinate) → spinner (unknown) → error + retry

### Empty states
- Always instructional: 1 sentence describing what goes here + 1 primary action
- Never "No items"

### Microcopy
- Errors: plain language, blame-free, actionable. "That email's already registered — sign in instead?" not "Error 409"
- Confirmations: specific. "Post shared to Gromada" beats "Success"

### Notifications
- Prime push permission with in-app contextual explanation BEFORE system prompt. Never on first launch.
- Group notifications by thread/conversation/post
- Granular notification settings (per category, per conversation, quiet hours)
- Badge counts = actionable items only (unread DMs, mentions). Never inflate.

### Social-specific
- Double-tap-to-like on feed media: heart burst + light haptic. Optimistic, reversible.
- Block/mute/report: never shame user, never require explanation, always confirm outcome.

### Communities
- Emoji reactions: optimistic, animated. Never upvote/downvote (no score economy).
- Nested comments: indent up to 5 levels, then "Continue thread →". Collapsible at every level.

### Accessibility (non-negotiable)
- Label every interactive element for VoiceOver/TalkBack
- 4.5:1 contrast minimum for text; 3:1 for large text and UI elements
- Respect Dynamic Type (iOS) and Font Scale (Android). Never hardcode font sizes.
- Respect Reduce Motion: disable parallax, spring, non-essential animations
- Keyboard navigation on web/tablet

### Performance budgets
- Time to first interaction: < 2s on mid-range device
- Tap feedback: < 100ms
- Scroll: 60fps minimum, 120fps on ProMotion
- Animations: short 150–200ms, medium 250–300ms, long 400–500ms. Never exceed 500ms.
- Easing: iOS default spring, Material emphasized/standard on Android

### Anti-patterns — NEVER
- Gate onboarding behind signup before showing value
- Use a spinner where a skeleton would work
- Confirm reversible actions with a modal — use undo
- Clear form input on error
- Autoplay video with sound
- Show empty states without a call to action
- Use error codes in user-facing copy
- Block UI on optimistic actions
- Request permissions without contextual priming
- Auto-scroll to top on back navigation
