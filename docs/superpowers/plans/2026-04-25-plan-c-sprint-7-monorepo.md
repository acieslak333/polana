# Sprint 7 — Monorepo Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-package Expo project into a pnpm workspace monorepo with three packages — `app` (React Native), `supabase` (Edge Functions + migrations), and `shared` (types + utils) — without breaking any existing functionality.

**Architecture:** pnpm workspaces + Turborepo for parallel builds. `packages/shared` is the only cross-package dependency. `packages/app` imports `@polana/shared`. `packages/supabase` Edge Functions import from `@polana/shared` via a Deno-compatible path. TypeScript project references connect the packages at compile time.

**Tech Stack:** pnpm 9+, Turborepo, TypeScript project references, ESLint + Prettier (new in this sprint), `supabase gen types typescript` for DB type generation.

---

## Prerequisites

- [ ] Sprint 6 merged to `main` and tagged `sprint-6-done`
- [ ] Docker Desktop installed (needed for Sprint 8 — install now to unblock)
- [ ] Node.js 20+ (`node --version`)
- [ ] pnpm not yet installed — this plan installs it

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `pnpm-workspace.yaml` | pnpm workspace config |
| Create | `package.json` (root) | Workspace root with Turborepo scripts |
| Create | `turbo.json` | Turborepo pipeline config |
| Create | `tsconfig.base.json` | Strict TS base config inherited by all packages |
| Create | `.eslintrc.base.js` | Shared ESLint config |
| Create | `.prettierrc` | Shared Prettier config |
| Create | `packages/shared/package.json` | `@polana/shared` package |
| Create | `packages/shared/tsconfig.json` | Extends base |
| Move | `utils/` → `packages/shared/src/utils/` | Shared utilities |
| Create | `packages/shared/src/types/database.ts` | Generated Supabase types |
| Create | `packages/shared/src/index.ts` | Public API barrel |
| Create | `packages/app/package.json` | `@polana/app` package |
| Move | all current source → `packages/app/` | App package |
| Create | `packages/supabase/package.json` | `@polana/supabase` package |
| Move | `supabase/` → `packages/supabase/` | Supabase package |

---

## Task 1: Install pnpm and verify environment

- [ ] **Step 1: Create sprint-7 branch**

```bash
git checkout main && git pull
git checkout -b sprint-7
```

- [ ] **Step 2: Install pnpm globally**

```bash
npm install -g pnpm@9
pnpm --version
```

Expected: `9.x.x`

- [ ] **Step 3: Install Turborepo**

```bash
pnpm add -g turbo
turbo --version
```

Expected: `2.x.x`

---

## Task 2: Create workspace root configuration

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.prettierrc`

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "polana",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "jsx": "react-native"
  }
}
```

- [ ] **Step 5: Create `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 6: Commit root config**

```bash
git add pnpm-workspace.yaml package.json turbo.json tsconfig.base.json .prettierrc
git commit -m "chore(monorepo): add workspace root — pnpm, Turborepo, tsconfig.base, prettier"
```

---

## Task 3: Create `packages/shared`

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/utils/validation.ts` (moved from `utils/`)
- Create: `packages/shared/src/utils/dates.ts` (moved from `utils/`)
- Create: `packages/shared/src/utils/geo.ts` (moved from `utils/`)
- Create: `packages/shared/src/types/database.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s7/shared-package
```

- [ ] **Step 2: Create `packages/shared/package.json`**

```json
{
  "name": "@polana/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "echo 'shared has no build step'"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Move utils to shared**

```bash
mkdir -p packages/shared/src/utils packages/shared/src/types
cp utils/validation.ts packages/shared/src/utils/validation.ts
cp utils/dates.ts packages/shared/src/utils/dates.ts
cp utils/geo.ts packages/shared/src/utils/geo.ts
```

Remove the now-duplicated files from the app later (Task 5 — after updating imports).

- [ ] **Step 5: Generate Supabase types into `packages/shared/src/types/database.ts`**

If Supabase CLI is installed:
```bash
supabase gen types typescript --project-id <your-project-id> > packages/shared/src/types/database.ts
```

If not yet (Sprint 8 sets up CLI), create a placeholder:

```typescript
// packages/shared/src/types/database.ts
// Generated by: supabase gen types typescript --project-id <id>
// Regenerate when schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          bio: string | null
          avatar_config: Json | null
          push_token: string | null
          onboarding_completed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      // Add other tables as needed — full types generated in Sprint 8
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
```

- [ ] **Step 6: Create `packages/shared/src/index.ts`**

```typescript
// Utils
export * from './utils/validation'
export * from './utils/dates'
export * from './utils/geo'

// Types
export type { Database, Json } from './types/database'
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat(monorepo): add @polana/shared package — utils + database types"
```

---

## Task 4: Create `packages/supabase`

**Files:**
- Create: `packages/supabase/package.json`
- Move: `supabase/` → `packages/supabase/supabase/`

- [ ] **Step 1: Create `packages/supabase/package.json`**

```json
{
  "name": "@polana/supabase",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "start": "supabase start",
    "stop": "supabase stop",
    "status": "supabase status",
    "reset": "supabase db reset",
    "gen-types": "supabase gen types typescript --local > ../shared/src/types/database.ts"
  }
}
```

- [ ] **Step 2: Move supabase/ into packages/supabase/**

```bash
mkdir -p packages/supabase
cp -r supabase/ packages/supabase/supabase/
```

Verify the structure:
```
packages/supabase/
  package.json
  supabase/
    migrations/
    functions/
    config.toml (if present)
```

Note: Leave the original `supabase/` in place until all CI scripts are updated in a later step.

- [ ] **Step 3: Commit**

```bash
git add packages/supabase/
git commit -m "feat(monorepo): add @polana/supabase package — migrations + Edge Functions"
```

---

## Task 5: Move app source to `packages/app`

This is the largest task. Move all current app source into `packages/app/`, update `package.json`, and fix all import paths from `utils/` to `@polana/shared`.

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s7/app-package
```

- [ ] **Step 2: Create `packages/app/package.json`**

```json
{
  "name": "@polana/app",
  "version": "0.0.1",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "build:preview": "eas build --profile preview",
    "build:production": "eas build --profile production"
  },
  "dependencies": {
    "@polana/shared": "workspace:*"
  }
}
```

The full `dependencies` block comes from the existing root `package.json` — copy all Expo/RN deps there. The key addition is `"@polana/shared": "workspace:*"`.

- [ ] **Step 3: Move source directories into `packages/app/`**

```bash
mkdir -p packages/app
# Move source directories
mv app packages/app/app
mv components packages/app/components
mv constants packages/app/constants
mv hooks packages/app/hooks
mv services packages/app/services
mv stores packages/app/stores
mv utils packages/app/utils
mv i18n packages/app/i18n
# Move config files
mv tsconfig.json packages/app/tsconfig.json
mv babel.config.js packages/app/babel.config.js
mv app.json packages/app/app.json
mv eas.json packages/app/eas.json
mv .env.example packages/app/.env.example
```

- [ ] **Step 4: Create `packages/app/tsconfig.json`**

Replace the moved tsconfig with one that extends base and references shared:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@polana/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["app", "components", "constants", "hooks", "services", "stores", "utils", "i18n"],
  "references": [{ "path": "../shared" }]
}
```

- [ ] **Step 5: Update imports from `utils/` to `@polana/shared`**

Find all imports of the moved utilities:

```bash
cd packages/app
npx rg "from '.*utils/validation'" --type ts
npx rg "from '.*utils/dates'" --type ts
npx rg "from '.*utils/geo'" --type ts
```

Replace each import. Example:

```typescript
// Before:
import { validateEmail } from '../../utils/validation'

// After:
import { validateEmail } from '@polana/shared'
```

Run the replacement across all files:

```bash
npx rg -l "from '.*utils/validation'" --type ts | xargs sed -i "s|from '.*utils/validation'|from '@polana/shared'|g"
npx rg -l "from '.*utils/dates'" --type ts | xargs sed -i "s|from '.*utils/dates'|from '@polana/shared'|g"
npx rg -l "from '.*utils/geo'" --type ts | xargs sed -i "s|from '.*utils/geo'|from '@polana/shared'|g"
```

Note: On Windows Git Bash, `sed -i` works. On PowerShell, use:
```powershell
Get-ChildItem -Recurse -Filter *.ts | ForEach-Object { (Get-Content $_) -replace "from '.*utils/validation'", "from '@polana/shared'" | Set-Content $_ }
```

- [ ] **Step 6: Delete `packages/app/utils/validation.ts`, `dates.ts`, `geo.ts`**

These now live in `@polana/shared`. Keep `utils/nameGenerator.ts` — it's app-only.

```bash
rm packages/app/utils/validation.ts packages/app/utils/dates.ts packages/app/utils/geo.ts
```

- [ ] **Step 7: Install workspace dependencies**

From the repo root:

```bash
pnpm install
```

Expected: pnpm resolves `@polana/shared` from `packages/shared` via workspace protocol.

- [ ] **Step 8: Run TypeScript check**

```bash
cd packages/app && npx tsc --noEmit
```

Fix any import errors until: 0 errors.

- [ ] **Step 9: Verify Expo still starts**

```bash
cd packages/app && pnpm start
```

Expected: Metro bundler starts, QR code shown. Press `w` to verify web bundle compiles.

- [ ] **Step 10: Commit**

```bash
cd ../..
git add packages/app/ packages/shared/
git commit -m "feat(monorepo): move app source to packages/app, wire @polana/shared imports"
```

- [ ] **Step 11: Merge to sprint-7**

```bash
git checkout sprint-7
git merge --no-ff s7/app-package
git branch -d s7/app-package
```

---

## Task 6: Add ESLint

**Files:**
- Create: `packages/app/.eslintrc.js`
- Create: `.eslintrc.base.js` (root)

- [ ] **Step 1: Install ESLint in app package**

```bash
cd packages/app
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native
```

- [ ] **Step 2: Create root `.eslintrc.base.js`**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

- [ ] **Step 3: Create `packages/app/.eslintrc.js`**

```javascript
module.exports = {
  extends: ['../../.eslintrc.base.js'],
  plugins: ['react-native'],
  rules: {
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'warn',
  },
  env: { 'react-native/react-native': true },
}
```

- [ ] **Step 4: Run lint and fix issues**

```bash
cd packages/app && pnpm lint
```

Fix all `error` level issues. `warn` level issues can be addressed over time.

- [ ] **Step 5: Update preflight skill to include lint**

Edit `.claude/skills/preflight/SKILL.md` — add lint step after TypeScript check:

```markdown
2. Run ESLint from packages/app:
   ```bash
   cd packages/app && pnpm lint
   ```
   - Errors block commit. Warnings are logged but do not block.
```

- [ ] **Step 6: Commit**

```bash
git add .eslintrc.base.js packages/app/.eslintrc.js .claude/skills/preflight/SKILL.md
git commit -m "chore(monorepo): add ESLint config — TS strict + react-native rules, update preflight"
```

---

## Task 7: Remove original source directories from repo root

Once `packages/app` is verified working, clean up the old locations.

- [ ] **Step 1: Remove original directories**

```bash
# Only if packages/app is fully verified — do NOT do this before Step 7:9 above
rm -rf app components constants hooks services stores utils i18n supabase
```

- [ ] **Step 2: Remove original root configs that moved**

```bash
rm tsconfig.json babel.config.js app.json
```

Keep at root: `eas.json` if it's still referenced by EAS CLI from root (check `eas.json` path — EAS looks for it relative to the project root by default). Update `eas.json` to point to `packages/app` if needed.

- [ ] **Step 3: Verify repo is clean**

```bash
git status
npx tsc --noEmit  # from packages/app/
```

- [ ] **Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore(monorepo): remove original source dirs now that packages/ is canonical"
```

---

## Task 8: Update Sprint Engine for monorepo

**Files:**
- Modify: `.claude/context_map.md`
- Modify: `.claude/state/sprint_progress.json`
- Modify: `.claude/SPRINTS.md`

- [ ] **Step 1: Regenerate context map**

```
/context-map
```

The context map now uses `packages/app/app/`, `packages/app/components/`, etc.

- [ ] **Step 2: Update sprint_progress.json for Sprint 7 completion**

Set all Sprint 7 tasks to `done`.

- [ ] **Step 3: Merge sprint-7 → main**

```bash
git checkout main
git merge --no-ff sprint-7
git tag sprint-7-done
git push origin main --tags
```

- [ ] **Step 4: Mark Sprint 7 done in SPRINTS.md**

Add Sprint 7 section to `.claude/SPRINTS.md`:

```markdown
## ✅ Sprint 7 — Monorepo Refactoring (DONE)

**Goal:** Clean package boundaries for future web dashboard and API layer.

- ✅ pnpm workspace root (pnpm-workspace.yaml, turbo.json)
- ✅ packages/shared — @polana/shared with utils + DB types
- ✅ packages/app — @polana/app with all RN source
- ✅ packages/supabase — migrations + Edge Functions
- ✅ ESLint + Prettier configured
- ✅ TypeScript project references
- ✅ context_map.md regenerated for monorepo paths
```
