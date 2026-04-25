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
