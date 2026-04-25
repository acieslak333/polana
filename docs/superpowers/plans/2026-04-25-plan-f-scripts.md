# Workflow Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 5 Python scripts and 1 bash script that power the autonomous workflow — sprint planning, review dispatch, log management, branch protection, sprint completion, and push notifications.

**Architecture:** Each script has exactly one responsibility and is callable from the command line. All scripts read/write `.claude/state/` and `.claude/registry/`. The `gh` CLI is used for GitHub operations. Scripts are called by the workflow skills and GitHub Actions hooks.

**Tech Stack:** Python 3.11+, pyyaml, gh CLI, git CLI, bash.

**Prerequisite:** Plan E (task registry) must be complete. Run `python scripts/validate_registry.py` before starting.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `scripts/plan_sprint.py` | Reads registry, detects domains, generates task JSON with tooling |
| Create | `scripts/review_pipeline.py` | Determines review tier, dispatches agent signal, applies GitHub label |
| Create | `scripts/workflow_log.py` | Appends timestamped entries + syncs log to git |
| Create | `scripts/branch_guard.py` | Blocks direct pushes to `main` |
| Create | `scripts/sprint_end_log.py` | Records sprint completion + retrospective scaffold to workflow_log.md |
| Create | `scripts/notify_blocker.sh` | Calls send-notification Edge Function on task blocker |

---

## Task 1: `scripts/plan_sprint.py`

**Files:**
- Create: `scripts/plan_sprint.py`

- [ ] **Step 1: Create the file**

```python
"""
Generates sprint tasks from a user request string using the task registry.

Usage:
  python scripts/plan_sprint.py "add push notifications to gromada events"

Reads:
  .claude/registry/keywords.yaml    — detect domains from request text
  .claude/registry/task-types.yaml  — load tooling per domain
  .claude/state/sprint_progress.json — get current sprint number + append tasks

Writes:
  .claude/state/sprint_progress.json — new tasks with tooling blocks appended

Output:
  Prints planned tasks to stdout (one per line).
  Exit 0 on success, exit 1 on error.
"""
import yaml, json, sys, re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).parent.parent
REGISTRY = ROOT / ".claude/registry"
STATE = ROOT / ".claude/state"


def load_registry():
    task_types = yaml.safe_load((REGISTRY / "task-types.yaml").read_text(encoding="utf-8"))
    keywords = yaml.safe_load((REGISTRY / "keywords.yaml").read_text(encoding="utf-8"))
    return task_types["domains"], keywords["mappings"]


def detect_domains(request: str, keyword_map: dict) -> list[str]:
    """Return list of domain IDs whose keywords appear in the request (case-insensitive)."""
    request_lower = request.lower()
    matched = []
    for domain, kws in keyword_map.items():
        if any(str(kw).lower() in request_lower for kw in kws):
            matched.append(domain)
    # De-duplicate, preserve order
    seen = set()
    result = []
    for d in matched:
        if d not in seen:
            seen.add(d)
            result.append(d)
    return result or ["quality/bugfix"]  # default if nothing matches


def build_tasks(domains: list[str], domain_map: dict, sprint: int, request: str) -> list[dict]:
    tasks = []
    for i, domain in enumerate(domains):
        if domain not in domain_map:
            continue
        cfg = domain_map[domain]
        slug = re.sub(r"[^a-z0-9-]", "-", domain.replace("/", "-"))
        task_id = f"s{sprint}-{slug}"
        if i > 0:
            task_id += f"-{i}"
        tasks.append({
            "id": task_id,
            "title": f"{cfg['description']} — {request}",
            "status": "pending",
            "domain": domain,
            "request": request,
            "tooling": {
                "skills": cfg.get("skills", []),
                "agents": cfg.get("agents", []),
                "plugins": cfg.get("plugins", []),
                "rules": cfg.get("rules", []),
                "review": cfg.get("review", "karpathy-first"),
                "branch": f"s{sprint}/{slug}"
            }
        })
    return tasks


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/plan_sprint.py \"your request here\"")
        sys.exit(1)

    request = " ".join(sys.argv[1:])
    progress_path = STATE / "sprint_progress.json"

    if not progress_path.exists():
        print(f"Error: {progress_path} not found. Run sprint-init first.")
        sys.exit(1)

    progress = json.loads(progress_path.read_text(encoding="utf-8"))
    sprint = progress["sprint"]
    domain_map, keyword_map = load_registry()
    domains = detect_domains(request, keyword_map)
    new_tasks = build_tasks(domains, domain_map, sprint, request)

    progress["tasks"].extend(new_tasks)
    progress["last_updated"] = datetime.now(timezone.utc).isoformat()
    progress_path.write_text(json.dumps(progress, indent=2, ensure_ascii=False))

    print(f"Planned {len(new_tasks)} task(s) for: {request}")
    print(f"Detected domains: {', '.join(domains)}")
    for t in new_tasks:
        print(f"  [{t['id']}] {t['domain']} — review: {t['tooling']['review']}")
        print(f"    skills: {', '.join(t['tooling']['skills'][:3])}{'...' if len(t['tooling']['skills']) > 3 else ''}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test with a sample request**

```bash
python scripts/plan_sprint.py "add push notifications to gromada events"
```

Expected output (exact domains may vary):
```
Planned 2 task(s) for: add push notifications to gromada events
Detected domains: backend/edge-functions, frontend/ux-interactions
  [s6-backend-edge-functions] backend/edge-functions — review: senior-first
    skills: supabase:supabase, supabase:supabase-postgres-best-practices, security-review...
  [s6-frontend-ux-interactions-1] frontend/ux-interactions — review: karpathy-first
    skills: frontend-design:frontend-design, senior-frontend, superpowers:systematic-debugging...
```

- [ ] **Step 3: Test default fallback (no keyword match)**

```bash
python scripts/plan_sprint.py "fix that weird thing that broke"
```

Expected:
```
Planned 1 task(s) for: fix that weird thing that broke
Detected domains: quality/bugfix
  [s6-quality-bugfix] quality/bugfix — review: karpathy-first
```

- [ ] **Step 4: Commit**

```bash
git add scripts/plan_sprint.py
git commit -m "feat(engine): add plan_sprint.py — domain detection + task generation from registry"
```

---

## Task 2: `scripts/review_pipeline.py`

**Files:**
- Create: `scripts/review_pipeline.py`

- [ ] **Step 1: Create the file**

```python
"""
Determines the review tier for a PR and signals which agent to dispatch.
After review passes, applies the 'review-approved' label via gh CLI.

Usage:
  python scripts/review_pipeline.py <pr-number> <domain> <files-changed> <lines-changed>

Arguments:
  pr-number     GitHub PR number (e.g. 42)
  domain        Task domain from registry (e.g. backend/edge-functions)
  files-changed Number of files changed in the PR
  lines-changed Number of lines changed in the PR

Output (stdout):
  TIER:<tier>           — one of: karpathy | senior | lead
  AGENT:<agent-name>    — agent to dispatch
  After review: applies 'review-approved' label if --apply-label flag is passed.

Exit 0: tier determined. Exit 1: error.
"""
import yaml, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
REGISTRY = ROOT / ".claude/registry"


def load_rules() -> dict:
    return yaml.safe_load((REGISTRY / "review-rules.yaml").read_text(encoding="utf-8"))


def get_tier(domain: str, files_changed: int, lines_changed: int, rules: dict) -> str:
    if domain in rules.get("always_lead", []):
        return "lead"
    if domain in rules.get("always_senior", []):
        return "senior"
    t = rules["thresholds"]
    if files_changed > t["files_changed"] or lines_changed > t["lines_changed"]:
        return "senior"
    return "karpathy"


TIER_TO_AGENT = {
    "karpathy": "cs-karpathy-reviewer",
    "senior": "cs-senior-engineer",
    "lead": "cs-engineering-lead",
}


def apply_label(pr: str, label: str) -> bool:
    result = subprocess.run(
        ["gh", "pr", "edit", pr, "--add-label", label],
        capture_output=True, text=True
    )
    return result.returncode == 0


def main():
    apply_label_flag = "--apply-label" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]

    if len(args) < 4:
        print("Usage: python scripts/review_pipeline.py <pr> <domain> <files> <lines> [--apply-label]")
        sys.exit(1)

    pr, domain, files_changed, lines_changed = args[0], args[1], int(args[2]), int(args[3])
    rules = load_rules()
    tier = get_tier(domain, files_changed, lines_changed, rules)
    agent = TIER_TO_AGENT[tier]

    print(f"TIER:{tier}")
    print(f"AGENT:{agent}")
    print(f"DOMAIN:{domain}")
    print(f"FILES:{files_changed} LINES:{lines_changed}")

    if apply_label_flag:
        success = apply_label(pr, "review-approved")
        if success:
            print(f"LABEL:review-approved applied to PR #{pr}")
        else:
            print(f"ERROR: failed to apply label to PR #{pr}")
            sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test tier detection**

```bash
python scripts/review_pipeline.py 42 frontend/ui-components 3 150
```

Expected:
```
TIER:karpathy
AGENT:cs-karpathy-reviewer
DOMAIN:frontend/ui-components
FILES:3 LINES:150
```

- [ ] **Step 3: Test escalation by file count**

```bash
python scripts/review_pipeline.py 42 frontend/ui-components 8 400
```

Expected:
```
TIER:senior
AGENT:cs-senior-engineer
DOMAIN:frontend/ui-components
FILES:8 LINES:400
```

- [ ] **Step 4: Test always-lead domain**

```bash
python scripts/review_pipeline.py 42 database/rls-policies 1 10
```

Expected:
```
TIER:lead
AGENT:cs-engineering-lead
DOMAIN:database/rls-policies
FILES:1 LINES:10
```

- [ ] **Step 5: Commit**

```bash
git add scripts/review_pipeline.py
git commit -m "feat(engine): add review_pipeline.py — tier detection + gh label dispatch"
```

---

## Task 3: `scripts/workflow_log.py`

**Files:**
- Create: `scripts/workflow_log.py`

- [ ] **Step 1: Create the file**

```python
"""
Manages .claude/state/workflow_log.md — append entries and sync to git.

Usage:
  python scripts/workflow_log.py append "▶ Starting s6-ts-fixes [quality/typescript]"
  python scripts/workflow_log.py append-task-start <task-id> <domain> <agent> <branch>
  python scripts/workflow_log.py append-task-done <task-id> <pr-number>
  python scripts/workflow_log.py append-blocker <task-id> <reason>
  python scripts/workflow_log.py sync
  python scripts/workflow_log.py retro-start <sprint-number>

Exit 0 always (log errors are non-fatal).
"""
import sys, subprocess, json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
LOG = ROOT / ".claude/state/workflow_log.md"
STATE = ROOT / ".claude/state/sprint_progress.json"


def ts() -> str:
    return datetime.now().strftime("%H:%M")


def ensure_log():
    LOG.parent.mkdir(parents=True, exist_ok=True)
    if not LOG.exists():
        LOG.write_text("# Workflow Log\n\n", encoding="utf-8")


def append_raw(line: str):
    ensure_log()
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def append_sprint_header(sprint: int, name: str, date: str):
    append_raw(f"\n## Sprint {sprint} — {name} — {date}\n")


def cmd_append(args: list[str]):
    msg = " ".join(args)
    append_raw(f"{ts()} {msg}")


def cmd_append_task_start(args: list[str]):
    task_id, domain, agent, branch = args[0], args[1], args[2], args[3]
    append_raw(f"\n▶ {ts()} Starting {task_id} [{domain}]")
    append_raw(f"  Agent: {agent}")
    append_raw(f"  Branch: {branch}")


def cmd_append_task_done(args: list[str]):
    task_id, pr = args[0], args[1]
    append_raw(f"✓ {ts()} Done {task_id} — PR #{pr} merged")


def cmd_append_blocker(args: list[str]):
    task_id = args[0]
    reason = " ".join(args[1:]) if len(args) > 1 else "unknown"
    append_raw(f"❌ {ts()} BLOCKER: {task_id} — 3 retries exhausted")
    append_raw(f"  Reason: {reason}")
    append_raw(f"  → GitHub issue opened (needs-human)")
    append_raw(f"  → Push notification sent")
    append_raw(f"  → Skipping to next task")


def cmd_retro_start(args: list[str]):
    sprint = args[0] if args else "?"
    append_raw(f"\n## Retrospective — Sprint {sprint}\n")
    append_raw(f"_Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}_\n")
    # Load stats from sprint_progress.json
    if STATE.exists():
        progress = json.loads(STATE.read_text(encoding="utf-8"))
        tasks = progress.get("tasks", [])
        done = sum(1 for t in tasks if t["status"] == "done")
        skipped = sum(1 for t in tasks if t["status"] == "skipped")
        total = len(tasks)
        append_raw(f"Tasks completed: {done}/{total}")
        if total > 0:
            blocker_rate = skipped / total
            append_raw(f"Blocker rate: {skipped}/{total} ({blocker_rate:.0%})")
            if blocker_rate > 0.20:
                append_raw(f"⚠ Blocker rate exceeds 20% threshold — review affected domains")
    append_raw("")
    append_raw("_Fill in: escalation rate, preflight failures, keyword misses, hook errors_")


def cmd_sync():
    result = subprocess.run(
        ["git", "status", "--porcelain", str(LOG)],
        capture_output=True, text=True, cwd=ROOT
    )
    if result.stdout.strip():
        subprocess.run(["git", "add", str(LOG)], cwd=ROOT)
        subprocess.run(
            ["git", "commit", "-m", "chore(engine): sync workflow_log.md"],
            cwd=ROOT
        )


COMMANDS = {
    "append": cmd_append,
    "append-task-start": cmd_append_task_start,
    "append-task-done": cmd_append_task_done,
    "append-blocker": cmd_append_blocker,
    "retro-start": cmd_retro_start,
    "sync": lambda _: cmd_sync(),
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(f"Usage: python scripts/workflow_log.py <cmd> [args]")
        print(f"Commands: {', '.join(COMMANDS.keys())}")
        sys.exit(1)
    try:
        COMMANDS[sys.argv[1]](sys.argv[2:])
    except Exception as e:
        print(f"workflow_log error (non-fatal): {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test append**

```bash
python scripts/workflow_log.py append "▶ test entry"
cat .claude/state/workflow_log.md
```

Expected: file contains `▶ test entry` with timestamp.

- [ ] **Step 3: Test task-start format**

```bash
python scripts/workflow_log.py append-task-start s6-ts-fixes quality/typescript cs-karpathy-reviewer s6/ts-fixes
cat .claude/state/workflow_log.md
```

Expected: 3-line block with `▶`, `Agent:`, `Branch:`.

- [ ] **Step 4: Test blocker format**

```bash
python scripts/workflow_log.py append-blocker s6-crossovers "RPC function not found in schema"
cat .claude/state/workflow_log.md
```

Expected: 4-line block with `❌`, reason, issue, notification, skip lines.

- [ ] **Step 5: Commit**

```bash
git add scripts/workflow_log.py .claude/state/workflow_log.md
git commit -m "feat(engine): add workflow_log.py — structured log management with 6 commands"
```

---

## Task 4: `scripts/branch_guard.py`

**Files:**
- Create: `scripts/branch_guard.py`

- [ ] **Step 1: Create the file**

```python
"""
PreToolUse hook — blocks direct git pushes to main.
Called by Claude Code hook before any Bash tool call containing 'git push'.

Reads current branch via git. Exits 1 (blocking) if branch is 'main'.
Outputs JSON for Claude Code hook system.

Usage (called automatically by hook, or manually):
  python scripts/branch_guard.py
"""
import subprocess, sys, json
from pathlib import Path

ROOT = Path(__file__).parent.parent

result = subprocess.run(
    ["git", "branch", "--show-current"],
    capture_output=True, text=True, cwd=ROOT
)
branch = result.stdout.strip()

if branch == "main":
    output = {
        "decision": "block",
        "reason": (
            "Direct push to main is blocked by branch_guard.py. "
            "Use a sprint branch (sprint-N/) or task branch (sN/<task-id>). "
            "If you need to merge to main, use: gh pr merge --squash"
        )
    }
    print(json.dumps(output))
    sys.exit(1)

# Not on main — allow
sys.exit(0)
```

- [ ] **Step 2: Test on non-main branch**

```bash
git checkout sprint-6
python scripts/branch_guard.py
echo "Exit code: $?"
```

Expected: `Exit code: 0`

- [ ] **Step 3: Test on main (safe — doesn't actually push)**

```bash
git checkout main
python scripts/branch_guard.py
echo "Exit code: $?"
git checkout sprint-6
```

Expected: JSON with `"decision": "block"` printed, `Exit code: 1`

- [ ] **Step 4: Commit**

```bash
git checkout sprint-6
git add scripts/branch_guard.py
git commit -m "feat(engine): add branch_guard.py — blocks direct pushes to main"
```

---

## Task 5: `scripts/sprint_end_log.py`

**Files:**
- Create: `scripts/sprint_end_log.py`

- [ ] **Step 1: Create the file**

```python
"""
Called by GitHub Actions sprint-end.yml when sprint-N/ merges to main.
Records sprint completion and starts the retrospective scaffold in workflow_log.md.

Usage:
  python scripts/sprint_end_log.py sprint-6

Writes:
  .claude/state/workflow_log.md — sprint completion entry + retrospective scaffold
"""
import sys, json, subprocess
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).parent.parent
LOG = ROOT / ".claude/state/workflow_log.md"
STATE = ROOT / ".claude/state/sprint_progress.json"


def main():
    sprint_branch = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    sprint_num = sprint_branch.replace("sprint-", "")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    progress = {}
    if STATE.exists():
        progress = json.loads(STATE.read_text(encoding="utf-8"))

    tasks = progress.get("tasks", [])
    done = sum(1 for t in tasks if t["status"] == "done")
    skipped = sum(1 for t in tasks if t["status"] == "skipped")
    total = len(tasks)

    lines = [
        f"\n---\n",
        f"## Sprint {sprint_num} Complete — {now}",
        f"",
        f"Branch: {sprint_branch} → merged to main",
        f"Tasks: {done}/{total} completed, {skipped} skipped",
        f"",
        f"## Retrospective — Sprint {sprint_num}",
        f"",
        f"**Blocker rate:** {skipped}/{total} ({skipped/total:.0%} {'⚠ exceeds 20% threshold' if total and skipped/total > 0.20 else '✓'})",
        f"**Escalation rate:** _fill in from workflow_log_",
        f"**Preflight avg failures:** _fill in_",
        f"**Keyword misses:** _fill in_",
        f"**Hook/script errors:** _fill in_",
        f"",
        f"**Actions taken:**",
        f"_→ list any registry updates, threshold changes, or follow-up tasks created_",
        f"",
    ]

    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Sprint {sprint_num} completion logged to workflow_log.md")
    print(f"  Tasks: {done}/{total} done, {skipped} skipped")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Test the script**

```bash
python scripts/sprint_end_log.py sprint-6
tail -30 .claude/state/workflow_log.md
```

Expected: sprint completion block + retrospective scaffold at end of file.

- [ ] **Step 3: Commit**

```bash
git add scripts/sprint_end_log.py
git commit -m "feat(engine): add sprint_end_log.py — sprint completion + retro scaffold"
```

---

## Task 6: `scripts/notify_blocker.sh`

**Files:**
- Create: `scripts/notify_blocker.sh`

- [ ] **Step 1: Create the file**

```bash
#!/usr/bin/env bash
# Sends a push notification via the send-notification Edge Function.
# Called when a task hits 3 retries and is being skipped.
#
# Usage: ./scripts/notify_blocker.sh <task-id> <reason>
# Requires: SUPABASE_URL and SUPABASE_ANON_KEY in environment (from .env.local)

set -e

TASK_ID="${1:-unknown-task}"
REASON="${2:-blocker detected}"

# Load env vars if .env.local exists
if [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Warning: SUPABASE_URL or ANON_KEY not set — skipping push notification"
  exit 0
fi

PAYLOAD=$(cat <<EOF
{
  "userId": "$(git config user.email 2>/dev/null || echo 'unknown')",
  "title": "🚨 Blocker: $TASK_ID",
  "body": "$REASON — skipped after 3 retries. Check GitHub issues.",
  "data": {
    "type": "blocker",
    "taskId": "$TASK_ID"
  }
}
EOF
)

curl -s -X POST \
  "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/send-notification" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --max-time 10 \
  || echo "Warning: push notification failed (non-fatal)"

echo "Blocker notification sent for $TASK_ID"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/notify_blocker.sh
```

- [ ] **Step 3: Test dry run (no real notification without running Supabase)**

```bash
./scripts/notify_blocker.sh s6-ts-fixes "TypeScript errors not fixable after 3 retries"
```

Expected: `Warning: SUPABASE_URL or ANON_KEY not set — skipping push notification` (if no .env.local) or `Blocker notification sent for s6-ts-fixes` (if Supabase is running).

- [ ] **Step 4: Commit all scripts**

```bash
git add scripts/notify_blocker.sh
git commit -m "feat(engine): add notify_blocker.sh — push notification on task blocker"
```

---

## Task 7: Verify all scripts work together

- [ ] **Step 1: Full integration test**

```bash
# 1. Validate registry
python scripts/validate_registry.py

# 2. Plan a sprint from a request
python scripts/plan_sprint.py "add crossover notifications when a gromada accepts"

# 3. Check review tier for a sample PR
python scripts/review_pipeline.py 1 backend/edge-functions 3 120

# 4. Log a task start
python scripts/workflow_log.py append-task-start s6-test-task backend/edge-functions cs-senior-engineer s6/test-task

# 5. Log task done
python scripts/workflow_log.py append-task-done s6-test-task 99

# 6. Log sprint end
python scripts/sprint_end_log.py sprint-6

# 7. View the log
cat .claude/state/workflow_log.md
```

Expected: each command exits 0. `workflow_log.md` contains all entries in order.

- [ ] **Step 2: Final commit**

```bash
git add .claude/state/
git commit -m "chore(engine): workflow_log.md updated by integration test"
```
