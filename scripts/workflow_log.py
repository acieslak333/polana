"""
Manages .claude/state/workflow_log.md — append entries and sync to git.

Usage:
  python scripts/workflow_log.py append "▶ Starting s6-ts-fixes [quality/typescript]"
  python scripts/workflow_log.py append-task-start <task-id> <domain> <agent> <branch>
  python scripts/workflow_log.py append-task-done <task-id> <pr-number>
  python scripts/workflow_log.py append-blocker <task-id> <reason>
  python scripts/workflow_log.py retro-start <sprint-number>
  python scripts/workflow_log.py sync

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
