"""
PreToolUse hook — blocks direct git pushes to main.
Called by Claude Code hook before any Bash tool call containing 'git push'.

Reads current branch via git. Exits 1 (blocking) if branch is 'main'.
Outputs JSON for Claude Code hook system.

Usage (called automatically by hook, or manually):
  python scripts/branch_guard.py

To merge a sprint branch into main without gh CLI:
  git checkout sprint-N
  git push origin sprint-N:main    # guard only checks local branch, not push target
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

sys.exit(0)
