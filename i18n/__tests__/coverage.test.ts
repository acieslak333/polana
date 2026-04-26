// Verifies that every translation key in Polish (primary) exists in English and Ukrainian.
// If a key is added to pl/ but forgotten in en/ or uk/, this test fails with the key name.

import plCommon from '../locales/pl/common.json';
import plAuth from '../locales/pl/auth.json';
import plOnboarding from '../locales/pl/onboarding.json';
import plFeed from '../locales/pl/feed.json';
import plGromady from '../locales/pl/gromady.json';
import plEvents from '../locales/pl/events.json';
import plMessages from '../locales/pl/messages.json';
import plProfile from '../locales/pl/profile.json';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enOnboarding from '../locales/en/onboarding.json';
import enFeed from '../locales/en/feed.json';
import enGromady from '../locales/en/gromady.json';
import enEvents from '../locales/en/events.json';
import enMessages from '../locales/en/messages.json';
import enProfile from '../locales/en/profile.json';

import ukCommon from '../locales/uk/common.json';
import ukAuth from '../locales/uk/auth.json';
import ukOnboarding from '../locales/uk/onboarding.json';
import ukFeed from '../locales/uk/feed.json';
import ukGromady from '../locales/uk/gromady.json';
import ukEvents from '../locales/uk/events.json';
import ukMessages from '../locales/uk/messages.json';
import ukProfile from '../locales/uk/profile.json';

type AnyJson = Record<string, unknown>;

function flatKeys(obj: AnyJson, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null && !Array.isArray(v)
      ? flatKeys(v as AnyJson, full)
      : [full];
  });
}

const NAMESPACES: Array<{ name: string; pl: AnyJson; en: AnyJson; uk: AnyJson }> = [
  { name: 'common',     pl: plCommon,     en: enCommon,     uk: ukCommon },
  { name: 'auth',       pl: plAuth,       en: enAuth,       uk: ukAuth },
  { name: 'onboarding', pl: plOnboarding, en: enOnboarding, uk: ukOnboarding },
  { name: 'feed',       pl: plFeed,       en: enFeed,       uk: ukFeed },
  { name: 'gromady',    pl: plGromady,    en: enGromady,    uk: ukGromady },
  { name: 'events',     pl: plEvents,     en: enEvents,     uk: ukEvents },
  { name: 'messages',   pl: plMessages,   en: enMessages,   uk: ukMessages },
  { name: 'profile',    pl: plProfile,    en: enProfile,    uk: ukProfile },
];

for (const { name, pl, en, uk } of NAMESPACES) {
  const plKeys = flatKeys(pl);
  const enKeys = new Set(flatKeys(en));
  const ukKeys = new Set(flatKeys(uk));

  describe(`i18n coverage: ${name}`, () => {
    it('all PL keys exist in EN', () => {
      const missing = plKeys.filter((k) => !enKeys.has(k));
      expect(missing).toEqual([]);
    });

    it('all PL keys exist in UK', () => {
      const missing = plKeys.filter((k) => !ukKeys.has(k));
      expect(missing).toEqual([]);
    });

    it('no EN keys are orphaned (missing from PL)', () => {
      const plSet = new Set(plKeys);
      const extra = flatKeys(en).filter((k) => !plSet.has(k));
      expect(extra).toEqual([]);
    });
  });
}
