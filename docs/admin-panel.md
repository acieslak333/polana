# Polana Admin Panel — Retool Setup

## Overview

The admin panel uses Retool connected to the Supabase database.  
Non-technical admins (city managers, support) use it without touching code.

## Setup Steps

### 1. Create a Retool workspace

1. Sign up at retool.com (free tier covers this use case)
2. Create a new app: "Polana Admin"

### 2. Connect Supabase

In Retool → Resources → New Resource → PostgreSQL:

| Field | Value |
|-------|-------|
| Host | `<your-project>.supabase.co` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres` |
| Password | Your Supabase DB password |
| SSL | Required |

> Use the **read-only** user for query components.  
> For mutations (ban user, hide content) call Edge Functions via HTTP Resource instead.

### 3. HTTP Resource (for mutations)

In Retool → Resources → New Resource → REST API:

| Field | Value |
|-------|-------|
| Base URL | `https://<your-project>.supabase.co/functions/v1` |
| Header: Authorization | `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |
| Header: Content-Type | `application/json` |

### 4. Admin Panel Pages

Build these four pages in the Retool app:

---

#### Page 1: Content Editor

Tables: `interests`, `name_adjectives`, `name_animals`, `name_suffixes`, `cities`

```sql
-- Interests list
SELECT id, name_pl, name_en, emoji, category, is_default FROM interests ORDER BY category, name_pl;
```

Add inline edit + delete buttons. Add a form to insert new rows.

---

#### Page 2: Moderation Queue

```sql
SELECT
  r.id, r.reason, r.status, r.created_at,
  p.content AS post_content,
  c.content AS comment_content,
  g.name AS gromada_name
FROM reports r
LEFT JOIN posts p ON r.post_id = p.id
LEFT JOIN comments c ON r.comment_id = c.id
LEFT JOIN gromady g ON p.gromada_id = g.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC
LIMIT 50;
```

Actions:
- "Hide content" → POST to `/resolve-report` Edge Function with `{ reportId, action: "hide" }`
- "Dismiss" → POST to `/resolve-report` with `{ reportId, action: "dismiss" }`

---

#### Page 3: User Lookup

```sql
-- Search by email (via auth.users join)
SELECT
  p.id, p.first_name, p.nickname, p.is_banned, p.created_at,
  u.email,
  COUNT(DISTINCT gm.gromada_id) AS gromada_count
FROM profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN gromada_members gm ON gm.user_id = p.id
WHERE u.email ILIKE '%' || {{ searchInput.value }} || '%'
GROUP BY p.id, u.email
LIMIT 20;
```

Actions:
- "Ban user" → POST to `/ban-user` Edge Function with `{ userId, banned: true }`
- "Unban" → same with `{ banned: false }`

---

#### Page 4: Logs Viewer

```sql
SELECT function_name, event, user_id, duration_ms, success, error_msg, created_at
FROM app_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 200;
```

Optional: add a `function_name` filter dropdown.

---

### 5. Access Control

In Retool → Settings → Permissions:
- Create group "city-admin" — read-only access to all pages
- Create group "super-admin" — full access including ban/unban

Never share the Supabase service role key — it lives only in the HTTP Resource config.
