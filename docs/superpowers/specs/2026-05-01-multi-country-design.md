# Multi-Country Support — Design Spec
**Date:** 2026-05-01  
**Status:** Approved  
**Scope:** Polana mobile app + Supabase backend  

---

## Problem

Polana is currently Poland-only by assumption, not by architecture. Three specific breakages exist today:

1. Date formatting hardcodes `{ locale: pl }` in 3 components
2. Name generation words are Polish-only in the DB
3. Push notifications deliver Polish copy to all users regardless of language
4. Brand concepts ("Gromada", "Elder") are inconsistently translated — some are proper i18n keys, some are hardcoded strings

Everything else (city fetching, Gromada suggestions, RLS) is already country-agnostic after the Sprint 21 fix to DB-drive city coordinates.

---

## Decisions

| Question | Decision |
|---|---|
| One global app or per-country apps? | One global app |
| What drives language shown? | User's language preference (not their city) |
| Can users join Gromady across countries? | Yes — Gromady are city-anchored, users can be in up to 3 across any city |
| Does "Polana" localize? | No — global brand, stays as-is everywhere |
| Do brand concepts localize? | Yes — "Gromada", "Elder", "Nowicjusz", etc. |
| RTL language support? | Explicitly out of scope — documented as future gap |
| How are new languages deployed? | Locale JSON file + `eas update` (same-day, no App Store review) |
| Who manages name words and notification templates? | Admin panel (no deploy needed) |

---

## Architecture

Three layers with clear ownership:

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: UI strings + brand concepts               │
│  i18n JSON locale files — EAS OTA deploy            │
│  Developer owns: adds locale file per language      │
├─────────────────────────────────────────────────────┤
│  Layer 2: Dynamic generated content                 │
│  DB: name words, notification templates             │
│  Admin panel owns: seeds per language, zero-deploy  │
├─────────────────────────────────────────────────────┤
│  Layer 3: Locale plumbing                           │
│  utils/locale.ts — language code → date-fns locale  │
│  Single source of truth for all components          │
└─────────────────────────────────────────────────────┘
```

**Fallback chain (all layers):** user language → `en` → `pl`

---

## Component 1: Language Registry (`utils/locale.ts`)

Single file mapping language codes to date-fns locale objects. Every component that formats dates imports from here — no component touches `date-fns/locale` directly.

```ts
import { pl, enGB, uk, de, fr, cs, es, pt } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const LOCALE_MAP: Record<string, Locale> = {
  pl, en: enGB, uk, de, fr, cs, es, pt,
};

export function getDateLocale(language: string): Locale {
  return LOCALE_MAP[language] ?? enGB;
}

export function getSupportedLanguages(): string[] {
  return Object.keys(LOCALE_MAP);
}
```

**Files that change:** `components/event/EventCard.tsx`, `app/(app)/(gromady)/[id]/info.tsx`, `app/(app)/(map)/index.tsx` — each replaces `{ locale: pl }` with `{ locale: getDateLocale(i18n.language) }`.

**Adding a new language:** one line added to `LOCALE_MAP` in the same PR as the locale JSON files. date-fns ships all locales; no extra dependency needed.

---

## Component 2: Brand Terms (`brand` i18n namespace)

New dedicated namespace `brand` per locale. Keeps creative localization decisions separate from mechanical UI string translation.

**"Polana" is not in this file** — it is a global brand constant in `constants/config.ts`.

```json
// i18n/locales/pl/brand.json
{
  "gromada":    "Gromada",
  "gromada_pl": "Gromady",
  "elder":      "Elder",
  "newcomer":   "Nowicjusz",
  "member":     "Członek",
  "favor":      "Przysługa",
  "warmth":     "Ciepło",
  "tagline":    "Miejsce prawdziwych społeczności"
}

// i18n/locales/en/brand.json
{
  "gromada":    "Circle",
  "gromada_pl": "Circles",
  "elder":      "Elder",
  "newcomer":   "Newcomer",
  "member":     "Member",
  "favor":      "Favour",
  "warmth":     "Warmth",
  "tagline":    "Real communities, real places"
}
```

**`i18n/index.ts`:** register `brand` namespace alongside existing 8 namespaces.

**Components that change:** any component with a hardcoded "Gromada", "Elder", "Nowicjusz", or "Członek" string switches to `t('brand:gromada')` etc. The `gromady` namespace keeps its UI action strings (`gromady:join`, `gromady:leave`) unchanged — only the concept nouns move to `brand`.

---

## Component 3: Name Generation System

### DB changes (`019_name_generation_multilang.sql`)

```sql
-- Add language column to all 3 word tables
ALTER TABLE name_adjectives ADD COLUMN language TEXT NOT NULL DEFAULT 'pl';
ALTER TABLE name_animals    ADD COLUMN language TEXT NOT NULL DEFAULT 'pl';
ALTER TABLE name_suffixes   ADD COLUMN language TEXT NOT NULL DEFAULT 'pl';

-- Back-fill existing rows (all Polish)
UPDATE name_adjectives SET language = 'pl';
UPDATE name_animals    SET language = 'pl';
UPDATE name_suffixes   SET language = 'pl';

-- Update indexes for language-filtered queries
CREATE INDEX idx_name_adj_language ON name_adjectives (language);
CREATE INDEX idx_name_ani_language ON name_animals (language);
CREATE INDEX idx_name_suf_language ON name_suffixes (language);

-- Pattern table: defines word order per language
CREATE TABLE name_patterns (
  language TEXT PRIMARY KEY,
  pattern  TEXT NOT NULL
  -- Pattern tokens: {adj} {animal} {suffix}
  -- PL/EN/DE: '{adj} {animal} {suffix}' → "Bold Otters of the Forest"
  -- FR:       '{animal} {adj} {suffix}' → "Loutres Courageuses de la Forêt"
);

INSERT INTO name_patterns (language, pattern) VALUES
  ('pl', '{adj} {animal} {suffix}'),
  ('en', '{adj} {animal} {suffix}'),
  ('uk', '{adj} {animal} {suffix}');
-- Admin panel adds patterns for new languages
```

### Updated SQL function

```sql
CREATE OR REPLACE FUNCTION generate_gromada_name(p_language TEXT DEFAULT 'pl')
RETURNS TEXT AS $$
DECLARE
  v_lang    TEXT;
  v_pattern TEXT;
  v_adj     TEXT;
  v_animal  TEXT;
  v_suffix  TEXT;
  v_name    TEXT;
BEGIN
  -- Resolve language with fallback: requested → en → pl
  v_lang := CASE
    WHEN EXISTS (SELECT 1 FROM name_adjectives WHERE language = p_language) THEN p_language
    WHEN EXISTS (SELECT 1 FROM name_adjectives WHERE language = 'en')       THEN 'en'
    ELSE 'pl'
  END;

  -- Get pattern (fallback to '{adj} {animal} {suffix}')
  SELECT COALESCE(
    (SELECT pattern FROM name_patterns WHERE language = v_lang),
    '{adj} {animal} {suffix}'
  ) INTO v_pattern;

  SELECT word_pl INTO v_adj    FROM name_adjectives WHERE language = v_lang ORDER BY RANDOM() LIMIT 1;
  SELECT word_pl INTO v_animal FROM name_animals    WHERE language = v_lang ORDER BY RANDOM() LIMIT 1;
  SELECT word_pl INTO v_suffix FROM name_suffixes   WHERE language = v_lang ORDER BY RANDOM() LIMIT 1;

  v_name := v_pattern;
  v_name := REPLACE(v_name, '{adj}',    v_adj);
  v_name := REPLACE(v_name, '{animal}', v_animal);
  v_name := REPLACE(v_name, '{suffix}', v_suffix);

  RETURN v_name;
END;
$$ LANGUAGE plpgsql;
```

### Note on `word_pl` column naming

The three word tables have a `word_pl` column from the original schema. Despite the name, this column stores the word in **whatever language the row's `language` column specifies** — a German row with `language = 'de'` stores the German word in `word_pl`. The column name is misleading but renaming it would require a large migration touching existing data and the SQL function. It stays as-is; treat `word_pl` as "the word in this row's language".

### App changes

`utils/nameGenerator.ts` — `generateGromadaName(language: string)` passes language to the DB function.

`app/(app)/(gromady)/create.tsx` — passes `i18n.language` when generating a suggested name.

Generated names are stored as fixed strings in `gromady.name` — not re-generated per viewer.

---

## Component 4: Push Notification Localization

### DB (`020_notification_templates.sql`)

```sql
CREATE TABLE notification_templates (
  type     TEXT NOT NULL,
  language TEXT NOT NULL,
  title    TEXT NOT NULL,  -- supports {variable} interpolation
  body     TEXT NOT NULL,
  PRIMARY KEY (type, language)
);

-- Seed Polish + English templates
INSERT INTO notification_templates (type, language, title, body) VALUES
  ('new_message',    'pl', 'Nowa wiadomość w {gromada}', '{sender} napisał(a) do grupy'),
  ('new_message',    'en', 'New message in {gromada}',   '{sender} sent a message'),
  ('new_event',      'pl', 'Nowe wydarzenie: {title}',   '{gromada} organizuje spotkanie'),
  ('new_event',      'en', 'New event: {title}',          '{gromada} is organising a meetup'),
  ('rsvp_reminder',  'pl', 'Przypomnienie: {title}',     'Wydarzenie zaczyna się jutro'),
  ('rsvp_reminder',  'en', 'Reminder: {title}',           'Your event starts tomorrow'),
  ('favor_offer',    'pl', 'Ktoś oferuje pomoc',          '{sender} chce pomóc z: {favor}'),
  ('favor_offer',    'en', 'Someone offered help',         '{sender} wants to help with: {favor}'),
  ('invite',         'pl', 'Zaproszenie do {gromada}',   '{sender} zaprasza cię do grupy'),
  ('invite',         'en', 'Invitation to {gromada}',     '{sender} invited you to join');
```

RLS: no client access — service role only (admin panel via Edge Function).

### Updated `send-notification` Edge Function

**Before:** `{ userId, title, body, data? }`  
**After:** `{ userId, type, variables: Record<string, string>, data? }`

Flow:
1. Fetch `profiles.language` for `userId`
2. Apply fallback chain: language → `en` → `pl`
3. Look up `notification_templates WHERE type = ? AND language = ?`
4. Interpolate `{variables}` into title/body
5. Send to push token

Callers no longer own notification copy. All notification text lives in DB, updatable without deploy.

---

## Component 5: Hardened City Schema

Already done in Sprint 21 (`018_cities_emoji_latlon.sql`): cities have `emoji`, `lat`, `lng`, `country_code`. App fetches coordinates and emoji from DB — no hardcoded city lookups remain.

No additional changes needed here.

---

## Country Rollout Runbook

### Adding a new country (e.g. Germany)

**Phase 1 — Developer (~1 day)**
1. Create locale files: `i18n/locales/de/brand.json` + all 8 namespace files
2. Add `de` to `utils/locale.ts` LOCALE_MAP
3. Run `eas update` — live within the hour

**Phase 2 — Admin panel (no deploy)**
1. Add cities: `Berlin`, `München`, `Hamburg` etc. with `is_active = false`
2. Seed name adjectives, animals, suffixes in `de`
3. Add `name_patterns` row for `de` (e.g. `'{adj} {animal} {suffix}'`)
4. Seed notification templates for `de`
5. Seed ~20 curated places per city (Sprint 23 admin panel)

**Phase 3 — Internal test**
1. Create test account, set language `de`, set city to Berlin
2. Verify checklist:
   - [ ] Onboarding city picker shows Berlin with correct emoji
   - [ ] Generated Gromada name is German words in correct order
   - [ ] Dates format as `de` locale (e.g. `3. Mai 2026`)
   - [ ] Push notification arrives in German
   - [ ] `t('brand:gromada')` renders "Gruppe" (or chosen term)
   - [ ] Feed, events, map all function normally

**Phase 4 — Launch**
1. Flip `is_active = true` on German cities
2. Done. No migration, no App Store submission, no downtime.

**Rollback:** flip `is_active = false` on cities — country disappears from onboarding. Existing members keep their Gromady.

---

## Out of Scope

- **RTL languages** (Arabic, Hebrew, Persian) — React Native's `I18nManager.forceRTL()` requires layout audit across all screens. Future sprint.
- **Currency / payments** — Polana is nonprofit; no in-app purchases.
- **Country-level data isolation** — a Warsaw user can join a Berlin Gromada by design.
- **Separate App Store listings per country** — one global listing.

---

## Files Created / Modified

| File | Change |
|---|---|
| `utils/locale.ts` | New — language registry |
| `i18n/locales/*/brand.json` | New — brand namespace (PL + EN + UK) |
| `i18n/index.ts` | Register `brand` namespace |
| `components/event/EventCard.tsx` | `{ locale: pl }` → `getDateLocale` |
| `app/(app)/(gromady)/[id]/info.tsx` | `{ locale: pl }` → `getDateLocale` |
| `app/(app)/(map)/index.tsx` | `{ locale: pl }` → `getDateLocale` |
| `utils/nameGenerator.ts` | Accept `language` param |
| `app/(app)/(gromady)/create.tsx` | Pass `i18n.language` to name generator |
| `supabase/migrations/019_name_generation_multilang.sql` | Language column, `name_patterns` table, updated function |
| `supabase/migrations/020_notification_templates.sql` | `notification_templates` table + PL/EN seed |
| `supabase/functions/send-notification/index.ts` | Template lookup + variable interpolation |
| `docs/new-country-runbook.md` | Operational runbook |
