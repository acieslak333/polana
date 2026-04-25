import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, corsHeaders } from '../_shared/supabase-admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const supabase = createAdminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: activeByPosts } = await supabase
      .from('posts')
      .select('gromada_id')
      .gte('created_at', thirtyDaysAgo)

    const { data: activeByEvents } = await supabase
      .from('events')
      .select('gromada_id')
      .gte('starts_at', thirtyDaysAgo)
      .not('gromada_id', 'is', null)

    const activeIds = new Set([
      ...(activeByPosts ?? []).map((p: { gromada_id: string }) => p.gromada_id),
      ...(activeByEvents ?? []).map((e: { gromada_id: string }) => e.gromada_id),
    ])

    const { data: allActive } = await supabase
      .from('gromady')
      .select('id')
      .eq('status', 'active')

    const dormantIds = (allActive ?? [])
      .map((g: { id: string }) => g.id)
      .filter((id: string) => !activeIds.has(id))

    if (dormantIds.length === 0) {
      return new Response(
        JSON.stringify({ flagged: 0 }),
        { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from('gromady')
      .update({ status: 'dormant' })
      .in('id', dormantIds)

    if (error) throw error

    return new Response(
      JSON.stringify({ flagged: dormantIds.length, ids: dormantIds }),
      { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
})
