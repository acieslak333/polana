# Autonomous Engineering Workflow Design

**Date:** 2026-04-25
**Trigger:** User message in Claude Code ("add X", "fix Y") → fully autonomous execution
**Mode:** Autonomous by default. User reviews only when explicitly stated or blocker occurs.

---

## 1. Architecture Overview

```
User message ("add X")
    ↓
[plan-sprint skill]
  → reads registry/keywords.yaml  — detect domains from request
  → reads registry/task-types.yaml — load tooling per domain
  → writes sprint_progress.json    — tasks with tooling metadata
    ↓
[run-sprint skill]
  → loops over pending tasks
  → per task: branch → code → preflight → PR → review → CI → merge
    ↓
[review pipeline]
  → cs-karpathy-reviewer (fast, cheap)
  → escalates to cs-senior-engineer if files > 5 or domain is senior-first
  → escalates to cs-engineering-lead for RLS, auth, new agents
    ↓
[GitHub Actions]
  → ci.yml: tsc + lint on every push
  → auto-merge.yml: merges when CI green + review-approved label present
  → sprint-end.yml: fires when sprint-N/ merges to main
    ↓
[hooks + scripts]
  → workflow_log.md updated at every state change
  → push notification + GitHub issue on blocker (after 3 retries)
    ↓
[sprint-review skill]
  → fires after last task merges
  → audits CLAUDE.md, rules/, context_map.md for drift
  → opens maintenance PR if anything needs updating
```

### Blocker handling

On any failure (preflight, review, CI):
1. Retry up to 3 times with different approach
2. If still failing: call `send-notification` Edge Function → push notification to device
3. Open GitHub issue tagged `needs-human`
4. Skip task, continue to next independent task in sprint

### Task data model

Every task in `sprint_progress.json` carries a `tooling` block:

```json
{
  "id": "s6-edge-generate-events",
  "title": "...",
  "status": "pending",
  "domain": "backend/edge-functions",
  "tooling": {
    "skills": ["supabase:supabase", "security-review", "preflight"],
    "agents": ["cs-senior-engineer"],
    "plugins": ["supabase@claude-plugins-official", "security-guidance@claude-plugins-official"],
    "rules": ["supabase-rls.md", "typescript-strict.md"],
    "review": "senior-first",
    "branch": "s6/edge-generate-events"
  }
}
```

---

## 2. Task Registry

Location: `.claude/registry/`

```
.claude/registry/
  task-types.yaml    ← domain → tooling map (20 domains, full coverage)
  keywords.yaml      ← keyword → domain auto-detection
  review-rules.yaml  ← escalation thresholds
```

### `task-types.yaml` — Full Domain Coverage

```yaml
domains:

  # ── FRONTEND ────────────────────────────────────────────────

  frontend/ui-components:
    description: React Native screens, components, styling
    skills: [frontend-design:frontend-design, senior-frontend, superpowers:test-driven-development, preflight]
    agents: [cs-karpathy-reviewer, cs-senior-engineer]
    plugins: [frontend-design@claude-plugins-official, code-simplifier@claude-plugins-official, superpowers@claude-plugins-official, impeccable@pbakaus]
    rules: [rn-native-only.md, no-dark-patterns.md, typescript-strict.md]
    review: karpathy-first
    escalate_if: files_changed > 5 or touches_navigation or touches_auth

  frontend/ux-interactions:
    description: Animations, haptics, gestures, accessibility, empty states
    skills: [frontend-design:frontend-design, senior-frontend, superpowers:systematic-debugging, preflight]
    agents: [cs-karpathy-reviewer, cs-senior-engineer]
    plugins: [frontend-design@claude-plugins-official, superpowers@claude-plugins-official, impeccable@pbakaus]
    rules: [no-dark-patterns.md, rn-native-only.md]
    review: karpathy-first
    escalate_if: touches_reanimated or touches_gesture_handler

  frontend/i18n:
    description: Translation keys, locale files, i18next config
    skills: [preflight, context-map]
    agents: [cs-karpathy-reviewer]
    plugins: [code-simplifier@claude-plugins-official]
    rules: [typescript-strict.md]
    review: karpathy-first
    escalate_if: adds_new_namespace

  frontend/state-management:
    description: Zustand stores, hooks, global state changes
    skills: [senior-frontend, superpowers:test-driven-development, preflight]
    agents: [cs-karpathy-reviewer, cs-senior-engineer]
    plugins: [superpowers@claude-plugins-official, code-simplifier@claude-plugins-official]
    rules: [typescript-strict.md]
    review: karpathy-first
    escalate_if: touches_auth_store or files_changed > 4

  # ── BACKEND ─────────────────────────────────────────────────

  backend/api-services:
    description: services/api/*.ts — CRUD, fetch, mutations
    skills: [supabase:supabase, supabase:supabase-postgres-best-practices, senior-fullstack, preflight]
    agents: [cs-karpathy-reviewer, cs-senior-engineer]
    plugins: [supabase@claude-plugins-official, superpowers@claude-plugins-official]
    rules: [supabase-rls.md, typescript-strict.md]
    review: karpathy-first
    escalate_if: touches_auth or new_table_access or files_changed > 4

  backend/edge-functions:
    description: supabase/functions/*.ts — Deno Edge Functions
    skills: [supabase:supabase, supabase:supabase-postgres-best-practices, security-review, preflight]
    agents: [cs-senior-engineer, cs-karpathy-reviewer]
    plugins: [supabase@claude-plugins-official, security-guidance@claude-plugins-official]
    rules: [supabase-rls.md, typescript-strict.md]
    review: senior-first
    escalate_if: always_false

  backend/realtime:
    description: Supabase Realtime subscriptions, chat, live updates
    skills: [supabase:supabase, senior-fullstack, preflight]
    agents: [cs-senior-engineer, cs-karpathy-reviewer]
    plugins: [supabase@claude-plugins-official]
    rules: [supabase-rls.md, typescript-strict.md]
    review: senior-first
    escalate_if: always_false

  # ── DATABASE ────────────────────────────────────────────────

  database/migrations:
    description: supabase/migrations/*.sql — schema changes
    skills: [supabase:supabase, supabase:supabase-postgres-best-practices, sql-database-assistant, database-designer, security-review]
    agents: [cs-senior-engineer, cs-engineering-lead]
    plugins: [supabase@claude-plugins-official, security-guidance@claude-plugins-official]
    rules: [supabase-rls.md]
    review: senior-first
    escalate_if: drops_column or drops_table or modifies_rls_policy

  database/rls-policies:
    description: Row Level Security policy changes
    skills: [supabase:supabase, supabase:supabase-postgres-best-practices, security-review]
    agents: [cs-senior-engineer, cs-engineering-lead]
    plugins: [supabase@claude-plugins-official, security-guidance@claude-plugins-official]
    rules: [supabase-rls.md]
    review: lead-required
    escalate_if: always_false

  database/performance:
    description: Query optimization, indexes, explain plans
    skills: [supabase:supabase-postgres-best-practices, sql-database-assistant]
    agents: [cs-senior-engineer]
    plugins: [supabase@claude-plugins-official]
    rules: [supabase-rls.md]
    review: senior-first
    escalate_if: always_false

  # ── INFRASTRUCTURE ──────────────────────────────────────────

  infra/deployment:
    description: EAS build config, app.json, eas.json, expo config
    skills: [senior-fullstack, preflight]
    agents: [cs-senior-engineer]
    plugins: [superpowers@claude-plugins-official]
    rules: [typescript-strict.md]
    review: senior-first
    escalate_if: modifies_production_profile

  infra/ci-cd:
    description: GitHub Actions workflows, scripts, automation
    skills: [docker-development, senior-fullstack, security-review]
    agents: [cs-senior-engineer, cs-engineering-lead]
    plugins: [security-guidance@claude-plugins-official, superpowers@claude-plugins-official]
    rules: []
    review: senior-first
    escalate_if: modifies_auto_merge or touches_secrets

  infra/environment:
    description: .env files, secrets, config management
    skills: [env-secrets-manager, security-review]
    agents: [cs-senior-engineer]
    plugins: [security-guidance@claude-plugins-official]
    rules: [supabase-rls.md]
    review: senior-first
    escalate_if: adds_new_secret

  infra/docker:
    description: Dockerfile, docker-compose, container config
    skills: [docker-development, security-review]
    agents: [cs-senior-engineer]
    plugins: [docker-development@claude-plugins-official, security-guidance@claude-plugins-official]
    rules: []
    review: senior-first
    escalate_if: modifies_base_image

  infra/monorepo:
    description: pnpm workspaces, Turborepo, tsconfig references
    skills: [monorepo-navigator, senior-fullstack, preflight]
    agents: [cs-senior-engineer, cs-engineering-lead]
    plugins: [superpowers@claude-plugins-official]
    rules: [typescript-strict.md]
    review: senior-first
    escalate_if: restructures_packages

  # ── SECURITY & AUTH ─────────────────────────────────────────

  security/auth:
    description: Auth flows, OAuth, token handling, session management
    skills: [security-review, supabase:supabase, senior-fullstack]
    agents: [cs-senior-engineer, cs-engineering-lead]
    plugins: [security-guidance@claude-plugins-official, supabase@claude-plugins-official]
    rules: [supabase-rls.md, typescript-strict.md]
    review: lead-required
    escalate_if: always_false

  security/audit:
    description: Security review of existing code, vulnerability assessment
    skills: [security-review, threat-detection]
    agents: [cs-quality-regulatory, cs-engineering-lead]
    plugins: [security-guidance@claude-plugins-official]
    rules: [supabase-rls.md]
    review: lead-required
    escalate_if: always_false

  # ── CODE QUALITY ────────────────────────────────────────────

  quality/bugfix:
    description: Bug fixes, error handling, edge cases
    skills: [superpowers:systematic-debugging, preflight, code-review:code-review]
    agents: [cs-karpathy-reviewer, cs-senior-engineer]
    plugins: [superpowers@claude-plugins-official, code-simplifier@claude-plugins-official]
    rules: [typescript-strict.md]
    review: karpathy-first
    escalate_if: touches_auth or files_changed > 6

  quality/refactor:
    description: Code cleanup, dead code removal, pattern enforcement
    skills: [simplify, tech-debt-tracker, preflight, code-review:code-review]
    agents: [cs-karpathy-reviewer, cs-senior-engineer]
    plugins: [code-simplifier@claude-plugins-official, superpowers@claude-plugins-official]
    rules: [typescript-strict.md]
    review: karpathy-first
    escalate_if: files_changed > 8

  quality/typescript:
    description: TypeScript error fixes, type improvements
    skills: [preflight, superpowers:systematic-debugging]
    agents: [cs-karpathy-reviewer]
    plugins: [code-simplifier@claude-plugins-official]
    rules: [typescript-strict.md]
    review: karpathy-first
    escalate_if: changes_core_types

  # ── SPRINT ENGINE & DOCS ────────────────────────────────────

  engine/sprint-management:
    description: Sprint planning, SPRINTS.md, sprint_progress.json updates
    skills: [sprint-init, mark-done, context-map]
    agents: [cs-karpathy-reviewer]
    plugins: [superpowers@claude-plugins-official]
    rules: []
    review: karpathy-first
    escalate_if: always_false

  engine/claude-config:
    description: CLAUDE.md, rules/, skills/, settings.json changes
    skills: [update-config, self-improving-agent, context-map]
    agents: [cs-senior-engineer]
    plugins: [superpowers@claude-plugins-official, skill-creator@claude-plugins-official]
    rules: []
    review: senior-first
    escalate_if: modifies_permissions or modifies_hooks

  engine/new-skill:
    description: Creating or modifying Claude Code skills
    skills: [superpowers:writing-skills, skill-creator:skill-creator]
    agents: [cs-senior-engineer]
    plugins: [skill-creator@claude-plugins-official, superpowers@claude-plugins-official]
    rules: []
    review: senior-first
    escalate_if: always_false

  engine/new-agent:
    description: Creating or modifying agents in .claude/agents/
    skills: [agent-designer, agent-workflow-designer]
    agents: [cs-engineering-lead]
    plugins: [superpowers@claude-plugins-official]
    rules: []
    review: lead-required
    escalate_if: always_false

  docs/wiki:
    description: Knowledge base updates, architecture docs, decision records
    skills: [llm-wiki, context-map]
    agents: [cs-wiki-ingestor, cs-wiki-librarian, cs-wiki-linter]
    plugins: [superpowers@claude-plugins-official]
    rules: []
    review: karpathy-first
    escalate_if: always_false

  docs/api:
    description: API documentation, type exports, public interfaces
    skills: [context-map, preflight]
    agents: [cs-karpathy-reviewer]
    plugins: [code-simplifier@claude-plugins-official]
    rules: [typescript-strict.md]
    review: karpathy-first
    escalate_if: always_false
```

### `keywords.yaml`

```yaml
mappings:
  frontend/ui-components:   [screen, component, button, card, modal, tab, navigation, layout, list, grid]
  frontend/ux-interactions: [animation, haptic, gesture, swipe, accessibility, a11y, empty state, skeleton, transition]
  frontend/i18n:            [translation, locale, i18n, polish, language, "t('"]
  frontend/state-management:[store, zustand, hook, state, context]
  backend/api-services:     [api, service, fetch, query, mutation, endpoint, crud]
  backend/edge-functions:   [edge function, deno, cron, scheduled, serverless]
  backend/realtime:         [realtime, subscription, chat, live, websocket]
  database/migrations:      [migration, schema, table, column, index, alter, create table]
  database/rls-policies:    [rls, row level security, policy, grant, revoke]
  database/performance:     [slow query, index, explain, performance, optimize]
  infra/deployment:         [eas, build, deploy, app store, google play, release]
  infra/ci-cd:              [github actions, workflow, ci, cd, automation, pipeline]
  infra/environment:        [env, secret, config, ".env", credentials]
  infra/docker:             [docker, container, dockerfile, compose]
  infra/monorepo:           [monorepo, workspace, package, turbo, pnpm]
  security/auth:            [auth, oauth, login, token, session, jwt, sign in]
  security/audit:           [security, vulnerability, audit, threat]
  quality/bugfix:           [bug, fix, error, crash, broken, not working]
  quality/refactor:         [refactor, clean, simplify, dead code, technical debt]
  quality/typescript:       [typescript, type error, ts error, type, interface]
  engine/sprint-management: [sprint, task, backlog, planning]
  engine/claude-config:     [claude.md, rules, settings, config, skill]
  engine/new-skill:         [new skill, create skill, add skill]
  engine/new-agent:         [new agent, create agent, add agent]
  docs/wiki:                [docs, wiki, documentation, decision, adr]
  docs/api:                 [api docs, type docs, interface docs]
```

### `review-rules.yaml`

```yaml
thresholds:
  files_changed: 5
  lines_changed: 300

always_senior:
  - backend/edge-functions
  - backend/realtime
  - database/migrations
  - database/performance
  - infra/deployment
  - infra/ci-cd
  - infra/environment
  - infra/docker
  - infra/monorepo
  - engine/claude-config
  - engine/new-skill

always_lead:
  - database/rls-policies
  - security/auth
  - security/audit
  - engine/new-agent

blocker_retries: 3
blocker_notification: push
```

---

## 3. Workflow Skills

### `plan-sprint` skill

Triggered by user message. Reads registry to detect domains, builds tasks with tooling metadata, writes to `sprint_progress.json`, commits, hands off to `run-sprint`.

No discussion by default. One clarifying question only if request maps to zero domains.

### `run-sprint` skill

Per-task loop:
1. `git checkout -b sN/<task-id>`
2. Mark `in_progress` + append to `workflow_log.md`
3. Load task's `tooling.skills` + `tooling.rules`
4. Implement via `superpowers:subagent-driven-development`
5. Run `/preflight` → retry 3x on fail → push notification + issue + skip
6. Run `scripts/review_pipeline.py` → agent review → retry 3x on fail
7. `gh pr create` + wait for CI green via `gh pr checks --watch`
8. `gh pr merge --squash` after `review-approved` label applied
9. `/mark-done <task-id>` + append to `workflow_log.md`
10. `git checkout sprint-N/`

After all tasks done → invoke `sprint-review` skill.

### `sprint-review` skill

Fires at sprint end in two passes:

**Pass 1 — Codebase drift check:**
1. `git log sprint-N/ --name-only` → collect all changed files
2. Check CLAUDE.md for undocumented patterns
3. Check `rules/` for new patterns established this sprint
4. Regenerate `context_map.md`
5. Check `registry/task-types.yaml` for coverage gaps
6. Open maintenance PR: `chore(engine): sprint-N end review`
7. Update `sprint_progress.json` sprint pointer

**Pass 2 — Workflow retrospective (self-reflection):**

After the maintenance PR is opened, Claude evaluates the workflow itself by answering these questions from the sprint's data:

1. **Blocker rate:** How many tasks hit the 3-retry limit? If >20% of tasks blocked, flag the relevant domain's tooling as under-equipped and suggest adding a skill or agent.

2. **Review escalation rate:** How often did Karpathy escalate to senior-engineer? If >50% of tasks escalated, consider lowering the `files_changed` threshold or promoting the domain to `senior-first` in `review-rules.yaml`.

3. **Preflight failure rate:** How many preflight runs failed before passing? If a domain consistently fails preflight, suggest adding a domain-specific pre-check script.

4. **Skill coverage gaps:** Were any tasks implemented without a matching registry entry (used default `quality/bugfix`)? If yes, add a new domain to `task-types.yaml`.

5. **Registry keyword misses:** Did `plan_sprint.py` fall back to default domain more than once? If yes, expand `keywords.yaml` with the actual words used.

6. **Hooks/scripts failures:** Did any hook or script error during the sprint? Flag for repair.

7. **Token efficiency:** Did any task spawn more than 3 subagent iterations? If yes, the task scope was too large — suggest splitting that domain into subtask templates.

Retrospective output is written to `workflow_log.md` as a `## Retrospective — Sprint N` section and committed. If any improvement is actionable (threshold change, new keyword, new domain), Claude creates a follow-up task in the next sprint's `sprint_progress.json` automatically with domain `engine/claude-config`.

---

## 4. GitHub Actions

### `.github/workflows/ci.yml`

Triggers on all `s*/**` and `sprint-*` branches. Jobs: `typecheck` (tsc --noEmit) + `lint` (eslint --max-warnings 0).

### `.github/workflows/auto-merge.yml`

Triggers when PR is labeled or CI workflow completes. Merges with `--squash --delete-branch` when both `review-approved` label is present AND CI is green. The label is applied by `scripts/review_pipeline.py` after agent review passes.

### `.github/workflows/sprint-end.yml`

Triggers on push to `main`. Detects sprint branch merge by reading `git log -1 --merges --pretty=format:%s` and matching the pattern `sprint-\d+`. Runs `scripts/sprint_end_log.py` with the sprint branch name as argument.

---

## 5. Hooks (`.claude/settings.json`)

| Hook | Trigger | Action |
|---|---|---|
| `PostToolUse` | Write/Edit | Async append to `workflow_log.md` |
| `Stop` | Session end | Sync `workflow_log.md` to git |
| `PreToolUse` | `git push` | Run `branch_guard.py` — block pushes to main |

---

## 6. Scripts (`scripts/`)

| Script | Purpose |
|---|---|
| `plan_sprint.py` | Reads registry, detects domains, generates task JSON with tooling |
| `review_pipeline.py` | Determines review tier, dispatches agent, applies GitHub label |
| `workflow_log.py` | Appends timestamped entries + syncs to git |
| `branch_guard.py` | Blocks direct pushes to `main` |
| `sprint_end_log.py` | Records sprint completion metadata in `workflow_log.md` |

---

## 7. `workflow_log.md` Format

```markdown
# Workflow Log

## Sprint 6 — 2026-04-25

▶ 09:14 Starting s6-ts-fixes [quality/typescript]
  Skills: preflight, superpowers:systematic-debugging
  Agent: cs-karpathy-reviewer (karpathy-first)
  Branch: s6/ts-fixes

✓ 09:21 Done s6-ts-fixes — PR #3 merged

▶ 09:22 Starting s6-edge-generate-events [backend/edge-functions]
  Skills: supabase:supabase, security-review, preflight
  Agent: cs-senior-engineer (senior-first domain)
  Branch: s6/edge-generate-events

⚠ 09:31 Preflight failed (retry 1/3)
✓ 09:34 Preflight passed
✓ 09:38 Review passed — cs-senior-engineer
✓ 09:39 CI green — auto-merged PR #4
✓ 09:40 Done s6-edge-generate-events

❌ 09:55 BLOCKER: s6-crossovers-api — 3 retries exhausted
  Issue: #12 opened (needs-human)
  Notification: sent
  Skipping → next task

## Retrospective — Sprint 6

Tasks completed: 16/19 (84%)
Blockers: 1 (s6-crossovers-api) — 5% blocker rate ✓
Review escalations: 4/16 (25%) — within threshold ✓
Preflight failures before pass: avg 0.8 per task ✓

Issues found:
⚠ backend/api-services escalated 3/4 times (75%) → consider promoting to senior-first
⚠ keywords.yaml missed "gromada crossover" → added "crossover" to backend/api-services keywords
⚠ hook workflow_log.py errored twice on Windows path (backslash) → repair task created

Actions taken:
→ backend/api-services review changed to senior-first in review-rules.yaml
→ "crossover" added to keywords.yaml backend/api-services
→ Task created: s7-fix-workflow-log-windows [engine/claude-config]
```

---

## 8. File Map

```
.claude/registry/
  task-types.yaml
  keywords.yaml
  review-rules.yaml
.claude/skills/
  plan-sprint/SKILL.md
  run-sprint/SKILL.md
  sprint-review/SKILL.md
.claude/state/
  sprint_progress.json    (existing — tooling block added)
  workflow_log.md         (new)
.github/workflows/
  ci.yml
  auto-merge.yml
  sprint-end.yml
scripts/
  plan_sprint.py
  review_pipeline.py
  workflow_log.py
  branch_guard.py
  sprint_end_log.py
```

**Note on `impeccable@pbakaus`:** Plugin marketplace registered. Install with `/plugin install impeccable` before first frontend sprint runs.
