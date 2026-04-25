# Sprint Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `.claude/` into a lean Sprint Engine — slimmed CLAUDE.md, 4 custom skills, 4 rule files, a state machine, and a codebase index — without touching plugin-managed files.

**Architecture:** Custom skills live in `.claude/skills/` alongside plugin skills (safe — plugins install into named subdirectories, no collision). `state/sprint_progress.json` is committed to git and updated by the `mark-done` skill after every task. CLAUDE.md is slimmed from ~3,000 to ~800 tokens by extracting rules into on-demand `rules/` files.

**Tech Stack:** Markdown (SKILL.md), JSON (state), TypeScript (preflight via tsc), Bash (git commands in skill steps), Claude Code skill system.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Modify | `.claude/CLAUDE.md` | Add boot block, remove rules sections, add rule pointers |
| Create | `.claude/rules/typescript-strict.md` | On-demand: 13 coding rules |
| Create | `.claude/rules/rn-native-only.md` | On-demand: styling + component rules |
| Create | `.claude/rules/supabase-rls.md` | On-demand: security + token rules |
| Create | `.claude/rules/no-dark-patterns.md` | On-demand: UX prohibitions |
| Create | `.claude/state/sprint_progress.json` | Current sprint task state |
| Create | `.claude/skills/sprint-init/SKILL.md` | Session bootloader skill |
| Create | `.claude/skills/preflight/SKILL.md` | Pre-commit quality gate |
| Create | `.claude/skills/context-map/SKILL.md` | Codebase index generator |
| Create | `.claude/skills/mark-done/SKILL.md` | State machine updater |
| Create | `.claude/context_map.md` | Generated codebase index |

---

## Task 1: Create sprint-6 git branch

**Files:** none (git only)

- [ ] **Step 1: Create and push sprint-6 branch**

```bash
git checkout -b sprint-6
git push -u origin sprint-6
```

Expected: branch `sprint-6` now tracks `origin/sprint-6`.

- [ ] **Step 2: Commit**

All Sprint Engine work lands on `sprint-6`. No commits to `main` until the sprint is fully done and audited.

---

## Task 2: Create `rules/` directory and 4 rule files

**Files:**
- Create: `.claude/rules/typescript-strict.md`
- Create: `.claude/rules/rn-native-only.md`
- Create: `.claude/rules/supabase-rls.md`
- Create: `.claude/rules/no-dark-patterns.md`

- [ ] **Step 1: Create `.claude/rules/typescript-strict.md`**

```markdown
# TypeScript Strict Rules

These rules apply whenever writing or modifying any `.ts` or `.tsx` file.

1. TypeScript everywhere — no `.js` files in `app/`, `components/`, `services/`, `hooks/`, `stores/`, `utils/`
2. No `any` — use `unknown` and narrow, or define a proper type
3. Type assertions (`as X`) require an inline comment explaining why it is safe
4. No `// @ts-ignore` or `// @ts-nocheck` — fix the type error instead
5. Strict null checks are on — never assume a value is non-null without a guard
6. Async functions must have `try/catch` — surface errors, never swallow them
7. User-facing error messages in Polish — internal errors can be English
8. No barrel re-exports (`index.ts` that re-exports everything) — import directly
9. Enums use `const enum` for tree-shaking
10. API response shapes must have explicit types — no implicit `any` from `supabase.from()`
11. All Zustand store slices must be typed with explicit interfaces
12. Hook return types must be explicitly annotated
13. Edge Function handlers must type their `req` as `Request` and their response body
```

- [ ] **Step 2: Create `.claude/rules/rn-native-only.md`**

```markdown
# React Native — Native Components Only

These rules apply whenever writing or modifying any component file.

1. Use only native RN components: `View`, `Text`, `Pressable`, `FlatList`, `ScrollView`, `TextInput`, `Modal`, `ActivityIndicator`, `Image`, `KeyboardAvoidingView`, `SafeAreaView`
2. `StyleSheet.create()` for all styles — no inline style objects except for truly dynamic values (e.g., `{ width: dynamicWidth }`)
3. `constants/theme.ts` is the ONLY source for colors, spacing, font sizes, border radii — never hardcode `#hex` or `16` for spacing
4. Do NOT install UI component libraries (NativeBase, Tamagui, RN Paper, Gluestack, etc.) without explicit instruction
5. Tappable areas must be ≥ 44pt — use `hitSlop` if the visual size is smaller
6. Every interactive element needs `accessibilityLabel` and `accessibilityRole`
7. `Pressable` over `TouchableOpacity` — it supports `pressed` state styling natively
8. Lists must use `FlatList` or `FlashList` — never `ScrollView` + `map()` for variable-length lists
9. Images must have explicit `width` + `height` or `flex` — never rely on natural size
10. Animations via `Animated` API or `react-native-reanimated` only — no CSS transitions
```

- [ ] **Step 3: Create `.claude/rules/supabase-rls.md`**

```markdown
# Supabase + Security Rules

These rules apply whenever writing or modifying services, hooks, or migration files.

1. Import Supabase client ONLY from `services/supabase.ts` — never create a second client
2. Tokens stored in `expo-secure-store` ONLY — never `AsyncStorage`, never `localStorage`
3. Every new table in migrations MUST have a corresponding RLS policy in `002_rls_policies.sql` or a new migration file
4. Never disable RLS on a table (`ALTER TABLE x DISABLE ROW LEVEL SECURITY`)
5. Edge Functions must validate the `Authorization` header before any DB operation
6. Rate-limit sensitive Edge Functions (login, register, send-notification) — use a counter in the DB or an external service
7. User-generated content must be sanitised before saving — strip HTML tags, truncate to column length
8. Never log JWT tokens, passwords, or push tokens — log only user IDs
9. Supabase Storage bucket policies must be set to private — never public buckets for user content
10. Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is only used in Edge Functions — never in the app bundle
```

- [ ] **Step 4: Create `.claude/rules/no-dark-patterns.md`**

```markdown
# Anti-Dark-Pattern Rules

These rules are identity-level constraints. They apply everywhere, always.

1. No like buttons on posts — emoji reactions only (Slack-style add/remove)
2. No follower counts visible anywhere in the UI
3. No algorithmic feed reordering — all feeds ORDER BY created_at DESC, always
4. No autoplay video with sound — muted autoplay is allowed
5. No notification inflation — badge counts are actionable items only (unread DMs, mentions)
6. No streak guilt mechanics — no "you'll lose your streak" messaging
7. No FOMO copy — never "X people are waiting", "don't miss out", etc.
8. No confirmation modals for reversible actions — use undo toasts (5–7s) instead
9. No permission requests without contextual priming — always explain WHY before the OS prompt
10. No skeleton screens that animate indefinitely — show error + retry after 10s timeout
11. No empty states without a call to action — always 1 sentence + 1 primary action button
12. User data is never passed to external AI services — analytics events contain no PII
```

- [ ] **Step 5: Commit**

```bash
git add .claude/rules/
git commit -m "chore(engine): add rules/ — typescript-strict, rn-native-only, supabase-rls, no-dark-patterns"
```

---

## Task 3: Create `state/sprint_progress.json`

**Files:**
- Create: `.claude/state/sprint_progress.json`

- [ ] **Step 1: Create the state file**

```json
{
  "sprint": 6,
  "sprint_name": "Auto-generation + Polish",
  "started": "2026-04-25",
  "last_updated": "2026-04-25T00:00:00Z",
  "last_completed_task": null,
  "tasks": [
    {
      "id": "s6-edge-generate-events",
      "title": "supabase/functions/generate-events/index.ts",
      "status": "pending",
      "domain": "backend"
    },
    {
      "id": "s6-edge-expire-favors",
      "title": "supabase/functions/expire-favors/index.ts",
      "status": "pending",
      "domain": "backend"
    },
    {
      "id": "s6-edge-dormant-check",
      "title": "supabase/functions/dormant-check/index.ts",
      "status": "pending",
      "domain": "backend"
    },
    {
      "id": "s6-edge-cron",
      "title": "Schedule all 3 Edge Functions as cron jobs in Supabase",
      "status": "pending",
      "domain": "backend"
    },
    {
      "id": "s6-crossovers-api",
      "title": "services/api/crossovers.ts — CRUD",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-crossovers-form",
      "title": "Crossover proposal form + vote UI in Gromada info panel",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-crossovers-status",
      "title": "Crossover status flow: proposed → accepted → happening → completed",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-allies",
      "title": "gromada_allies display + elder CRUD in app/(app)/(gromady)/[id]/info.tsx",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-user-calendar",
      "title": "app/(app)/(profile)/calendar.tsx — upcoming + past RSVPd events",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-gromada-stats",
      "title": "Gromada stats + warmth score formula in app/(app)/(gromady)/[id]/info.tsx",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-warmth-indicator",
      "title": "components/gromada/WarmthIndicator.tsx — visual bar + campfire icon",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-mindful-texts",
      "title": "MindfulText in all empty states + loading skeletons across the app",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-sentry",
      "title": "services/sentry.ts — error monitoring integration",
      "status": "pending",
      "domain": "infra"
    },
    {
      "id": "s6-analytics",
      "title": "Plausible/PostHog event tracking — screen views + key actions, privacy-first",
      "status": "pending",
      "domain": "infra"
    },
    {
      "id": "s6-eas",
      "title": "eas.json — development, preview, production build profiles",
      "status": "pending",
      "domain": "infra"
    },
    {
      "id": "s6-a11y-audit",
      "title": "Full accessibility audit — VoiceOver + TalkBack manual test",
      "status": "pending",
      "domain": "qa"
    },
    {
      "id": "s6-perf-audit",
      "title": "Performance audit — FPS profiling, bundle size, cold start time",
      "status": "pending",
      "domain": "qa"
    },
    {
      "id": "s6-code-review",
      "title": "Run code-reviewer agent on all Sprint 6 files",
      "status": "pending",
      "domain": "qa"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/state/sprint_progress.json
git commit -m "chore(engine): add state/sprint_progress.json — Sprint 6 task list"
```

---

## Task 4: Create 4 custom skills

**Files:**
- Create: `.claude/skills/sprint-init/SKILL.md`
- Create: `.claude/skills/preflight/SKILL.md`
- Create: `.claude/skills/context-map/SKILL.md`
- Create: `.claude/skills/mark-done/SKILL.md`

- [ ] **Step 1: Create `.claude/skills/sprint-init/SKILL.md`**

```markdown
# Sprint Init

Run at the start of every session to check sprint status and session health. Also run manually with `/sprint-init` after a session reset.

## Steps

1. Read `.claude/state/sprint_progress.json`

2. Output a status block:
   ```
   Sprint N — <sprint_name>
   Started: <started>
   Last updated: <last_updated>
   Last completed: <last_completed_task or "none yet">

   Next 3 pending tasks:
   1. [<id>] <title> (<domain>)
   2. [<id>] <title> (<domain>)
   3. [<id>] <title> (<domain>)
   ```

3. Run: `git branch --show-current`
   - If output is `main` → warn: "You are on main. Create a sprint branch: git checkout -b sprint-N"
   - If output starts with `sprint-` → confirm: "On sprint branch ✓"
   - Any other branch → note it

4. Count tasks by status and report:
   ```
   Total: X tasks | Done: X | In progress: X | Pending: X
   ```

5. If any task has status `in_progress` → ask: "Task <id> is marked in_progress. Resume it, or mark it done first?"

6. If no tasks are `in_progress` and there are pending tasks → ask: "Which task do you want to work on? (List the next 3 pending tasks by id)"
```

- [ ] **Step 2: Create `.claude/skills/preflight/SKILL.md`**

```markdown
# Preflight

Run before any git commit to verify type safety. Use `/preflight` before committing.

## Steps

1. Run TypeScript check from the project root:
   ```bash
   npx tsc --noEmit
   ```

2. If exit code is 0:
   - Output: "✓ TypeScript — no errors"
   - Proceed: "Preflight passed. Safe to commit."

3. If exit code is non-zero:
   - Output the full error list grouped by file
   - Output: "✗ Preflight FAILED — fix TypeScript errors before committing"
   - Do NOT commit
   - Fix errors one file at a time, re-run preflight after each fix

4. After preflight passes, remind to update sprint state:
   - "Run /mark-done <task-id> if this commit completes a sprint task"
```

- [ ] **Step 3: Create `.claude/skills/context-map/SKILL.md`**

```markdown
# Context Map

Generate or update `.claude/context_map.md` — a one-liner index of every key file in the codebase. Run with `/context-map` at the end of a sprint or after adding significant new files.

## Steps

1. Walk these directories and collect all `.tsx`, `.ts` files (exclude `node_modules`, `.expo`, `dist`):
   - `app/` — screens and layouts
   - `components/` — UI components
   - `services/` — API and auth services
   - `hooks/` — custom hooks
   - `stores/` — Zustand stores
   - `utils/` — utility functions
   - `constants/` — theme, config, mindfulTexts
   - `supabase/functions/` — Edge Functions

2. For each file, write one line:
   ```
   <relative-path>  —  <one-sentence description of what the file does>
   ```

3. Group by directory. Write the output to `.claude/context_map.md`:
   ```markdown
   # Context Map
   _Generated <date>. Run `/context-map` to regenerate._

   ## App Screens
   app/_layout.tsx  —  Root layout: session hydration, auth state listener
   ...

   ## Components
   components/ui/Button.tsx  —  4 variants (primary/secondary/ghost/destructive), loading state
   ...

   ## Services
   services/supabase.ts  —  Singleton Supabase client with SecureStore adapter
   ...
   ```

4. Commit the updated context map:
   ```bash
   git add .claude/context_map.md
   git commit -m "chore(engine): regenerate context_map.md"
   ```
```

- [ ] **Step 4: Create `.claude/skills/mark-done/SKILL.md`**

```markdown
# Mark Done

Update `sprint_progress.json` after completing a sprint task. Use `/mark-done <task-id>`.

## Steps

1. Read `.claude/state/sprint_progress.json`

2. Find the task with `id` matching the argument (e.g., `s6-edge-generate-events`)
   - If not found → output: "Task <id> not found. Valid IDs: <list all ids>"
   - If already `done` → output: "Task <id> is already marked done"

3. Update the task:
   - Set `status` → `"done"`
   - Set top-level `last_completed_task` → `"<task-id>"`
   - Set top-level `last_updated` → current ISO timestamp

4. Write the updated JSON back to `.claude/state/sprint_progress.json`

5. Also update `.claude/SPRINTS.md`: find the matching task line and change `[ ]` → `[x]`

6. Commit both files:
   ```bash
   git add .claude/state/sprint_progress.json .claude/SPRINTS.md
   git commit -m "chore(engine): mark <task-id> done"
   ```

7. Output remaining pending task count:
   "Task done ✓ — X tasks remaining in Sprint N"

8. Suggest next task: "Next up: [<next-pending-id>] <title>"
```

- [ ] **Step 5: Commit all skills**

```bash
git add .claude/skills/sprint-init/ .claude/skills/preflight/ .claude/skills/context-map/ .claude/skills/mark-done/
git commit -m "chore(engine): add 4 custom skills — sprint-init, preflight, context-map, mark-done"
```

---

## Task 5: Refactor CLAUDE.md

**Files:**
- Modify: `.claude/CLAUDE.md`

The goal is to slim CLAUDE.md from ~3,000 tokens to ~800 tokens. The rules content is now in `rules/` — CLAUDE.md just references them.

- [ ] **Step 1: Replace CLAUDE.md with the slimmed version**

Replace the entire file content with the following. This preserves all identity-level content and adds the boot block at the top:

```markdown
# CLAUDE.md — Polana Sprint Engine

> Read this file completely before any action.

---

## SESSION START — RUN BEFORE ANYTHING ELSE

1. Read `.claude/state/sprint_progress.json`
2. Output: sprint number, last completed task, next 3 pending tasks
3. Run `git branch --show-current` — warn if on `main`
4. If no task is `in_progress`, ask which task to start
5. Before writing any code, read the relevant rules file from `.claude/rules/`

---

## What Polana IS

**Polana** is an anti-addictive mobile social platform (iOS + Android) for building local micro-communities based on shared interests.

- Users join small groups called **Gromady** (15–50 people)
- Gromady meet in real life, help each other, and create crossovers between groups
- Success = real-world meetups, NOT screen time
- Model: Nonprofit / B-corp
- Launch market: Poland — 5 cities (Warszawa, Kraków, Wrocław, Łódź, Gdańsk)

---

## What Polana IS NOT — HARDCODED PROHIBITIONS

- No like buttons — emoji reactions only (Slack-style)
- No follower counts visible anywhere
- No algorithmic feed — always `ORDER BY created_at DESC`
- No autoplay video with sound
- No notification inflation — badge = actionable only
- No confirmation modals for reversible actions — undo toasts instead
- No permission requests without contextual priming
- No dark patterns, streak guilt, or FOMO copy
- No user data sold or sent to external AI

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| Expo | ~55 | Build toolchain |
| React Native | ^0.85 | UI framework |
| React | ^19 | UI library |
| Expo Router | ~55 | File-based routing |
| TypeScript | strict | Required everywhere |
| Zustand | ^5 | Global state |
| expo-secure-store | ~14 | Encrypted token storage |
| expo-notifications | ~0.29 | Push notifications |
| i18next + react-i18next | ^23/^15 | i18n (PL primary, EN fallback) |
| date-fns | ^4 | Date formatting |

### Backend
| Feature | Usage |
|---|---|
| Supabase Auth | email/password + Google OAuth + Apple Sign-In |
| PostgreSQL + PostGIS | DB with geolocation |
| Supabase Realtime | Chat subscriptions |
| Supabase Storage | Avatars, post images |
| Supabase Edge Functions | Cron jobs, event gen, push notifications |
| Row Level Security | DB-level security on every table |

---

## Database — Core Tables

`cities`, `interests`, `profiles`, `user_interests`, `gromady`, `gromada_interests`, `gromada_members`, `events`, `event_rsvps`, `posts`, `comments`, `reactions`, `reports`, `favor_requests`, `favor_offers`, `crossover_proposals`, `chat_rooms`, `messages`, `chat_mutes`, `friendships`, `gromada_allies`

Full schema in `supabase/migrations/`. Never re-define schema in code.

---

## Folder Structure

```
app/(auth)/          — login, register, welcome, terms
app/(onboarding)/    — 7-step wizard (profile, interests, city, gromady, notifications, rules, ready)
app/(app)/           — 5 tabs: feed, gromady, map, messages, profile
components/          — ui/, feed/, gromada/, event/, map/, chat/, avatar/, mindful/
constants/           — theme.ts (ONLY token source), mindfulTexts.ts, config.ts
services/            — supabase.ts (singleton), auth.ts, api/*.ts, notifications.ts
hooks/               — useAuth, useGromady, useEvents, usePosts, useFavors, useMessages, useNotifications
stores/              — authStore, onboardingStore, preferencesStore
utils/               — dates.ts, geo.ts, validation.ts, nameGenerator.ts
supabase/migrations/ — 001_initial_schema, 002_rls_policies, 003_seed_data, 004_push_tokens
supabase/functions/  — generate-events/, expire-favors/, dormant-check/, send-notification/
```

---

## Rules (load before writing code)

| When | Read |
|---|---|
| Writing any TypeScript | `.claude/rules/typescript-strict.md` |
| Writing any component | `.claude/rules/rn-native-only.md` |
| Writing any service/hook/migration | `.claude/rules/supabase-rls.md` |
| Writing any UI copy or interaction | `.claude/rules/no-dark-patterns.md` |

---

## Sprint State

Current sprint and task list: `.claude/state/sprint_progress.json`
Full sprint history with checkboxes: `.claude/SPRINTS.md`
Codebase file index: `.claude/context_map.md`

---

## Git Workflow

```
main                     ← protected, always deployable
  └── sprint-N/          ← sprint integration branch
        └── sN/<task-id> ← one branch per task
```

Commit format: `<type>(<domain>): <description>`
Types: `feat` | `fix` | `refactor` | `chore` | `docs`
Domains: `frontend` | `backend` | `infra` | `qa` | `engine`

Before any commit: `/preflight`
After completing a task: `/mark-done <task-id>`
```

- [ ] **Step 2: Commit**

```bash
git add .claude/CLAUDE.md
git commit -m "chore(engine): slim CLAUDE.md to ~800 tokens, add boot block + rule pointers"
```

---

## Task 6: Generate initial `context_map.md`

**Files:**
- Create: `.claude/context_map.md`

- [ ] **Step 1: Run the context-map skill**

```
/context-map
```

This walks the codebase and writes `.claude/context_map.md`. The skill commits the file automatically.

If running manually (no skill yet), create `.claude/context_map.md` with this initial content based on the known file structure:

```markdown
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
supabase/functions/generate-events/  —  PENDING Sprint 6: daily event proposals
supabase/functions/expire-favors/  —  PENDING Sprint 6: mark favors expired after 7 days
supabase/functions/dormant-check/  —  PENDING Sprint 6: flag inactive Gromady as dormant
supabase/functions/send-notification/  —  PENDING Sprint 6: push notification sender
```

- [ ] **Step 2: Commit**

```bash
git add .claude/context_map.md
git commit -m "chore(engine): add initial context_map.md"
```

---

## Task 7: Verify Sprint Engine works

- [ ] **Step 1: Test sprint-init**

Run: `/sprint-init`

Expected output (exact shape):
```
Sprint 6 — Auto-generation + Polish
Started: 2026-04-25
Last updated: 2026-04-25T00:00:00Z
Last completed: none yet

Next 3 pending tasks:
1. [s6-edge-generate-events] supabase/functions/generate-events/index.ts (backend)
2. [s6-edge-expire-favors] supabase/functions/expire-favors/index.ts (backend)
3. [s6-edge-dormant-check] supabase/functions/dormant-check/index.ts (backend)

Total: 18 tasks | Done: 0 | In progress: 0 | Pending: 18
On sprint branch ✓

Which task do you want to work on?
```

- [ ] **Step 2: Test preflight**

Run: `/preflight`

Expected: `npx tsc --noEmit` runs and either passes (exit 0) or lists existing type errors cleanly.

- [ ] **Step 3: Final Sprint Engine commit**

```bash
git add -A
git commit -m "chore(engine): Sprint Engine complete — rules, state, skills, CLAUDE.md, context_map"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| CLAUDE.md boot sequence | Task 5 |
| sprint-init skill | Task 4 step 1 |
| rules/ files (4) | Task 2 |
| state/sprint_progress.json | Task 3 |
| preflight skill | Task 4 step 2 |
| context-map skill | Task 4 step 3 |
| mark-done skill | Task 4 step 4 |
| context_map.md generated | Task 6 |
| sprint-6 git branch | Task 1 |
| CLAUDE.md slimmed | Task 5 |
| skills-custom/ separate from plugins | All Task 4 (`.claude/skills/<name>/`) |
