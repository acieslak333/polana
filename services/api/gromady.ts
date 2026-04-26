import { supabase } from '@/services/supabase';

export type GromadaRow = {
  id: string;
  name: string;
  avatar_config: Record<string, unknown>;
  city_id: string;
  size_type: 'small' | 'medium' | 'large';
  max_members: number;
  elder_id: string | null;
  member_count: number;
  description: string | null;
  last_activity_at: string;
  status: 'active' | 'dormant' | 'archived';
  total_meetings_count: number;
  meetings_this_month: number;
  meetings_this_week: number;
  favors_exchanged: number;
  created_at: string;
};

export type GromadaWithInterests = GromadaRow & {
  gromada_interests: {
    interest_id: string;
    interests: { name_pl: string; emoji: string } | null;
  }[];
  gromada_members: { user_id: string; role: string }[];
};

const GROMADA_FULL_QUERY = `
  id, name, avatar_config, city_id, size_type, max_members,
  elder_id, member_count, description, last_activity_at, status,
  total_meetings_count, meetings_this_month, meetings_this_week,
  favors_exchanged, created_at,
  gromada_interests(interest_id, interests(name_pl, emoji)),
  gromada_members(user_id, role)
`;

const PAGE_SIZE = 20;

export async function fetchMyGromady(userId: string): Promise<GromadaWithInterests[]> {
  // First get the gromada IDs the user belongs to
  const { data: memberships, error: memErr } = await supabase
    .from('gromada_members')
    .select('gromada_id')
    .eq('user_id', userId);
  if (memErr) throw memErr;

  const ids = (memberships ?? []).map((m) => m.gromada_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('gromady')
    .select(GROMADA_FULL_QUERY)
    .in('id', ids)
    .eq('status', 'active')
    .order('last_activity_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as GromadaWithInterests[];
}

export async function fetchGromada(id: string): Promise<GromadaWithInterests> {
  const { data, error } = await supabase
    .from('gromady')
    .select(GROMADA_FULL_QUERY)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as GromadaWithInterests;
}

export async function searchGromady(
  cityId: string,
  query: string,
  interestIds: string[],
): Promise<GromadaWithInterests[]> {
  let builder = supabase
    .from('gromady')
    .select(GROMADA_FULL_QUERY)
    .eq('city_id', cityId)
    .eq('status', 'active')
    .order('member_count', { ascending: false })
    .limit(30);

  if (query.trim()) {
    builder = builder.ilike('name', `%${query.trim()}%`);
  }

  const { data, error } = await builder;
  if (error) throw error;

  const results = (data ?? []) as unknown as GromadaWithInterests[];

  if (interestIds.length === 0) return results;

  return results.sort((a, b) => {
    const aOverlap = a.gromada_interests.filter((gi) =>
      interestIds.includes(gi.interest_id),
    ).length;
    const bOverlap = b.gromada_interests.filter((gi) =>
      interestIds.includes(gi.interest_id),
    ).length;
    return bOverlap - aOverlap;
  });
}

export async function fetchAllGromady(
  cityId: string,
  page = 0,
  interestId?: string | null,
): Promise<GromadaRow[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (interestId) {
    // Join through gromada_interests to filter by a specific interest
    const { data, error } = await supabase
      .from('gromada_interests')
      .select(`
        gromady!inner(
          id, name, avatar_config, city_id, size_type, max_members,
          elder_id, member_count, description, last_activity_at, status,
          total_meetings_count, meetings_this_month, meetings_this_week,
          favors_exchanged, created_at
        )
      `)
      .eq('interest_id', interestId)
      .eq('gromady.city_id', cityId)
      .eq('gromady.status', 'active')
      .order('gromady.member_count', { ascending: false })
      .range(from, to);
    if (error) throw error;

    return (data ?? []).map((row) => {
      const r = row as unknown as { gromady: GromadaRow };
      return r.gromady;
    });
  }

  const { data, error } = await supabase
    .from('gromady')
    .select(
      'id, name, avatar_config, city_id, size_type, max_members, elder_id, member_count, description, last_activity_at, status, total_meetings_count, meetings_this_month, meetings_this_week, favors_exchanged, created_at',
    )
    .eq('city_id', cityId)
    .eq('status', 'active')
    .order('member_count', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return (data ?? []) as GromadaRow[];
}

export async function createGromada(payload: {
  name: string;
  city_id: string;
  size_type: 'small' | 'medium' | 'large';
  max_members: number;
  description: string | null;
  elder_id: string;
  interest_ids: string[];
}): Promise<GromadaRow> {
  const { interest_ids, ...gromadaData } = payload;

  const { data, error } = await supabase
    .from('gromady')
    .insert({ ...gromadaData, member_count: 0 })
    .select()
    .single();
  if (error) throw error;

  // Insert interests (max 3, enforced by DB trigger)
  if (interest_ids.length > 0) {
    const { error: intErr } = await supabase
      .from('gromada_interests')
      .insert(interest_ids.map((interest_id) => ({ gromada_id: data.id, interest_id })));
    if (intErr) throw intErr;
  }

  // Auto-join creator as elder
  const { error: memErr } = await supabase
    .from('gromada_members')
    .insert({ gromada_id: data.id, user_id: payload.elder_id, role: 'elder' });
  if (memErr) throw memErr;

  return data as GromadaRow;
}

export async function updateGromada(
  id: string,
  updates: Partial<Pick<GromadaRow, 'name' | 'description'>>,
): Promise<GromadaRow> {
  const { data, error } = await supabase
    .from('gromady')
    .update({ ...updates, last_activity_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as GromadaRow;
}

export async function leaveGromada(gromadaId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('gromada_members')
    .delete()
    .eq('gromada_id', gromadaId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchGromadaMembers(gromadaId: string) {
  const { data, error } = await supabase
    .from('gromada_members')
    .select('user_id, role, joined_at, profiles(id, first_name, nickname, avatar_config)')
    .eq('gromada_id', gromadaId)
    .order('role')
    .order('joined_at');
  if (error) throw error;
  return data ?? [];
}

export async function fetchUpcomingEvents(gromadaId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, location_name, starts_at, event_type, status')
    .eq('gromada_id', gromadaId)
    .eq('status', 'upcoming')
    .order('starts_at')
    .limit(5);
  if (error) throw error;
  return data ?? [];
}

export async function fetchGromadyForElder(userId: string): Promise<GromadaRow[]> {
  const { data, error } = await supabase
    .from('gromady')
    .select('id, name, avatar_config, member_count, max_members, size_type, elder_id, status, created_at')
    .eq('elder_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return (data ?? []) as GromadaRow[];
}
