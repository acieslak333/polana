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

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enFeed from './locales/en/feed.json';
import enGromady from './locales/en/gromady.json';
import enEvents from './locales/en/events.json';
import enMessages from './locales/en/messages.json';
import enProfile from './locales/en/profile.json';

export const defaultNS = 'common';
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
