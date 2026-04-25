# Preflight

Run before any git commit to verify type safety. Use `/preflight` before committing.

## Steps

1. Run TypeScript check from the project root:
   ```bash
   ./node_modules/.bin/tsc --noEmit
   ```

2. If exit code is 0:
   - Output: "✓ TypeScript — no errors"
   - Proceed: "Preflight passed. Safe to commit."

3. If exit code is non-zero:
   - Output the full error list grouped by file
   - Output: "✗ Preflight FAILED — fix TypeScript errors before committing"
   - Do NOT commit
   - Fix errors one file at a time, re-run preflight after each fix

4. After preflight passes, remind to update sprint state:
   - "Run /mark-done <task-id> if this commit completes a sprint task"
