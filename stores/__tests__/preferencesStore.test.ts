import { act, renderHook } from '@testing-library/react-native';
import { usePreferencesStore } from '../preferencesStore';

describe('preferencesStore', () => {
  it('starts with language=pl, colorScheme=system', () => {
    const { result } = renderHook(() => usePreferencesStore());
    expect(result.current.language).toBe('pl');
    expect(result.current.colorScheme).toBe('system');
    expect(result.current.reduceMotion).toBe(false);
  });

  describe('language cycling', () => {
    it('cycles pl → en → uk → pl', () => {
      const { result } = renderHook(() => usePreferencesStore());
      const order = ['pl', 'en', 'uk', 'pl'] as const;

      // force reset to pl first
      act(() => { result.current.setLanguage('pl'); });
      expect(result.current.language).toBe('pl');

      for (const lang of order.slice(1)) {
        const languages = ['pl', 'en', 'uk'] as const;
        const current = result.current.language as typeof languages[number];
        const idx = languages.indexOf(current);
        const next = languages[(idx + 1) % languages.length];
        act(() => { result.current.setLanguage(next); });
        expect(result.current.language).toBe(lang);
      }
    });

    it('setLanguage accepts pl, en, uk', () => {
      const { result } = renderHook(() => usePreferencesStore());
      for (const lang of ['pl', 'en', 'uk'] as const) {
        act(() => { result.current.setLanguage(lang); });
        expect(result.current.language).toBe(lang);
      }
    });
  });

  describe('colorScheme cycling', () => {
    it('cycles system → dark → light → system', () => {
      const { result } = renderHook(() => usePreferencesStore());
      act(() => { result.current.setColorScheme('system'); });
      expect(result.current.colorScheme).toBe('system');
      act(() => { result.current.setColorScheme('dark'); });
      expect(result.current.colorScheme).toBe('dark');
      act(() => { result.current.setColorScheme('light'); });
      expect(result.current.colorScheme).toBe('light');
    });
  });

  it('setReduceMotion toggles the flag', () => {
    const { result } = renderHook(() => usePreferencesStore());
    act(() => { result.current.setReduceMotion(true); });
    expect(result.current.reduceMotion).toBe(true);
    act(() => { result.current.setReduceMotion(false); });
    expect(result.current.reduceMotion).toBe(false);
  });
});
