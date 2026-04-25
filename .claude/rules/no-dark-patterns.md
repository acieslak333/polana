# Anti-Dark-Pattern Rules

These rules are identity-level constraints. They apply everywhere, always.

1. No like buttons on posts — emoji reactions only (Slack-style add/remove)
2. No follower counts visible anywhere in the UI
3. No algorithmic feed reordering — all feeds ORDER BY created_at DESC, always
4. No autoplay video with sound — muted autoplay is allowed
5. No notification inflation — badge counts are actionable items only (unread DMs, mentions)
6. No streak guilt mechanics — no "you'll lose your streak" messaging
7. No FOMO copy — never "X people are waiting", "don't miss out", etc.
8. No confirmation modals for reversible actions — use undo toasts (5–7s) instead
9. No permission requests without contextual priming — always explain WHY before the OS prompt
10. No skeleton screens that animate indefinitely — show error + retry after 10s timeout
11. No empty states without a call to action — always 1 sentence + 1 primary action button
12. User data is never passed to external AI services — analytics events contain no PII
