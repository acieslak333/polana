import { supabase } from '../supabase'
import type { CrossoverProposal } from '@polana/db-types'

export type { CrossoverProposal }

export async function fetchCrossovers(gromadaId: string): Promise<CrossoverProposal[]> {
  const { data, error } = await supabase
    .from('crossover_proposals')
    .select('*')
    .or(`from_gromada_id.eq.${gromadaId},to_gromada_id.eq.${gromadaId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CrossoverProposal[]
}

export async function proposeCrossover(params: {
  fromGromadaId: string
  toGromadaId: string
  title: string
  description?: string
}): Promise<CrossoverProposal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Musisz być zalogowany')

  const { data, error } = await supabase
    .from('crossover_proposals')
    .insert({
      from_gromada_id: params.fromGromadaId,
      to_gromada_id: params.toGromadaId,
      title: params.title,
      description: params.description ?? null,
      proposed_by: user.id,
      status: 'proposed',
      vote_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as CrossoverProposal
}

export async function voteCrossover(crossoverId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_crossover_votes', {
    crossover_id: crossoverId,
  })
  if (error) throw error
}

export async function updateCrossoverStatus(
  crossoverId: string,
  status: CrossoverProposal['status']
): Promise<void> {
  const { error } = await supabase
    .from('crossover_proposals')
    .update({ status })
    .eq('id', crossoverId)

  if (error) throw error
}
