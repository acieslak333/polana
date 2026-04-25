# Context Map

Generate or update `.claude/context_map.md` — a one-liner index of every key file in the codebase. Run with `/context-map` at the end of a sprint or after adding significant new files.

## Steps

1. Walk these directories and collect all `.tsx`, `.ts` files (exclude `node_modules`, `.expo`, `dist`):
   - `app/` — screens and layouts
   - `components/` — UI components
   - `services/` — API and auth services
   - `hooks/` — custom hooks
   - `stores/` — Zustand stores
   - `utils/` — utility functions
   - `constants/` — theme, config, mindfulTexts
   - `supabase/functions/` — Edge Functions

2. For each file, write one line:
   ```
   <relative-path>  —  <one-sentence description of what the file does>
   ```

3. Group by directory. Write the output to `.claude/context_map.md`:
   ```markdown
   # Context Map
   _Generated <date>. Run `/context-map` to regenerate._

   ## App Screens
   app/_layout.tsx  —  Root layout: session hydration, auth state listener
   ...

   ## Components
   components/ui/Button.tsx  —  4 variants (primary/secondary/ghost/destructive), loading state
   ...

   ## Services
   services/supabase.ts  —  Singleton Supabase client with SecureStore adapter
   ...
   ```

4. Commit the updated context map:
   ```bash
   git add .claude/context_map.md
   git commit -m "chore(engine): regenerate context_map.md"
   ```
