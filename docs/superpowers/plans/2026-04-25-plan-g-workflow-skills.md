# Workflow Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 3 Claude Code skills — `plan-sprint`, `run-sprint`, `sprint-review` — that form the autonomous execution engine. These are SKILL.md files Claude reads and follows when invoked.

**Architecture:** Skills are markdown instruction files in `.claude/skills/<name>/SKILL.md`. Claude Code discovers them automatically. Each skill is a precise ordered sequence of steps Claude follows. `plan-sprint` calls `scripts/plan_sprint.py`. `run-sprint` orchestrates the full task loop. `sprint-review` fires at sprint end and writes the retrospective.

**Tech Stack:** Markdown (SKILL.md format), Python scripts (Plan F), gh CLI, git.

**Prerequisite:** Plan E (registry) and Plan F (scripts) must be complete.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `.claude/skills/plan-sprint/SKILL.md` | Triggered by user request — plans tasks autonomously |
| Create | `.claude/skills/run-sprint/SKILL.md` | Executes all pending tasks branch→PR→merge loop |
| Create | `.claude/skills/sprint-review/SKILL.md` | Sprint-end audit + workflow retrospective |

---

## Task 1: Create `plan-sprint` skill

**Files:**
- Create: `.claude/skills/plan-sprint/SKILL.md`

- [ ] **Step 1: Create the file**

```markdown
# Plan Sprint

Triggered when the user asks to add a feature, fix something, or implement anything not already in the current sprint. Runs autonomously — no user discussion unless the request is completely ambiguous.

## When to invoke

- User says "add X", "implement Y", "build Z", "fix X"
- User describes a feature that doesn't map to any pending task
- Do NOT invoke if the request maps to an existing pending task — just start that task

## Steps

### 1. Check for ambiguity

Read the user's request. If it maps to zero domains (you genuinely cannot tell what kind of work this is), ask ONE clarifying question:
> "Is this frontend, backend, database, infrastructure, or something else?"

Then proceed immediately with their answer. Do not ask follow-up questions.

If the request is clear enough to guess a domain, proceed without asking.

### 2. Run plan_sprint.py

```bash
python scripts/plan_sprint.py "<user request verbatim>"
```

Read the output. It lists the planned tasks with their domains and review tiers.

### 3. Log the planning event

```bash
python scripts/workflow_log.py append "📋 Planned sprint tasks for: <user request>"
```

### 4. Commit sprint_progress.json

```bash
git add .claude/state/sprint_progress.json
git commit -m "chore(engine): plan sprint — <user request summary in 5 words>"
```

### 5. Report to user

Output:
```
Planned N task(s):
1. [<task-id>] <domain> — <review tier>
2. ...

Starting execution now. I'll update workflow_log.md as I go.
Check GitHub for PRs. You'll get a push notification if anything blocks.
```

### 6. Immediately invoke run-sprint

Do not wait for user confirmation. Invoke the run-sprint skill now.
```

- [ ] **Step 2: Verify skill appears in available list**

The skill is auto-discovered when the file exists. Check that `plan-sprint` appears in the Claude Code skill list by looking at the system-reminder in the next response. If it doesn't appear, restart the Claude Code session.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/plan-sprint/
git commit -m "feat(engine): add plan-sprint skill — autonomous task planning from user request"
```

---

## Task 2: Create `run-sprint` skill

**Files:**
- Create: `.claude/skills/run-sprint/SKILL.md`

- [ ] **Step 1: Create the file**

```markdown
# Run Sprint

Executes all pending tasks in sprint_progress.json autonomously. Each task gets its own branch, PR, review, and auto-merge. Runs without user supervision unless a blocker occurs.

## When to invoke

- Automatically by plan-sprint after planning completes
- Manually with `/run-sprint` to resume after a session reset
- After a blocker is resolved and you want to continue

## Steps

### 1. Load sprint state

Read `.claude/state/sprint_progress.json`. Find all tasks with `status: pending`.

If no pending tasks: output "No pending tasks. Sprint complete." and invoke sprint-review.

### 2. For each pending task (in order)

Repeat these steps for every pending task:

#### 2a. Create task branch

```bash
git checkout sprint-6    # or whatever the current sprint branch is
git pull
git checkout -b <tooling.branch>
```

Example: `git checkout -b s6/backend-edge-functions`

#### 2b. Mark task in_progress

Update `.claude/state/sprint_progress.json`: set this task's `status` to `"in_progress"` and `last_updated` to current ISO timestamp.

```bash
git add .claude/state/sprint_progress.json
git commit -m "chore(engine): start <task-id>"
```

Log it:
```bash
python scripts/workflow_log.py append-task-start <task-id> <domain> <primary-agent> <branch>
```

#### 2c. Load rules and skills

Read each file listed in `tooling.rules` from `.claude/rules/`. These are now active constraints.

The skills listed in `tooling.skills` tell you which Claude Code skills to invoke. Invoke the most relevant one for the implementation work. For feature work, use `superpowers:subagent-driven-development`. For debugging, use `superpowers:systematic-debugging`.

#### 2d. Implement the task

Using the task's `title` and `request` as the goal, and the loaded rules as constraints, implement the feature. Follow these principles:
- TypeScript strict — no `any`, no type assertions without comment
- Read `.claude/context_map.md` before creating any new file to avoid duplicates
- Commit incrementally as you work (every significant file change)
- Commit message format: `feat(<domain-short>): <what you did>`

#### 2e. Run preflight

```bash
./node_modules/.bin/tsc --noEmit
```

**If it passes:** continue to 2f.

**If it fails:**
- Fix the TypeScript errors. Re-run. Repeat up to 3 times total.
- If still failing after 3 attempts:
  ```bash
  python scripts/workflow_log.py append-blocker <task-id> "TypeScript errors not resolvable"
  ./scripts/notify_blocker.sh <task-id> "TypeScript errors after 3 retries"
  gh issue create --title "BLOCKER: <task-id> — TS errors" --label "needs-human" --body "Task blocked after 3 preflight retries. Branch: <branch>"
  ```
  Mark task `skipped` in sprint_progress.json. Commit. Go to next task (step 2a with next task).

#### 2f. Push branch and open PR

```bash
git push -u origin <branch>
```

Create PR:
```bash
gh pr create \
  --title "feat(<domain-short>): <task title>" \
  --body "$(cat <<'EOF'
## Task
<task-id> — <task title>

## Domain
<domain>

## Skills used
<tooling.skills joined by comma>

## Review tier
<tooling.review>

## Changes
<list changed files>
EOF
)" \
  --base sprint-6
```

Save the PR number from output (e.g. `#42`).

#### 2g. Determine review tier and run review

```bash
FILES=$(git diff --name-only origin/sprint-6...HEAD | wc -l)
LINES=$(git diff --stat origin/sprint-6...HEAD | tail -1 | grep -oP '\d+ insertion' | grep -oP '\d+' || echo 0)
python scripts/review_pipeline.py <pr-number> <domain> $FILES $LINES
```

Read the output: `TIER:karpathy|senior|lead` and `AGENT:<agent-name>`.

Dispatch the agent by invoking it as a subagent with this prompt:
> "Review PR #<pr-number> for the task <task-id> (<domain>). Read the diff with `gh pr diff <pr-number>`. Apply Karpathy's 4 principles [if karpathy] / architectural review [if senior] / security + compliance review [if lead]. Output: PASS or FAIL with specific line-level feedback."

**If agent outputs PASS:**
- Apply review-approved label:
  ```bash
  python scripts/review_pipeline.py <pr-number> <domain> $FILES $LINES --apply-label
  ```
- Continue to 2h.

**If agent outputs FAIL with fixable issues:**
- Fix the issues. Re-push. Re-run review. Up to 3 total review attempts.
- If still failing: blocker flow (same as 2e blocker path above). Skip task.

#### 2h. Wait for CI green

```bash
gh pr checks <pr-number> --watch --interval 30
```

**If all checks pass:** continue to 2i.

**If checks fail:**
- Read the failure output. Fix the issue (usually a TypeScript or lint error introduced by something not caught by preflight). Re-push.
- Retry up to 3 times.
- If still failing: blocker flow. Skip task.

#### 2i. Auto-merge triggers

The `auto-merge.yml` GitHub Action merges automatically when:
- CI is green (all checks pass)
- `review-approved` label is present

Both are now true. Wait up to 60 seconds for the merge:
```bash
gh pr view <pr-number> --json state --jq '.state'
```

Repeat until output is `MERGED` or 60s elapses. If not merged after 60s, merge manually:
```bash
gh pr merge <pr-number> --squash --delete-branch
```

#### 2j. Mark done and continue

```bash
/mark-done <task-id>
python scripts/workflow_log.py append-task-done <task-id> <pr-number>
git checkout sprint-6
git pull
```

Proceed to next pending task (back to step 2a).

### 3. All tasks complete

When no more pending tasks remain:
```bash
python scripts/workflow_log.py sync
```

Output: "All tasks complete. Invoking sprint-review."

Invoke the sprint-review skill.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/run-sprint/
git commit -m "feat(engine): add run-sprint skill — full autonomous task execution loop"
```

---

## Task 3: Create `sprint-review` skill

**Files:**
- Create: `.claude/skills/sprint-review/SKILL.md`

- [ ] **Step 1: Create the file**

```markdown
# Sprint Review

Runs automatically after run-sprint completes all tasks. Performs two passes: codebase drift check + workflow retrospective. Opens a maintenance PR if anything needs updating.

## When to invoke

- Automatically by run-sprint when all tasks are done
- Manually with `/sprint-review` at any time

## Steps

### Pass 1: Codebase Drift Check

#### 1a. Collect all changed files this sprint

```bash
git log sprint-6 --name-only --pretty=format: | sort -u | grep -v '^$'
```

#### 1b. Check CLAUDE.md for drift

Read `.claude/CLAUDE.md`. Cross-reference against the files changed this sprint. Ask:
- Are any new services, hooks, or stores now missing from the Folder Structure section?
- Are any new tech stack dependencies missing from the Tech Stack table?
- Are any prohibitions being violated by the new code?

If yes: update CLAUDE.md accordingly.

#### 1c. Check rules/ for new patterns

Read the changed files. Ask:
- Did this sprint establish any new coding patterns not covered by the 4 rules files?
- Example: if Edge Functions were added, is the Deno import pattern documented?

If yes: add the pattern to the relevant rules file.

#### 1d. Regenerate context_map.md

Invoke the context-map skill:
```
/context-map
```

#### 1e. Check registry for coverage gaps

Read `.claude/registry/keywords.yaml`. Were any tasks planned that fell back to `quality/bugfix` because no keywords matched? If yes, add the actual keywords used to the relevant domain.

#### 1f. Open maintenance PR if anything changed

```bash
git add .claude/
git commit -m "chore(engine): sprint-N end — update CLAUDE.md, rules, context_map, registry"
gh pr create \
  --title "chore(engine): sprint-N end review" \
  --body "Automated sprint-end maintenance: CLAUDE.md drift fixes, rules updates, context_map regeneration, registry improvements." \
  --base main \
  --label "maintenance"
gh pr merge --squash --auto
```

### Pass 2: Workflow Retrospective

#### 2a. Start retrospective log

```bash
python scripts/workflow_log.py retro-start <sprint-number>
```

#### 2b. Calculate metrics from sprint_progress.json and workflow_log.md

Read `.claude/state/sprint_progress.json`:
- `done_count` = tasks with status `done`
- `skipped_count` = tasks with status `skipped`
- `total_count` = total tasks
- `blocker_rate` = skipped_count / total_count

Read `.claude/state/workflow_log.md` for this sprint:
- Count lines containing `TIER:senior` or `TIER:lead` → `escalation_count`
- Count lines containing `Preflight failed` → `preflight_failures`
- Count `⚠` lines (retries) → `retry_count`

#### 2c. Evaluate against thresholds

Read `.claude/registry/review-rules.yaml` for `retrospective` thresholds.

**Blocker rate > 20%:**
Find which domains had blockers. For each:
- Append to workflow_log.md: `⚠ Domain <domain> had <N> blockers — consider adding skills/agents`
- Create follow-up task in next sprint's `sprint_progress.json`:
  ```json
  {"id": "sN-registry-<domain-slug>", "title": "Improve tooling for <domain> — high blocker rate", "status": "pending", "domain": "engine/claude-config"}
  ```

**Escalation rate > 50%:**
For domains with high escalation:
- Append: `⚠ Domain <domain> escalated <N>/<total> times — consider senior-first`
- Update `review-rules.yaml`: move domain to `always_senior` if not already there.
- Commit: `chore(engine): promote <domain> to senior-first review`

**Preflight avg failures > 2:**
- Append: `⚠ High preflight failure rate — consider pre-flight lint script for affected domains`

**Keyword misses (tasks that defaulted to quality/bugfix unexpectedly):**
- Read workflow_log.md for tasks tagged `quality/bugfix` that don't look like bug fixes
- For each: add the actual request keywords to `keywords.yaml` under the correct domain
- Commit: `chore(engine): add keyword mappings from sprint-N misses`

**Hook/script errors:**
- Search workflow_log.md for `workflow_log error` or script failure lines
- For each: create a follow-up `engine/claude-config` task

#### 2d. Finalize retrospective

Append summary to workflow_log.md:
```
Sprint complete ✓
Actions taken: <list all registry updates, threshold changes, follow-up tasks>
Next sprint: <sprint number + 1>
```

#### 2e. Update sprint pointer

Update `.claude/state/sprint_progress.json`:
```json
{
  "sprint": <N+1>,
  "sprint_name": "TBD — set when next sprint is planned",
  "tasks": []
}
```

Commit:
```bash
git add .claude/state/ .claude/registry/
git commit -m "chore(engine): sprint-N retrospective — advance pointer to sprint-N+1"
```

#### 2f. Sync workflow log

```bash
python scripts/workflow_log.py sync
```

Output: "Sprint N review complete. Registry updated. Next sprint ready."
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sprint-review/
git commit -m "feat(engine): add sprint-review skill — drift check + workflow retrospective"
```

---

## Task 4: Verify all 3 skills appear in Claude Code

- [ ] **Step 1: Check skill list**

After committing, the next Claude Code response should show `plan-sprint`, `run-sprint`, and `sprint-review` in the available skills system-reminder. If they don't appear, open `/hooks` to trigger a config reload.

- [ ] **Step 2: Test plan-sprint with a dry request**

```
/plan-sprint add a warmth score badge to GromadaCard
```

Expected: Claude reads sprint_progress.json, runs plan_sprint.py, prints planned tasks, immediately invokes run-sprint.

- [ ] **Step 3: Final push**

```bash
git push origin sprint-6
```
