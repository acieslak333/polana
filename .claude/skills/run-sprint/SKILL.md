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
git checkout sprint-6
git pull
git checkout -b <tooling.branch>
```

Replace `sprint-6` with the current sprint branch name from `sprint_progress.json`.

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
- Read `.claude/context_map.md` before creating any new file to avoid duplicates
- Commit incrementally as you work (every significant file change)
- Commit message format: `feat(<domain-short>): <what you did>`

#### 2e. Run preflight

```bash
./node_modules/.bin/tsc --noEmit
```

**If it passes:** continue to 2f.

**If it fails (retry up to 3 times total):**
- Fix the TypeScript errors. Re-run.
- After 3 failed attempts:
  ```bash
  python scripts/workflow_log.py append-blocker <task-id> "TypeScript errors not resolvable"
  ./scripts/notify_blocker.sh <task-id> "TypeScript errors after 3 retries"
  gh issue create --title "BLOCKER: <task-id> — TS errors" --label "needs-human" --body "Task blocked after 3 preflight retries. Branch: <branch>"
  ```
  Mark task `skipped` in sprint_progress.json. Commit. Go to next task.

#### 2f. Push and open PR

```bash
git push -u origin <branch>
gh pr create \
  --title "feat(<domain-short>): <task title truncated to 60 chars>" \
  --body "Task: <task-id> | Domain: <domain> | Review: <tooling.review>" \
  --base sprint-6
```

Save the PR number from output.

#### 2g. Run review pipeline

```bash
FILES=$(git diff --name-only origin/sprint-6...HEAD | wc -l)
LINES=$(git diff --stat origin/sprint-6...HEAD | tail -1 | grep -oP '\d+(?= insertion)' || echo 0)
python scripts/review_pipeline.py <pr-number> <domain> $FILES $LINES
```

Read the `TIER:` and `AGENT:` lines from output.

Dispatch the listed agent as a subagent with:
> "Review PR #<pr-number> for task <task-id> (<domain>). Run: `gh pr diff <pr-number>`. Apply [Karpathy's 4 principles / architectural review / security review]. Output: PASS or FAIL with line-level feedback."

**If PASS:** apply label:
```bash
python scripts/review_pipeline.py <pr-number> <domain> $FILES $LINES --apply-label
```

**If FAIL:** fix issues, re-push, re-review. Max 3 review attempts. On 3rd failure: blocker flow (same as 2e blocker).

#### 2h. Wait for CI and auto-merge

```bash
gh pr checks <pr-number> --watch --interval 30
```

If CI green, `auto-merge.yml` triggers. Confirm merge:
```bash
gh pr view <pr-number> --json state --jq '.state'
```

If not `MERGED` after 90s, merge manually:
```bash
gh pr merge <pr-number> --squash --delete-branch
```

#### 2i. Mark done and continue

```bash
/mark-done <task-id>
python scripts/workflow_log.py append-task-done <task-id> <pr-number>
python scripts/workflow_log.py sync
git checkout sprint-6
git pull
```

Go to next pending task (back to 2a).

### 3. All tasks complete

```bash
python scripts/workflow_log.py sync
```

Output: "All tasks complete. Invoking sprint-review."

Invoke the sprint-review skill.
