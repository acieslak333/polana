# Supabase + Security Rules

These rules apply whenever writing or modifying services, hooks, or migration files.

1. Import Supabase client ONLY from `services/supabase.ts` — never create a second client
2. Tokens stored in `expo-secure-store` ONLY — never `AsyncStorage`, never `localStorage`
3. Every new table in migrations MUST have a corresponding RLS policy in `002_rls_policies.sql` or a new migration file
4. Never disable RLS on a table (`ALTER TABLE x DISABLE ROW LEVEL SECURITY`)
5. Edge Functions must validate the `Authorization` header before any DB operation
6. Rate-limit sensitive Edge Functions (login, register, send-notification) — use a counter in the DB or an external service
7. User-generated content must be sanitised before saving — strip HTML tags, truncate to column length
8. Never log JWT tokens, passwords, or push tokens — log only user IDs
9. Supabase Storage bucket policies must be set to private — never public buckets for user content
10. Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is only used in Edge Functions — never in the app bundle
