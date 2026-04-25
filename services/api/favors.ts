import { supabase } from '@/services/supabase';

export type FavorRequest = {
  id: string;
  gromada_id: string | null;
  requested_by: string;
  description: string;
  expires_at: string;
  status: 'open' | 'helped' | 'expired';
  created_at: string;
  profiles: { id: string; first_name: string; nickname: string | null; avatar_config: Record<string, unknown> } | null;
  favor_offers: { id: string; offered_by: string; message: string | null }[];
};

const FAVOR_QUERY = `
  id, gromada_id, requested_by, description, expires_at, status, created_at,
  profiles(id, first_name, nickname, avatar_config),
  favor_offers(id, offered_by, message)
`;

export async function fetchGromadaFavors(gromadaId: string): Promise<FavorRequest[]> {
  const { data, error } = await supabase
    .from('favor_requests')
    .select(FAVOR_QUERY)
    .eq('gromada_id', gromadaId)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FavorRequest[];
}

export async function createFavorRequest(payload: {
  gromada_id: string;
  requested_by: string;
  description: string;
}): Promise<FavorRequest> {
  const { data, error } = await supabase
    .from('favor_requests')
    .insert({ ...payload, status: 'open' })
    .select(FAVOR_QUERY)
    .single();
  if (error) throw error;
  return data as unknown as FavorRequest;
}

export async function offerHelp(payload: {
  favor_request_id: string;
  offered_by: string;
  message?: string;
}): Promise<void> {
  const { error } = await supabase.from('favor_offers').insert(payload);
  if (error) throw error;
}

export async function markFavorHelped(favorId: string): Promise<void> {
  const { error } = await supabase
    .from('favor_requests')
    .update({ status: 'helped' })
    .eq('id', favorId);
  if (error) throw error;
}
