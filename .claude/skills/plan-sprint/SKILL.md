# Plan Sprint

Triggered when the user asks to add a feature, fix something, or implement anything not already in the current sprint. Runs autonomously — no user discussion unless the request is completely ambiguous.

## When to invoke

- User says "add X", "implement Y", "build Z", "fix X"
- User describes a feature that doesn't map to any pending task
- Do NOT invoke if the request maps to an existing pending task — just start that task

## Steps

### 1. Check for ambiguity

Read the user's request. If it maps to zero domains (you genuinely cannot tell what kind of work this is), ask ONE clarifying question:
> "Is this frontend, backend, database, infrastructure, or something else?"

Then proceed immediately with their answer. Do not ask follow-up questions.

If the request is clear enough to guess a domain, proceed without asking.

### 2. Run plan_sprint.py

```bash
python scripts/plan_sprint.py "<user request verbatim>"
```

Read the output. It lists the planned tasks with their domains and review tiers.

### 3. Log the planning event

```bash
python scripts/workflow_log.py append "📋 Planned sprint tasks for: <user request>"
```

### 4. Commit sprint_progress.json

```bash
git add .claude/state/sprint_progress.json
git commit -m "chore(engine): plan sprint — <user request summary in 5 words>"
```

### 5. Report to user

Output:
```
Planned N task(s):
1. [<task-id>] <domain> — <review tier>
2. ...

Starting execution now. I'll update workflow_log.md as I go.
Check GitHub for PRs. You'll get a push notification if anything blocks.
```

### 6. Immediately invoke run-sprint

Do not wait for user confirmation. Invoke the run-sprint skill now.
