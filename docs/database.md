# Polana — Database Architecture

## Connection

| Environment | URL | Pool |
|---|---|---|
| Development | `SUPABASE_DB_URL` (direct) | n/a |
| Edge Functions | `SUPABASE_DB_URL` (pooler) | PgBouncer transaction mode |
| Admin panel | Service role via Edge Functions only | — |

**Always use the pooler URL in Edge Functions** (`?pgbouncer=true`). Direct connections exhaust Postgres connection slots under load.

## Schema overview

22 tables across 7 domains:

| Domain | Tables |
|---|---|
| Identity | `profiles`, `user_interests` |
| Groups | `gromady`, `gromada_members`, `gromada_interests`, `gromada_allies` |
| Events | `events`, `event_rsvps` |
| Content | `posts`, `comments`, `reactions`, `reports` |
| Chat | `chat_rooms`, `messages`, `chat_mutes` |
| Social | `friendships`, `user_blocks` |
| System | `admin_users`, `audit_log`, `api_rate_limits`, `gromada_invites`, `app_logs` |
| Name gen | `name_adjectives`, `name_animals`, `name_suffixes` |

## Index strategy

Every foreign key column has a B-tree index (see `010_indexes.sql`). Additional indexes:

| Table | Index | Query served |
|---|---|---|
| `posts` | `(gromada_id, created_at DESC) WHERE is_hidden=false` | Chronological feed |
| `messages` | `(chat_room_id, created_at DESC)` | Chat pagination |
| `events` | `(city_id, starts_at) WHERE status='upcoming'` | Map/list view |
| `events` | `GIST(location_point)` | ST_DWithin radius query |
| `profiles` | `(is_banned) WHERE is_banned=true` | Admin ban lookup |
| `favor_requests` | `(expires_at) WHERE status='open'` | Expiry cron |

## Query timeout guards

Set these at session start in every Edge Function:

```typescript
await supabase.rpc('set_config', {
  setting: 'statement_timeout',
  value: '30000',   // 30 seconds
  is_local: true,
});
await supabase.rpc('set_config', {
  setting: 'lock_timeout',
  value: '10000',   // 10 seconds
  is_local: true,
});
```

Or use the raw Postgres connection:
```sql
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '10s';
```

## Warmth score

Stored in materialized view `gromada_warmth_scores`, refreshed hourly by pg_cron.

Formula: `(meetings_this_month × 3) + (favors_exchanged × 2) + member_count`

Tiers:
- **Cold** (0–9): ❄️ — no campfire
- **Kindling** (10–29): 🪵 — spark
- **Warm** (30–59): 🔥 — flame
- **Blazing** (60+): 🏕️ — campfire

`WarmthIndicator` queries this view. Do not read raw counter columns from `gromady` in the UI.

## pg_cron schedule

| Job | Schedule | What it does |
|---|---|---|
| `warmth-score-refresh` | Every hour | `REFRESH MATERIALIZED VIEW CONCURRENTLY gromada_warmth_scores` |
| `reset-meetings-monthly` | 1st of month 00:05 | Reset `meetings_this_month = 0` |
| `reset-meetings-weekly` | Monday 00:05 | Reset `meetings_this_week = 0` |
| `expire-favors` | Daily 01:00 | Mark open favors past `expires_at` as expired |
| `prune-rate-limits` | Every hour +5min | Delete `api_rate_limits` rows older than 2 hours |
| `dormant-check` | Sunday 02:00 | Set `status = 'dormant'` on inactive gromady |
| `audit-log-prune` | Daily 03:00 | Delete `audit_log` rows older than 90 days |
| `purge-logs` | Daily 04:00 | Delete `app_logs` rows older than 30 days |

Verify cron jobs: `SELECT * FROM cron.job;`
View job history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;`

## Growth projections

| Users | Expected rows | Critical tables | Action needed |
|---|---|---|---|
| 1,000 | <50k total | — | Current indexes sufficient |
| 10,000 | ~2M messages | messages | Monitor index bloat; vacuum weekly |
| 50,000 | ~20M messages | messages, posts | Consider partitioning messages by month |
| 100,000 | ~50M messages | messages | Partition messages by chat_room_id + month |

### Partitioning trigger

When `messages` exceeds 10M rows, partition by `created_at` month:

```sql
-- Step 1: create partitioned table
CREATE TABLE public.messages_new (LIKE public.messages INCLUDING ALL)
  PARTITION BY RANGE (created_at);

-- Step 2: create monthly partitions
CREATE TABLE public.messages_2026_01 PARTITION OF public.messages_new
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- etc.

-- Step 3: migrate data (pg_partman recommended for automation)
```

## EXPLAIN ANALYZE — top 5 queries

Run these on production quarterly to verify index usage:

```sql
-- 1. Feed query
EXPLAIN ANALYZE
SELECT p.*, pr.first_name, pr.nickname, pr.avatar_config
  FROM posts p
  JOIN profiles pr ON pr.id = p.author_id
 WHERE p.gromada_id IN (
   SELECT gromada_id FROM gromada_members WHERE user_id = '<user_id>'
 )
   AND p.is_hidden = false
 ORDER BY p.created_at DESC
 LIMIT 25;

-- 2. Chat pagination
EXPLAIN ANALYZE
SELECT m.*, p.first_name, p.nickname, p.avatar_config
  FROM messages m
  JOIN profiles p ON p.id = m.sender_id
 WHERE m.chat_room_id = '<room_id>'
 ORDER BY m.created_at DESC
 LIMIT 30;

-- 3. Nearby events
EXPLAIN ANALYZE
SELECT * FROM events
 WHERE status = 'upcoming'
   AND city_id = '<city_id>'
   AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(21.0, 52.2), 4326), 5000)
 ORDER BY starts_at;

-- 4. Gromada suggestions (onboarding)
EXPLAIN ANALYZE
SELECT g.*, COUNT(gi.interest_id) AS match_count
  FROM gromady g
  JOIN gromada_interests gi ON gi.gromada_id = g.id
 WHERE g.city_id = '<city_id>'
   AND g.status = 'active'
   AND g.member_count < g.max_members
   AND gi.interest_id = ANY(ARRAY['<id1>', '<id2>']::UUID[])
 GROUP BY g.id
 ORDER BY match_count DESC, g.member_count DESC
 LIMIT 3;

-- 5. Warmth scores for city
EXPLAIN ANALYZE
SELECT * FROM gromada_warmth_scores
 WHERE city_id = '<city_id>'
 ORDER BY warmth_score DESC;
```

All five should show `Index Scan` or `Bitmap Index Scan`, never `Seq Scan` on tables over 1,000 rows.
