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

## ✅ Sprint 6 — Auto-generation + Polish (DONE)

**Goal:** System self-sustains with generated events. Full feature completeness. Beta-ready.

### Edge Functions
- ✅ `supabase/functions/generate-events/index.ts` — daily event proposals for inactive Gromady
- ✅ `supabase/functions/expire-favors/index.ts` — mark favors `expired` after 7 days
- ✅ `supabase/functions/dormant-check/index.ts` — flag Gromady with no activity in 30 days as `dormant`
- ✅ Schedule all 3 as cron jobs in Supabase

### Crossovers
- ✅ `crossover_proposals` CRUD (`services/api/crossovers.ts`)
- ✅ Crossover proposal form (from Gromada info → to another Gromada)
- ✅ Crossover interest vote (like RSVP — shows demand)
- ✅ Crossover status flow: proposed → accepted → happening → completed

### Allies (Local Sponsors)
- ✅ `gromada_allies` display in Gromada info panel
- ✅ Ally card: business name, category, offer text
- ✅ Elder-only: add/remove ally

### User Calendar
- ✅ `app/(app)/(profile)/calendar.tsx` — upcoming + past events the user RSVPd to

### Gromada Stats
- ✅ `app/(app)/(gromady)/[id]/info.tsx` — meetings this week/month, total meetings, favors exchanged, warmth score
- ✅ Warmth score formula: `(meetings_this_month × 3) + (favors_exchanged × 2) + (member_count)`
- ✅ `components/gromada/WarmthIndicator.tsx` — visual bar / campfire icon

### Mindful Texts Integration
- ✅ `components/mindful/MindfulText.tsx` — renders random text from `mindfulTexts.ts`
- ✅ Add to: notifications onboarding step, all empty states, loading skeletons

### Code Review + Bug Fixes (end of sprint)
- ✅ Ran code-reviewer — A grade (96.7/100). Fixed auth on send-notification Edge Function.

### Beta Prep
- ✅ Sentry integration (`services/sentry.ts`)
- ✅ Plausible / PostHog event tracking (screen views, key actions only — privacy-first)
- ✅ EAS build configuration (development, preview, production)
- ⏭️ App Store + Google Play metadata prep — Sprint 11
- ⏭️ Full accessibility audit — deferred to Sprint 8
- ⏭️ Performance audit — deferred to Sprint 8

---

## ✅ Sprint 7 — Maps + Media + Chat Polish (DONE)

**Goal:** Map tab shows real events/gromady. Users can post images. Chat is polished. Friends + favors complete.

### Map Tab
- ✅ `react-native-maps` integration — event pins on MapView with location priming
- ✅ Map/list toggle in `app/(app)/(map)/index.tsx` — map view with event markers + FAB
- ✅ Location permission priming before requesting (contextual, not upfront)
- ✅ `app/(app)/(map)/create-event.tsx` — event creation form with location picker
- ✅ `components/event/CreateEventForm.tsx` — full form with type picker, datetime, location

### Media
- ✅ `services/api/media.ts` — upload image to Supabase Storage bucket `post-media`
- ✅ Post composer: image attachment button → expo-image-picker → upload → preview
- ✅ `components/feed/PostCard.tsx` — renders single image or 2×2 grid inline
- ✅ `uploadAvatar` in media.ts for profile photo upload

### Chat Polish
- ✅ Chat bubble layout — sender right (accent), receiver left, timestamps grouped by day
- ✅ Day separators: "Dzisiaj" / "Wczoraj" / full date via `daySeparatorLabel()`
- ✅ 44pt send button, accessible placeholder

### Friends + Social
- ✅ `app/(app)/(messages)/friends.tsx` — friends list + pending requests with accept/decline
- ✅ `app/(app)/(messages)/friend/[id].tsx` — friend profile + DM + friend status
- ✅ Send friend request from public profile view
- ✅ `services/api/users.ts` — fetchFriends, fetchPendingRequests, acceptFriendRequest, declineFriendRequest

### Favors
- ✅ Favor list in Gromada info panel (open + helped)
- ✅ Create favor form (description, 7-day expiry auto-set)
- ✅ "Offer help" → opens direct message with requester
- ✅ `hooks/useFavors.ts` — favor CRUD

### Infrastructure
- ✅ `services/notifications.ts` + `supabase/migrations/004_push_tokens.sql`
- ✅ `types/react-native-maps.d.ts` + `types/sentry-react-native.d.ts` stubs (install via `npx expo install`)

### Code Review (end of sprint)
- ✅ TS clean. Fixed: nextEvent type, missing users.ts exports, native module stubs.

---

## ✅ Sprint 8 — Discovery + Social Graph + Deep Linking (DONE)

**Goal:** Users can discover Gromady beyond onboarding. Public profiles browsable. App is deep-linkable.

### Discovery
- ✅ `app/(app)/(gromady)/explore.tsx` — browse all Gromady: interest chip filter, paginated, join with undo toast
- ✅ `fetchAllGromady(cityId, page, interestId?)` added to gromady service
- ✅ `gromady/_layout.tsx` — explore route registered

### Public Profiles
- ✅ `app/(app)/(profile)/[id].tsx` — public profile: avatar, name, bio, friend request state machine, DM button
- ✅ `services/api/users.ts` — fetchPublicProfile, fetchFriendshipStatus, sendFriendRequest
- ✅ PostCard author tap → navigates to public profile (own profile → own tab)

### Deep Linking
- ✅ `app.json` — `scheme: "polana"`, intentFilters (Android), associatedDomains (iOS)
- ✅ `utils/routing.ts` — `buildDeepLink()` + `resolveDeepLink()` for gromada/event/profile/invite
- ✅ `app/_layout.tsx` — Linking.addEventListener wired for in-app deep link handling

### Performance
- ⏭️ Bundle size analysis — deferred (needs device)
- ⏭️ FlatList tuning — deferred
- ✅ `React.memo` on PostCard, EventCard, GromadaCard (named exports preserved)
- ✅ CI: orphaned-imports check step added

### Code Review (end of sprint)
- ✅ TS clean. Merge conflicts in EventCard/PostCard/GromadaCard resolved.

---

## ✅ Sprint 9 — Safety + Resilience (DONE)

**Goal:** Users can block/mute. Moderators have a queue. App survives crashes and offline gracefully.

### Block + Mute
- ✅ `supabase/migrations/006_blocks.sql` — `user_blocks` table + RLS policy hiding posts
- ✅ `services/api/safety.ts` — blockUser, unblockUser, muteChat, unmuteChat
- ✅ Block action in public profile 3-dot menu with 7s undo toast

### Moderation Queue
- ✅ `app/(app)/(profile)/moderation.tsx` — elder report queue: hide content / dismiss with undo
- ✅ `services/api/moderation.ts` — fetchPendingReports (filtered to elder's gromady), resolveReport, undoResolveReport
- ✅ `services/api/gromady.ts` — fetchGromadyForElder added

### Error Boundaries
- ✅ `components/ui/ErrorBoundary.tsx` — React class boundary, Sentry capture, retry button
- ✅ All 5 tab screens wrapped in ErrorBoundary
- ✅ `components/ui/NetworkError.tsx` — sticky offline banner with retry

### Offline Cache
- ✅ `stores/cacheStore.ts` — Zustand + AsyncStorage persist (50 feed posts, full gromady list)
- ✅ Feed screen falls back to cached posts on network error + shows NetworkError banner

### Code Review (end of sprint)
- ✅ TS clean throughout.

---

## ✅ Sprint 10 — Invites + Emails + Admin (DONE)

**Goal:** Gromady can invite people. Email flows are branded. Elders have admin tools.

### Invite System
- ✅ `supabase/migrations/007_invites.sql` — gromada_invites table with unique code + RLS
- ✅ `services/api/invites.ts` — createInvite, fetchInviteByCode, acceptInvite
- ✅ `app/(app)/(gromady)/[id]/invite.tsx` — elder generates 7-day link, share sheet
- ✅ `polana://invite/[code]` deep link handler in _layout.tsx

### Branded Emails (Supabase)
- ✅ `supabase/templates/welcome.html` — branded welcome email (Polish)
- ✅ `supabase/templates/invite.html` — gromada invite email with CTA
- ✅ `supabase/templates/reset.html` — password reset email

### Password Reset
- ✅ `app/(auth)/forgot-password.tsx` — email input → Supabase resetPasswordForEmail
- ✅ `app/(auth)/reset-password.tsx` — new password form from deep link
- ✅ "Nie pamiętam hasła" link added to login screen

### Elder Admin Panel
- ✅ `app/(app)/(gromady)/[id]/admin.tsx` — edit gromada, remove members, transfer elder, archive
- ✅ Remove member with 5s toast (no confirmation modal — undo toast instead)
- ✅ Transfer elder role to another member
- ✅ Archive gromada → status: archived → redirects to list

### Code Review (end of sprint)
- ✅ TS clean. updateGromada allows status field.

---

## ✅ Sprint 11 — Legal + GDPR + Launch (DONE)

**Goal:** App is legally compliant, GDPR-ready, and submitted to App Store + Google Play.

### Legal Screens
- ✅ `app/(auth)/privacy.tsx` — 8-section RODO-compliant Polish privacy policy
- ✅ `app/(auth)/terms.tsx` — existing terms screen linked
- ✅ Links in `app/(app)/(profile)/settings.tsx` to privacy + data screens

### GDPR Compliance
- ✅ `supabase/functions/export-data/index.ts` — exports profile, posts, comments, messages, RSVPs as JSON
- ✅ `supabase/functions/delete-account/index.ts` — hard delete via admin API (GDPR Art. 17)
- ✅ `app/(app)/(profile)/data.tsx` — export button + "type USUŃ to delete" confirmation
- ✅ `app.json` — version 1.0.0, buildNumber, runtimeVersion

### Launch Prep
- ✅ `LAUNCH_CHECKLIST.md` — 30-item checklist: Supabase, EAS, store listings, testing
- ⏳ App icon 1024×1024 — needs design asset
- ⏳ Splash screen — needs design asset
- ⏳ App Store screenshots — needs physical device
- ⏳ Play Store screenshots + feature graphic — needs physical device
- ⏳ Store listings text — ready to write

### Code Review (end of sprint)
- ✅ TS clean throughout.

---

## ✅ Sprint 12 — i18n: Polish → English code + 3 languages (DONE)

**Goal:** All hardcoded Polish UI strings replaced with `t()` calls. Ukrainian added. Code identifiers clean.

### Translation Infrastructure
- ✅ `i18n/locales/uk/` — full Ukrainian translations (all 8 namespaces, 150+ keys)
- ✅ `i18n/locales/pl/` + `en/` — 80+ new keys added (auth, profile, gromady, common, events, feed)
- ✅ `i18n/index.ts` — Ukrainian wired, `SUPPORTED_LANGUAGES` const exported
- ✅ `stores/preferencesStore.ts` — Language type: `'pl' | 'en' | 'uk'`
- ✅ Settings screen — 3-way language cycle 🇵🇱 PL → 🇬🇧 EN → 🇺🇦 UK

### Screen i18n (all screens from Sprint 7–11)
- ✅ auth: forgot-password, reset-password, privacy, login
- ✅ profile: public [id], moderation, data, settings, calendar
- ✅ gromady: admin, invite, info, panel index, members, explore, create, search
- ✅ map: index (map view), create-event
- ✅ messages: chat, friend, friends
- ✅ feed: index (filters), post/[id]
- ✅ components: PostCard (action sheet), ErrorBoundary (i18n.t), NetworkError (hook)

### Code Identifier Audit
- ✅ All variable/function/type names in English — no Polish identifiers found
- ✅ `'Ktoś'` fallbacks → `'?'` everywhere
- ✅ Internal service errors in English (media.ts, data.tsx, moderation.ts)
- ✅ `GromadaRow`, `gromadaId` etc. kept intentionally (brand vocabulary)
- ✅ `ROLE_LABELS` constant → `getRoleLabel(t)` function (i18n-correct)
- ✅ `SIZE_OPTIONS` moved inside component to access `t()`
- ✅ `daySeparatorLabel()` passes today/yesterday labels from t()

### Auto-sync
- ✅ `.github/workflows/update-sprints.yml` — auto-updates SPRINTS.md on push to main

### Result
- 0 hardcoded Polish strings in .tsx/.ts files (except intentional: privacy legal bodies, invite share message)
- 3 languages fully supported: Polski, English, Українська
- Any developer can read and modify the codebase without knowing Polish
