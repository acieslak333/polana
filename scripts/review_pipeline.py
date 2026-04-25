"""
Determines the review tier for a PR and signals which agent to dispatch.
After review passes, applies the 'review-approved' label via gh CLI.

Usage:
  python scripts/review_pipeline.py <pr-number> <domain> <files-changed> <lines-changed>
  python scripts/review_pipeline.py <pr-number> <domain> <files-changed> <lines-changed> --apply-label

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
