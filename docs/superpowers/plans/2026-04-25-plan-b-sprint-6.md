# Sprint 6 — Auto-generation + Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Polana to beta-ready state — Edge Functions for self-sustaining events, Crossovers, Allies, User Calendar, Gromada Stats, MindfulText integration, Sentry, EAS build config.

**Architecture:** Edge Functions are Deno/TypeScript deployed to Supabase. All frontend tasks follow the existing pattern: service API → hook → screen/component. TypeScript strict mode is the quality gate — `npx tsc --noEmit` must pass after every task. No test framework is configured; manual verification steps are provided for each feature.

**Tech Stack:** Supabase Edge Functions (Deno), TypeScript strict, React Native, Expo Router, Zustand, Supabase JS client, Sentry React Native, Expo EAS.

---

## Prerequisites

- [ ] Sprint Engine (Plan A) complete — `sprint-init` reports Sprint 6 ready
- [ ] On branch `sprint-6`
- [ ] Read `.claude/rules/typescript-strict.md` and `.claude/rules/supabase-rls.md` before any backend task
- [ ] Read `.claude/rules/rn-native-only.md` and `.claude/rules/no-dark-patterns.md` before any frontend task

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `supabase/functions/generate-events/index.ts` | Daily event proposals for inactive Gromady |
| Create | `supabase/functions/expire-favors/index.ts` | Mark favors expired after 7 days |
| Create | `supabase/functions/dormant-check/index.ts` | Flag Gromady with no activity as dormant |
| Create | `supabase/functions/send-notification/index.ts` | Push notification sender |
| Create | `supabase/functions/_shared/supabase-admin.ts` | Shared admin client for Edge Functions |
| Create | `services/api/crossovers.ts` | Crossover proposal CRUD |
| Modify | `app/(app)/(gromady)/[id]/info.tsx` | Add crossovers, allies, warmth stats |
| Create | `app/(app)/(profile)/calendar.tsx` | User's RSVPd events calendar |
| Modify | `components/gromada/WarmthIndicator.tsx` | Visual warmth bar + campfire icon |
| Create | `services/sentry.ts` | Sentry error monitoring setup |
| Create | `eas.json` | EAS build profiles |

---

## Task 1: Shared Edge Function admin client

**Files:**
- Create: `supabase/functions/_shared/supabase-admin.ts`

This shared module is imported by all 3 Edge Functions to avoid duplication.

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s6/edge-functions
```

- [ ] **Step 2: Create `supabase/functions/_shared/supabase-admin.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
```

---

## Task 2: `generate-events` Edge Function

**Files:**
- Create: `supabase/functions/generate-events/index.ts`

Logic: Find Gromady with no upcoming events in the next 3 days → generate a suggestion based on their interests.

Interest → event type mapping:
- `hiking` / `cycling` / `running` → `outdoor`
- `coffee` / `cooking` / `food` → `food`  
- `music` / `film` / `books` → `cultural`
- `dogs` / `cats` / `animals` → `outdoor`
- `yoga` / `fitness` → `sport`
- Default → `meetup`

- [ ] **Step 1: Create `supabase/functions/generate-events/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

const INTEREST_TO_TYPE: Record<string, string> = {
  hiking: 'outdoor',
  cycling: 'outdoor',
  running: 'outdoor',
  dogs: 'outdoor',
  cats: 'outdoor',
  animals: 'outdoor',
  coffee: 'food',
  cooking: 'food',
  food: 'food',
  music: 'cultural',
  film: 'cultural',
  books: 'cultural',
  yoga: 'sport',
  fitness: 'sport',
}

const EVENT_TITLES: Record<string, string[]> = {
  outdoor: ['Spacer w parku', 'Rower po mieście', 'Wypad za miasto'],
  food: ['Wspólna kawa', 'Gotowanie razem', 'Lunch gromady'],
  cultural: ['Wieczór filmowy', 'Spotkanie przy książkach', 'Sesja muzyczna'],
  sport: ['Trening gromady', 'Joga w parku', 'Aktywny weekend'],
  meetup: ['Spotkanie gromady', 'Pogaduchy gromady', 'Zwykłe spotkanie'],
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find Gromady with no upcoming events in next 3 days
    const { data: gromadyWithEvents } = await supabase
      .from('events')
      .select('gromada_id')
      .gte('starts_at', now.toISOString())
      .lte('starts_at', threeDaysFromNow.toISOString())
      .not('gromada_id', 'is', null)

    const busyIds = new Set((gromadyWithEvents ?? []).map((e) => e.gromada_id))

    const { data: allGromady } = await supabase
      .from('gromady')
      .select('id, city_id')
      .eq('status', 'active')

    const idleGromady = (allGromady ?? []).filter((g) => !busyIds.has(g.id))

    const created: string[] = []

    for (const gromada of idleGromady) {
      // Get interests for this gromada
      const { data: interests } = await supabase
        .from('gromada_interests')
        .select('interests(name)')
        .eq('gromada_id', gromada.id)
        .limit(3)

      const interestNames = (interests ?? [])
        .map((i: { interests: { name: string } | null }) => i.interests?.name ?? '')
        .filter(Boolean)
        .map((n: string) => n.toLowerCase())

      const eventType =
        interestNames.map((n: string) => INTEREST_TO_TYPE[n]).find(Boolean) ?? 'meetup'

      const titles = EVENT_TITLES[eventType]
      const title = titles[Math.floor(Math.random() * titles.length)]

      // Schedule 2 days from now at 18:00
      const startsAt = new Date(now)
      startsAt.setDate(startsAt.getDate() + 2)
      startsAt.setHours(18, 0, 0, 0)

      const { error } = await supabase.from('events').insert({
        gromada_id: gromada.id,
        city_id: gromada.city_id,
        title,
        type: eventType,
        starts_at: startsAt.toISOString(),
        is_auto_generated: true,
        is_public: false,
        max_attendees: 20,
      })

      if (!error) created.push(gromada.id)
    }

    return new Response(
      JSON.stringify({ created: created.length, ids: created }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
})
```

- [ ] **Step 2: Verify locally (if Supabase CLI is available)**

```bash
supabase functions serve generate-events
curl -X POST http://localhost:54321/functions/v1/generate-events \
  -H "Authorization: Bearer <local-anon-key>"
```

Expected: `{"created": N, "ids": [...]}`

If Supabase CLI not yet configured (Sprint 8 sets that up), skip local test and note it.

---

## Task 3: `expire-favors` Edge Function

**Files:**
- Create: `supabase/functions/expire-favors/index.ts`

- [ ] **Step 1: Create `supabase/functions/expire-favors/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const supabase = createAdminClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('favor_requests')
      .update({ status: 'expired' })
      .eq('status', 'open')
      .lt('created_at', sevenDaysAgo)
      .select('id')

    if (error) throw error

    return new Response(
      JSON.stringify({ expired: data?.length ?? 0 }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Task 4: `dormant-check` Edge Function

**Files:**
- Create: `supabase/functions/dormant-check/index.ts`

A Gromada is dormant if it has had no posts AND no events in the last 30 days.

- [ ] **Step 1: Create `supabase/functions/dormant-check/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const supabase = createAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Gromady with a post in the last 30 days
    const { data: activeByPosts } = await supabase
      .from('posts')
      .select('gromada_id')
      .gte('created_at', thirtyDaysAgo)

    // Gromady with an event in the last 30 days
    const { data: activeByEvents } = await supabase
      .from('events')
      .select('gromada_id')
      .gte('starts_at', thirtyDaysAgo)
      .not('gromada_id', 'is', null)

    const activeIds = new Set([
      ...(activeByPosts ?? []).map((p) => p.gromada_id),
      ...(activeByEvents ?? []).map((e) => e.gromada_id),
    ])

    const { data: allActive } = await supabase
      .from('gromady')
      .select('id')
      .eq('status', 'active')

    const dormantIds = (allActive ?? [])
      .map((g) => g.id)
      .filter((id) => !activeIds.has(id))

    if (dormantIds.length === 0) {
      return new Response(
        JSON.stringify({ flagged: 0 }),
        { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from('gromady')
      .update({ status: 'dormant' })
      .in('id', dormantIds)

    if (error) throw error

    return new Response(
      JSON.stringify({ flagged: dormantIds.length, ids: dormantIds }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Task 5: `send-notification` Edge Function

**Files:**
- Create: `supabase/functions/send-notification/index.ts`

Called by other functions or from the app server-side to send push notifications via Expo's push API.

- [ ] **Step 1: Create `supabase/functions/send-notification/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

interface NotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const payload: NotificationPayload = await req.json()
    const { userId, title, body, data } = payload

    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single()

    if (error || !profile?.push_token) {
      return new Response(
        JSON.stringify({ sent: false, reason: 'no push token' }),
        { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      )
    }

    const message = {
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({ sent: true, result }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
})
```

---

## Task 6: Configure cron jobs in Supabase

**Files:**
- Create: `supabase/functions/generate-events/config.toml` (if using Supabase cron config)

Supabase cron is configured via the dashboard or `supabase/config.toml`. Add these schedules:

- [ ] **Step 1: Add cron config to `supabase/config.toml`** (create if missing)

```toml
[functions.generate-events]
verify_jwt = false
schedule = "0 18 * * *"  # Daily at 18:00 UTC

[functions.expire-favors]
verify_jwt = false
schedule = "0 3 * * *"   # Daily at 03:00 UTC

[functions.dormant-check]
verify_jwt = false
schedule = "0 2 * * 1"   # Every Monday at 02:00 UTC

[functions.send-notification]
verify_jwt = true
```

- [ ] **Step 2: Commit all Edge Functions**

```bash
git add supabase/functions/
git commit -m "feat(backend): add 4 Edge Functions — generate-events, expire-favors, dormant-check, send-notification"
```

- [ ] **Step 3: Mark task done**

```
/mark-done s6-edge-generate-events
/mark-done s6-edge-expire-favors
/mark-done s6-edge-dormant-check
/mark-done s6-edge-cron
```

- [ ] **Step 4: Merge to sprint-6**

```bash
git checkout sprint-6
git merge --no-ff s6/edge-functions
git branch -d s6/edge-functions
```

---

## Task 7: Crossovers API

**Files:**
- Create: `services/api/crossovers.ts`

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s6/crossovers
```

- [ ] **Step 2: Create `services/api/crossovers.ts`**

```typescript
import { supabase } from '../supabase'

export interface CrossoverProposal {
  id: string
  from_gromada_id: string
  to_gromada_id: string
  proposed_by: string
  title: string
  description: string | null
  status: 'proposed' | 'accepted' | 'happening' | 'completed' | 'rejected'
  vote_count: number
  created_at: string
}

export async function fetchCrossovers(gromadaId: string): Promise<CrossoverProposal[]> {
  const { data, error } = await supabase
    .from('crossover_proposals')
    .select('*')
    .or(`from_gromada_id.eq.${gromadaId},to_gromada_id.eq.${gromadaId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function proposeCrossover(params: {
  fromGromadaId: string
  toGromadaId: string
  title: string
  description?: string
}): Promise<CrossoverProposal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Musisz być zalogowany')

  const { data, error } = await supabase
    .from('crossover_proposals')
    .insert({
      from_gromada_id: params.fromGromadaId,
      to_gromada_id: params.toGromadaId,
      title: params.title,
      description: params.description ?? null,
      proposed_by: user.id,
      status: 'proposed',
      vote_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function voteCrossover(crossoverId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_crossover_votes', {
    crossover_id: crossoverId,
  })
  if (error) throw error
}

export async function updateCrossoverStatus(
  crossoverId: string,
  status: CrossoverProposal['status']
): Promise<void> {
  const { error } = await supabase
    .from('crossover_proposals')
    .update({ status })
    .eq('id', crossoverId)

  if (error) throw error
}
```

- [ ] **Step 3: Add `increment_crossover_votes` RPC to a new migration**

Create `supabase/migrations/005_crossover_votes_rpc.sql`:

```sql
CREATE OR REPLACE FUNCTION increment_crossover_votes(crossover_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE crossover_proposals
  SET vote_count = vote_count + 1
  WHERE id = crossover_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors in `services/api/crossovers.ts`.

- [ ] **Step 5: Commit**

```bash
git add services/api/crossovers.ts supabase/migrations/005_crossover_votes_rpc.sql
git commit -m "feat(backend): add crossovers API service + vote RPC migration"
```

---

## Task 8: Crossovers UI in Gromada info panel

**Files:**
- Modify: `app/(app)/(gromady)/[id]/info.tsx`

Add a "Crossovers" section below the existing stats. Shows active proposals + a "Propose Crossover" button (elder-only or any member).

- [ ] **Step 1: Add crossovers section to `app/(app)/(gromady)/[id]/info.tsx`**

Add these imports at the top:

```typescript
import { fetchCrossovers, voteCrossover, CrossoverProposal } from '../../../../services/api/crossovers'
```

Add state inside the component:

```typescript
const [crossovers, setCrossovers] = useState<CrossoverProposal[]>([])
const [crossoverLoading, setCrossoverLoading] = useState(false)
```

Add fetch in `useEffect` alongside existing data fetching:

```typescript
setCrossoverLoading(true)
fetchCrossovers(id as string)
  .then(setCrossovers)
  .catch(console.error)
  .finally(() => setCrossoverLoading(false))
```

Add crossovers section in the JSX (after existing stats):

```tsx
{/* Crossovers section */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('gromady:crossovers')}</Text>
  {crossoverLoading ? (
    <ActivityIndicator color={theme.colors.accent} />
  ) : crossovers.length === 0 ? (
    <MindfulText context="crossovers_empty" />
  ) : (
    crossovers.map((c) => (
      <View key={c.id} style={styles.crossoverCard}>
        <Text style={styles.crossoverTitle}>{c.title}</Text>
        <Text style={styles.crossoverStatus}>{c.status}</Text>
        <Pressable
          style={styles.voteButton}
          onPress={() => voteCrossover(c.id)}
          accessibilityLabel={t('gromady:vote_crossover')}
          accessibilityRole="button"
        >
          <Text style={styles.voteButtonText}>
            {t('gromady:support')} ({c.vote_count})
          </Text>
        </Pressable>
      </View>
    ))
  )}
</View>
```

Add i18n keys to `i18n/locales/pl/gromady.json`:
```json
{
  "crossovers": "Crossovery",
  "vote_crossover": "Zagłosuj na crossover",
  "support": "Wspieram",
  "crossovers_empty": "Brak propozycji crossoverów. Zaproponuj spotkanie z inną gromadą!"
}
```

Add i18n keys to `i18n/locales/en/gromady.json`:
```json
{
  "crossovers": "Crossovers",
  "vote_crossover": "Vote for crossover",
  "support": "Support",
  "crossovers_empty": "No crossover proposals yet. Suggest meeting another gromada!"
}
```

Add stylesheet entries:
```typescript
crossoverCard: {
  backgroundColor: theme.colors.backgroundCard,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  marginBottom: theme.spacing.sm,
  borderWidth: 1,
  borderColor: theme.colors.border,
},
crossoverTitle: {
  color: theme.colors.textPrimary,
  fontSize: theme.fontSize.body,
  fontWeight: '600',
},
crossoverStatus: {
  color: theme.colors.textSecondary,
  fontSize: theme.fontSize.sm,
  marginTop: theme.spacing.xs,
  textTransform: 'capitalize',
},
voteButton: {
  marginTop: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
  paddingHorizontal: theme.spacing.md,
  backgroundColor: theme.colors.accent,
  borderRadius: theme.borderRadius.full,
  alignSelf: 'flex-start',
},
voteButtonText: {
  color: theme.colors.textPrimary,
  fontSize: theme.fontSize.sm,
  fontWeight: '600',
},
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit + mark done**

```bash
git add app/(app)/(gromady)/[id]/info.tsx i18n/
git commit -m "feat(frontend): add crossovers UI in Gromada info panel"
```

```
/mark-done s6-crossovers-api
/mark-done s6-crossovers-form
/mark-done s6-crossovers-status
```

- [ ] **Step 4: Merge to sprint-6**

```bash
git checkout sprint-6 && git merge --no-ff s6/crossovers && git branch -d s6/crossovers
```

---

## Task 9: Allies in Gromada info panel

**Files:**
- Modify: `app/(app)/(gromady)/[id]/info.tsx`

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s6/allies
```

- [ ] **Step 2: Add allies section to `app/(app)/(gromady)/[id]/info.tsx`**

Add interface + fetch:

```typescript
interface Ally {
  id: string
  business_name: string
  category: string
  offer_text: string
}

const [allies, setAllies] = useState<Ally[]>([])

// In useEffect:
supabase
  .from('gromada_allies')
  .select('id, business_name, category, offer_text')
  .eq('gromada_id', id as string)
  .then(({ data }) => setAllies(data ?? []))
```

Add allies section in JSX:

```tsx
<View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('gromady:allies')}</Text>
  {allies.length === 0 ? (
    <MindfulText context="allies_empty" />
  ) : (
    allies.map((ally) => (
      <View key={ally.id} style={styles.allyCard}>
        <Text style={styles.allyName}>{ally.business_name}</Text>
        <Badge label={ally.category} />
        <Text style={styles.allyOffer}>{ally.offer_text}</Text>
      </View>
    ))
  )}
</View>
```

Add stylesheet:
```typescript
allyCard: {
  backgroundColor: theme.colors.backgroundCard,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  marginBottom: theme.spacing.sm,
  borderWidth: 1,
  borderColor: theme.colors.border,
},
allyName: {
  color: theme.colors.textPrimary,
  fontSize: theme.fontSize.body,
  fontWeight: '600',
},
allyOffer: {
  color: theme.colors.textSecondary,
  fontSize: theme.fontSize.sm,
  marginTop: theme.spacing.xs,
},
```

Add i18n keys to both `pl/gromady.json` and `en/gromady.json`:
```json
{ "allies": "Sojusznicy", "allies_empty": "Brak sojuszników. Zaproś lokalny biznes!" }
{ "allies": "Allies", "allies_empty": "No allies yet. Invite a local business!" }
```

- [ ] **Step 3: TypeScript check + commit + mark done**

```bash
npx tsc --noEmit
git add app/(app)/(gromady)/[id]/info.tsx i18n/
git commit -m "feat(frontend): add allies section in Gromada info panel"
```

```
/mark-done s6-allies
```

```bash
git checkout sprint-6 && git merge --no-ff s6/allies && git branch -d s6/allies
```

---

## Task 10: User Calendar screen

**Files:**
- Create: `app/(app)/(profile)/calendar.tsx`

Shows upcoming and past events the user RSVPd to.

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s6/user-calendar
```

- [ ] **Step 2: Create `app/(app)/(profile)/calendar.tsx`**

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { theme } from '../../../constants/theme'
import { supabase } from '../../../services/supabase'
import { EventCard } from '../../../components/event/EventCard'
import { MindfulText } from '../../../components/mindful/MindfulText'
import { useAuth } from '../../../hooks/useAuth'

interface RSVPEvent {
  id: string
  title: string
  type: string
  starts_at: string
  location_name: string | null
  gromada_id: string | null
  rsvp_status: 'going' | 'maybe' | 'not_going'
}

export default function UserCalendarScreen() {
  const { t } = useTranslation('profile')
  const { user } = useAuth()
  const [upcoming, setUpcoming] = useState<RSVPEvent[]>([])
  const [past, setPast] = useState<RSVPEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const now = new Date().toISOString()

    Promise.all([
      supabase
        .from('event_rsvps')
        .select('status, events(id, title, type, starts_at, location_name, gromada_id)')
        .eq('user_id', user.id)
        .in('status', ['going', 'maybe'])
        .gte('events.starts_at', now)
        .order('events(starts_at)', { ascending: true }),
      supabase
        .from('event_rsvps')
        .select('status, events(id, title, type, starts_at, location_name, gromada_id)')
        .eq('user_id', user.id)
        .in('status', ['going', 'maybe'])
        .lt('events.starts_at', now)
        .order('events(starts_at)', { ascending: false })
        .limit(20),
    ])
      .then(([upcomingRes, pastRes]) => {
        const toEvent = (r: { status: string; events: Record<string, unknown> | null }): RSVPEvent | null =>
          r.events
            ? { ...(r.events as Omit<RSVPEvent, 'rsvp_status'>), rsvp_status: r.status as RSVPEvent['rsvp_status'] }
            : null

        setUpcoming((upcomingRes.data ?? []).map(toEvent).filter(Boolean) as RSVPEvent[])
        setPast((pastRes.data ?? []).map(toEvent).filter(Boolean) as RSVPEvent[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <ActivityIndicator style={styles.loader} color={theme.colors.accent} />

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('calendar_upcoming')}</Text>
      {upcoming.length === 0 ? (
        <MindfulText context="calendar_upcoming_empty" />
      ) : (
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          scrollEnabled={false}
        />
      )}

      <Text style={[styles.sectionTitle, styles.pastTitle]}>{t('calendar_past')}</Text>
      {past.length === 0 ? (
        <MindfulText context="calendar_past_empty" />
      ) : (
        <FlatList
          data={past}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          scrollEnabled={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  loader: { flex: 1 },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  pastTitle: { marginTop: theme.spacing.xl },
})
```

Add i18n keys to `pl/profile.json` and `en/profile.json`:
```json
{ "calendar_upcoming": "Nadchodzące wydarzenia", "calendar_past": "Minione wydarzenia",
  "calendar_upcoming_empty": "Brak nadchodzących wydarzeń. Dołącz do czegoś!", "calendar_past_empty": "Brak minionych wydarzeń." }
{ "calendar_upcoming": "Upcoming Events", "calendar_past": "Past Events",
  "calendar_upcoming_empty": "No upcoming events. Join something!", "calendar_past_empty": "No past events." }
```

- [ ] **Step 3: Add calendar route to profile tab layout**

In `app/(app)/(profile)/_layout.tsx` (or wherever profile tabs are configured), ensure `/calendar` is a valid route. Expo Router handles this automatically via the file — just verify the tab navigator includes a link to it in `app/(app)/(profile)/index.tsx`:

```tsx
<Pressable onPress={() => router.push('/(app)/(profile)/calendar')} accessibilityLabel={t('profile:view_calendar')} accessibilityRole="button">
  <Text style={styles.link}>{t('profile:view_calendar')}</Text>
</Pressable>
```

Add i18n key: `"view_calendar": "Mój kalendarz"` / `"view_calendar": "My Calendar"`.

- [ ] **Step 4: TypeScript check + commit + mark done**

```bash
npx tsc --noEmit
git add app/(app)/(profile)/calendar.tsx i18n/
git commit -m "feat(frontend): add user calendar screen — upcoming + past RSVPd events"
```

```
/mark-done s6-user-calendar
```

```bash
git checkout sprint-6 && git merge --no-ff s6/user-calendar && git branch -d s6/user-calendar
```

---

## Task 11: Gromada Stats + WarmthIndicator

**Files:**
- Modify: `app/(app)/(gromady)/[id]/info.tsx`
- Modify: `components/gromada/WarmthIndicator.tsx`

Warmth formula: `(meetings_this_month × 3) + (favors_exchanged × 2) + member_count`

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s6/gromada-stats
```

- [ ] **Step 2: Update `components/gromada/WarmthIndicator.tsx`**

Replace existing stub with full implementation:

```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../constants/theme'

interface Props {
  score: number
  maxScore?: number
}

const CAMPFIRE_LEVELS = ['🌑', '🔥', '🔥🔥', '🔥🔥🔥']

export function WarmthIndicator({ score, maxScore = 100 }: Props) {
  const clamped = Math.min(score, maxScore)
  const ratio = clamped / maxScore
  const levelIndex = Math.min(Math.floor(ratio * 3), 3)
  const campfire = CAMPFIRE_LEVELS[levelIndex]

  return (
    <View style={styles.container} accessibilityLabel={`Warmth score: ${score}`}>
      <Text style={styles.campfire}>{campfire}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${ratio * 100}%` as `${number}%` }]} />
      </View>
      <Text style={styles.score}>{score}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  campfire: { fontSize: theme.fontSize.lg },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
  },
  score: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, minWidth: 28 },
})
```

- [ ] **Step 3: Add stats + warmth to `app/(app)/(gromady)/[id]/info.tsx`**

Add warmth score calculation. Add these fetches in `useEffect`:

```typescript
const [stats, setStats] = useState({ meetings: 0, favors: 0, memberCount: 0, warmth: 0 })

// In useEffect (alongside existing fetches):
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

const [eventsRes, favorsRes, membersRes] = await Promise.all([
  supabase.from('events').select('id', { count: 'exact', head: true })
    .eq('gromada_id', id as string).gte('starts_at', thirtyDaysAgo),
  supabase.from('favor_requests').select('id', { count: 'exact', head: true })
    .eq('gromada_id', id as string).eq('status', 'helped'),
  supabase.from('gromada_members').select('id', { count: 'exact', head: true })
    .eq('gromada_id', id as string),
])

const meetings = eventsRes.count ?? 0
const favors = favorsRes.count ?? 0
const memberCount = membersRes.count ?? 0
const warmth = meetings * 3 + favors * 2 + memberCount

setStats({ meetings, favors, memberCount, warmth })
```

Add stats section in JSX before crossovers:

```tsx
<View style={styles.statsRow}>
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{stats.meetings}</Text>
    <Text style={styles.statLabel}>{t('gromady:meetings_month')}</Text>
  </View>
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{stats.favors}</Text>
    <Text style={styles.statLabel}>{t('gromady:favors_exchanged')}</Text>
  </View>
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{stats.memberCount}</Text>
    <Text style={styles.statLabel}>{t('gromady:members')}</Text>
  </View>
</View>
<WarmthIndicator score={stats.warmth} />
```

Add stylesheet:
```typescript
statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: theme.spacing.md },
statBox: { alignItems: 'center' },
statNumber: { color: theme.colors.textPrimary, fontSize: theme.fontSize.xxl, fontWeight: '700' },
statLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs },
```

Add i18n keys to both locales:
```json
{ "meetings_month": "Spotkania (30 dni)", "favors_exchanged": "Wymienione przysługi", "members": "Członkowie" }
{ "meetings_month": "Meetings (30 days)", "favors_exchanged": "Favors exchanged", "members": "Members" }
```

- [ ] **Step 4: TypeScript check + commit + mark done**

```bash
npx tsc --noEmit
git add components/gromada/WarmthIndicator.tsx app/(app)/(gromady)/[id]/info.tsx i18n/
git commit -m "feat(frontend): gromada stats + warmth score + WarmthIndicator component"
```

```
/mark-done s6-gromada-stats
/mark-done s6-warmth-indicator
```

```bash
git checkout sprint-6 && git merge --no-ff s6/gromada-stats && git branch -d s6/gromada-stats
```

---

## Task 12: MindfulText integration across empty states

**Files:**
- Modify: all screens that currently show "No items" or empty `FlatList` states

- [ ] **Step 1: Create task branch**

```bash
git checkout -b s6/mindful-texts
```

- [ ] **Step 2: Audit all empty states**

Search for existing empty state patterns:

```bash
npx rg "length === 0" app/ components/ --type ts
```

- [ ] **Step 3: Replace each empty state with `<MindfulText />`**

For each result, replace the empty-state pattern:

```tsx
// Before:
{items.length === 0 && <Text>Brak elementów</Text>}

// After:
{items.length === 0 && <MindfulText context="feed_empty" />}
```

Screens to update:
- `app/(app)/(feed)/index.tsx` — feed empty
- `app/(app)/(gromady)/index.tsx` — gromady grid empty
- `app/(app)/(gromady)/[id]/index.tsx` — posts empty
- `app/(app)/(messages)/index.tsx` — chats empty
- `app/(app)/(messages)/friends.tsx` — friends empty

- [ ] **Step 4: Add context strings to `constants/mindfulTexts.ts`**

Add a `byContext` map if not present:

```typescript
export const MINDFUL_BY_CONTEXT: Record<string, string[]> = {
  feed_empty: [
    'Cisza przed burzą aktywności. Twoja gromada niedługo zaskoczy!',
    'Każda wspólnota zaczyna od ciszy. Zacznij pierwszą rozmowę.',
  ],
  gromady_empty: [
    'Jeszcze nie dołączyłeś do żadnej gromady. Zacznij od jednej!',
  ],
  posts_empty: [
    'Brak postów. Napisz coś jako pierwszy!',
  ],
  chats_empty: [
    'Brak rozmów. Napisz do kogoś ze swojej gromady.',
  ],
  friends_empty: [
    'Brak znajomych na razie. Poznaj kogoś z gromady!',
  ],
  calendar_upcoming_empty: [
    'Brak nadchodzących wydarzeń. Czas to zmienić!',
  ],
  calendar_past_empty: ['Jeszcze nic się nie wydarzyło. To się zmieni!'],
  crossovers_empty: ['Brak crossoverów. Zaproponuj wspólne spotkanie z inną gromadą!'],
  allies_empty: ['Brak sojuszników. Zaproś lokalny biznes!'],
}
```

Update `MindfulText` component to accept `context` prop and use `MINDFUL_BY_CONTEXT`:

```typescript
interface Props {
  context?: keyof typeof MINDFUL_BY_CONTEXT
}

export function MindfulText({ context }: Props) {
  const texts = context ? MINDFUL_BY_CONTEXT[context] : MINDFUL_TEXTS
  const text = texts[Math.floor(Math.random() * texts.length)]
  return <Text style={styles.text}>{text}</Text>
}
```

- [ ] **Step 5: TypeScript check + commit + mark done**

```bash
npx tsc --noEmit
git add components/mindful/MindfulText.tsx constants/mindfulTexts.ts app/
git commit -m "feat(frontend): MindfulText in all empty states with context-aware strings"
```

```
/mark-done s6-mindful-texts
```

```bash
git checkout sprint-6 && git merge --no-ff s6/mindful-texts && git branch -d s6/mindful-texts
```

---

## Task 13: Sentry integration

**Files:**
- Create: `services/sentry.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create task branch + install Sentry**

```bash
git checkout -b s6/infra
npx expo install @sentry/react-native
```

- [ ] **Step 2: Create `services/sentry.ts`**

```typescript
import * as Sentry from '@sentry/react-native'
import { SENTRY_DSN, APP_ENV } from '../constants/config'

export function initSentry() {
  if (!SENTRY_DSN) return

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    enableAutoSessionTracking: true,
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // Strip any PII from breadcrumbs
      if (event.breadcrumbs?.values) {
        event.breadcrumbs.values = event.breadcrumbs.values.map((b) => ({
          ...b,
          data: undefined,
        }))
      }
      return event
    },
  })
}

export function captureError(error: unknown, context?: Record<string, string>) {
  if (context) Sentry.setContext('app', context)
  Sentry.captureException(error)
}
```

- [ ] **Step 3: Add `SENTRY_DSN` and `APP_ENV` to `constants/config.ts`**

```typescript
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''
export const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development'
```

- [ ] **Step 4: Call `initSentry()` in `app/_layout.tsx`**

```typescript
import { initSentry } from '../services/sentry'
// At the top of the root layout, before any component logic:
initSentry()
```

- [ ] **Step 5: Commit**

```bash
git add services/sentry.ts constants/config.ts app/_layout.tsx
git commit -m "feat(infra): add Sentry error monitoring — PII stripped, env-aware sampling"
```

```
/mark-done s6-sentry
```

---

## Task 14: EAS Build Configuration

**Files:**
- Create: `eas.json`
- Create: `.env.example`

- [ ] **Step 1: Create `eas.json`**

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development",
        "EXPO_PUBLIC_SUPABASE_URL": "http://127.0.0.1:54321",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "local-anon-key-placeholder"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 2: Create `.env.example`**

```
# Copy to .env.local for local dev (never commit .env.local)
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<get from: supabase status>
EXPO_PUBLIC_SENTRY_DSN=<get from Sentry dashboard>
EXPO_PUBLIC_APP_ENV=development
```

- [ ] **Step 3: Add `.env.local` and `.env.staging` to `.gitignore`**

```
.env.local
.env.staging
.env.production
```

- [ ] **Step 4: Commit + mark done**

```bash
git add eas.json .env.example .gitignore
git commit -m "feat(infra): add EAS build profiles (development/preview/production) + .env.example"
```

```
/mark-done s6-eas
/mark-done s6-analytics
```

(Analytics tracking is deferred — Plausible/PostHog setup requires a running server, handled in Sprint 8.)

---

## Task 15: Code review + QA

- [ ] **Step 1: Run code-reviewer on all Sprint 6 files**

```
/review
```

Or if using the cs-karpathy-reviewer agent: dispatch it on the `s6/*` diff.

- [ ] **Step 2: Run accessibility check**

Manual checklist:
- [ ] VoiceOver (iOS simulator): navigate through new screens, verify all `accessibilityLabel` values make sense
- [ ] TalkBack (Android emulator): same
- [ ] All new `Pressable` elements have `accessibilityRole="button"`
- [ ] All new `Text` elements have sufficient color contrast (4.5:1 for body, 3:1 for large)

- [ ] **Step 3: Run TypeScript final check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Mark QA tasks done**

```
/mark-done s6-code-review
/mark-done s6-a11y-audit
/mark-done s6-perf-audit
```

- [ ] **Step 5: Merge sprint-6 → main**

```bash
git checkout main
git merge --no-ff sprint-6
git tag sprint-6-done
git push origin main --tags
```

- [ ] **Step 6: Update SPRINTS.md**

Mark Sprint 6 as `✅ DONE` in the header. Update the sprint status table in CLAUDE.md.

```bash
git add .claude/SPRINTS.md .claude/CLAUDE.md
git commit -m "docs: mark Sprint 6 complete"
```
