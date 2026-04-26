import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  const supabase = createAdminClient()

  // Verify the user token
  const token = authHeader.slice(7)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  const userId = user.id

  try {
    const [profile, posts, comments, rsvps, messages, friendships] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single().then((r) => r.data),
      supabase.from('posts').select('id, content, media_urls, created_at').eq('author_id', userId).then((r) => r.data ?? []),
      supabase.from('comments').select('id, content, created_at').eq('author_id', userId).then((r) => r.data ?? []),
      supabase.from('event_rsvps').select('event_id, status, responded_at').eq('user_id', userId).then((r) => r.data ?? []),
      supabase.from('messages').select('id, body, created_at').eq('sender_id', userId).then((r) => r.data ?? []),
      supabase.from('friendships').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).then((r) => r.data ?? []),
    ])

    const export_data = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile,
      posts,
      comments,
      event_rsvps: rsvps,
      messages,
      friendships,
    }

    return new Response(JSON.stringify(export_data), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="polana-data-export.json"',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
