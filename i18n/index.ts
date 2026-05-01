import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import plCommon from './locales/pl/common.json';
import plAuth from './locales/pl/auth.json';
import plOnboarding from './locales/pl/onboarding.json';
import plFeed from './locales/pl/feed.json';
import plGromady from './locales/pl/gromady.json';
import plEvents from './locales/pl/events.json';
import plMessages from './locales/pl/messages.json';
import plProfile from './locales/pl/profile.json';
import plBrand from './locales/pl/brand.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enFeed from './locales/en/feed.json';
import enGromady from './locales/en/gromady.json';
import enEvents from './locales/en/events.json';
import enMessages from './locales/en/messages.json';
import enProfile from './locales/en/profile.json';
import enBrand from './locales/en/brand.json';

import ukCommon from './locales/uk/common.json';
import ukAuth from './locales/uk/auth.json';
import ukOnboarding from './locales/uk/onboarding.json';
import ukFeed from './locales/uk/feed.json';
import ukGromady from './locales/uk/gromady.json';
import ukEvents from './locales/uk/events.json';
import ukMessages from './locales/uk/messages.json';
import ukProfile from './locales/uk/profile.json';
import ukBrand from './locales/uk/brand.json';

export const defaultNS = 'common';

export const SUPPORTED_LANGUAGES = [
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

export const resources = {
  pl: {
    common: plCommon,
    auth: plAuth,
    onboarding: plOnboarding,
    feed: plFeed,
    gromady: plGromady,
    events: plEvents,
    messages: plMessages,
    profile: plProfile,
    brand: plBrand,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    onboarding: enOnboarding,
    feed: enFeed,
    gromady: enGromady,
    events: enEvents,
    messages: enMessages,
    profile: enProfile,
    brand: enBrand,
  },
  uk: {
    common: ukCommon,
    auth: ukAuth,
    onboarding: ukOnboarding,
    feed: ukFeed,
    gromady: ukGromady,
    events: ukEvents,
    messages: ukMessages,
    profile: ukProfile,
    brand: ukBrand,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'pl',
  fallbackLng: 'en',
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
