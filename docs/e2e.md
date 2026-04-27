# E2E Testing with Maestro

## Overview

End-to-end tests run on a real iOS Simulator using [Maestro](https://maestro.mobile.dev).  
They test complete user journeys, not individual components.

## Local Setup

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version

# Build the app for the simulator
npx expo run:ios

# Run all flows
maestro test .maestro/

# Run a single flow
maestro test .maestro/02_create_post.yaml

# Run flows with a tag
maestro test .maestro/ --tags critical
```

## Flows

| File | What it tests | Tags |
|------|--------------|------|
| `01_register_onboard.yaml` | Registration + full 7-step onboarding | critical, onboarding |
| `02_create_post.yaml` | Open Gromada, compose and submit a post | critical, posts |
| `03_rsvp_event.yaml` | Find event, RSVP "Idę", verify in calendar | critical, events |
| `04_send_message.yaml` | Open chat, type and send a message | critical, chat |
| `05_invite_flow.yaml` | Generate invite link from admin panel | critical, invites |

## Test Environment

E2E tests use a **separate Supabase project** seeded with test data.

Required secrets in GitHub → Settings → Secrets:
- `E2E_SUPABASE_URL` — test project URL
- `E2E_SUPABASE_ANON_KEY` — test project anon key

The test project is seeded from `supabase/migrations/003_seed_data.sql`.  
Reset between runs: `supabase db reset --linked` on the test project.

## CI Schedule

E2E runs nightly at 02:00 UTC via `.github/workflows/e2e.yml`.  
Trigger manually: Actions → E2E Tests → Run workflow.

## Adding a New Flow

1. Create `.maestro/NN_flow_name.yaml`
2. Follow the selector hierarchy: `id` > `text` > `index`
3. Use `testID` props on key elements in the app code:
   ```tsx
   <Pressable testID="post-submit-button" ...>
   ```
4. Tag the flow with `critical` if it covers a user-facing feature
5. Add it to this table

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `assertVisible` fails | Add `waitForAnimationToEnd` before the assertion |
| App not found | Run `npx expo run:ios` first, verify simulator is booted |
| Flaky timing | Increase `takeScreenshot` intervals in the flow |
| Wrong element tapped | Use `testID` instead of `text` for elements with dynamic content |
