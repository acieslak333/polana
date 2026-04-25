#!/usr/bin/env bash
# Sends a push notification via the send-notification Edge Function.
# Called when a task hits 3 retries and is being skipped.
#
# Usage: ./scripts/notify_blocker.sh <task-id> <reason>
# Requires: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local

set -e

TASK_ID="${1:-unknown-task}"
REASON="${2:-blocker detected}"

# Load env vars if .env.local exists
if [ -f ".env.local" ]; then
  set -a
  source .env.local
  set +a
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Warning: SUPABASE_URL or ANON_KEY not set — skipping push notification"
  exit 0
fi

PAYLOAD=$(cat <<EOF
{
  "userId": "$(git config user.email 2>/dev/null || echo 'unknown')",
  "title": "Blocker: $TASK_ID",
  "body": "$REASON — skipped after 3 retries. Check GitHub issues.",
  "data": {
    "type": "blocker",
    "taskId": "$TASK_ID"
  }
}
EOF
)

curl -s -X POST \
  "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/send-notification" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --max-time 10 \
  || echo "Warning: push notification failed (non-fatal)"

echo "Blocker notification sent for $TASK_ID"
