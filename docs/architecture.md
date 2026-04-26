# Polana — Architecture

## Data Flow

```
Screen (app/)
  ↓  renders data from
Hook (hooks/)
  ↓  calls
API Client (services/api/)
  ↓  queries
Supabase (PostgreSQL + RLS)
```

Screens own **UI state** only (loading spinners, form inputs, modals).  
Hooks own **server state** (data arrays, pagination, optimistic updates).  
API services are **thin query wrappers** — no business logic.

## Directory Guide

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo Router screens — file = route |
| `components/` | Reusable UI components (no data fetching) |
| `hooks/` | Data-fetching hooks with local state |
| `services/api/` | Supabase query functions |
| `services/supabase.ts` | Singleton Supabase client |
| `stores/` | Global Zustand state (auth, preferences, cache) |
| `packages/db-types/` | Shared TypeScript types for all DB tables |
| `constants/` | Theme tokens, config, static data |
| `utils/` | Pure functions (dates, geo, routing, validation) |
| `i18n/` | Translation files — PL (primary), EN, UK |
| `supabase/migrations/` | SQL migrations (source of truth for schema) |
| `supabase/functions/` | Deno Edge Functions (cron jobs, notifications) |
| `__tests__/` | Shared test helpers |
| `__mocks__/` | Jest module mocks |
| `__fixtures__/` | Test data factory functions |

## Types

All DB row types live in `packages/db-types/src/`:
- `tables.ts` — one interface per DB table
- `enums.ts` — all enum/union types matching DB CHECK constraints

Services import from `@polana/db-types` and re-export for backward compatibility:
```ts
import type { GromadaRow } from '@polana/db-types';
export type { GromadaRow };
```

Callers import from the service (not the package directly):
```ts
import type { GromadaRow } from '@/services/api/gromady';
```

## Adding a New Feature

1. Add migration in `supabase/migrations/NNN_feature.sql`
2. Add types to `packages/db-types/src/tables.ts`
3. Add query functions to `services/api/feature.ts`
4. Write a hook in `hooks/useFeature.ts`
5. Build screens in `app/(app)/...`
6. Write tests: `services/api/__tests__/feature.test.ts`, `hooks/__tests__/useFeature.test.ts`

## Security Model

All data access goes through Supabase RLS policies — the policies ARE the security layer.  
The service role key is only used in Edge Functions, never in the app bundle.  
User tokens are stored in `expo-secure-store`, never AsyncStorage.

## Branch Strategy

```
main                 ← always deployable, protected by branch_guard.py
  └── sprint-N       ← sprint integration branch
        └── sN/task  ← one branch per task
```

To push a sprint branch to main (no gh CLI needed):
```bash
git checkout sprint-N
git push origin sprint-N:main
```
