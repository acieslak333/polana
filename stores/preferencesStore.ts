import { create } from 'zustand';

type ColorScheme = 'dark' | 'light' | 'system';
type Language = 'pl' | 'en';

type PreferencesState = {
  colorScheme: ColorScheme;
  language: Language;
  reduceMotion: boolean;

  setColorScheme: (scheme: ColorScheme) => void;
  setLanguage: (lang: Language) => void;
  setReduceMotion: (reduce: boolean) => void;
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  colorScheme: 'system',
  language: 'pl',
  reduceMotion: false,

  setColorScheme: (colorScheme) => set({ colorScheme }),
  setLanguage: (language) => set({ language }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }),
}));
