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

    blocker_pct = f"{skipped/total:.0%}" if total else "0%"
    blocker_flag = "⚠ exceeds 20% threshold" if total and skipped/total > 0.20 else "✓"

    lines = [
        "",
        "---",
        "",
        f"## Sprint {sprint_num} Complete — {now}",
        "",
        f"Branch: {sprint_branch} → merged to main",
        f"Tasks: {done}/{total} completed, {skipped} skipped",
        "",
        f"## Retrospective — Sprint {sprint_num}",
        "",
        f"**Blocker rate:** {skipped}/{total} ({blocker_pct} {blocker_flag})",
        "**Escalation rate:** _fill in from workflow_log_",
        "**Preflight avg failures:** _fill in_",
        "**Keyword misses:** _fill in_",
        "**Hook/script errors:** _fill in_",
        "",
        "**Actions taken:**",
        "_→ list any registry updates, threshold changes, or follow-up tasks created_",
        "",
    ]

    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Sprint {sprint_num} completion logged to workflow_log.md")
    print(f"  Tasks: {done}/{total} done, {skipped} skipped")


if __name__ == "__main__":
    main()
