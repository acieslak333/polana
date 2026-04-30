import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'
import { makeLogger } from '../_shared/logger.ts'
import { requireAuth, checkRateLimit, requestId, json } from '../_shared/security.ts'

interface NotificationPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  const reqId = requestId(req)

  // Validate JWT — must be a real user session, not just any bearer token
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const supabase = createAdminClient()
  const log = makeLogger(supabase, 'send-notification')

  // Rate limit: 10 push notifications per minute per caller
  const rateCheck = await checkRateLimit(auth.userId, 'send-notification', supabase)
  if (!rateCheck.ok) {
    await log.start('push-rate-limited', { userId: auth.userId, reqId })
    return rateCheck.response
  }

  try {
    const payload: NotificationPayload = await req.json()
    const { userId: targetUserId, title, body, data } = payload

    // Validate that the target userId is a real profile (not user-supplied garbage)
    const { data: profileCheck, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single()

    if (profileError || !profileCheck) {
      return json({ sent: false, reason: 'target user not found' }, 404)
    }

    const done = log.start('push', { userId: targetUserId, reqId })

    // Decrypt the push token using the server-side decrypt_field() function.
    // This is the ONLY correct way to read push tokens — never select push_token directly.
    const { data: tokenRow, error: tokenError } = await supabase
      .rpc('decrypt_field_for_user', { p_user_id: targetUserId })

    // Fallback: if encrypted token not yet migrated, try legacy plaintext column
    let pushToken: string | null = tokenRow ?? null

    if (!pushToken && !tokenError) {
      const { data: legacy } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', targetUserId)
        .single()
      pushToken = legacy?.push_token ?? null
    }

    if (!pushToken) {
      await done(true)
      return json({ sent: false, reason: 'no push token' })
    }

    // Validate token format — Expo push tokens start with ExponentPushToken[
    if (!pushToken.startsWith('ExponentPushToken[')) {
      await done(false)
      return json({ sent: false, reason: 'invalid token format' })
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    // Detect Expo error responses (they return 200 with error in body)
    const ticket = result?.data
    if (ticket?.status === 'error') {
      await done(false)
      return json({ sent: false, reason: ticket.message ?? 'Expo error' })
    }

    await done(true)
    return new Response(
      JSON.stringify({ sent: true, result }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'X-Request-Id': reqId } }
    )
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
