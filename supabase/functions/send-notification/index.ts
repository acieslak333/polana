import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'
import { makeLogger } from '../_shared/logger.ts'
import { requireAuth, checkRateLimit, requestId, json } from '../_shared/security.ts'

type NotificationType = 'new_message' | 'new_event' | 'rsvp_reminder' | 'favor_offer' | 'invite'

interface NotificationPayload {
  userId: string
  type: NotificationType
  variables: Record<string, string>
  data?: Record<string, string>
}

const LANGUAGE_FALLBACKS = ['en', 'pl']

function interpolate(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (str, [key, value]) => str.replaceAll(`{${key}}`, value),
    template,
  )
}

async function fetchTemplate(
  supabase: ReturnType<typeof createAdminClient>,
  type: string,
  language: string,
): Promise<{ title: string; body: string } | null> {
  const candidates = [language, ...LANGUAGE_FALLBACKS.filter((l) => l !== language)]
  for (const lang of candidates) {
    const { data } = await supabase
      .from('notification_templates')
      .select('title, body')
      .eq('type', type)
      .eq('language', lang)
      .single()
    if (data) return data
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  const reqId = requestId(req)
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const supabase = createAdminClient()
  const log = makeLogger(supabase, 'send-notification')

  const rateCheck = await checkRateLimit(auth.userId, 'send-notification', supabase)
  if (!rateCheck.ok) {
    await log.start('push-rate-limited', { userId: auth.userId, reqId })
    return rateCheck.response
  }

  try {
    const payload: NotificationPayload = await req.json()
    const { userId: targetUserId, type, variables, data } = payload

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, language, push_token, push_token_enc')
      .eq('id', targetUserId)
      .single()

    if (profileError || !profileData) {
      return json({ sent: false, reason: 'target user not found' }, 404)
    }

    const done = log.start('push', { userId: targetUserId, type, reqId })

    let pushToken: string | null = null
    if (profileData.push_token_enc) {
      const { data: decrypted } = await supabase
        .rpc('decrypt_field_for_user', { p_user_id: targetUserId })
      pushToken = decrypted ?? null
    }
    if (!pushToken && profileData.push_token) {
      pushToken = profileData.push_token
    }

    if (!pushToken) {
      await done(true)
      return json({ sent: false, reason: 'no push token' })
    }

    if (!pushToken.startsWith('ExponentPushToken[')) {
      await done(false)
      return json({ sent: false, reason: 'invalid token format' })
    }

    const userLanguage = profileData.language ?? 'pl'
    const template = await fetchTemplate(supabase, type, userLanguage)

    if (!template) {
      await done(false)
      return json({ sent: false, reason: `no template for type=${type}` }, 422)
    }

    const title = interpolate(template.title, variables)
    const body  = interpolate(template.body,  variables)

    const message = { to: pushToken, sound: 'default', title, body, data: data ?? {} }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify(message),
    })

    const result = await response.json()
    const ticket = result?.data

    if (ticket?.status === 'error') {
      await done(false)
      return json({ sent: false, reason: ticket.message ?? 'Expo error' })
    }

    await done(true)
    return new Response(
      JSON.stringify({ sent: true, result }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'X-Request-Id': reqId } },
    )
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
