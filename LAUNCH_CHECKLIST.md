# Polana — Launch Checklist

> Complete all items before submitting to App Store and Google Play.

## Before Build

- [ ] Replace `assets/icon.png` with final 1024×1024 app icon
- [ ] Replace `assets/splash.png` with final splash (2048×2048 recommended)
- [ ] Replace `assets/adaptive-icon.png` with Android adaptive icon foreground
- [ ] Replace `assets/notification-icon.png` with notification icon (96×96 white on transparent)
- [ ] Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS secrets
- [ ] Set `EXPO_PUBLIC_SENTRY_DSN` in EAS secrets (production DSN)
- [ ] Set `EXPO_PUBLIC_APP_ENV=production` in EAS production profile

## Supabase Setup

- [ ] Run all migrations (001 → 007) against production database
- [ ] Verify RLS is enabled on every table (`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`)
- [ ] Deploy all Edge Functions: `supabase functions deploy`
- [ ] Configure cron jobs in Supabase dashboard for generate-events, expire-favors, dormant-check
- [ ] Configure email templates (welcome.html, reset.html, invite.html) in Supabase Auth settings
- [ ] Create Storage buckets: `post-media` (private), `avatars` (private)
- [ ] Set Storage bucket policies (no public access)

## Native Module Installation

Run before building (not tracked in package.json to avoid lock-file drift):
```bash
npx expo install react-native-maps
npx expo install @sentry/react-native
npx sentry-expo-upload-sourcemaps --auto-prefix --force
```

## EAS Build

```bash
# Preview build (internal testing)
eas build --platform all --profile preview

# Production build
eas build --platform all --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest
```

## App Store (iOS)

- [ ] App name: "Polana – lokalne społeczności"
- [ ] Subtitle: "Gromady, spotkania, sąsiedzi"
- [ ] Keywords: gromada, społeczność, lokalna, spotkania, sąsiedzi, Polska
- [ ] Privacy policy URL: https://polana.app/privacy
- [ ] Age rating: 4+ (no mature content)
- [ ] Screenshots: 6.5" (iPhone 15 Pro Max), 5.5" (iPhone 8 Plus), 12.9" (iPad Pro)
- [ ] Preview video (optional)
- [ ] Set Polish as primary language

## Google Play

- [ ] Short description (80 chars): "Buduj lokalne społeczności. Spotykaj się w realu."
- [ ] Full description: polish description with keywords
- [ ] Feature graphic: 1024×500
- [ ] Screenshots: phone + 7" tablet
- [ ] Content rating: Everyone
- [ ] Privacy policy URL: https://polana.app/privacy
- [ ] Data safety form: fill out what data is collected and why

## TestFlight / Internal Testing

- [ ] Invite 10 internal testers via TestFlight
- [ ] Verify: register → onboard → join gromada → RSVP event → chat → invite friend
- [ ] Monitor Sentry for crash-free rate ≥ 99% before wide release
- [ ] Monitor cold start time < 3s on iPhone 12 and mid-range Android

## Post-Launch

- [ ] Set up Supabase alerts for DB connection saturation
- [ ] Monitor Sentry error rate daily for first 2 weeks
- [ ] Respond to App Store reviews within 48h
