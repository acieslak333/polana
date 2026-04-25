# Sprint Engine Design — Polana

**Date:** 2026-04-25
**Scope:** Sprint Engine (Claude automation layer) + Sprint 6 continuation + Sprint 7 (monorepo) + Sprint 8 (local/remote servers)

---

## 1. Sprint Engine — Option A (Lightweight)

### Philosophy

Skills cost zero tokens to "load" — they inject only when invoked. Agents spin up cold and re-derive all context. For a project with 5 sprints of history, the difference is ~4,000 tokens per agent cold-start vs. ~0 for a skill. We use skills for everything except truly parallel, multi-file tasks — where we delegate to the existing `cs-senior-engineer` plugin agent.

---

### 1.1 CLAUDE.md Restructure

**Current problem:** ~3,000 tokens loaded every session. Rules and UX guidelines are 300+ lines that Claude only needs when writing code.

**Solution:** Split into always-loaded vs. on-demand content.

**CLAUDE.md after restructure (~800 tokens):**
- Session Boot block (top, mandatory)
- What Polana IS / IS NOT + concrete prohibitions (always needed — identity-level)
- Tech stack table (always needed — informs every decision)
- Database schema overview (always needed — informs queries)
- Folder structure (always needed — informs file placement)
- Sprint status pointer → `state/sprint_progress.json`
- Links to rules/ files (loaded on demand)

**Moved to `rules/` (on-demand only):**
- `typescript-strict.md` — 13 coding rules
- `rn-native-only.md` — styling rules, component constraints
- `supabase-rls.md` — security rules, token storage
- `no-dark-patterns.md` — UX rules (the long section)

**Session Boot block (added to top of CLAUDE.md):**
```
## SESSION START — RUN BEFORE ANYTHING ELSE
1. Read .claude/state/sprint_progress.json
2. Output: current sprint, last completed task, next pending task
3. Check git branch: warn if not on main or a named feature branch
4. If no tasks are in_progress: ask user what to work on next
```

This block is plain text — Claude reads and executes it on every session because CLAUDE.md loads first, always.

---

### 1.2 Directory Structure

```
.claude/
  CLAUDE.md                        ← slimmed to ~800 tokens, boot block at top
  SPRINTS.md                       ← unchanged, human-readable source of truth
  settings.json                    ← unchanged
  agents/                          ← plugin agents, untouched
  skills/                          ← plugin skills, untouched
  skills-custom/                   ← NEW: Polana-specific skills
    sprint-init/
      SKILL.md
    preflight/
      SKILL.md
    context-map/
      SKILL.md
    mark-done/
      SKILL.md
  rules/                           ← NEW: on-demand rule files
    typescript-strict.md
    rn-native-only.md
    supabase-rls.md
    no-dark-patterns.md
  state/                           ← NEW: session persistence
    sprint_progress.json
  context_map.md                   ← NEW: generated codebase index
```

`skills-custom/` is separate from `skills/` to survive plugin updates without collision.

---

### 1.3 `state/sprint_progress.json` Schema

Structured mirror of the current sprint's tasks. Resets each sprint. Claude updates it via the `mark-done` skill after every completed task.

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
      "title": "Schedule all 3 functions as cron jobs in Supabase",
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
      "title": "Crossover proposal form + vote UI",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-crossovers-status",
      "title": "Crossover status flow (proposed → completed)",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-allies",
      "title": "gromada_allies display + elder CRUD in info panel",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-user-calendar",
      "title": "app/(app)/(profile)/calendar.tsx",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-gromada-stats",
      "title": "Gromada stats + warmth score formula in info.tsx",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-mindful-texts",
      "title": "MindfulText in empty states + loading skeletons",
      "status": "pending",
      "domain": "frontend"
    },
    {
      "id": "s6-sentry",
      "title": "services/sentry.ts integration",
      "status": "pending",
      "domain": "infra"
    },
    {
      "id": "s6-analytics",
      "title": "Plausible/PostHog event tracking (privacy-first)",
      "status": "pending",
      "domain": "infra"
    },
    {
      "id": "s6-eas",
      "title": "EAS build config (dev, preview, production)",
      "status": "pending",
      "domain": "infra"
    },
    {
      "id": "s6-a11y-audit",
      "title": "Full accessibility audit (VoiceOver + TalkBack)",
      "status": "pending",
      "domain": "qa"
    },
    {
      "id": "s6-perf-audit",
      "title": "Performance audit (FPS, bundle size, cold start)",
      "status": "pending",
      "domain": "qa"
    },
    {
      "id": "s6-code-review",
      "title": "Run code-reviewer on all Sprint 6 files",
      "status": "pending",
      "domain": "qa"
    }
  ]
}
```

**Status values:** `pending` | `in_progress` | `done` | `skipped`

---

### 1.4 Custom Skills

#### `sprint-init`
Triggered at session start (or manually via `/sprint-init`). Reads `sprint_progress.json`, reports current sprint health, checks git branch, lists next 3 pending tasks. Does not modify any files — read-only diagnostic.

#### `preflight`
Triggered before any git commit. Runs in sequence:
1. `npx tsc --noEmit` — type safety
2. TypeScript errors reported inline, commit blocked if any exist
3. Summary: pass/fail with file-level error list

No linting config exists yet in the project — preflight will only enforce TypeScript for now. ESLint gate added in Sprint 7 when monorepo tooling is set up.

#### `context-map`
Generates/updates `.claude/context_map.md`. Walks the codebase and produces a one-liner per key file. Claude reads this instead of grepping the whole repo. Triggered manually via `/context-map` — run it at the end of each sprint or after adding a significant new file.

Format:
```
app/(app)/(gromady)/[id]/index.tsx  — Gromada panel: posts feed + pinned event
services/api/events.ts              — Event CRUD + fetch by city/gromada
hooks/useMessages.ts                — Realtime subscription + optimistic send
```

#### `mark-done`
Called after a task completes. Updates `sprint_progress.json`: sets task status to `done`, sets `last_completed_task`, sets `last_updated` timestamp. One task at a time — no batch updates.

---

### 1.5 Rules Files

Short, non-negotiable. 5–15 lines each. Loaded only when Claude is about to write code.

- `typescript-strict.md` — no `any`, no plain JS, type assertions require a comment
- `rn-native-only.md` — `StyleSheet.create()` only, no UI libraries, `constants/theme.ts` only for tokens
- `supabase-rls.md` — tokens in SecureStore only, RLS on every table, singleton client from `services/supabase.ts`
- `no-dark-patterns.md` — no like counts, no follower counts, chronological only, undo over confirm

---

### 1.6 `context_map.md`

Auto-generated by the `context-map` skill. Contains one line per file with a brief description. Grouped by domain: app screens, components, services, hooks, stores, utils, supabase. Updated at the end of each sprint.

---

## 2. Sprint 6 — Auto-generation + Polish (continuation)

No structural changes — Sprint 6 tasks are already defined in `SPRINTS.md`. With the Sprint Engine in place, the boot sequence will surface the next pending task automatically each session.

Execution order (optimized for dependencies):
1. Edge Functions (generate-events, expire-favors, dormant-check) — backend first, independent
2. Gromada stats + warmth score — depends on nothing
3. Crossovers API + UI — depends on nothing
4. Allies — depends on nothing
5. User calendar — depends on events RSVP (done in Sprint 4)
6. MindfulText integration — depends on component existing (done Sprint 2)
7. Sentry + analytics — infra, can be done anytime
8. EAS build config — infra, do last
9. Code review + accessibility/perf audits — always last in sprint

---

## 3. Sprint 7 — Monorepo Refactoring

**Goal:** Clean package boundaries between app, backend, and shared code. Enables future web dashboard, API layer, or admin panel without copy-pasting types.

### Package Structure

```
polana/                          ← repo root
  package.json                   ← pnpm workspace root
  pnpm-workspace.yaml
  turbo.json                     ← Turborepo for parallel builds + caching
  packages/
    app/                         ← current Expo/RN codebase (moved here)
      app/                       ← Expo Router screens (unchanged structure)
      components/
      constants/
      hooks/
      services/
      stores/
      utils/
      i18n/
      package.json               ← name: "@polana/app"
      tsconfig.json              ← extends ../../tsconfig.base.json
    supabase/                    ← current supabase/ folder (moved here)
      migrations/
      functions/
      package.json               ← name: "@polana/supabase"
    shared/                      ← NEW: cross-package code
      types/                     ← TypeScript interfaces (Database, Profile, etc.)
      utils/                     ← validation.ts, dates.ts, geo.ts (shared logic)
      package.json               ← name: "@polana/shared"
      tsconfig.json
  tsconfig.base.json             ← strict TS config inherited by all packages
  .claude/                       ← Sprint Engine (unchanged, repo-level)
```

### What moves to `shared/`

- `utils/validation.ts` — used by both app and Edge Functions
- `utils/dates.ts` — shared date logic
- `utils/geo.ts` — shared geo utils
- Database types (generated from Supabase schema via `supabase gen types typescript`)

### Migration steps

1. Install pnpm (if not present), init workspace
2. Create `packages/app/`, move current app source in
3. Create `packages/supabase/`, move `supabase/` in
4. Create `packages/shared/`, extract shared utils + types
5. Update all import paths in `packages/app/` to use `@polana/shared`
6. Update Edge Functions to import from `@polana/shared`
7. Update `app.json`, `eas.json` paths for new structure
8. Verify `npx expo start` works from `packages/app/`
9. Verify `supabase functions serve` works from `packages/supabase/`
10. Update `.claude/context_map.md` and `sprint_progress.json`

### Tooling added in Sprint 7

- `pnpm` — workspace-aware package manager
- `turbo` (optional) — parallel builds, caching across packages
- `eslint` — project-wide linting config (TypeScript + React Native rules)
- `prettier` — consistent formatting (the preflight skill adds ESLint gate here)
- `supabase gen types typescript` — auto-generated DB types into `shared/types/database.ts`

---

## 4. Sprint 8 — Local + Remote Server Setup

**Goal:** Full local development stack with one command. Remote environments for staging and production.

### Local Stack

```
supabase start        ← Postgres + Auth + Storage + Realtime (Docker)
expo start            ← Metro bundler
```

Requires Docker Desktop. Supabase CLI manages the local Postgres instance, runs migrations automatically, and provides a local Studio UI at `http://localhost:54323`.

**Environment files:**
```
packages/app/
  .env.local          ← SUPABASE_URL=http://127.0.0.1:54321, local anon key
  .env.staging        ← hosted Supabase staging project
  .env.production     ← hosted Supabase production project (never committed)
```

`constants/config.ts` reads from `process.env` — no hardcoded URLs.

**Local seed data:** `packages/supabase/seed.sql` — runs automatically on `supabase start`. Contains: 5 cities, 20 interests, 3 test users, 2 Gromady, sample posts and events.

### Remote Environments

| Environment | Supabase | Expo |
|---|---|---|
| Local dev | `supabase start` (Docker) | `expo start` |
| Staging | Supabase cloud project (free tier) | EAS Build — preview profile |
| Production | Supabase cloud project (pro) | EAS Build — production profile |

### EAS Build Configuration

```json
// eas.json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "local" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_ENV": "staging" }
    },
    "production": {
      "env": { "APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Local Run Procedure (one-time setup)

1. Install Docker Desktop
2. Install Supabase CLI: `npm install -g supabase`
3. Install pnpm: `npm install -g pnpm`
4. `pnpm install` (from repo root)
5. `supabase start` (from `packages/supabase/`)
6. Copy `.env.local.example` → `.env.local`, fill local keys from `supabase status`
7. `pnpm --filter @polana/app start`
8. Scan QR code with Expo Go or dev client

### Migration script

A `scripts/setup-local.sh` (bash, works via Git Bash on Windows) that automates steps 5–7 for any new contributor.

---

## 5. Git Workflow

### Branch Strategy

```
main                    ← always deployable, protected
  └── sprint-6/         ← one branch per sprint
        ├── s6/edge-functions
        ├── s6/crossovers
        ├── s6/allies
        └── s6/beta-prep
```

- `main` — production-ready at all times. Never commit directly.
- `sprint-N/` — integration branch for the sprint. Merges into `main` when sprint is done and audited.
- `s6/<task-slug>` — one branch per task (matches `id` in `sprint_progress.json`). Merged into `sprint-6/` when task is complete and preflight passes.

### Commit Convention

Every commit follows this format:
```
<type>(<scope>): <description>

Types: feat | fix | refactor | chore | docs | test
Scope: matches task domain — backend | frontend | infra | qa | engine

Examples:
feat(backend): add generate-events Edge Function
fix(frontend): crossover status flow not updating on RSVP
chore(engine): update sprint_progress.json — s6-edge-generate-events done
```

### Task → Git Flow (per task)

```
1. Pull latest sprint branch
   git checkout sprint-6 && git pull

2. Create task branch
   git checkout -b s6/<task-id>

3. Work on task, commit incrementally

4. Run preflight before final commit
   /preflight  →  tsc --noEmit must pass

5. Mark task done in state machine
   /mark-done s6-<task-id>

6. Merge task branch → sprint branch
   git checkout sprint-6
   git merge --no-ff s6/<task-id>
   git branch -d s6/<task-id>

7. Sprint complete → merge sprint → main
   git checkout main
   git merge --no-ff sprint-6
   git tag sprint-6-done
```

### `mark-done` updates git state

After `/mark-done`, the skill:
1. Updates `sprint_progress.json` (task → `done`, `last_updated` timestamp)
2. Commits that file: `chore(engine): mark s6-<id> done`
3. So `git log` is always a readable record of sprint progress

### Sprint branch lifecycle

| Sprint state | Git action |
|---|---|
| Sprint starting | `git checkout -b sprint-N` from `main` |
| Task done | Merge task branch → sprint branch, delete task branch |
| Sprint done + audited | Merge sprint branch → `main`, tag `sprint-N-done` |
| Sprint 7 (monorepo) | Branch from `main` after Sprint 6 tag |

### `.gitignore` additions

```
# Environment
.env.local
.env.staging
.env.production

# Supabase local
supabase/.branches
supabase/.temp

# State (committed, but never manually edited)
# .claude/state/ is tracked — it's the source of truth
```

Note: `.claude/state/sprint_progress.json` **is committed to git** — it's the persistent state machine and should be in version history so you can see sprint progress over time.

---

## Implementation Order

1. Sprint Engine setup (CLAUDE.md + state/ + skills-custom/ + rules/)
2. Sprint Engine proof: run `/sprint-init`, verify output
3. Sprint 6: work through tasks top-to-bottom using state machine
4. Sprint 7: monorepo refactoring (after Sprint 6 is done and stable)
5. Sprint 8: local/remote server setup (after monorepo structure is in place)
