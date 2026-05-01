import { pl, enGB, uk } from 'date-fns/locale';
import type { Locale } from 'date-fns';

// Central registry: language code → date-fns Locale.
// To add a new language: import the locale from date-fns and add one entry here.
// All locales ship with date-fns — no extra install needed.
// Keep in sync with i18n/index.ts SUPPORTED_LANGUAGES and utils/nameGenerator.ts WORDS.
const LOCALE_MAP: Record<string, Locale> = {
  pl,
  en: enGB,
  uk,
};

/**
 * Returns the date-fns Locale for the given i18next language code.
 * Fallback chain: requested language → en-GB.
 * Never returns undefined — always safe to pass directly to date-fns format().
 */
export function getDateLocale(language: string): Locale {
  return LOCALE_MAP[language] ?? enGB;
}

/**
 * All language codes with a registered date-fns locale.
 * Note: key order follows insertion order — do not rely on alphabetical ordering.
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LOCALE_MAP);
}
