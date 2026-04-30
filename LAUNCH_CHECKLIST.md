# Polana — Launch Checklist

> Complete all items before submitting to App Store and Google Play.  
> Legend: ✅ done in code | ⏳ manual step needed | 🔧 needs config

---

## Code — Done in Sprints 1–20

- ✅ Full app — auth, onboarding, feed, gromady, events, map, chat, profile
- ✅ Crossovers, allies, warmth score, gromada stats
- ✅ Block/mute, moderation queue, error boundaries, offline cache
- ✅ Invites, password reset, branded emails, elder admin panel
- ✅ GDPR export + account deletion
- ✅ Privacy policy screen (`app/(auth)/privacy.tsx`)
- ✅ i18n — Polish, English, Ukrainian
- ✅ Sentry error monitoring
- ✅ PostHog analytics (privacy-first, no PII)
- ✅ Shared type package `@polana/db-types`
- ✅ Jest test suite — 200+ test cases across utils, services, hooks, components
- ✅ E2E Maestro flows — 5 critical flows, nightly CI
- ✅ EAS build profiles — development, preview, production
- ✅ Deep links — `polana://` scheme + Universal Links

---

## Before Building

### Design Assets (⏳ needs designer)
- [ ] App icon 1024×1024 PNG — transparent background
- [ ] Splash screen 2048×2048 PNG on `#1A1612` background
- [ ] Android adaptive icon foreground PNG
- [ ] Notification icon 96×96 white on transparent PNG
- [ ] iOS screenshots: 6.5" × 5, 5.5" × 5, 12.9" iPad × 3
- [ ] Android: phone × 5, 7" tablet × 3, feature graphic 1024×500

### EAS + Secrets (🔧 needs config)
- [ ] Set `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS secrets
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN` (production DSN) in EAS secrets
- [ ] Set `EXPO_PUBLIC_POSTHOG_KEY` in EAS secrets
- [ ] Set `EXPO_PUBLIC_APP_ENV=production` in EAS production profile
- [ ] Replace `YOUR_EAS_PROJECT_ID` in `app.json` with real project ID (`eas init`)

### Native Modules (🔧 run once)
```bash
npx expo install react-native-maps
npx expo install @sentry/react-native
npx expo install posthog-react-native
npx sentry-expo-upload-sourcemaps --auto-prefix --force
```

---

## Supabase Production Setup (⏳ manual)

- [ ] Run all migrations 001→009 on production DB
- [ ] Verify RLS enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] Deploy all Edge Functions: `supabase functions deploy`
- [ ] Configure cron jobs: generate-events (daily), expire-favors (daily), dormant-check (weekly)
- [ ] Upload email templates to Supabase Auth dashboard (welcome.html, reset.html, invite.html)
- [ ] Create Storage buckets: `post-media` (private), `avatars` (private)
- [ ] Configure pg_cron to purge app_logs after 30 days
- [ ] Sign Supabase DPA for GDPR compliance

---

## Build & Submit

```bash
# Preview build (internal testing)
eas build --platform all --profile preview

# Production build
eas build --platform all --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## App Store (iOS) (⏳ manual in App Store Connect)

- [ ] Create app in App Store Connect
- [ ] App name: "Polana – lokalne społeczności"
- [ ] Subtitle: "Gromady, spotkania, sąsiedzi"
- [ ] Keywords: `gromada,społeczność,lokalna,spotkania,sąsiedzi,Polska,komunitet`
- [ ] Privacy policy URL: `https://polana.app/privacy`
- [ ] Age rating: **4+**
- [ ] Full description: copy from `docs/store-listings.md`
- [ ] Screenshots uploaded
- [ ] Set Polish as primary language, English as secondary

## Google Play (⏳ manual in Play Console)

- [ ] Create app in Play Console
- [ ] Short description: copy from `docs/store-listings.md`
- [ ] Full description: copy from `docs/store-listings.md`
- [ ] Feature graphic 1024×500
- [ ] Content rating: **Everyone** (complete rating questionnaire)
- [ ] Privacy policy URL: `https://polana.app/privacy`
- [ ] Data safety form — declare: email, name, location (city only), usage data

---

## Accessibility Sign-off (⏳ manual)

See `docs/a11y-checklist.md` for full checklist.

- [ ] VoiceOver test: registration, feed, events, chat, profile
- [ ] TalkBack test: same flows on Android 13+
- [ ] All critical flows complete without getting stuck

---

## TestFlight / Internal Testing (⏳ manual)

- [ ] Invite 10 internal testers via TestFlight
- [ ] Run E2E Maestro flows manually on a physical device
- [ ] Monitor Sentry for **≥ 99% crash-free rate** over 48 hours
- [ ] Verify cold start < 3s on iPhone 12 and Pixel 6a
- [ ] Verify PostHog events firing in dashboard

---

## Post-Launch

- [ ] Set up Supabase DB alert for connection count > 80%
- [ ] Set Sentry alert: error rate > 1% → email notify
- [ ] Check Retool admin panel is accessible to city moderators
- [ ] Monitor App Store / Play Store reviews — respond within 48h
- [ ] Schedule first feature retrospective at 1,000 DAU
