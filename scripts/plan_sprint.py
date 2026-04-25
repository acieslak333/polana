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
    progress_path.write_text(json.dumps(progress, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Planned {len(new_tasks)} task(s) for: {request}")
    print(f"Detected domains: {', '.join(domains)}")
    for t in new_tasks:
        print(f"  [{t['id']}] {t['domain']} — review: {t['tooling']['review']}")
        skills_preview = ', '.join(t['tooling']['skills'][:3])
        if len(t['tooling']['skills']) > 3:
            skills_preview += '...'
        print(f"    skills: {skills_preview}")


if __name__ == "__main__":
    main()
