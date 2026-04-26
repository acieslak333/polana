import { supabase } from '@/services/supabase'
import type { GromadaInvite } from '@polana/db-types'

export type { GromadaInvite }

export async function createInvite(gromadaId: string, createdBy: string): Promise<GromadaInvite> {
  const { data, error } = await supabase
    .from('gromada_invites')
    .insert({ gromada_id: gromadaId, created_by: createdBy })
    .select('id, gromada_id, code, expires_at, used_by')
    .single()
  if (error) throw error
  return data as GromadaInvite
}

export async function fetchInviteByCode(code: string): Promise<GromadaInvite & {
  gromady: { name: string; member_count: number; max_members: number }
}> {
  const { data, error } = await supabase
    .from('gromada_invites')
    .select('id, gromada_id, code, expires_at, used_by, gromady(name, member_count, max_members)')
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .is('used_by', null)
    .single()
  if (error) throw error
  return data as unknown as GromadaInvite & { gromady: { name: string; member_count: number; max_members: number } }
}

export async function acceptInvite(code: string, userId: string): Promise<void> {
  const invite = await fetchInviteByCode(code)
  const { error: joinErr } = await supabase
    .from('gromada_members')
    .insert({ gromada_id: invite.gromada_id, user_id: userId, role: 'newcomer' })
  if (joinErr && joinErr.code !== '23505') throw joinErr

  await supabase
    .from('gromada_invites')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('id', invite.id)
}
