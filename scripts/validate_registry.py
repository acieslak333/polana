"""
Validates the 3 registry YAML files for:
  1. Valid YAML syntax
  2. All domains in keywords.yaml exist in task-types.yaml
  3. All domains in review-rules.yaml exist in task-types.yaml
  4. All task-types have required fields: description, skills, agents, plugins, rules, review, escalate_if

Usage: python scripts/validate_registry.py
Exit 0: all valid. Exit 1: validation errors printed.
"""
import yaml, sys
from pathlib import Path

REGISTRY = Path(__file__).parent.parent / ".claude/registry"
REQUIRED_FIELDS = ["description", "skills", "agents", "plugins", "rules", "review", "escalate_if"]
VALID_REVIEW = {"karpathy-first", "senior-first", "lead-required"}

errors = []

def load(name):
    path = REGISTRY / name
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"YAML parse error in {name}: {e}")
        return None

task_types = load("task-types.yaml")
keywords = load("keywords.yaml")
review_rules = load("review-rules.yaml")

if any(d is None for d in [task_types, keywords, review_rules]):
    print("\n".join(errors))
    sys.exit(1)

domains = set(task_types.get("domains", {}).keys())

# Check all task-types have required fields
for domain, cfg in task_types["domains"].items():
    for field in REQUIRED_FIELDS:
        if field not in cfg:
            errors.append(f"task-types.yaml/{domain}: missing field '{field}'")
    if cfg.get("review") not in VALID_REVIEW:
        errors.append(f"task-types.yaml/{domain}: invalid review '{cfg.get('review')}' — must be one of {VALID_REVIEW}")

# Check keywords domains exist in task-types
for kw_domain in keywords.get("mappings", {}).keys():
    if kw_domain not in domains:
        errors.append(f"keywords.yaml: domain '{kw_domain}' not found in task-types.yaml")

# Check review-rules domains exist in task-types
for list_name in ["always_senior", "always_lead"]:
    for domain in review_rules.get(list_name, []):
        if domain not in domains:
            errors.append(f"review-rules.yaml/{list_name}: domain '{domain}' not found in task-types.yaml")

if errors:
    print("Registry validation FAILED:")
    for e in errors:
        print(f"  [FAIL] {e}")
    sys.exit(1)

print(f"Registry validation PASSED")
print(f"  [OK] {len(domains)} domains in task-types.yaml")
print(f"  [OK] {len(keywords['mappings'])} domains in keywords.yaml")
print(f"  [OK] All cross-references valid")
