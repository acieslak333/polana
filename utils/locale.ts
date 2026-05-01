import { pl, enGB, uk } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const LOCALE_MAP: Record<string, Locale> = {
  pl,
  en: enGB,
  uk,
};

export function getDateLocale(language: string): Locale {
  return LOCALE_MAP[language] ?? enGB;
}

export function getSupportedLanguages(): string[] {
  return Object.keys(LOCALE_MAP);
}
