# Mark Done

Update `sprint_progress.json` after completing a sprint task. Use `/mark-done <task-id>`.

## Steps

1. Read `.claude/state/sprint_progress.json`

2. Find the task with `id` matching the argument (e.g., `s6-edge-generate-events`)
   - If not found → output: "Task <id> not found. Valid IDs: <list all ids>"
   - If already `done` → output: "Task <id> is already marked done"

3. Update the task:
   - Set `status` → `"done"`
   - Set top-level `last_completed_task` → `"<task-id>"`
   - Set top-level `last_updated` → current ISO timestamp

4. Write the updated JSON back to `.claude/state/sprint_progress.json`

5. Also update `.claude/SPRINTS.md`: find the matching task line and change `[ ]` → `[x]`

6. Commit both files:
   ```bash
   git add .claude/state/sprint_progress.json .claude/SPRINTS.md
   git commit -m "chore(engine): mark <task-id> done"
   ```

7. Output remaining pending task count:
   "Task done ✓ — X tasks remaining in Sprint N"

8. Suggest next task: "Next up: [<next-pending-id>] <title>"
