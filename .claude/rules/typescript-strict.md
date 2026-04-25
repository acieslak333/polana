# TypeScript Strict Rules

These rules apply whenever writing or modifying any `.ts` or `.tsx` file.

1. TypeScript everywhere — no `.js` files in `app/`, `components/`, `services/`, `hooks/`, `stores/`, `utils/`
2. No `any` — use `unknown` and narrow, or define a proper type
3. Type assertions (`as X`) require an inline comment explaining why it is safe
4. No `// @ts-ignore` or `// @ts-nocheck` — fix the type error instead
5. Strict null checks are on — never assume a value is non-null without a guard
6. Async functions must have `try/catch` — surface errors, never swallow them
7. User-facing error messages in Polish — internal errors can be English
8. No barrel re-exports (`index.ts` that re-exports everything) — import directly
9. Enums use `const enum` for tree-shaking
10. API response shapes must have explicit types — no implicit `any` from `supabase.from()`
11. All Zustand store slices must be typed with explicit interfaces
12. Hook return types must be explicitly annotated
13. Edge Function handlers must type their `req` as `Request` and their response body
