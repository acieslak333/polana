import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

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

  try {
    const payload: NotificationPayload = await req.json()
    const { userId, title, body, data } = payload

    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single()

    if (error || !profile?.push_token) {
      return new Response(
        JSON.stringify({ sent: false, reason: 'no push token' }),
        { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      )
    }

    const message = {
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({ sent: true, result }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
})
