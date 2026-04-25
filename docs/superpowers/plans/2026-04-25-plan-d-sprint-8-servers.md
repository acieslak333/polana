# Sprint 8 — Local + Remote Server Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full local development stack runnable with two commands (`supabase start` + `pnpm start`). Three remote environments (development, staging, production) with environment-switched config. Any contributor can onboard in under 15 minutes using `scripts/setup-local.sh`.

**Architecture:** Supabase CLI manages a local Postgres + Auth + Storage + Realtime stack via Docker. The app reads `EXPO_PUBLIC_*` env vars to switch between local and remote Supabase. EAS Build handles remote CI builds. Environment files are never committed — `.env.example` is the only committed reference.

**Tech Stack:** Supabase CLI, Docker Desktop, pnpm workspaces (from Sprint 7), Expo EAS, bash script for onboarding automation.

---

## Prerequisites

- [ ] Sprint 7 merged to `main` and tagged `sprint-7-done`
- [ ] Docker Desktop installed and running (`docker ps` works)
- [ ] Supabase CLI: `npm install -g supabase` (or `brew install supabase/tap/supabase` on Mac)
- [ ] EAS CLI: `npm install -g eas-cli`
- [ ] Expo account with the Polana project registered (`eas build:configure` run at least once)

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Modify | `packages/app/constants/config.ts` | Read all config from env vars |
| Create | `packages/app/.env.example` | Reference env file (committed) |
| Create | `packages/app/.env.local` | Local dev values (gitignored) |
| Modify | `packages/supabase/supabase/config.toml` | Supabase local project config |
| Create | `packages/supabase/supabase/seed.sql` | Local dev seed data |
| Create | `scripts/setup-local.sh` | One-command local onboarding |
| Modify | `packages/app/eas.json` | Three build profiles wired to env |
| Modify | `.gitignore` | Add .env.local, .env.staging, .env.production |

---

## Task 1: Create sprint-8 branch

- [ ] **Step 1:**

```bash
git checkout main && git pull
git checkout -b sprint-8
git checkout -b s8/local-stack
```

---

## Task 2: Update `constants/config.ts` for env-var-driven config

**Files:**
- Modify: `packages/app/constants/config.ts`

Currently `config.ts` likely has hardcoded Supabase URL and anon key. Replace with env var reads so the app switches between local and remote without a code change.

- [ ] **Step 1: Replace `packages/app/constants/config.ts`**

```typescript
// All values come from environment variables.
// Local dev: .env.local
// Staging/Production: set in EAS secrets or eas.json env block
// Never hardcode these values.

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''
export const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as
  | 'development'
  | 'staging'
  | 'production'

// Application limits (not env-specific)
export const MAX_GROMADY_PER_USER = 3
export const MAX_INTERESTS_PER_GROMADA = 3
export const MAX_EVENTS_PER_GROMADA = 5
export const FEED_PAGE_SIZE = 25

// City IDs — must match supabase/migrations/003_seed_data.sql
export const CITY_IDS = {
  warszawa: '00000000-0000-0000-0000-000000000001',
  krakow: '00000000-0000-0000-0000-000000000002',
  wroclaw: '00000000-0000-0000-0000-000000000003',
  lodz: '00000000-0000-0000-0000-000000000004',
  gdansk: '00000000-0000-0000-0000-000000000005',
} as const

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[config] SUPABASE_URL or SUPABASE_ANON_KEY is missing. ' +
    'Copy .env.example to .env.local and fill in values from `supabase status`.'
  )
}
```

- [ ] **Step 2: Verify `services/supabase.ts` imports from config correctly**

```typescript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config'
```

If it has hardcoded values, replace them with these imports.

- [ ] **Step 3: TypeScript check**

```bash
cd packages/app && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add packages/app/constants/config.ts packages/app/services/supabase.ts
git commit -m "chore(infra): config.ts reads from EXPO_PUBLIC_* env vars — no hardcoded URLs"
```

---

## Task 3: Create `.env.example` and `.env.local`

**Files:**
- Create: `packages/app/.env.example`
- Create: `packages/app/.env.local` (gitignored — local values only)

- [ ] **Step 1: Create `packages/app/.env.example`**

```bash
# Polana — Environment Variables
# Copy this file to .env.local for local development
# NEVER commit .env.local, .env.staging, or .env.production

# ── Local Development ──────────────────────────────────────────
# Get these values by running: supabase status (from packages/supabase/)
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste from: supabase status → anon key>

# ── App Environment ────────────────────────────────────────────
# Values: development | staging | production
EXPO_PUBLIC_APP_ENV=development

# ── Error Monitoring (optional for local dev) ──────────────────
# Get DSN from: sentry.io → Settings → Projects → Polana → Client Keys
EXPO_PUBLIC_SENTRY_DSN=
```

- [ ] **Step 2: Update `.gitignore` at repo root**

Add these lines if not already present:

```
# Environment files — never commit real values
packages/app/.env.local
packages/app/.env.staging
packages/app/.env.production
.env.local
.env.staging
.env.production

# Supabase local state
packages/supabase/supabase/.branches
packages/supabase/supabase/.temp
```

- [ ] **Step 3: Commit .env.example and .gitignore**

```bash
git add packages/app/.env.example .gitignore
git commit -m "chore(infra): add .env.example + gitignore env files and supabase local state"
```

---

## Task 4: Configure `supabase/config.toml` for local stack

**Files:**
- Modify: `packages/supabase/supabase/config.toml`

- [ ] **Step 1: Ensure `packages/supabase/supabase/config.toml` exists and has correct settings**

If `config.toml` doesn't exist yet, create it. If it exists, verify these sections are present:

```toml
[project]
# Your Supabase project ref — get from: supabase.com → project settings → general
project_id = "your-project-ref-here"

[api]
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
port = 54323
api_url = "http://127.0.0.1"

[inbucket]
# Local email testing (magic links, verification emails)
port = 54324

[auth]
site_url = "exp://127.0.0.1:8081"
# Allow localhost redirect for Expo dev client
additional_redirect_urls = ["exp://127.0.0.1:8081", "polana://"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # Disable for local dev — no email needed

[storage]
file_size_limit = "50MiB"

# Edge Function cron jobs (Sprint 6)
[functions.generate-events]
verify_jwt = false

[functions.expire-favors]
verify_jwt = false

[functions.dormant-check]
verify_jwt = false

[functions.send-notification]
verify_jwt = true
```

- [ ] **Step 2: Commit**

```bash
git add packages/supabase/supabase/config.toml
git commit -m "chore(infra): configure supabase/config.toml for local dev stack"
```

---

## Task 5: Create local seed data

**Files:**
- Create: `packages/supabase/supabase/seed.sql`

The seed runs automatically on `supabase db reset` and on fresh `supabase start`. It creates 3 test users, 2 Gromady, sample posts and events — enough to see the app working immediately.

- [ ] **Step 1: Create `packages/supabase/supabase/seed.sql`**

```sql
-- Polana local dev seed data
-- Runs automatically on: supabase db reset
-- Test user credentials: test1@polana.dev / password123 (etc.)

-- ── Cities (match CITY_IDS in constants/config.ts) ───────────
INSERT INTO cities (id, name, country_code, latitude, longitude) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Warszawa', 'PL', 52.2297, 21.0122),
  ('00000000-0000-0000-0000-000000000002', 'Kraków', 'PL', 50.0647, 19.9450),
  ('00000000-0000-0000-0000-000000000003', 'Wrocław', 'PL', 51.1079, 17.0385),
  ('00000000-0000-0000-0000-000000000004', 'Łódź', 'PL', 51.7592, 19.4560),
  ('00000000-0000-0000-0000-000000000005', 'Gdańsk', 'PL', 54.3520, 18.6466)
ON CONFLICT (id) DO NOTHING;

-- ── Interests ─────────────────────────────────────────────────
INSERT INTO interests (id, name, emoji, category) VALUES
  ('10000000-0000-0000-0000-000000000001', 'hiking', '🥾', 'outdoor'),
  ('10000000-0000-0000-0000-000000000002', 'coffee', '☕', 'food'),
  ('10000000-0000-0000-0000-000000000003', 'cycling', '🚴', 'outdoor'),
  ('10000000-0000-0000-0000-000000000004', 'cooking', '🍳', 'food'),
  ('10000000-0000-0000-0000-000000000005', 'music', '🎵', 'cultural'),
  ('10000000-0000-0000-0000-000000000006', 'film', '🎬', 'cultural'),
  ('10000000-0000-0000-0000-000000000007', 'dogs', '🐕', 'outdoor'),
  ('10000000-0000-0000-0000-000000000008', 'yoga', '🧘', 'sport'),
  ('10000000-0000-0000-0000-000000000009', 'books', '📚', 'cultural'),
  ('10000000-0000-0000-0000-000000000010', 'running', '🏃', 'sport')
ON CONFLICT (id) DO NOTHING;

-- ── Test users (created via auth.users + profiles trigger) ────
-- Use Supabase Auth API to create users; profiles are created by trigger.
-- Run after: supabase start
-- Command: supabase auth create-user --email test1@polana.dev --password password123

-- ── Sample Gromada ────────────────────────────────────────────
-- Insert after test users exist. Replace UUIDs with actual user IDs from:
-- SELECT id FROM auth.users LIMIT 3;
-- These are left as comments — the setup script fills them in.

-- INSERT INTO gromady (id, name, city_id, description, status) VALUES
--   ('20000000-0000-0000-0000-000000000001', 'Leśne Sowy', '00000000-0000-0000-0000-000000000001',
--    'Gromada miłośników wędrówek po Kampinosie', 'active');
```

Note: Full user-dependent seeding is handled by `scripts/setup-local.sh` which creates users via the Supabase Auth API after `supabase start`, then inserts dependent data.

- [ ] **Step 2: Commit**

```bash
git add packages/supabase/supabase/seed.sql
git commit -m "chore(infra): add local dev seed.sql — cities, interests, sample data"
```

---

## Task 6: Create `scripts/setup-local.sh`

**Files:**
- Create: `scripts/setup-local.sh`

One-command local onboarding. Works in Git Bash on Windows and native bash on Mac/Linux.

- [ ] **Step 1: Create `scripts/setup-local.sh`**

```bash
#!/usr/bin/env bash
set -e

echo "🌲 Polana — Local Development Setup"
echo "======================================"

# ── Prerequisites check ─────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ $1 is not installed. $2"
    exit 1
  fi
}

check_cmd docker   "Install Docker Desktop from https://docs.docker.com/get-docker/"
check_cmd supabase "Run: npm install -g supabase"
check_cmd pnpm     "Run: npm install -g pnpm"
check_cmd node     "Install Node.js 20+ from https://nodejs.org"

echo "✓ All prerequisites found"

# ── Install dependencies ─────────────────────────────────────────
echo ""
echo "📦 Installing workspace dependencies..."
pnpm install

# ── Start Supabase local stack ───────────────────────────────────
echo ""
echo "🚀 Starting Supabase local stack (Docker required)..."
cd packages/supabase
supabase start

# ── Extract local credentials ────────────────────────────────────
echo ""
echo "🔑 Reading local Supabase credentials..."
SUPABASE_STATUS=$(supabase status)

LOCAL_URL=$(echo "$SUPABASE_STATUS" | grep "API URL" | awk '{print $NF}')
LOCAL_ANON_KEY=$(echo "$SUPABASE_STATUS" | grep "anon key" | awk '{print $NF}')

if [ -z "$LOCAL_URL" ] || [ -z "$LOCAL_ANON_KEY" ]; then
  echo "❌ Could not read Supabase credentials from 'supabase status'"
  echo "   Try running 'supabase status' manually and check the output."
  exit 1
fi

# ── Write .env.local ─────────────────────────────────────────────
echo ""
echo "📝 Writing packages/app/.env.local..."
cd ../app
cat > .env.local << EOF
EXPO_PUBLIC_SUPABASE_URL=$LOCAL_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$LOCAL_ANON_KEY
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SENTRY_DSN=
EOF

echo "✓ .env.local written with local Supabase credentials"

# ── Create test users ────────────────────────────────────────────
echo ""
echo "👤 Creating test users..."
cd ../supabase

supabase auth create-user \
  --email test1@polana.dev \
  --password password123 \
  --role authenticated 2>/dev/null || echo "   (test1@polana.dev already exists)"

supabase auth create-user \
  --email test2@polana.dev \
  --password password123 \
  --role authenticated 2>/dev/null || echo "   (test2@polana.dev already exists)"

echo "✓ Test users ready"
echo "   test1@polana.dev / password123"
echo "   test2@polana.dev / password123"

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "======================================"
echo "✅ Local stack is ready!"
echo ""
echo "Next steps:"
echo "  1. cd packages/app && pnpm start"
echo "  2. Scan the QR code with Expo Go"
echo "  3. Sign in: test1@polana.dev / password123"
echo ""
echo "Supabase Studio (local DB UI):"
echo "  http://localhost:54323"
echo ""
echo "To stop the local stack:"
echo "  cd packages/supabase && supabase stop"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/setup-local.sh
```

On Windows (Git Bash), `chmod` works. Alternatively, add to `.gitattributes`:
```
scripts/setup-local.sh text eol=lf
```

- [ ] **Step 3: Test the script end-to-end**

```bash
./scripts/setup-local.sh
```

Expected final output:
```
✅ Local stack is ready!
```

Verify:
- `packages/app/.env.local` exists with real values
- `http://localhost:54323` opens Supabase Studio
- `cd packages/app && pnpm start` shows QR code
- Signing in with `test1@polana.dev / password123` works

- [ ] **Step 4: Commit**

```bash
cd ../..
git add scripts/setup-local.sh .gitattributes
git commit -m "feat(infra): add setup-local.sh — one-command local dev onboarding"
```

---

## Task 7: Configure EAS build profiles

**Files:**
- Modify: `packages/app/eas.json`

- [ ] **Step 1: Update `packages/app/eas.json`**

```json
{
  "cli": {
    "version": ">= 10.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development",
        "EXPO_PUBLIC_SUPABASE_URL": "http://127.0.0.1:54321"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging"
      },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "adam.cieslak333@gmail.com",
        "ascAppId": "FILL_IN_APP_STORE_CONNECT_ID",
        "appleTeamId": "FILL_IN_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

- [ ] **Step 2: Set EAS secrets for staging and production**

Sensitive values are never in `eas.json`. Set them as EAS secrets:

```bash
# Staging secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-staging-project.supabase.co" --environment preview
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-staging-anon-key" --environment preview
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your-sentry-dsn" --environment preview

# Production secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod-project.supabase.co" --environment production
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-prod-anon-key" --environment production
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your-sentry-dsn" --environment production
```

- [ ] **Step 3: Verify EAS config is valid**

```bash
cd packages/app && eas build:inspect --profile development --platform ios
```

Expected: prints resolved env vars without errors.

- [ ] **Step 4: Commit**

```bash
git add packages/app/eas.json
git commit -m "feat(infra): configure EAS build profiles — development/preview/production with env secrets"
```

---

## Task 8: Document the local run procedure

**Files:**
- Create: `CONTRIBUTING.md` (repo root)

- [ ] **Step 1: Create `CONTRIBUTING.md`**

```markdown
# Contributing to Polana

## Local Development Setup

### One-time setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd polana

# 2. Run the setup script (installs deps, starts Supabase, writes .env.local)
./scripts/setup-local.sh
```

Requirements: Docker Desktop, Node.js 20+, Git Bash (Windows) or bash (Mac/Linux).
The script installs pnpm and Supabase CLI if missing.

### Daily workflow

```bash
# Terminal 1 — start the local Supabase stack
cd packages/supabase && supabase start

# Terminal 2 — start the Expo dev server
cd packages/app && pnpm start
```

Scan the QR code with **Expo Go** (iOS/Android) or press `i` for iOS simulator.

**Test credentials:**
- `test1@polana.dev` / `password123`
- `test2@polana.dev` / `password123`

**Local Supabase Studio (DB browser):** http://localhost:54323

### Stopping

```bash
cd packages/supabase && supabase stop
```

---

## Remote Environments

| Environment | Supabase | How to build |
|---|---|---|
| Local dev | `supabase start` (Docker) | `pnpm start` |
| Staging | Supabase cloud (staging project) | `eas build --profile preview` |
| Production | Supabase cloud (prod project) | `eas build --profile production` |

Staging and production Supabase credentials are stored as EAS secrets — never in `.env` files or `eas.json`.

---

## Git Workflow

```
main                     ← protected, always deployable
  └── sprint-N/          ← sprint integration branch
        └── sN/<task-id> ← one branch per task
```

Before any commit: `/preflight` (TypeScript + ESLint must pass)
After completing a task: `/mark-done <task-id>`

Commit format: `<type>(<domain>): <description>`
Types: `feat` | `fix` | `refactor` | `chore` | `docs`
Domains: `frontend` | `backend` | `infra` | `qa` | `engine`

---

## Sprint Engine

At the start of every Claude Code session, run `/sprint-init` to see current sprint status, git branch, and next tasks. The state machine lives in `.claude/state/sprint_progress.json`.
```

- [ ] **Step 2: Commit + mark done + merge**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md — local setup, remote envs, git workflow, sprint engine"
```

```bash
git checkout sprint-8
git merge --no-ff s8/local-stack
git branch -d s8/local-stack
```

---

## Task 9: Final verification + merge to main

- [ ] **Step 1: Full local stack test**

```bash
./scripts/setup-local.sh
cd packages/app && pnpm start
```

Verify the golden path manually:
- [ ] App loads (no white screen)
- [ ] Login with `test1@polana.dev` works
- [ ] Feed screen loads (empty is fine)
- [ ] TypeScript check passes: `npx tsc --noEmit`

- [ ] **Step 2: Merge sprint-8 → main**

```bash
git checkout main
git merge --no-ff sprint-8
git tag sprint-8-done
git push origin main --tags
```

- [ ] **Step 3: Mark Sprint 8 done in SPRINTS.md**

```markdown
## ✅ Sprint 8 — Local + Remote Server Setup (DONE)

- ✅ config.ts reads from EXPO_PUBLIC_* env vars
- ✅ .env.example committed, .env.local gitignored
- ✅ supabase/config.toml configured for local stack
- ✅ seed.sql with cities, interests, test users
- ✅ scripts/setup-local.sh — one-command onboarding
- ✅ eas.json — development/preview/production profiles
- ✅ EAS secrets set for staging + production
- ✅ CONTRIBUTING.md with full onboarding guide
```

- [ ] **Step 4: Run `/sprint-init` in new Claude session to verify Sprint Engine reads completion**

Expected:
```
Sprint 8 — Local + Remote Server Setup
Last completed: sprint-8 done
Next: No pending tasks. Sprint complete!
```

Update `sprint_progress.json` to Sprint 9 (TBD) or mark the project as beta-ready.
