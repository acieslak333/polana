import { getDateLocale, getSupportedLanguages } from '../locale';

describe('getDateLocale', () => {
  it('returns Polish locale for pl', () => {
    const locale = getDateLocale('pl');
    expect(locale.code).toBe('pl');
  });

  it('returns British English for en', () => {
    const locale = getDateLocale('en');
    expect(locale.code).toBe('en-GB');
  });

  it('returns Ukrainian locale for uk', () => {
    const locale = getDateLocale('uk');
    expect(locale.code).toBe('uk');
  });

  it('falls back to en-GB for unknown language code', () => {
    const locale = getDateLocale('xx');
    expect(locale.code).toBe('en-GB');
  });

  it('falls back to en-GB for empty string', () => {
    const locale = getDateLocale('');
    expect(locale.code).toBe('en-GB');
  });
});

describe('getSupportedLanguages', () => {
  it('includes pl, en, uk at minimum', () => {
    const langs = getSupportedLanguages();
    expect(langs).toContain('pl');
    expect(langs).toContain('en');
    expect(langs).toContain('uk');
  });
});
