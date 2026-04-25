# GitHub Actions + Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up 3 GitHub Actions workflows and 3 Claude Code hooks that enforce CI gates, trigger auto-merge, and keep workflow_log.md updated automatically without any manual steps.

**Architecture:** GitHub Actions handles CI enforcement (tsc + lint) and auto-merge via the `review-approved` label. Claude Code hooks handle local log updates (PostToolUse on Write/Edit), log sync on session end (Stop), and direct-main-push blocking (PreToolUse on Bash). All hooks are non-blocking except branch_guard.

**Tech Stack:** GitHub Actions (yaml), gh CLI, Python (workflow_log.py, branch_guard.py already written in Plan F), Claude Code settings.json hooks.

**Prerequisite:** Plans E, F, G must be complete. `gh auth status` must show authenticated.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `.github/workflows/ci.yml` | TypeScript + lint on every task/sprint branch push |
| Create | `.github/workflows/auto-merge.yml` | Auto-merge when CI green + review-approved label |
| Create | `.github/workflows/sprint-end.yml` | Sprint completion log when sprint-N/ merges to main |
| Modify | `.claude/settings.json` | Add 3 hooks: PostToolUse log, Stop sync, PreToolUse branch guard |

---

## Task 1: Create `.github/workflows/ci.yml`

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches:
      - 'sprint-*'
      - 's*/**'
  pull_request:
    branches:
      - 'sprint-*'
      - main

jobs:
  typecheck:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: ./node_modules/.bin/tsc --noEmit

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    # Only run lint if eslint config exists — Sprint 7 adds it
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check for ESLint config
        id: check_eslint
        run: |
          if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
            echo "has_eslint=true" >> $GITHUB_OUTPUT
          else
            echo "has_eslint=false" >> $GITHUB_OUTPUT
          fi

      - name: ESLint
        if: steps.check_eslint.outputs.has_eslint == 'true'
        run: ./node_modules/.bin/eslint . --ext .ts,.tsx --max-warnings 0

      - name: ESLint skip notice
        if: steps.check_eslint.outputs.has_eslint == 'false'
        run: echo "ESLint config not found — skipping (added in Sprint 7)"
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('CI YAML valid')"
```

Expected: `CI YAML valid`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(infra): add ci.yml — TypeScript + ESLint on sprint/task branches"
```

---

## Task 2: Create `.github/workflows/auto-merge.yml`

**Files:**
- Create: `.github/workflows/auto-merge.yml`

- [ ] **Step 1: Create the file**

```yaml
name: Auto Merge

on:
  # Fires when a label is added to a PR (e.g. review-approved)
  pull_request:
    types: [labeled]

  # Also fires when CI completes, in case label was added before CI finished
  workflow_run:
    workflows: [CI]
    types: [completed]

jobs:
  auto-merge:
    name: Merge if approved + CI green
    runs-on: ubuntu-latest
    # Only run on PRs targeting sprint-* or main
    if: |
      github.event_name == 'pull_request' ||
      github.event.workflow_run.conclusion == 'success'

    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Find open PR for this branch
        id: find_pr
        if: github.event_name == 'workflow_run'
        run: |
          BRANCH="${{ github.event.workflow_run.head_branch }}"
          PR=$(gh pr list --head "$BRANCH" --json number,labels --jq '.[0]')
          echo "pr_number=$(echo $PR | jq -r '.number // empty')" >> $GITHUB_OUTPUT
          echo "labels=$(echo $PR | jq -r '[.labels[].name] | join(",")')" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Check conditions and merge (workflow_run trigger)
        if: |
          github.event_name == 'workflow_run' &&
          steps.find_pr.outputs.pr_number != '' &&
          contains(steps.find_pr.outputs.labels, 'review-approved')
        run: |
          gh pr merge ${{ steps.find_pr.outputs.pr_number }} \
            --squash \
            --delete-branch \
            --subject "$(gh pr view ${{ steps.find_pr.outputs.pr_number }} --json title --jq '.title')"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Check CI status and merge (label trigger)
        if: |
          github.event_name == 'pull_request' &&
          github.event.label.name == 'review-approved'
        run: |
          PR="${{ github.event.pull_request.number }}"
          # Wait for CI to finish (max 5 minutes)
          for i in $(seq 1 10); do
            STATUS=$(gh pr checks $PR --json state --jq '.[].state' | sort -u)
            if echo "$STATUS" | grep -q "FAILURE\|ERROR"; then
              echo "CI failed — not merging PR #$PR"
              exit 0
            fi
            if ! echo "$STATUS" | grep -q "PENDING\|IN_PROGRESS"; then
              echo "CI green — merging PR #$PR"
              gh pr merge $PR --squash --delete-branch
              exit 0
            fi
            echo "CI still running... waiting 30s (attempt $i/10)"
            sleep 30
          done
          echo "Timeout waiting for CI — not merging"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Validate YAML syntax**

```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/auto-merge.yml')); print('auto-merge YAML valid')"
```

Expected: `auto-merge YAML valid`

- [ ] **Step 3: Create the `review-approved` label in GitHub**

```bash
gh label create "review-approved" --color "0075ca" --description "Review passed — safe to auto-merge" 2>/dev/null || echo "Label already exists"
gh label create "needs-human" --color "e4e669" --description "Blocked — requires human intervention" 2>/dev/null || echo "Label already exists"
gh label create "maintenance" --color "bfd4f2" --description "Sprint-end engine maintenance PR" 2>/dev/null || echo "Label already exists"
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/auto-merge.yml
git commit -m "feat(infra): add auto-merge.yml — squash merge when CI green + review-approved"
```

---

## Task 3: Create `.github/workflows/sprint-end.yml`

**Files:**
- Create: `.github/workflows/sprint-end.yml`

- [ ] **Step 1: Create the file**

```yaml
name: Sprint End

on:
  push:
    branches:
      - main

jobs:
  detect-sprint-merge:
    name: Detect and log sprint completion
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 10  # Need history to detect merge commit

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install pyyaml
        run: pip install pyyaml

      - name: Detect sprint branch merge
        id: detect
        run: |
          # Check if the last merge commit came from a sprint-* branch
          MERGE_MSG=$(git log -1 --merges --pretty=format:%s 2>/dev/null || echo "")
          SPRINT_BRANCH=$(echo "$MERGE_MSG" | grep -oP 'sprint-\d+' | head -1 || echo "")
          echo "sprint_branch=$SPRINT_BRANCH" >> $GITHUB_OUTPUT
          echo "detected=$( [ -n "$SPRINT_BRANCH" ] && echo 'true' || echo 'false' )" >> $GITHUB_OUTPUT

      - name: Log sprint completion
        if: steps.detect.outputs.detected == 'true'
        run: |
          python scripts/sprint_end_log.py "${{ steps.detect.outputs.sprint_branch }}"

      - name: Commit sprint end log
        if: steps.detect.outputs.detected == 'true'
        run: |
          git config user.email "action@github.com"
          git config user.name "GitHub Actions"
          git add .claude/state/workflow_log.md || true
          git diff --cached --quiet || git commit -m "chore(engine): log sprint-end for ${{ steps.detect.outputs.sprint_branch }}"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Validate YAML syntax**

```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/sprint-end.yml')); print('sprint-end YAML valid')"
```

Expected: `sprint-end YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/sprint-end.yml
git commit -m "feat(infra): add sprint-end.yml — log sprint completion when sprint-N merges to main"
```

---

## Task 4: Add 3 hooks to `.claude/settings.json`

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Read current settings.json**

Read `.claude/settings.json` to see what's already there before modifying.

- [ ] **Step 2: Add hooks — merge with existing content**

The final `.claude/settings.json` must contain:

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "Glob(*)",
      "Grep(*)"
    ],
    "defaultMode": "acceptEdits"
  },
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "code-simplifier@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true,
    "skill-creator@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "supabase@claude-plugins-official": true,
    "commit-commands@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "pbakaus@impeccable": true
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path // .tool_response.filePath // empty' | { read -r f; [ -n \"$f\" ] && python scripts/workflow_log.py append \"Edited: $f\"; } 2>/dev/null || true",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python scripts/workflow_log.py sync 2>/dev/null || true",
            "async": true
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git push*)",
            "command": "python scripts/branch_guard.py",
            "shell": "bash"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Validate JSON syntax**

```bash
python -c "import json; json.load(open('.claude/settings.json')); print('settings.json valid JSON')"
```

Expected: `settings.json valid JSON`

- [ ] **Step 4: Validate hook schema with jq**

```bash
jq '.hooks | keys' .claude/settings.json
```

Expected: `["PostToolUse", "PreToolUse", "Stop"]`

- [ ] **Step 5: Pipe-test the PostToolUse hook command**

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"app/(app)/(feed)/index.tsx"}}' | \
  jq -r '.tool_input.file_path // .tool_response.filePath // empty' | \
  { read -r f; [ -n "$f" ] && echo "Would log: Edited: $f" || echo "No file path found"; }
```

Expected: `Would log: Edited: app/(app)/(feed)/index.tsx`

- [ ] **Step 6: Pipe-test the Stop hook command**

```bash
echo '{}' | python scripts/workflow_log.py sync 2>/dev/null && echo "sync OK"
```

Expected: `sync OK` (or nothing if no log changes to commit)

- [ ] **Step 7: Pipe-test the branch_guard hook**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git push origin sprint-6"}}' | python scripts/branch_guard.py
echo "Exit: $?"
```

Expected (on sprint-6 branch): `Exit: 0`

- [ ] **Step 8: Commit settings.json**

```bash
git add .claude/settings.json
git commit -m "feat(engine): add 3 hooks — PostToolUse log, Stop sync, PreToolUse branch guard"
```

---

## Task 5: End-to-end verification

- [ ] **Step 1: Verify all 3 GitHub Actions workflows exist**

```bash
ls .github/workflows/
```

Expected: `auto-merge.yml  ci.yml  sprint-end.yml`

- [ ] **Step 2: Verify all 3 YAML files are valid**

```bash
python -c "
import yaml
for f in ['ci', 'auto-merge', 'sprint-end']:
    yaml.safe_load(open(f'.github/workflows/{f}.yml'))
    print(f'{f}.yml ✓')
print('All workflows valid')
"
```

Expected:
```
ci.yml ✓
auto-merge.yml ✓
sprint-end.yml ✓
All workflows valid
```

- [ ] **Step 3: Verify hooks in settings.json**

```bash
jq '.hooks | to_entries | map("\(.key): \(.value | length) hook group(s)") | .[]' .claude/settings.json
```

Expected:
```
"PostToolUse: 1 hook group(s)"
"Stop: 1 hook group(s)"
"PreToolUse: 1 hook group(s)"
```

- [ ] **Step 4: Verify GitHub labels exist**

```bash
gh label list | grep -E "review-approved|needs-human|maintenance"
```

Expected: 3 lines with the label names and colours.

- [ ] **Step 5: Push everything to sprint-6**

```bash
git push origin sprint-6
```

- [ ] **Step 6: Verify CI runs on GitHub**

```bash
gh run list --branch sprint-6 --limit 3
```

Expected: at least one CI run with status `completed` or `in_progress`.

- [ ] **Step 7: Final summary commit**

```bash
git add -A
git status  # should be clean
```

If clean: all done. If not, commit remaining files:

```bash
git commit -m "chore(engine): finalize autonomous workflow — GitHub Actions + hooks complete"
git push origin sprint-6
```
