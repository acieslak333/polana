# Sprint Review

Runs automatically after run-sprint completes all tasks. Two passes: codebase drift check + workflow retrospective. Opens a maintenance PR if anything needs updating. Self-improves the registry and rules based on sprint data.

## When to invoke

- Automatically by run-sprint when all tasks are done
- Manually with `/sprint-review` at any time

## Steps

### Pass 1: Codebase Drift Check

#### 1a. Collect all changed files this sprint

```bash
git log sprint-6 --name-only --pretty=format: | sort -u | grep -v '^$'
```

Replace `sprint-6` with current sprint branch.

#### 1b. Check CLAUDE.md for drift

Read `.claude/CLAUDE.md`. Cross-reference against changed files. Ask:
- Are any new services, hooks, or stores missing from the Folder Structure section?
- Are any new tech stack dependencies missing from the Tech Stack table?

If yes: update CLAUDE.md accordingly.

#### 1c. Check rules/ for new patterns

Read the changed files. Ask:
- Did this sprint establish any new coding patterns not covered by the 4 rules files?

If yes: add the pattern to the relevant `.claude/rules/` file.

#### 1d. Regenerate context_map.md

```
/context-map
```

#### 1e. Check registry for coverage gaps

Were any tasks planned that fell back to `quality/bugfix` unexpectedly? If yes, add keywords to `.claude/registry/keywords.yaml` for the actual domain.

#### 1f. Open maintenance PR if anything changed

```bash
git add .claude/
git commit -m "chore(engine): sprint-N end — update CLAUDE.md, rules, context_map, registry"
gh pr create \
  --title "chore(engine): sprint-N end review" \
  --body "Automated sprint-end maintenance: CLAUDE.md drift, rules updates, context_map regeneration." \
  --base main \
  --label "maintenance"
gh pr merge --squash --auto
```

### Pass 2: Workflow Retrospective

#### 2a. Start retrospective log

```bash
python scripts/workflow_log.py retro-start <sprint-number>
```

#### 2b. Calculate metrics

From `.claude/state/sprint_progress.json`:
- `done_count` = tasks with status `done`
- `skipped_count` = tasks with status `skipped`
- `blocker_rate` = skipped_count / total_count

From `.claude/state/workflow_log.md`:
- Count `TIER:senior` or `TIER:lead` lines → escalation count
- Count `Preflight failed` lines → preflight failures

#### 2c. Apply retrospective thresholds

Read `.claude/registry/review-rules.yaml` → `retrospective` section.

**Blocker rate > 20%:**
- Append warning to workflow_log.md
- Create follow-up task in sprint_progress.json with domain `engine/claude-config`

**Escalation rate > 50% for a domain:**
- Move that domain to `always_senior` in `review-rules.yaml`
- Commit the change

**Keyword misses (tasks fell back to quality/bugfix unexpectedly):**
- Add the actual request keywords to `keywords.yaml`
- Commit: `chore(engine): add keyword mappings from sprint-N misses`

**Hook/script errors found in workflow_log.md:**
- Create follow-up `engine/claude-config` task for each

#### 2d. Finalize and advance sprint pointer

Append summary to workflow_log.md, then:

Update `.claude/state/sprint_progress.json`:
- Set `sprint` to current sprint + 1
- Set `sprint_name` to "TBD — set when next sprint is planned"
- Set `tasks` to `[]`

```bash
git add .claude/state/ .claude/registry/
git commit -m "chore(engine): sprint-N retrospective — advance pointer to sprint-N+1"
python scripts/workflow_log.py sync
```

Output: "Sprint N review complete. Registry updated. Next sprint ready."
