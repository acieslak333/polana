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
