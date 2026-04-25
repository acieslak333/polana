# Sprint Init

Run at the start of every session to check sprint status and session health. Also run manually with `/sprint-init` after a session reset.

## Steps

1. Read `.claude/state/sprint_progress.json`

2. Output a status block:
   ```
   Sprint N — <sprint_name>
   Started: <started>
   Last updated: <last_updated>
   Last completed: <last_completed_task or "none yet">

   Next 3 pending tasks:
   1. [<id>] <title> (<domain>)
   2. [<id>] <title> (<domain>)
   3. [<id>] <title> (<domain>)
   ```

3. Run: `git branch --show-current`
   - If output is `main` → warn: "You are on main. Create a sprint branch: git checkout -b sprint-N"
   - If output starts with `sprint-` → confirm: "On sprint branch ✓"
   - Any other branch → note it

4. Count tasks by status and report:
   ```
   Total: X tasks | Done: X | In progress: X | Pending: X
   ```

5. If any task has status `in_progress` → ask: "Task <id> is marked in_progress. Resume it, or mark it done first?"

6. If no tasks are `in_progress` and there are pending tasks → ask: "Which task do you want to work on? (List the next 3 pending tasks by id)"
