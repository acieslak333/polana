# Adding a New Country to Polana

**Time estimate:** Phase 1 ~4h (developer) + Phase 2 ~2h (admin panel) + Phase 3 ~1h (testing)

---

## Prerequisites

- Access to the admin panel (Sprint 22)
- EAS CLI installed and authenticated: `eas whoami`
- New country's cities researched: name, GPS coordinates, timezone

---

## Phase 1 — Developer (~4 hours)

### 1.1 Create locale files

Copy an existing locale as a template:
```bash
cp -r i18n/locales/en i18n/locales/<code>
```

Translate every value in all 9 files:
- `brand.json` — brand concept names (most important: `gromada`, `elder`, `tagline`)
- `common.json`, `auth.json`, `onboarding.json`, `feed.json`, `gromady.json`, `events.json`, `messages.json`, `profile.json`

For `brand.json` specifically, decide:
- "Gromada" → what word means "local community group" in this language?
- "Elder" → what word means "experienced group leader"?
- "Tagline" → a short evocative phrase

### 1.2 Register the locale

In `i18n/index.ts`:
```ts
import deBrand from './locales/de/brand.json';
// ... all 9 namespaces

export const SUPPORTED_LANGUAGES = [
  { code: 'pl', label: 'Polski',    flag: '🇵🇱' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'uk', label: 'Українська',flag: '🇺🇦' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪' }, // ADD
] as const;

export const resources = {
  // ...existing...
  de: { brand: deBrand, common: deCommon, /* all 9 */ },
};
```

### 1.3 Register date locale

In `utils/locale.ts`:
```ts
import { de } from 'date-fns/locale';

const LOCALE_MAP: Record<string, Locale> = {
  pl, en: enGB, uk,
  de, // ADD
};
```

### 1.4 Add name generation word lists

In `utils/nameGenerator.ts`, add an entry in the `WORDS` object for the new language with adjectives, animals, suffixes, and pattern. Minimum 10 entries per word type.

### 1.5 Deploy via EAS OTA

```bash
eas update --branch production --message "Add <language> locale"
```

Users get the update on next app launch. No App Store review required.

---

## Phase 2 — Admin Panel (~2 hours, no deploy)

### 2.1 Add cities

Admin panel → Content → Cities → Add City:
- Name (in local language)
- GPS coordinates
- Timezone (e.g. `Europe/Berlin`)
- Emoji
- `is_active = false` (hidden during setup)

### 2.2 Seed name generation words

Admin panel → Content → Names → select language:
- Add 15+ adjectives, 15+ animals, 10+ suffixes
- Set the word-order pattern (e.g. French: `{animal} {adj} {suffix}`)

### 2.3 Seed notification templates

Admin panel → Content → Notifications → select language:
- Add templates for all 5 types: `new_message`, `new_event`, `rsvp_reminder`, `favor_offer`, `invite`
- Use `{variable}` tokens (see `notification_templates` table comments)

### 2.4 Seed curated places (Sprint 23)

Admin panel → Places → Add Place:
- 20 minimum per city at launch
- Tag with relevant interest types

---

## Phase 3 — Internal Test (~1 hour)

Create a test account. Set language to new language and city to one of the new cities.

Verification checklist:

- [ ] Onboarding city picker shows new city with correct emoji
- [ ] Generated Gromada name uses new language words in correct grammar order
- [ ] Dates format correctly for the locale (e.g. `3. Mai 2026` for German)
- [ ] `t('brand:gromada')` renders the correct term for the language
- [ ] Push notification for a test message arrives in the new language
- [ ] Feed, events list, map all function normally
- [ ] Settings screen shows new language as an option

---

## Phase 4 — Launch (5 minutes)

Admin panel → Content → Cities → flip `is_active = true` for each new city.

City becomes immediately available in the onboarding city picker.

**Rollback:** flip `is_active = false` — country disappears from onboarding. Existing Gromada members are unaffected.

---

## Out of Scope

- RTL languages (Arabic, Hebrew) — requires full layout audit, future sprint
- Separate App Store listings per country — one global app
- Country-level data isolation — users can join Gromady across countries by design
