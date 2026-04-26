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
  const token = authHeader.slice(7)
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  const userId = user.id

  try {
    // Cascade deletes handle profile data via FK constraints.
    // Delete the auth user — this triggers ON DELETE CASCADE on profiles.
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error

    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
