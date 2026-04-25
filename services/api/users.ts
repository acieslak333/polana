import { supabase } from '@/services/supabase';

export async function fetchInterests() {
  const { data, error } = await supabase
    .from('interests')
    .select('id, name_pl, name_en, emoji, category')
    .eq('is_default', true)
    .order('category')
    .order('name_pl');
  if (error) throw error;
  return data;
}

export async function fetchCities() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
}

export async function fetchGromadySuggestions(cityId: string, interestIds: string[]) {
  const { data, error } = await supabase
    .from('gromady')
    .select(`
      id, name, avatar_config, member_count, max_members, size_type,
      gromada_interests(interest_id, interests(name_pl, emoji))
    `)
    .eq('city_id', cityId)
    .eq('status', 'active')
    .limit(9); // over-fetch; full-group filter happens in JS
  if (error) throw error;

  // Sort by interest overlap, filter out full groups, return top 3
  const scored = (data ?? [])
    .filter((g) => g.member_count < g.max_members)
    .map((g) => {
    const gInterestIds = (g.gromada_interests as any[]).map(
      (gi: any) => gi.interest_id,
    );
    const overlap = gInterestIds.filter((id: string) => interestIds.includes(id)).length;
    return { ...g, overlap };
  });

  return scored
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);
}

export async function saveUserInterests(userId: string, interestIds: string[]) {
  // Delete old, insert new
  await supabase.from('user_interests').delete().eq('user_id', userId);
  if (interestIds.length === 0) return;
  const { error } = await supabase.from('user_interests').insert(
    interestIds.map((interest_id) => ({ user_id: userId, interest_id })),
  );
  if (error) throw error;
}

export async function joinGromada(gromadaId: string, userId: string) {
  const { error } = await supabase
    .from('gromada_members')
    .insert({ gromada_id: gromadaId, user_id: userId, role: 'member' });
  if (error && error.code !== '23505') throw error;
}
