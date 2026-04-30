# Polana — Sprint Plan

> Update this file as tasks are completed. Mark items with ✅ when done, 🔄 when in progress.
> Current sprint is always the first one without "DONE" in the header.

---

## ✅ Sprint 1 — Foundation (DONE)

**Goal:** Working project skeleton. Auth flow end-to-end. DB schema in place.

### Setup
- ✅ Expo 55 + React 19 + RN 0.85 — package.json, tsconfig, babel.config.js, app.json
- ✅ `constants/theme.ts` — full color palette, spacing, typography, shadows
- ✅ `constants/mindfulTexts.ts` — calming text bank
- ✅ `constants/config.ts` — Supabase URL, limits, city IDs

### i18n
- ✅ `i18n/index.ts` — i18next config, PL primary + EN fallback
- ✅ 8 namespaces × PL + EN: common, auth, onboarding, feed, gromady, events, messages, profile

### Database
- ✅ `supabase/migrations/001_initial_schema.sql` — full schema (cities, profiles, gromady, events, posts, messages, etc.)
- ✅ `supabase/migrations/002_rls_policies.sql` — RLS on every table
- ✅ `supabase/migrations/003_seed_data.sql` — dev seed data

### Services & Stores
- ✅ `services/supabase.ts` — singleton client with SecureStore adapter
- ✅ `services/auth.ts` — signIn, signUp, signOut, getProfile, updateProfile
- ✅ `stores/authStore.ts` — session, user, profile, isOnboardingComplete
- ✅ `stores/onboardingStore.ts` — wizard state
- ✅ `stores/preferencesStore.ts` — colorScheme, language, reduceMotion

### Routing & Auth Screens
- ✅ `app/_layout.tsx` — root layout: session hydration, onAuthStateChange listener
- ✅ `app/index.tsx` — redirect guard (→ welcome / onboarding / feed)
- ✅ `app/(auth)/_layout.tsx` — redirects logged-in users away
- ✅ `app/(auth)/welcome.tsx` — hero + sign in / sign up buttons
- ✅ `app/(auth)/login.tsx` — inline validation, no double-submit, password toggle
- ✅ `app/(auth)/register.tsx` — full validation, email verification screen
- ✅ `app/(auth)/terms.tsx` — terms of service screen
- ✅ `app/(onboarding)/_layout.tsx` — blocks unauthenticated + completed users
- ✅ `app/(onboarding)/profile-setup.tsx` — step 1/7 stub (name, nickname)
- ✅ `app/(app)/_layout.tsx` — 5-tab navigator (feed, gromady, map, messages, profile)
- ✅ Tab stub screens for all 5 tabs (index.tsx each)

### UI Components
- ✅ `components/ui/Button.tsx` — 4 variants (primary/secondary/ghost/destructive), loading state, disabled reason
- ✅ `components/ui/Input.tsx` — label, error, hint, password toggle, forwardRef, accessible

---

## ✅ Sprint 2 — Onboarding + Profile (DONE)

**Goal:** New user can complete full onboarding and see their profile. Avatar system works.

### Onboarding Flow (7 steps)
- ✅ `app/(onboarding)/interests.tsx` — interest grid, min 3, toggleable chips, fetched from Supabase
- ✅ `app/(onboarding)/city.tsx` — city picker (5 Polish cities from Supabase)
- ✅ `app/(onboarding)/gromada-pick.tsx` — 3 suggested Gromady by interest overlap, join any/all
- ✅ `app/(onboarding)/notifications.tsx` — push permission prime + MindfulText
- ✅ `app/(onboarding)/community-rules.tsx` — 3 rules + checkbox agreement
- ✅ `app/(onboarding)/ready.tsx` — profile creation + Supabase write + redirect

### Profile Creation
- ✅ Profile written to Supabase `profiles` table on onboarding complete
- ✅ User interests saved to `user_interests` table
- ✅ Selected Gromady joined via `gromada_members`
- ✅ `onboarding_completed = true` → unlocks main app

### Avatar System
- ✅ `components/avatar/avatarParts.ts` — part definitions, colors, emoji maps, `generateRandomAvatarConfig`
- ✅ `components/avatar/ProceduralAvatar.tsx` — emoji-based animal renderer with hat + accessory badge
- ✅ `components/avatar/AvatarEditor.tsx` — horizontal scroll pickers per part + color swatches
- ✅ `app/(app)/(profile)/avatar.tsx` — full editor screen with save to Supabase
- ✅ Random avatar auto-generated on registration

### Profile Screens
- ✅ `app/(app)/(profile)/index.tsx` — avatar, name, bio, member since, interests, settings link
- ✅ `app/(app)/(profile)/edit.tsx` — edit name, nickname, bio with live char counter
- ✅ `app/(app)/(profile)/settings.tsx` — language toggle, theme cycle, sign out

### Auth
- ✅ Google OAuth via `services/oAuth.ts` (expo-web-browser + Supabase PKCE flow)
- ✅ Apple Sign-In code ready in `services/oAuth.ts` (needs Apple credentials configured)

### UI Components
- ✅ `components/ui/Card.tsx`
- ✅ `components/ui/Badge.tsx` — with emoji support, selected state
- ✅ `components/ui/ProgressBar.tsx`
- ✅ `components/mindful/MindfulText.tsx`

### Code Review + Bug Fixes (done end of sprint)
- ✅ Fixed broken Supabase query (`supabase.rpc` used as filter value → JS filter instead)
- ✅ Fixed duplicate-key error check (`'23505'` code instead of string match)
- ✅ Fixed `avatar.tsx` TS null-narrowing error
- ✅ Fixed `notifications.tsx` — `router.push` moved out of `finally`
- ✅ Fixed `gromada-pick.tsx` — `selectedInterestIds.join(',')` in effect deps to prevent infinite loop
- ✅ Fixed `ready.tsx` — `saveOnboarding` moved inside effect; retry via `retryCount` state bump

### Deferred to later sprint
- ⏭️ Dark/light/system mode theme provider (settings toggle exists, visual switch deferred to Sprint 3)
- ⏭️ Reduce Motion in animations (no Reanimated animations yet)

---

## Sprint 3 — Gromady

**Goal:** Users can browse, join, and participate in Gromady. Posts + reactions working.

### Gromady Browsing
- [ ] `app/(app)/(gromady)/index.tsx` — grid of user's Gromady + "Find more" CTA
- [ ] `app/(app)/(gromady)/search.tsx` — search + filter by city/interest
- [ ] `app/(app)/(gromady)/create.tsx` — create Gromada (generative name, size, interests, description)
- [ ] `components/gromada/GromadaCard.tsx` — square card: avatar, name, member count, warmth indicator

### Gromada Panel
- [ ] `app/(app)/(gromady)/[id]/index.tsx` — main panel: posts feed + pinned event
- [ ] `app/(app)/(gromady)/[id]/members.tsx` — member list with roles
- [ ] `app/(app)/(gromady)/[id]/calendar.tsx` — upcoming + past events
- [ ] `app/(app)/(gromady)/[id]/info.tsx` — stats: meetings, favors, warmth, allies
- [ ] `app/(app)/(gromady)/[id]/settings.tsx` — elder-only: edit name, description, manage members
- [ ] `components/gromada/GromadaHeader.tsx` — collapsible header with tabs
- [ ] `components/gromada/EventPinned.tsx` — pinned next event card
- [ ] `components/gromada/WarmthIndicator.tsx` — visual warmth meter

### Posts
- [ ] `services/api/posts.ts` — CRUD + paginated fetch
- [ ] `hooks/usePosts.ts` — with optimistic updates
- [ ] `components/feed/PostCard.tsx` — author avatar, content (truncated at 3 lines), media, reactions, comment count
- [ ] `app/(app)/(feed)/post/[id].tsx` — full post + threaded comments
- [ ] Post composer in Gromada panel (auto-save draft, character counter near limit)

### Comments
- [ ] `components/feed/CommentThread.tsx` — Reddit-style nested, indent 5 levels, collapsible, "Continue thread →"
- [ ] Comment composer: reply-to indicator, @mention support

### Reactions
- [ ] `components/feed/ReactionBar.tsx` — Slack-style emoji reactions (add, remove, count)
- [ ] `components/ui/EmojiPicker.tsx` — filterable emoji grid bottom sheet

### Code Review + Bug Fixes (end of sprint)
- [ ] Run code-reviewer agent on all new Sprint 3 files
- [ ] Fix all confirmed bugs before marking sprint done

### Moderation
- [ ] Report post/comment flow (reason selection, no shame, clear outcome)
- [ ] Hide post (elder + author can hide)

### Generative Names
- [ ] `utils/nameGenerator.ts` — client-side mirror of DB `generate_gromada_name()` SQL function

---

## Sprint 4 — Feed + Events

**Goal:** Main feed works. Events visible on map. RSVP functional.

### Main Feed
- [ ] `app/(app)/(feed)/index.tsx` — full feed: posts from all user's Gromady, chronological DESC
- [ ] Pull-to-refresh, pagination (25 items), skeleton loading
- [ ] Filter tabs: All / Gromady / Friends / Discover
- [ ] `services/api/posts.ts` — feed query with join on gromada_members

### Events
- [ ] `services/api/events.ts` — CRUD + fetch by city/gromada
- [ ] `hooks/useEvents.ts`
- [ ] `components/event/EventCard.tsx` — type icon, title, location, date, RSVP count
- [ ] `components/event/CreateEventForm.tsx` — title, location, date picker, type, max attendees
- [ ] `app/(app)/(map)/event/[id].tsx` — event detail: anonymised attendees pre-RSVP, join chat button
- [ ] RSVP system: going / maybe / not going, optimistic

### Map
- [ ] Install + configure `react-native-maps`
- [ ] `app/(app)/(map)/index.tsx` — city map with event pins clustered
- [ ] `app/(app)/(map)/list.tsx` — list view alternative with filter/sort
- [ ] `components/map/CityMap.tsx` — map component with region, pins, user location
- [ ] `components/map/EventPin.tsx` — custom pin with event type icon
- [ ] `components/map/EventListItem.tsx` — list row

### Event Chatrooms
- [ ] Auto-create `chat_rooms` of type `event` when event is created
- [ ] Chat accessible post-RSVP only

### Code Review + Bug Fixes (end of sprint)
- [ ] Run code-reviewer agent on all new Sprint 4 files
- [ ] Fix all confirmed bugs before marking sprint done

---

## Sprint 5 — Community

**Goal:** Real-time chat works. Friends system complete. Push notifications live.

### Gromada Chat (Realtime)
- [ ] `services/api/messages.ts` — send, fetch paginated history
- [ ] `hooks/useMessages.ts` — Supabase Realtime subscription
- [ ] `app/(app)/(messages)/chat/[id].tsx` — full chat UI
- [ ] `components/chat/ChatBubble.tsx` — own vs other, timestamp, status (sent/delivered/read)
- [ ] `components/chat/ChatInput.tsx` — composer: grow to 6 lines, paste image, @mention, send on Enter
- [ ] `components/chat/ChatRoomItem.tsx` — list row: avatar, last message, unread badge
- [ ] Typing indicator (1s debounce send, 3s clear)
- [ ] Swipe-right-to-reply with haptic
- [ ] Long-press reaction menu (500ms, medium haptic)
- [ ] Mute chat (per-chat, duration picker)

### Direct Messages
- [ ] `app/(app)/(messages)/index.tsx` — chat list: gromada chats + DMs, sorted by last activity
- [ ] DM creation from friend profile
- [ ] `app/(app)/(messages)/friends.tsx` — friends list + pending requests
- [ ] `app/(app)/(messages)/friend/[id].tsx` — friend profile + DM button

### Friends System
- [ ] `services/api/users.ts` — friend request send/accept/decline/block
- [ ] `hooks/useFriends.ts`
- [ ] Add friend from Gromada member list or event attendees

### Push Notifications
- [ ] `services/notifications.ts` — register device token, permission flow with prime screen
- [ ] `hooks/useNotifications.ts` — foreground handler, notification tap navigation
- [ ] Supabase Edge Function `send-notification/index.ts` — trigger on new message / event / favor
- [ ] Notification categories: new message, event RSVP, new favor, crossover proposal

### Favors ("Potrzebne ręce")
- [ ] `services/api/favors.ts`
- [ ] `hooks/useFavors.ts`
- [ ] Favor request list in Gromada info panel
- [ ] Create favor (description, 7-day expiry)
- [ ] Offer help (message to requester)
- [ ] Mark as helped → increment `favors_exchanged` on Gromada

### Code Review + Bug Fixes (end of sprint)
- [ ] Run code-reviewer agent on all new Sprint 5 files
- [ ] Fix all confirmed bugs before marking sprint done

---

## Sprint 6 — Auto-generation + Polish

**Goal:** System self-sustains with generated events. Full feature completeness. Beta-ready.

### Edge Functions
- [ ] `supabase/functions/generate-events/index.ts` — daily event proposals for inactive Gromady
- [ ] `supabase/functions/expire-favors/index.ts` — mark favors `expired` after 7 days
- [ ] `supabase/functions/dormant-check/index.ts` — flag Gromady with no activity in 30 days as `dormant`
- [ ] Schedule all 3 as cron jobs in Supabase

### Crossovers
- [ ] `crossover_proposals` CRUD (`services/api/crossovers.ts`)
- [ ] Crossover proposal form (from Gromada info → to another Gromada)
- [ ] Crossover interest vote (like RSVP — shows demand)
- [ ] Crossover status flow: proposed → accepted → happening → completed

### Allies (Local Sponsors)
- [ ] `gromada_allies` display in Gromada info panel
- [ ] Ally card: business name, category, offer text
- [ ] Elder-only: add/remove ally

### User Calendar
- [ ] `app/(app)/(profile)/calendar.tsx` — upcoming + past events the user RSVPd to

### Gromada Stats
- [ ] `app/(app)/(gromady)/[id]/info.tsx` — meetings this week/month, total meetings, favors exchanged, warmth score
- [ ] Warmth score formula: `(meetings_this_month × 3) + (favors_exchanged × 2) + (member_count)`
- [ ] `components/gromada/WarmthIndicator.tsx` — visual bar / campfire icon

### Mindful Texts Integration
- [ ] `components/mindful/MindfulText.tsx` — renders random text from `mindfulTexts.ts`
- [ ] Add to: notifications onboarding step, all empty states, loading skeletons

### Code Review + Bug Fixes (end of sprint)
- [ ] Run code-reviewer agent on all new Sprint 6 files
- [ ] Fix all confirmed bugs before marking sprint done

### Beta Prep
- [x] Sentry integration (`services/sentry.ts`)
- [x] Plausible / PostHog event tracking (screen views, key actions only — privacy-first)
- [x] EAS build configuration (development, preview, production)
- [ ] App Store + Google Play metadata prep — Sprint 11
- [ ] Full accessibility audit — deferred Sprint 8
- [ ] Performance audit — deferred Sprint 8

---

## Sprint 7 — Maps + Media + Chat Polish

**Goal:** Map tab shows real events/gromady. Users can post images. Chat is polished. Friends + favors complete.

### Map Tab
- [ ] `react-native-maps` integration — event + gromada pins on MapView
- [ ] Map/list toggle in `app/(app)/(map)/index.tsx` — map view with clustered pins
- [ ] Location permission priming before requesting
- [ ] `app/(app)/(map)/create-event.tsx` — event creation form with location picker
- [ ] `components/event/CreateEventForm.tsx` — full form with type picker, datetime, location

### Media
- [ ] `services/api/media.ts` — upload image to Supabase Storage bucket `post-media`
- [ ] Post composer: image attachment button → expo-image-picker → upload → preview
- [ ] `components/feed/PostCard.tsx` — render image media inline (single or grid)
- [ ] Avatar photo upload in profile editor (custom_avatar_url)

### Chat Polish
- [ ] Chat bubble layout — sender right, receiver left, timestamps grouped by day
- [ ] Seen/sent indicator (single tick = sent, double = seen)
- [ ] Message reactions in chat (emoji tap to react to a message)
- [ ] Image sharing in chat

### Friends + Social
- [ ] `app/(app)/(messages)/friends.tsx` — friends list + pending requests
- [ ] `app/(app)/(messages)/friend/[id].tsx` — direct message thread
- [ ] Send friend request from profile view
- [ ] Accept/decline friend request with undo toast

### Favors
- [ ] Favor list in Gromada info panel (open + helped)
- [ ] Create favor form (description, 7-day expiry auto-set)
- [ ] "Offer help" → opens direct message with requester
- [ ] `hooks/useFavors.ts` — favor CRUD with optimistic updates

### Infrastructure
- [ ] Commit `services/notifications.ts` + `supabase/migrations/004_push_tokens.sql`

### Code Review (end of sprint)
- [ ] Run code-reviewer on all Sprint 7 files

---

## Sprint 8 — Discovery + Social Graph + Deep Linking

**Goal:** Users can discover Gromady beyond onboarding. Public profiles browsable. App is deep-linkable.

### Discovery
- [ ] `app/(app)/(gromady)/explore.tsx` — browse all Gromady: filter by city, interest, size; paginated
- [ ] `components/gromada/GromadaCard.tsx` — list-style card for explore view
- [ ] Join request flow for full Gromady (elder approval if at capacity)
- [ ] `app/(app)/(map)/index.tsx` — map pin tap → gromada preview sheet

### Public Profiles
- [ ] `app/(app)/(profile)/[id].tsx` — public profile: avatar, name, bio, shared gromady, send friend request
- [ ] `services/api/users.ts` — `fetchPublicProfile(userId)` RLS-safe
- [ ] Profile link from PostCard author tap

### Deep Linking
- [ ] `app.json` — `scheme: "polana"`, universal link domain config
- [ ] Link handlers: `polana://gromada/[id]`, `polana://event/[id]`, `polana://profile/[id]`
- [ ] Share button on event + gromada screens (uses `expo-sharing`)
- [ ] `utils/routing.ts` — `buildDeepLink(type, id)` + `resolveDeepLink(url)`

### Social Graph
- [ ] Mutual friends count on profile view
- [ ] "People you may know" stub in friends screen (shared gromada members)

### Accessibility Audit (deferred from S6)
- [ ] Manual VoiceOver + TalkBack checklist on all main screens — document findings
- [ ] Fix any critical a11y issues found (accessibilityLabel, accessibilityHint, roles)

### Performance
- [ ] Bundle size analysis: `npx expo-bundle-explorer` — document large deps
- [ ] FlatList `getItemLayout` + `windowSize` tuning on feed + member list
- [ ] Memo guards on PostCard, GromadaCard, EventCard

### Code Review (end of sprint)
- [ ] Run code-reviewer on all Sprint 8 files

---

## Sprint 9 — Safety + Resilience

**Goal:** Users can block/mute. Moderators have a queue. App survives crashes and offline gracefully.

### Block + Mute
- [ ] `supabase/migrations/006_blocks.sql` — `user_blocks(blocker_id, blocked_id, created_at)`
- [ ] RLS: blocked users cannot see each other's posts, profiles, chats
- [ ] `services/api/safety.ts` — `blockUser`, `unblockUser`, `muteUser`
- [ ] Block/mute action in profile view (3-dot menu)
- [ ] Chat mute: `chat_mutes` already in schema — wire up UI toggle

### Moderation Queue
- [ ] `app/(app)/(profile)/moderation.tsx` — elder-only: list of pending reports for their Gromady
- [ ] Report card: content preview, reporter reason, action buttons (dismiss / hide content)
- [ ] `services/api/moderation.ts` — `fetchPendingReports`, `resolveReport`
- [ ] Elder notification when new report arrives in their Gromada

### Error Boundaries
- [ ] `components/ui/ErrorBoundary.tsx` — React error boundary with Sentry capture + retry button
- [ ] Wrap every tab screen and every modal in ErrorBoundary
- [ ] `components/ui/NetworkError.tsx` — offline banner + retry CTA

### Offline Cache
- [ ] `stores/cacheStore.ts` — Zustand + AsyncStorage persist for: feed posts, gromady list, user profile
- [ ] Stale-while-revalidate pattern in `usePosts`, `useGromady`, `useEvents`
- [ ] Show cached data with "offline" badge when network unavailable

### Code Review (end of sprint)
- [ ] Run code-reviewer on all Sprint 9 files

---

## Sprint 10 — Invites + Emails + Admin

**Goal:** Gromady can invite people. Email flows are branded. Elders have admin tools.

### Invite System
- [ ] `supabase/migrations/007_invites.sql` — `gromada_invites(id, gromada_id, created_by, code, expires_at, used_by)`
- [ ] `supabase/functions/create-invite/index.ts` — generate unique code, return deep link
- [ ] `app/(app)/(gromady)/[id]/invite.tsx` — elder generates link, share sheet
- [ ] Deep link handler: `polana://invite/[code]` → join flow with context card

### Branded Emails (Supabase)
- [ ] `supabase/templates/welcome.html` — welcome email after registration
- [ ] `supabase/templates/invite.html` — gromada invite email with CTA button
- [ ] `supabase/templates/reset.html` — password reset email
- [ ] Configure custom SMTP or Supabase email settings in docs

### Password Reset
- [ ] `app/(auth)/forgot-password.tsx` — email input → Supabase `resetPasswordForEmail`
- [ ] `app/(auth)/reset-password.tsx` — deep link lands here, new password form
- [ ] Deep link: `polana://reset-password?token=...`

### Elder Admin Panel
- [ ] `app/(app)/(gromady)/[id]/admin.tsx` — elder-only: remove member, pin/unpin event, edit gromada info
- [ ] Remove member: confirmation undo-toast, triggers `gromada_members` delete
- [ ] Transfer elder role to another member
- [ ] Archive gromada (status → archived)

### Code Review (end of sprint)
- [ ] Run code-reviewer on all Sprint 10 files

---

## Sprint 11 — Legal + GDPR

**Goal:** App is legally compliant, GDPR-ready, and submitted to App Store + Google Play.

### Legal Screens
- [ ] `app/(auth)/privacy.tsx` — full privacy policy (Polish + English)
- [ ] `app/(auth)/terms.tsx` — update terms to final version with GDPR references
- [ ] Link to both from registration screen and profile settings

### GDPR Compliance
- [ ] `supabase/functions/export-data/index.ts` — export all user data as JSON (profile, posts, messages, RSVPs)
- [ ] `supabase/functions/delete-account/index.ts` — hard delete user + all content (GDPR Art. 17)
- [ ] `app/(app)/(profile)/data.tsx` — "Your data" screen: request export, delete account button
- [ ] Confirm delete: type "USUŃ" to confirm (no modal — undo impossible, so warning is right)
- [ ] Cookie/tracking consent banner (only if using any analytics)

### Final QA
- [ ] End-to-end flow test: register → onboarding → join gromada → RSVP event → chat → invite friend
- [ ] Test on iOS + Android physical devices
- [ ] Fix any crash bugs found in final QA

### App Store + Play Store
- [ ] App icon (1024×1024) — export from avatar system
- [ ] Splash screen (`app.json` splash config)
- [ ] `app.json` — final bundle ID, version 1.0.0, permissions rationale strings
- [ ] App Store screenshots (6.5" + 5.5" iPhone, 12.9" iPad)
- [ ] Play Store screenshots + feature graphic
- [ ] Store listings: Polish (primary) + English description, keywords

---

## Sprint 13 — Test Infrastructure + Pure Function Tests

**Goal:** Jest running in CI with 50% coverage threshold. Pure functions and stores fully tested. Foundation every later sprint builds on.

### Test Infrastructure
- [ ] `jest.config.js` — jest-expo preset, moduleNameMapper for `@/` alias, coverage config
- [ ] `jest.setup.ts` — mock AsyncStorage, expo-secure-store, expo-router, expo-notifications, react-i18next
- [ ] `__mocks__/supabase.ts` — typed mock of the Supabase client (shared across all test files)
- [ ] `__fixtures__/index.ts` — factory functions: makePost(), makeGromada(), makeProfile(), makeEvent(), makeMessage()
- [ ] `package.json` — add `test`, `test:watch`, `test:coverage` scripts
- [ ] `.github/workflows/ci.yml` — add Jest job, enforce 50% coverage threshold, fail PR on regression

### Utility Tests (`utils/__tests__/`)
- [ ] `dates.test.ts` — formatRelative, formatEventDate, all edge cases (today/yesterday/far future)
- [ ] `geo.test.ts` — distance calculation, city centre lookup, normalizeCity with Polish diacritics
- [ ] `validation.test.ts` — email valid/invalid, password length, bio max 200 chars, post max 5000
- [ ] `routing.test.ts` — buildDeepLink all 4 types, resolveDeepLink polana:// and https://, malformed input returns null
- [ ] `nameGenerator.test.ts` — output matches `word word word` pattern, differs over 10 runs

### Store Tests (`stores/__tests__/`)
- [ ] `authStore.test.ts` — session set/clear, reset(), profile partial update
- [ ] `preferencesStore.test.ts` — language cycles pl→en→uk→pl, colorScheme cycles
- [ ] `onboardingStore.test.ts` — step fields set correctly, interests array toggle
- [ ] `cacheStore.test.ts` — setFeedPosts capped at 50, clearCache zeroes all fields

### i18n Coverage Test
- [ ] `i18n/__tests__/coverage.test.ts` — every key in `pl/` exists in `en/` and `uk/`; flags any missing key with the key name in the failure message

### Code Review (end of sprint)
- [ ] Preflight clean, coverage ≥ 50%, all tests green in CI

---

## Sprint 14 — Service Layer Tests

**Goal:** Every `services/api/*.ts` file tested against the typed Supabase mock. Auth service fully covered.

### Auth Service Tests
- [ ] `services/__tests__/auth.test.ts` — signIn success, wrong password error, signUp email-taken, signOut, getProfile null-user guard

### API Service Tests (`services/api/__tests__/`)
- [ ] `posts.test.ts` — fetchFeedPosts pagination, createPost with media_urls, toggleReaction add/remove, deletePost, hidePost
- [ ] `gromady.test.ts` — fetchMyGromady, fetchGromada 404, joinGromada duplicate-key ignored, leaveGromada, fetchAllGromady with interestId filter
- [ ] `users.test.ts` — fetchPublicProfile, fetchFriendshipStatus all 4 states, sendFriendRequest, fetchFriends, acceptFriendRequest, declineFriendRequest
- [ ] `events.test.ts` — fetchCityEvents pagination, createEvent, upsertRSVP going/maybe/not_going
- [ ] `messages.test.ts` — fetchChatRooms, fetchMessages, sendMessage, getOrCreateDM idempotent
- [ ] `favors.test.ts` — fetchGromadaFavors, createFavorRequest, offerHelp, markFavorHelped
- [ ] `crossovers.test.ts` — fetchCrossovers, proposeCrossover, voteCrossover RPC call, updateCrossoverStatus
- [ ] `safety.test.ts` — blockUser (duplicate ignored), unblockUser, fetchBlockedIds, muteChat, unmuteChat
- [ ] `moderation.test.ts` — fetchPendingReports filtered by gromadaIds, resolveReport hide/dismiss, undoResolveReport
- [ ] `invites.test.ts` — createInvite, fetchInviteByCode, expired-link throws, acceptInvite already-member ignored
- [ ] `media.test.ts` — uploadPostImage success + fetch-error, uploadAvatar upsert=true

### Code Review (end of sprint)
- [ ] All service tests green, mock verifies correct table/column names and RLS-safe queries

---

## Sprint 15 — Hook Tests

**Goal:** All data-fetching hooks tested for loading, success, error, and optimistic update states.

### Hook Tests (`hooks/__tests__/`)
- [ ] `usePosts.test.ts` — useGromadaPosts load, addPost optimistic + rollback on error, removePost, react toggle
- [ ] `usePosts.test.ts` — fetchFeedPosts filter by type, pagination append, offline fallback to cache
- [ ] `useEvents.test.ts` — useCityEvents load+paginate, rsvp optimistic update, refreshing state
- [ ] `useGromady.test.ts` — fetchMyGromady on mount, refresh, error state stays empty
- [ ] `useMessages.test.ts` — useChatMessages load, send optimistic append, Realtime subscription fires handler
- [ ] `useFavors.test.ts` — load, create, offer, markHelped — each verifies state update
- [ ] `useNotifications.test.ts` — registers when user present, cleans up subscriptions on unmount, navigates on notification tap

### Code Review (end of sprint)
- [ ] All hooks tested with renderHook + act(), async states (loading/success/error) all verified

---

## Sprint 16 — Component Tests

**Goal:** Critical UI components tested for render correctness and user interaction.

### UI Component Tests (`components/ui/__tests__/`)
- [ ] `Button.test.tsx` — all 4 variants render, loading shows spinner, disabled prevents onPress, accessibilityRole button
- [ ] `Input.test.tsx` — label renders, error message displayed, password toggle works, forwardRef
- [ ] `ErrorBoundary.test.tsx` — catches thrown error, renders fallback UI, retry resets hasError, captureError called
- [ ] `NetworkError.test.tsx` — renders offline banner, onRetry fires, accessibilityRole alert
- [ ] `Badge.test.tsx` — emoji support, selected state styling change
- [ ] `ProgressBar.test.tsx` — progress 0 / 0.5 / 1.0 rendered correctly

### Feed + Gromada Component Tests
- [ ] `PostCard.test.tsx` — text content renders, single image renders, 4-image grid renders, reaction bar present, author Pressable exists
- [ ] `GromadaCard.test.tsx` — name and member count displayed, warmth emoji shown
- [ ] `WarmthIndicator.test.tsx` — score 0 / 50 / 100 show correct campfire tier
- [ ] `EventCard.test.tsx` — title renders, RSVP pressable calls onRSVP, event type emoji shown

### Avatar Tests
- [ ] `ProceduralAvatar.test.tsx` — renders without crash for all base types and null config, size prop applied

### Code Review (end of sprint)
- [ ] 80%+ component coverage, all interactions use fireEvent from @testing-library/react-native

---

## Sprint 17 — Architecture: Clean Separation

**Goal:** Shared types extracted into a package. Services thinned to pure DB queries. Business logic lives in hooks. Tests from Sprints 13-16 stay green throughout — do not merge if any test breaks.

### Shared Types Package (`packages/db-types/`)
- [ ] `packages/db-types/package.json` — name `@polana/db-types`, TypeScript source, no build step needed
- [ ] `packages/db-types/src/tables.ts` — all DB row interfaces (Profile, GromadaRow, EventRow, Post, Message, FavorRequest, CrossoverProposal, GromadaInvite, ReportRow)
- [ ] `packages/db-types/src/enums.ts` — GromadaStatus, EventStatus, EventType, FriendshipStatus, MemberRole, ReportReason, ReportStatus
- [ ] `packages/db-types/src/index.ts` — re-exports all types
- [ ] `tsconfig.json` — paths: `@polana/db-types` → `packages/db-types/src/index.ts`
- [ ] `metro.config.js` — watchFolders: packages/ for Metro bundler

### Pnpm Workspaces
- [ ] `pnpm-workspace.yaml` — `packages: [packages/*]`
- [ ] Run `pnpm install`, commit `pnpm-lock.yaml`, delete `package-lock.json`
- [ ] `.github/workflows/ci.yml` — switch `npm ci` → `pnpm install --frozen-lockfile`

### API Layer Cleanup
- [ ] Remove all inline type definitions from `services/api/*.ts` — import from `@polana/db-types`
- [ ] Each service file = only Supabase queries, no business logic
- [ ] Any business logic mixed into services → moved to hooks or a new `domain/` layer
- [ ] Audit and remove any remaining `any` casts from the Sprints 3-6 era

### Documentation
- [ ] `context_map.md` — updated to reflect packages/ + clean separation
- [ ] `docs/architecture.md` — data flow: Screen → Hook → service/api → Supabase
- [ ] `docs/adding-a-feature.md` — step-by-step for a new developer adding a CRUD feature

### Code Review (end of sprint)
- [ ] All Sprint 13-16 tests still green, TS clean, pnpm CI green, no `any` in services

---

## Sprint 18 — Observability + Admin Panel

**Goal:** Know what users do and what breaks before launch. Manage content without touching code.

### PostHog Analytics (privacy-first)
- [ ] `services/analytics.ts` — PostHog client init, `trackEvent(name, props)` wrapper, `identifyUser(id, city)`
- [ ] `app/_layout.tsx` — PostHogProvider wraps the app
- [ ] Screen tracking via `usePathname()` → `posthog.screen()` on every route change
- [ ] Event tracking: `join_gromada`, `rsvp_event`, `send_message`, `create_post`, `invite_sent`, `friend_added`, `block_user`
- [ ] No PII in events — only anonymous userId hash + city slug
- [ ] `EXPO_PUBLIC_POSTHOG_KEY` + `EXPO_PUBLIC_POSTHOG_HOST` env vars, documented in `.env.example`

### Structured Edge Function Logs
- [ ] `supabase/migrations/008_app_logs.sql` — `app_logs(id, function_name, event, user_id, duration_ms, success, error_msg, created_at)` with 30-day retention via pg_cron
- [ ] `supabase/functions/_shared/logger.ts` — `logEvent(supabase, event, opts)` helper
- [ ] Update all 6 Edge Functions to call logEvent at entry and exit
- [ ] `supabase/functions/purge-logs/index.ts` — cron: DELETE app_logs WHERE created_at < NOW() - INTERVAL 30 days

### User Flags
- [ ] `supabase/migrations/009_user_flags.sql` — `ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT false`
- [ ] RLS update on posts, comments, messages: banned users blocked from read/write
- [ ] `services/api/safety.ts` — `banUser(userId)`, `unbanUser(userId)` (admin-only, calls service-role Edge Function)

### Retool Admin Panel
- [ ] Retool workspace connected to Supabase (read-only anon key for queries, service-role only via Edge Functions for mutations)
- [ ] **Content editor**: `interests`, `name_adjectives`, `name_animals`, `name_suffixes` — view/add/edit/delete rows
- [ ] **Mindful texts**: view/edit `constants/mindfulTexts.ts` content via a writable `mindful_texts` DB table (migrate hardcoded array to DB)
- [ ] **Moderation queue**: pending reports with hide/dismiss actions → calls resolve-report Edge Function
- [ ] **User lookup**: search by email, view profile + gromady, ban/unban button
- [ ] **Analytics**: embed PostHog dashboard iframe

### Code Review (end of sprint)
- [ ] Analytics events firing in dev console, admin panel deployed, logs flowing in app_logs table

---

## Sprint 19 — E2E Tests (Maestro)

**Goal:** 5 critical user journeys automated on simulator. Runs in CI nightly. No manual regression testing before each release.

### Maestro Setup
- [ ] Install Maestro CLI, add to CI runner, document setup in `docs/e2e.md`
- [ ] `.maestro/` directory at repo root
- [ ] `.github/workflows/e2e.yml` — nightly at 02:00 on iOS Simulator (macos runner), post results summary to PR
- [ ] Supabase test project configured — seeded with `003_seed_data.sql`, separate from production

### E2E Flows (`.maestro/*.yaml`)
- [ ] `01_register_onboard.yaml` — launch → register email → verify email (mocked) → 7-step onboarding → land on feed tab
- [ ] `02_create_post.yaml` — open gromada → tap composer → type post → submit → post visible in feed
- [ ] `03_rsvp_event.yaml` — map tab → list view → find first event → tap RSVP "Idę" → navigate to calendar → event listed
- [ ] `04_send_message.yaml` — messages tab → open first chat room → type message → send → message visible in bubble list
- [ ] `05_invite_flow.yaml` — gromada info → admin panel → generate invite → copy link → navigate to link → member count increments

### Code Review (end of sprint)
- [ ] All 5 flows passing on iOS Simulator, E2E workflow green in CI nightly

---

## Sprint 20 — Pre-Launch Hardening + Store Submission

**Goal:** App is shippable. Store listings live. TestFlight soak passed. Submit to App Store and Google Play.

### Accessibility Final Pass
- [ ] VoiceOver audit: register, browse feed, RSVP event, send message, view profile — document any issues found
- [ ] Fix any missing `accessibilityLabel` / `accessibilityHint` surfaced by audit
- [ ] Minimum contrast ratio check on all Text components (WCAG AA: 4.5:1)
- [ ] All interactive elements ≥ 44pt verified (run automated check with a11y tooling)

### Performance
- [ ] Cold start < 3s measured on iPhone 12 and Pixel 6a
- [ ] `npx expo-bundle-explorer` — find and remove any large unused dependencies
- [ ] Image loading: add `blurhash` placeholder while Supabase Storage images load
- [ ] Verify FlatList `getItemLayout` on feed, member list, event list

### Store Assets
- [ ] App icon 1024×1024 PNG (transparent background for Android adaptive icon)
- [ ] Splash screen 2048×2048 PNG on dark background (#1A1612)
- [ ] iOS screenshots: 6.5" × 5 screens + 12.9" iPad × 3 screens
- [ ] Android screenshots: phone × 5 + 7" tablet × 3 + feature graphic 1024×500
- [ ] Store listing PL: name "Polana – lokalne społeczności", subtitle, description 4000 chars, 5 keywords
- [ ] Store listing EN: same content in English
- [ ] Age rating form: 4+ iOS / Everyone Android

### Legal + Config Verification
- [ ] Privacy policy live at `https://polana.app/privacy`
- [ ] `app.json` — all permission rationale strings filled (camera, location, notifications, photo library)
- [ ] Supabase DPA signed (GDPR data processing agreement)
- [ ] Push notification certificate configured in EAS for production

### Build + Submit
- [ ] `eas build --platform all --profile production` — both stores
- [ ] TestFlight: 10 internal testers, 48h soak, 0 crashes required before proceeding
- [ ] Google Play internal track: same 48h soak
- [ ] `eas submit --platform ios --latest`
- [ ] `eas submit --platform android --latest`

### Code Review (end of sprint)
- [ ] Crash-free rate ≥ 99% in Sentry after 48h TestFlight. Congrats — you shipped.

---

## Sprint 21 — Database Security, Indexing & Scalability

**Goal:** The database is hardened against real-world attack vectors, performs well at 50k+ users, and follows professional backend engineering standards. Every identified gap from the schema audit is fixed.

### Context — What the audit found

After reviewing `001_initial_schema.sql` and `002_rls_policies.sql`, these are the concrete issues:

**Security gaps:**
- `profiles_select_any` policy uses `USING (true)` — any authenticated user can read every column of every profile, including `date_of_birth`, `push_token`, `last_active_at`. This is GDPR-risky.
- `chat_rooms_insert_authenticated` uses `USING (auth.uid() IS NOT NULL)` — any logged-in user can create any type of chat room with any participants.
- `reports_select_own` only lets reporters see their own reports — elders cannot see reports filed against content in their own Gromada.
- `gromada_allies` has no INSERT/UPDATE/DELETE policies — currently only elders can update `gromady` metadata, but allies have no write protection at DB level.
- `push_token` stored in plaintext in `profiles` — should use pgcrypto symmetric encryption or Supabase Vault.
- `date_of_birth` stored in plaintext — encrypt with `pgp_sym_encrypt` or strip to age-range bucket only.
- No audit trail for sensitive admin actions (ban, delete, remove member).
- Missing tables from planned sprints: `user_blocks`, `gromada_invites`, `admin_users`.

**Missing indexes (all foreign keys and query columns lack indexes):**
Every join and filter will cause sequential scans on large tables. Critical missing indexes:
- `gromada_members(gromada_id)`, `gromada_members(user_id)` — most-joined table in the app
- `posts(gromada_id, created_at DESC)` — feed query
- `posts(author_id)`, `posts(is_hidden)`
- `messages(chat_room_id, created_at DESC)` — chat pagination
- `events(city_id, starts_at)`, `events(gromada_id, status)`
- `event_rsvps(event_id)`, `event_rsvps(user_id)`
- `comments(post_id, created_at)`, `comments(parent_comment_id)`
- `reactions(post_id)`, `reactions(user_id)`
- `friendships(requester_id)`, `friendships(addressee_id)`
- `favor_requests(gromada_id, status, expires_at)`
- `profiles(city_id)`, `profiles(last_active_at)`, `profiles(is_banned)`
- PostGIS `GIST` index on `events.location_point` — without this, geo queries are O(n)

**Scalability gaps:**
- No query timeouts set — a rogue query can stall the whole connection pool
- `warmth_score` recomputed on every profile load — should be materialized or cached
- `meetings_this_month` / `meetings_this_week` counters in `gromady` are updated by triggers but never reset — need a cron reset job
- No `ANALYZE` schedule (Supabase auto-analyzes but explicit schedule helps post-migration)
- Connection pooler mode: Supabase uses PgBouncer by default in `transaction` mode — confirm Edge Functions use the pooler URL, not the direct URL

### Tasks

#### s21-indexes — `010_indexes.sql`
- `CREATE INDEX CONCURRENTLY` for all missing indexes listed above
- `CREATE INDEX CONCURRENTLY` on `messages(chat_room_id, created_at DESC)`
- `CREATE INDEX CONCURRENTLY` on `posts(gromada_id, created_at DESC) WHERE is_hidden = false` (partial index)
- `CREATE INDEX CONCURRENTLY` on `events(city_id, starts_at) WHERE status = 'upcoming'` (partial index)
- `CREATE INDEX CONCURRENTLY` using `GIST` on `events.location_point`
- `CREATE INDEX CONCURRENTLY` on `profiles(city_id)`, `profiles(last_active_at)`, `profiles(is_banned)`
- `CREATE INDEX CONCURRENTLY` on all FK columns in junction tables
- Add `COMMENT ON INDEX` for each, explaining the query it serves

#### s21-rls-fix — `011_rls_fixes.sql`
- Replace `profiles_select_any` with a view-based approach:
  - Create `profiles_public` view exposing only: `id, first_name, nickname, bio, city_id, avatar_config, custom_avatar_url, created_at` — no DOB, no push_token, no last_active_at
  - Grant SELECT on the view to `authenticated` role
  - Drop the `profiles_select_any` policy; replace with `profiles_select_self` (own full row) + RLS on the view
- Fix `chat_rooms_insert_authenticated`:
  - `INSERT WITH CHECK`: gromada-type rooms only if member, event-type rooms only if RSVP'd `going`, direct rooms only if neither participant is blocked
- Add elder-level report visibility:
  - `reports_select_elder`: SELECT using EXISTS check — reporter_id = auth.uid() OR (gromada_id is in a gromada where elder_id = auth.uid())
  - Requires joining reports → posts/comments → gromady
- Add `gromada_allies` write policies: INSERT/UPDATE/DELETE only for elder of that gromada
- Add `crossover_proposals` UPDATE policy for status changes (to/from gromada elders only)
- Verify `friendships_update_addressee` doesn't allow requester to unblock themselves

#### s21-missing-tables — `012_missing_tables.sql`
- `user_blocks(id, blocker_id, blocked_id, created_at)` — unique on (blocker_id, blocked_id)
- RLS: SELECT/INSERT/DELETE by blocker_id only
- `gromada_invites(id, gromada_id, created_by, code TEXT UNIQUE, expires_at, used_by, used_at)`
- RLS: INSERT by gromada elder, SELECT by any authenticated (needed for link resolution)
- Trigger: mark invite `used_by` + `used_at` on redemption; enforce `expires_at`; enforce single use
- `admin_users(id, user_id REFERENCES profiles(id), role TEXT CHECK(role IN ('super_admin','moderator','content_editor')), granted_by UUID, created_at)` — used by both Sprint 21 and Sprint 22
- RLS: SELECT by auth user for own row + by service role only for writes (never writable from client)

#### s21-encryption — `013_encryption.sql`
- Enable `pgcrypto` extension: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- **`date_of_birth`**: Replace with age-range bucket only — `ALTER TABLE profiles ADD COLUMN age_group TEXT CHECK (age_group IN ('16-17','18-24','25-34','35-44','45-54','55+'))` — drop `date_of_birth` column (it is not needed after onboarding; we only need it for the 16+ check which can be done at registration time). Migration strips existing DOBs to age group then drops column.
- **`push_token`**: Encrypt with `pgp_sym_encrypt(push_token, current_setting('app.push_token_key'))` — set `app.push_token_key` via `ALTER DATABASE SET app.push_token_key = '...'` (loaded from Supabase Vault). Service-layer reads with `pgp_sym_decrypt`. App never reads push_token back — it only writes.
- **`contact_email` in `gromada_allies`**: Same pgcrypto symmetric encryption
- Document key rotation procedure in `docs/encryption.md`

#### s21-audit — `014_audit_log.sql`
- `audit_log(id BIGSERIAL PK, table_name TEXT, record_id UUID, action TEXT CHECK(action IN ('INSERT','UPDATE','DELETE')), changed_by UUID, old_data JSONB, new_data JSONB, created_at TIMESTAMPTZ DEFAULT NOW())`
- Trigger function `audit_trigger()`: fires AFTER INSERT/UPDATE/DELETE on sensitive tables, captures `auth.uid()` via `current_setting('request.jwt.claims')`
- Attach to: `gromada_members` (joins/leaves), `profiles` (is_banned changes), `gromady` (status changes), `admin_users` (grants/revokes)
- Retention: pg_cron job deletes rows older than 90 days
- RLS: no client access (service role only)

#### s21-scalability — `015_scalability.sql` + `docs/database.md`
- Set `statement_timeout = '30s'` and `lock_timeout = '10s'` at session level in Edge Functions
- Add `ANALYZE` to the migration so query planner stats are fresh
- Materialized view `gromada_warmth_scores(gromada_id, warmth_score, refreshed_at)` — refreshed by pg_cron every hour
- Monthly counter reset: pg_cron job on 1st of each month resets `meetings_this_month = 0` on all gromady; weekly reset for `meetings_this_week`
- `docs/database.md`: document connection pooler URLs, index strategy, query explain plans for the 5 most expensive queries, growth projections (1k/10k/100k users), partitioning trigger point (>10M messages → partition by month)

#### s21-edge-security — Edge Function hardening
- All Edge Functions: validate `Authorization` header AND check `admin_users` table when called from admin context
- Add `X-Request-ID` header passthrough for audit log correlation
- Rate limit: implement sliding window counter in `api_rate_limits(user_id, endpoint, window_start, count)` — reject if count > threshold
- `send-notification` function: validate push token belongs to target user before sending

### Code Review (end of sprint)
- [ ] Run `EXPLAIN ANALYZE` on the 10 most common queries — all use index scans, no sequential scans on tables > 1000 rows
- [ ] RLS verification: test with 3 users (stranger, member, elder) that each sees only what they should
- [ ] Encryption: verify push tokens not readable via Supabase dashboard (check pgcrypto output)
- [ ] Audit log fires correctly for ban action, member removal, admin grant

---

## Sprint 22 — Admin Panel (Web App)

**Goal:** A secure, privately-hosted web admin panel that lets you (and designated admins) manage all configurable aspects of Polana — content, users, gromady, places, event types — without touching code or the database directly.

### Architecture Decision

**Where to host:** Vercel (Next.js App Router)
- Free tier handles: preview deployments per PR, custom domain, HTTPS, env var management
- Deploy from `packages/admin/` subfolder in the monorepo
- `vercel.json` in `packages/admin/` specifies `rootDirectory`
- Custom domain: `admin.polana.app` — locked behind HTTP Basic Auth at Vercel level as a first gate

**Security model (layered):**
```
Browser → Vercel (HTTP Basic Auth) → Next.js (Supabase session check) → Edge Functions (admin_users table) → Supabase (service role)
```
1. **Layer 1 — Vercel Password Protection**: Vercel Pro's password protection feature on `admin.polana.app` — simple shared password blocks casual access (not security, just obscurity layer)
2. **Layer 2 — Supabase Auth**: Email + password login, only pre-approved emails in `admin_users` table can log in
3. **Layer 3 — admin_users check**: Every page and API route verifies the session user exists in `admin_users` with appropriate role
4. **Layer 4 — Edge Functions for mutations**: All writes go through Edge Functions that re-verify `admin_users` using service role, never client-side

**Never exposed to browser:** `SUPABASE_SERVICE_ROLE_KEY` — it only exists in Edge Function environment vars

**Granting access to new admins:**
- You run a script (or Edge Function endpoint): `POST /admin/grant-access { email, role }`
- Creates a record in `admin_users` + sends a Supabase magic link to their email
- They follow the link, set a password, and can log in
- To revoke: `DELETE FROM admin_users WHERE user_id = ?` — next request returns 403

### Tech Stack (admin panel only)
| Tool | Version | Purpose |
|---|---|---|
| Next.js | 14 | App Router, server components, API routes |
| TypeScript | strict | Same rules as main app |
| Tailwind CSS | 3 | Utility-first styling (no theme.ts — this is a web app) |
| shadcn/ui | latest | Pre-built admin UI components (table, form, dialog, toast) |
| Supabase JS | 2 | Auth + data fetch + realtime |
| TanStack Table | 8 | Data tables with sort/filter/pagination |
| Zod | 3 | Form validation schemas |
| React Hook Form | 7 | Form state management |

### Folder Structure
```
packages/admin/
  app/
    layout.tsx               — root layout with sidebar + auth guard
    (auth)/
      login/page.tsx         — email + password login form
    (dashboard)/
      page.tsx               — overview: user count, gromada count, reports count
      users/page.tsx         — user lookup, ban/unban
      users/[id]/page.tsx    — user detail: profile, gromady, activity log
      gromady/page.tsx       — all gromady table: status, member count, filter
      gromady/[id]/page.tsx  — gromada detail: members, events, change status
      content/
        interests/page.tsx   — interests CRUD table
        names/page.tsx       — adjectives/animals/suffixes CRUD
        event-types/page.tsx — event type CRUD (after making it a DB table)
        cities/page.tsx      — city management
        mindful-texts/page.tsx — mindful text bank management
      places/page.tsx        — places CRUD (Sprint 23 prerequisite)
      reports/page.tsx       — moderation queue: pending reports, resolve actions
      config/page.tsx        — feature flags, limits (max_members, max_gromady_per_user)
  components/
    sidebar.tsx
    data-table.tsx
    user-row.tsx
    confirm-dialog.tsx
  lib/
    supabase.ts              — admin Supabase client (anon key)
    admin-check.ts           — server-side admin_users verification middleware
    edge-functions.ts        — typed wrappers for Edge Function calls
  middleware.ts              — Next.js middleware: redirect to login if no session
  vercel.json
  package.json
  tailwind.config.ts
  tsconfig.json
```

### Tasks

#### s22-scaffold — Admin panel scaffold
- `packages/admin/` directory with all config files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `vercel.json`
- `pnpm-workspace.yaml` updated to include `packages/admin`
- `.github/workflows/admin-deploy.yml` — Vercel deploy on push to `main`
- `packages/admin/app/layout.tsx` — root layout with sidebar navigation component
- `packages/admin/middleware.ts` — redirect to `/login` if no valid Supabase session + admin role check
- `packages/admin/lib/supabase.ts` — server-side Supabase client using `@supabase/ssr`
- `packages/admin/lib/admin-check.ts` — `requireAdmin(role?)` function: reads session, checks `admin_users`, throws 403 if not authorized
- `packages/admin/app/(auth)/login/page.tsx` — clean login form with Supabase email+password auth
- `packages/admin/app/(dashboard)/page.tsx` — stats overview: users, gromady, reports, recent activity

#### s22-user-management — User management
- `packages/admin/app/(dashboard)/users/page.tsx` — searchable table: email, name, city, is_banned, created_at
- `packages/admin/app/(dashboard)/users/[id]/page.tsx` — full profile, list of gromady, ban/unban action
- Edge Function `admin-ban-user/index.ts` — validates admin role, sets `profiles.is_banned`, logs to audit_log
- Edge Function `admin-unban-user/index.ts` — same, unsets flag
- Edge Function `admin-grant-access/index.ts` — creates `admin_users` record, sends magic link

#### s22-content-management — Content CRUD
- `packages/admin/app/(dashboard)/content/interests/page.tsx` — table of all interests + add/edit/delete inline
- `packages/admin/app/(dashboard)/content/names/page.tsx` — tabs: adjectives / animals / suffixes, add/remove words
- **`016_event_types_table.sql`** — migrate `event_type` from CHECK constraint to `event_types(id, name_pl, name_en, emoji, is_active)` table; update events FK; update RLS
- `packages/admin/app/(dashboard)/content/event-types/page.tsx` — add/toggle active event types
- **`017_mindful_texts_table.sql`** — `mindful_texts(id, category TEXT, text_pl TEXT, text_en TEXT, is_active)` table seeded from `constants/mindfulTexts.ts` content; update `MindfulText` component to fetch from DB
- `packages/admin/app/(dashboard)/content/mindful-texts/page.tsx` — manage mindful text bank per category
- `packages/admin/app/(dashboard)/content/cities/page.tsx` — add/edit city (name, coordinates, timezone, is_active)

#### s22-gromada-management — Gromada management
- `packages/admin/app/(dashboard)/gromady/page.tsx` — sortable/filterable table: name, city, status, member count, last activity
- `packages/admin/app/(dashboard)/gromady/[id]/page.tsx` — member list, upcoming events, change status (active/dormant/archived), transfer elder
- Edge Function `admin-archive-gromada/index.ts` — validates admin role, sets status + notifies members
- Edge Function `admin-transfer-elder/index.ts` — validates new elder is a member, updates `elder_id`

#### s22-moderation — Reports queue
- `packages/admin/app/(dashboard)/reports/page.tsx` — pending reports table with content preview, reason, reporter info
- Resolve actions: hide content / dismiss / warn user (adds note to audit_log)
- Edge Function `admin-resolve-report/index.ts` — hides post/comment or dismisses report, logs action

#### s22-config — Feature flags & limits
- **`018_config_table.sql`** — `app_config(key TEXT PK, value TEXT, description TEXT, updated_by UUID, updated_at)` — seed with: `max_members_small=15`, `max_members_medium=30`, `max_members_large=50`, `max_gromady_per_user=3`, `max_upcoming_events=5`, `invite_expiry_days=7`
- `packages/admin/app/(dashboard)/config/page.tsx` — editable key-value config table
- Edge Function `admin-update-config/index.ts` — updates `app_config`, logs to audit_log
- Update existing trigger functions and Edge Functions to read limits from `app_config` instead of hardcoded values

### Code Review (end of sprint)
- [ ] Login with a non-admin Supabase user → 403 on every route
- [ ] Ban a user → is_banned = true in DB → audit_log entry → user cannot log in
- [ ] Add an interest → immediately visible in mobile app
- [ ] Non-super_admin cannot access `/config` or `/users/[id]/ban`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` confirmed absent from browser network requests

---

## Sprint 23 — Places & Smart Location Suggestions

**Goal:** Users get intelligent place suggestions when creating events, based on the event type and their Gromada's interests. Daily/weekly recurring events are supported. Google Places API handles ad-hoc location search. A curated places database powers smart suggestions.

### Decision: Where Does Place Data Come From?

**Three-source hybrid:**

| Source | Use case | Storage |
|---|---|---|
| **Google Places API** | Ad-hoc location search when user types a custom venue | Do NOT store — extract name + coordinates only (ToS) |
| **Curated `places` table** | Smart suggestions seeded by admin + user proposals | Our DB, full metadata |
| **Historical event data** | "Leśne Chomiki always meet at Praga Park" inference | Derived from `events` table |

**Cost:** Google Places API costs $0.017/autocomplete request. With $200/month free credit that's ~11,700 free searches/month — more than enough for early stage. Set a billing alert at $50.

### Database Schema

#### `019_places.sql`
```sql
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  address TEXT NOT NULL,
  city_id UUID NOT NULL REFERENCES public.cities(id),
  location_point GEOGRAPHY(POINT, 4326) NOT NULL,
  place_types TEXT[] NOT NULL DEFAULT '{}',
    -- possible values: 'park','cafe','gym','community_center','library',
    --                  'sports_field','indoor_hall','restaurant','studio'
  is_indoor BOOLEAN NOT NULL DEFAULT false,
  capacity INT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  source TEXT NOT NULL DEFAULT 'admin_curated' CHECK (source IN ('admin_curated','user_suggested')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction: which interests fit this place
CREATE TABLE public.place_interest_tags (
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, interest_id)
);

-- RLS: places are public read, admin-only write
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places_select_active" ON public.places FOR SELECT USING (is_active = true);
-- INSERT/UPDATE/DELETE: service role only (via admin panel Edge Functions)

ALTER TABLE public.place_interest_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "place_tags_select" ON public.place_interest_tags FOR SELECT USING (true);

-- Spatial index for geo queries
CREATE INDEX idx_places_location ON public.places USING GIST (location_point);
CREATE INDEX idx_places_city ON public.places (city_id);
CREATE INDEX idx_places_types ON public.places USING GIN (place_types);
```

#### `020_recurring_events.sql`
```sql
CREATE TABLE public.recurring_event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gromada_id UUID NOT NULL REFERENCES public.gromady(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  event_type TEXT REFERENCES public.event_types(id),  -- after Sprint 22
  preferred_place_id UUID REFERENCES public.places(id),
  preferred_location_name TEXT,   -- fallback if no place selected
  preferred_location_point GEOGRAPHY(POINT, 4326),
  recurrence TEXT NOT NULL CHECK (recurrence IN ('daily','weekly','biweekly','monthly')),
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday, null for daily
  time_of_day TIME NOT NULL DEFAULT '18:00',
  max_attendees INT,
  is_active BOOLEAN DEFAULT true,
  last_instantiated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: elder of gromada can create/manage
ALTER TABLE public.recurring_event_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select_member" ON public.recurring_event_templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.gromada_members WHERE gromada_id = recurring_event_templates.gromada_id AND user_id = auth.uid())
  );
CREATE POLICY "templates_insert_elder" ON public.recurring_event_templates
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.gromady WHERE id = gromada_id AND elder_id = auth.uid())
  );
CREATE POLICY "templates_update_elder" ON public.recurring_event_templates
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.gromady WHERE id = gromada_id AND elder_id = auth.uid()));
CREATE POLICY "templates_delete_elder" ON public.recurring_event_templates
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.gromady WHERE id = gromada_id AND elder_id = auth.uid()));
```

### Place Suggestion Algorithm

**Endpoint:** Edge Function `suggest-places/index.ts`

**Input:** `{ gromada_id, event_type, max_results = 5 }`

**Steps:**
1. Fetch gromada's city center from `gromady JOIN cities`
2. Fetch gromada's interest IDs from `gromada_interests`
3. Map interests → expected `place_types` using a lookup table (hardcoded in Edge Function):
   - sport interests (Rower, Bieganie, Joga, Siatkówka, Badminton, Wspinaczka) → `['park','gym','sports_field','indoor_hall']`
   - social interests (Kawa i herbata, Gry planszowe, Matcha) → `['cafe','restaurant','library']`
   - creative (Ceramika, Muzyka, Rysunek, Fotografia) → `['studio','community_center','indoor_hall']`
   - outdoor (Spacery z psami, Piknik, Ogrodnictwo) → `['park']`
4. Query `places` with PostGIS: `ST_DWithin(location_point, city_center, 5000)` — within 5km
5. Filter by `place_types && $expectedTypes` (array overlap)
6. Exclude places used by this gromada in the last 14 days (join `events WHERE created_at > NOW() - 14 days`)
7. Score: `(1.0 / ST_Distance(location_point, city_center)) + (capacity_match_bonus) + (freshness_bonus)`
8. Return top `max_results` with distance and match reason

### Google Places Integration

**Where it's used:** `CreateEventForm` location field only

**Implementation:**
- `services/api/places.ts` — `searchGooglePlaces(query, cityCenter)` — calls `https://maps.googleapis.com/maps/api/place/autocomplete/json`
- Returns: `[{ place_id, description }]` — used for autocomplete display only
- On selection: call `getGooglePlaceDetails(place_id)` to get lat/lng
- Extract: `{ name: description, lat, lng }` — store as `location_name + location_point` in event
- **Never store `place_id` in our DB** — Google ToS prohibits caching

**`CreateEventForm` changes:**
- Location field: `TextInput` with debounced autocomplete (300ms)
- Dropdown shows: smart suggestions first (from Edge Function), then Google Places results as user types
- Smart suggestions shown immediately when form opens (0 network calls required)
- Google Places only called when user starts typing custom location
- User can tap a suggestion or type freely

**Environment variable:**
- `EXPO_PUBLIC_GOOGLE_PLACES_KEY` — restricted to bundle ID `com.polana.app` + `Maps JavaScript API` + `Places API`
- Set billing alert at $50/month in Google Cloud Console

### Recurring Events Edge Function

**`supabase/functions/instantiate-recurring-events/index.ts`**
- Runs daily at 06:00 via pg_cron (or Supabase scheduled function)
- Fetches all active `recurring_event_templates WHERE last_instantiated_at < NOW() - recurrence_interval`
- For each template, checks if a matching upcoming event already exists in the next recurrence window
- If not: `INSERT INTO events` with title, type, place, starts_at computed from recurrence + day_of_week + time_of_day
- Respects existing `enforce_max_gromada_events` trigger (max 5 upcoming events)
- Updates `last_instantiated_at`
- Logs to `app_logs`

### UI Changes

#### Recurring event UI (Gromada settings screen)
- `app/(app)/(gromady)/[id]/settings.tsx` — add "Recurring events" section (elder only)
- List active templates with recurrence badge
- Add/edit template: title, type, place (from suggestion dropdown), recurrence, day, time
- Toggle active/inactive

#### CreateEventForm improvements
- Split location field into two modes:
  1. "Suggest a place" tab — shows smart suggestions from Edge Function
  2. "Search address" tab — Google Places autocomplete
- Show suggestion cards: place name, place type icon, distance, why it was suggested ("Matches your cycling interests")

### Seed Data

**`003_seed_data.sql` update** (or `021_seed_places.sql`):
```sql
-- Warsaw places (seed ~20 places per city at launch)
INSERT INTO places (name, address, city_id, location_point, place_types, is_indoor, capacity) VALUES
  ('Park Skaryszewski', 'ul. Łazienkowska, Warszawa', <warsaw_city_id>,
   ST_SetSRID(ST_MakePoint(21.0456, 52.2278), 4326), ARRAY['park','sports_field'], false, NULL),
  ('Hala Mera', 'ul. Merliniego 5, Warszawa', <warsaw_city_id>,
   ST_SetSRID(ST_MakePoint(21.0123, 52.1845), 4326), ARRAY['gym','indoor_hall'], true, 200),
  -- ... 18 more Warsaw, then Kraków, Wrocław, Łódź, Gdańsk
  ;
```

### Code Review (end of sprint)
- [ ] `suggest-places` Edge Function returns relevant results within 200ms for Warsaw seed data
- [ ] Google Places autocomplete fires only after 300ms debounce, never on form open
- [ ] `place_id` from Google is never stored in any DB table
- [ ] Recurring event template for "weekly Thursday run" creates exactly 1 upcoming event when instantiated
- [ ] `enforce_max_gromada_events` trigger correctly blocks 6th event even from recurring template
