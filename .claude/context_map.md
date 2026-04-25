# Context Map
_Generated 2026-04-25. Run `/context-map` to regenerate._

## App Screens
app/_layout.tsx  —  Root layout: session hydration, onAuthStateChange listener
app/index.tsx  —  Redirect guard: → welcome / onboarding / feed
app/(auth)/_layout.tsx  —  Redirects logged-in users away from auth screens
app/(auth)/welcome.tsx  —  Hero screen with sign in / sign up buttons
app/(auth)/login.tsx  —  Email+password login with inline validation
app/(auth)/register.tsx  —  Registration with email verification
app/(auth)/terms.tsx  —  Terms of service
app/(onboarding)/_layout.tsx  —  Blocks unauthenticated and already-onboarded users
app/(onboarding)/profile-setup.tsx  —  Step 1/7: name + nickname
app/(onboarding)/interests.tsx  —  Step 2/7: interest grid, min 3 required
app/(onboarding)/city.tsx  —  Step 3/7: city picker (5 Polish cities)
app/(onboarding)/gromada-pick.tsx  —  Step 4/7: 3 suggested Gromady by interest overlap
app/(onboarding)/notifications.tsx  —  Step 5/7: push permission prime
app/(onboarding)/community-rules.tsx  —  Step 6/7: 3 rules + checkbox
app/(onboarding)/ready.tsx  —  Step 7/7: writes profile to Supabase, redirects
app/(app)/_layout.tsx  —  5-tab navigator: feed, gromady, map, messages, profile
app/(app)/(feed)/index.tsx  —  Chronological feed from all user's Gromady, pagination 25
app/(app)/(feed)/post/[id].tsx  —  Full post with threaded comments
app/(app)/(gromady)/index.tsx  —  Grid of user's Gromady + "Find more" CTA
app/(app)/(gromady)/search.tsx  —  Search + filter by city/interest
app/(app)/(gromady)/create.tsx  —  Create Gromada: name, size, interests, description
app/(app)/(gromady)/[id]/index.tsx  —  Gromada panel: posts feed + pinned event
app/(app)/(gromady)/[id]/members.tsx  —  Member list with roles
app/(app)/(gromady)/[id]/calendar.tsx  —  Upcoming + past events for this Gromada
app/(app)/(gromady)/[id]/info.tsx  —  Stats: meetings, favors, warmth, allies
app/(app)/(gromady)/[id]/settings.tsx  —  Elder-only: edit name, description
app/(app)/(map)/index.tsx  —  Event list view + map placeholder toggle, FAB to create
app/(app)/(map)/create-event.tsx  —  Create event screen (accepts optional gromadaId)
app/(app)/(messages)/index.tsx  —  Chat list with Friends button
app/(app)/(messages)/chat/[id].tsx  —  Full chat UI with realtime + composer
app/(app)/(messages)/friends.tsx  —  Friends list + accept/decline pending requests
app/(app)/(messages)/friend/[id].tsx  —  Friend profile: add friend, send DM
app/(app)/(profile)/index.tsx  —  Profile: avatar, name, bio, interests, settings link
app/(app)/(profile)/edit.tsx  —  Edit name, nickname, bio with live char counter
app/(app)/(profile)/avatar.tsx  —  Avatar editor screen: part pickers + color swatches
app/(app)/(profile)/settings.tsx  —  Language toggle, theme cycle, sign out
app/event/[id].tsx  —  Event detail: full info, optimistic RSVP, cancel for creator

## Components
components/ui/Button.tsx  —  4 variants (primary/secondary/ghost/destructive), loading state, disabled reason
components/ui/Input.tsx  —  Floating label, error, hint, password toggle, forwardRef
components/ui/Card.tsx  —  Base card container with theme styling
components/ui/Badge.tsx  —  Badge with emoji support and selected state
components/ui/ProgressBar.tsx  —  Linear progress bar for onboarding steps
components/ui/EmojiPicker.tsx  —  Emoji grid bottom sheet (Modal)
components/feed/PostCard.tsx  —  Post: author avatar, content, reactions, comment count
components/feed/CommentThread.tsx  —  Reddit-style nested comments, 5 levels, collapsible
components/feed/ReactionBar.tsx  —  Slack-style emoji reactions, optimistic add/remove
components/gromada/GromadaCard.tsx  —  Square card: avatar, name, member count, warmth
components/gromada/EventPinned.tsx  —  Pinned next event card in Gromada panel
components/gromada/WarmthIndicator.tsx  —  Visual warmth meter for a Gromada
components/event/EventCard.tsx  —  Event: type icon, title, location, date, RSVP buttons
components/event/CreateEventForm.tsx  —  Event creation: title, type, location, date, max attendees
components/avatar/avatarParts.ts  —  AVATAR_PARTS + AVATAR_COLORS constants + generateRandomAvatarConfig
components/avatar/ProceduralAvatar.tsx  —  Emoji-based animal renderer with hat + accessory
components/avatar/AvatarEditor.tsx  —  Horizontal scroll pickers per avatar part
components/mindful/MindfulText.tsx  —  Renders random calming text from mindfulTexts.ts

## Services
services/supabase.ts  —  Singleton Supabase client with SecureStore adapter (ONLY import for DB access)
services/auth.ts  —  signIn, signUp, signOut, getProfile, updateProfile
services/oAuth.ts  —  Google OAuth + Apple Sign-In (expo-web-browser + PKCE)
services/notifications.ts  —  Expo push token registration, Android channel setup
services/api/posts.ts  —  Post CRUD + paginated feed fetch with gromada_members join
services/api/events.ts  —  Event CRUD + fetch by city/gromada + auto-creates chat room
services/api/messages.ts  —  Message send, paginated history, DM creation
services/api/users.ts  —  Friend requests, friendship status, public profile fetch
services/api/favors.ts  —  Favor CRUD + offerHelp + markHelped

## Hooks
hooks/useAuth.ts  —  Session state, profile, isOnboardingComplete from authStore
hooks/useEvents.ts  —  Event fetch + RSVP with optimistic updates
hooks/usePosts.ts  —  Post feed with optimistic create/delete
hooks/useMessages.ts  —  Realtime subscription + optimistic send + load-older pagination
hooks/useFavors.ts  —  Favor list + create + offerHelp + markHelped
hooks/useNotifications.ts  —  Foreground handler + tap-to-navigate by data payload

## Stores
stores/authStore.ts  —  session, user, profile, isOnboardingComplete
stores/onboardingStore.ts  —  Wizard step state
stores/preferencesStore.ts  —  colorScheme, language, reduceMotion

## Constants & Utils
constants/theme.ts  —  THE ONLY token source: colors, spacing, fontSize, borderRadius
constants/mindfulTexts.ts  —  Calming text bank for empty states and loading
constants/config.ts  —  Supabase URL, limits, city IDs
utils/dates.ts  —  Date formatting with date-fns + Polish locale
utils/geo.ts  —  Geolocation helpers
utils/validation.ts  —  Input validation (email, password, name)
utils/nameGenerator.ts  —  Client-side mirror of DB generate_gromada_name() function

## Supabase
supabase/migrations/001_initial_schema.sql  —  Full schema: all tables, triggers, indexes
supabase/migrations/002_rls_policies.sql  —  RLS policies for every table
supabase/migrations/003_seed_data.sql  —  Dev seed: cities, interests, test users
supabase/migrations/004_push_tokens.sql  —  Adds push_token to profiles table
supabase/functions/generate-events/  —  PENDING Sprint 6: daily event proposals for idle Gromady
supabase/functions/expire-favors/  —  PENDING Sprint 6: mark favors expired after 7 days
supabase/functions/dormant-check/  —  PENDING Sprint 6: flag Gromady with no activity as dormant
supabase/functions/send-notification/  —  PENDING Sprint 6: push notification sender via Expo API

## Sprint Engine
.claude/CLAUDE.md  —  System bootloader: boot sequence, prohibitions, tech stack, rules table
.claude/SPRINTS.md  —  Full sprint history with per-task checkboxes
.claude/state/sprint_progress.json  —  Live state machine: current sprint task status
.claude/context_map.md  —  This file: one-liner index of every key file
.claude/rules/typescript-strict.md  —  13 TypeScript rules (load before writing .ts/.tsx)
.claude/rules/rn-native-only.md  —  10 React Native component rules (load before writing components)
.claude/rules/supabase-rls.md  —  10 Supabase security rules (load before writing services/migrations)
.claude/rules/no-dark-patterns.md  —  12 anti-dark-pattern rules (load before writing UI/copy)
.claude/skills/sprint-init/SKILL.md  —  Session bootloader skill: reads state, reports sprint health
.claude/skills/preflight/SKILL.md  —  Pre-commit quality gate: runs tsc --noEmit
.claude/skills/context-map/SKILL.md  —  Regenerates this context map from current codebase
.claude/skills/mark-done/SKILL.md  —  Updates sprint_progress.json + SPRINTS.md + commits
