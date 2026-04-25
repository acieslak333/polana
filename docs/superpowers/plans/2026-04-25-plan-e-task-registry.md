# Task Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `.claude/registry/` directory with 3 YAML files that map task domains to skills, agents, plugins, and review tiers — the foundation all other workflow components depend on.

**Architecture:** Three YAML files with strict schemas. `task-types.yaml` is the core lookup table (25 domains). `keywords.yaml` maps plain-English words to domains for auto-detection. `review-rules.yaml` defines escalation thresholds. All three are read by `plan_sprint.py` at planning time.

**Tech Stack:** YAML, Python 3.11+ (pyyaml for validation), Git.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `.claude/registry/task-types.yaml` | 25 domains → skills/agents/plugins/rules/review |
| Create | `.claude/registry/keywords.yaml` | plain-English words → domain mapping |
| Create | `.claude/registry/review-rules.yaml` | escalation thresholds + always-senior/lead lists |
| Create | `scripts/validate_registry.py` | validates all 3 YAML files parse and cross-reference correctly |

---

## Task 1: Create `.claude/registry/task-types.yaml`

**Files:**
- Create: `.claude/registry/task-types.yaml`

- [ ] **Step 1: Create the file**

```yaml
# .claude/registry/task-types.yaml
# Maps task domains to: skills, agents, plugins, rules, review tier, escalation condition.
# Read by scripts/plan_sprint.py at planning time.
# review values: karpathy-first | senior-first | lead-required

domains:

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
    description: Knowledge base, architecture docs, decision records
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

- [ ] **Step 2: Verify YAML parses**

```bash
python -c "import yaml; d = yaml.safe_load(open('.claude/registry/task-types.yaml')); print(f'OK — {len(d[\"domains\"])} domains loaded')"
```

Expected: `OK — 25 domains loaded`

---

## Task 2: Create `.claude/registry/keywords.yaml`

**Files:**
- Create: `.claude/registry/keywords.yaml`

- [ ] **Step 1: Create the file**

```yaml
# .claude/registry/keywords.yaml
# Maps plain-English keywords to domain IDs.
# Read by scripts/plan_sprint.py to auto-detect domains from user request text.
# A request matches a domain if ANY of its keywords appear (case-insensitive).
# If no match: defaults to quality/bugfix.

mappings:
  frontend/ui-components:
    - screen
    - component
    - button
    - card
    - modal
    - tab
    - navigation
    - layout
    - list
    - grid
    - picker
    - header
    - footer
    - badge
    - avatar

  frontend/ux-interactions:
    - animation
    - haptic
    - gesture
    - swipe
    - accessibility
    - a11y
    - empty state
    - skeleton
    - transition
    - scroll
    - drag
    - pull to refresh

  frontend/i18n:
    - translation
    - locale
    - i18n
    - polish
    - language
    - "t('"
    - namespace
    - localize

  frontend/state-management:
    - store
    - zustand
    - hook
    - global state
    - context
    - usestore
    - usehook

  backend/api-services:
    - api
    - service
    - fetch
    - query
    - mutation
    - endpoint
    - crud
    - request
    - response

  backend/edge-functions:
    - edge function
    - deno
    - cron
    - scheduled
    - serverless
    - supabase function

  backend/realtime:
    - realtime
    - subscription
    - chat
    - live
    - websocket
    - broadcast

  database/migrations:
    - migration
    - schema
    - table
    - column
    - index
    - alter table
    - create table
    - add column
    - drop column

  database/rls-policies:
    - rls
    - row level security
    - policy
    - grant
    - revoke
    - security policy

  database/performance:
    - slow query
    - index
    - explain
    - performance
    - optimize
    - query plan
    - n+1

  infra/deployment:
    - eas
    - build
    - deploy
    - app store
    - google play
    - release
    - distribution
    - submit

  infra/ci-cd:
    - github actions
    - workflow
    - pipeline
    - ci
    - cd
    - automation
    - action

  infra/environment:
    - env
    - secret
    - ".env"
    - credentials
    - environment variable
    - config value

  infra/docker:
    - docker
    - container
    - dockerfile
    - compose
    - image

  infra/monorepo:
    - monorepo
    - workspace
    - package
    - turbo
    - pnpm
    - turborepo

  security/auth:
    - auth
    - oauth
    - login
    - token
    - session
    - jwt
    - sign in
    - sign up
    - password
    - refresh token

  security/audit:
    - security
    - vulnerability
    - audit
    - threat
    - penetration
    - xss
    - injection

  quality/bugfix:
    - bug
    - fix
    - error
    - crash
    - broken
    - not working
    - issue
    - regression

  quality/refactor:
    - refactor
    - clean
    - simplify
    - dead code
    - technical debt
    - cleanup
    - restructure

  quality/typescript:
    - typescript
    - type error
    - ts error
    - type
    - interface
    - generic
    - type assertion

  engine/sprint-management:
    - sprint
    - task
    - backlog
    - planning
    - sprint goal

  engine/claude-config:
    - claude.md
    - rules
    - settings
    - config
    - skill update
    - registry

  engine/new-skill:
    - new skill
    - create skill
    - add skill
    - skill file

  engine/new-agent:
    - new agent
    - create agent
    - add agent
    - agent file

  docs/wiki:
    - docs
    - wiki
    - documentation
    - decision
    - adr
    - architecture doc

  docs/api:
    - api docs
    - type docs
    - interface docs
    - jsdoc
    - public api
```

- [ ] **Step 2: Verify YAML parses**

```bash
python -c "import yaml; d = yaml.safe_load(open('.claude/registry/keywords.yaml')); total = sum(len(v) for v in d['mappings'].values()); print(f'OK — {len(d[\"mappings\"])} domains, {total} keywords')"
```

Expected: `OK — 25 domains, 100+ keywords`

---

## Task 3: Create `.claude/registry/review-rules.yaml`

**Files:**
- Create: `.claude/registry/review-rules.yaml`

- [ ] **Step 1: Create the file**

```yaml
# .claude/registry/review-rules.yaml
# Defines escalation thresholds for the layered review pipeline.
# Read by scripts/review_pipeline.py.

thresholds:
  files_changed: 5       # Karpathy → senior if > 5 files touched
  lines_changed: 300     # Karpathy → senior if > 300 lines changed

# Domains that always use cs-senior-engineer (skip Karpathy)
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

# Domains that always use cs-engineering-lead (skip both Karpathy and senior)
always_lead:
  - database/rls-policies
  - security/auth
  - security/audit
  - engine/new-agent

# Blocker handling
blocker_retries: 3
blocker_notification: push   # calls send-notification Edge Function

# Retrospective thresholds (used by sprint-review skill)
retrospective:
  blocker_rate_warning: 0.20       # warn if >20% of tasks blocked
  escalation_rate_warning: 0.50    # warn if >50% of tasks escalated
  preflight_avg_failures_warning: 2 # warn if avg preflight failures > 2
```

- [ ] **Step 2: Verify YAML parses**

```bash
python -c "import yaml; d = yaml.safe_load(open('.claude/registry/review-rules.yaml')); print(f'OK — thresholds: {d[\"thresholds\"]}')"
```

Expected: `OK — thresholds: {'files_changed': 5, 'lines_changed': 300}`

---

## Task 4: Create `scripts/validate_registry.py`

**Files:**
- Create: `scripts/validate_registry.py`

- [ ] **Step 1: Create the file**

```python
"""
Validates the 3 registry YAML files for:
  1. Valid YAML syntax
  2. All domains in keywords.yaml exist in task-types.yaml
  3. All domains in review-rules.yaml exist in task-types.yaml
  4. All task-types have required fields: description, skills, agents, plugins, rules, review

Usage: python scripts/validate_registry.py
Exit 0: all valid. Exit 1: validation errors printed.
"""
import yaml, sys
from pathlib import Path

REGISTRY = Path(__file__).parent.parent / ".claude/registry"
REQUIRED_FIELDS = ["description", "skills", "agents", "plugins", "rules", "review", "escalate_if"]
VALID_REVIEW = {"karpathy-first", "senior-first", "lead-required"}

errors = []

def load(name):
    path = REGISTRY / name
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"YAML parse error in {name}: {e}")
        return None

task_types = load("task-types.yaml")
keywords = load("keywords.yaml")
review_rules = load("review-rules.yaml")

if any(d is None for d in [task_types, keywords, review_rules]):
    print("\n".join(errors))
    sys.exit(1)

domains = set(task_types.get("domains", {}).keys())

# Check all task-types have required fields
for domain, cfg in task_types["domains"].items():
    for field in REQUIRED_FIELDS:
        if field not in cfg:
            errors.append(f"task-types.yaml/{domain}: missing field '{field}'")
    if cfg.get("review") not in VALID_REVIEW:
        errors.append(f"task-types.yaml/{domain}: invalid review '{cfg.get('review')}' — must be one of {VALID_REVIEW}")

# Check keywords domains exist in task-types
for kw_domain in keywords.get("mappings", {}).keys():
    if kw_domain not in domains:
        errors.append(f"keywords.yaml: domain '{kw_domain}' not found in task-types.yaml")

# Check review-rules domains exist in task-types
for list_name in ["always_senior", "always_lead"]:
    for domain in review_rules.get(list_name, []):
        if domain not in domains:
            errors.append(f"review-rules.yaml/{list_name}: domain '{domain}' not found in task-types.yaml")

if errors:
    print("Registry validation FAILED:")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

print(f"Registry validation PASSED")
print(f"  ✓ {len(domains)} domains in task-types.yaml")
print(f"  ✓ {len(keywords['mappings'])} domains in keywords.yaml")
print(f"  ✓ All cross-references valid")
```

- [ ] **Step 2: Run validation**

```bash
python scripts/validate_registry.py
```

Expected:
```
Registry validation PASSED
  ✓ 25 domains in task-types.yaml
  ✓ 25 domains in keywords.yaml
  ✓ All cross-references valid
```

- [ ] **Step 3: Commit everything**

```bash
git add .claude/registry/ scripts/validate_registry.py
git commit -m "feat(engine): add task registry — task-types, keywords, review-rules + validator"
```
