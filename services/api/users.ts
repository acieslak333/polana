import { supabase } from '@/services/supabase';
import type { PublicProfile, FriendshipStatus } from '@polana/db-types';
import { trackEvent } from '@/services/analytics';

export type { PublicProfile, FriendshipStatus };

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
  if (!error) trackEvent('join_gromada');
}


export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, nickname, bio, avatar_config, custom_avatar_url, city_id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as PublicProfile;
}

export async function fetchFriendshipStatus(
  currentUserId: string,
  targetUserId: string,
): Promise<FriendshipStatus> {
  const { data, error } = await supabase
    .from('friendships')
    .select('status, requester_id')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),` +
      `and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`,
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) return 'none';
  if (data.status === 'accepted') return 'accepted';
  if (data.requester_id === currentUserId) return 'pending_sent';
  return 'pending_received';
}

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' });
  if (error && error.code !== '23505') throw error;
}

export async function fetchFriends(userId: string): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      status, requester_id, addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, first_name, nickname, bio, avatar_config, custom_avatar_url, city_id),
      addressee:profiles!friendships_addressee_id_fkey(id, first_name, nickname, bio, avatar_config, custom_avatar_url, city_id)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as unknown as {
      requester_id: string;
      requester: PublicProfile;
      addressee: PublicProfile;
    };
    return r.requester_id === userId ? r.addressee : r.requester;
  });
}

export async function fetchPendingRequests(userId: string): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      requester:profiles!friendships_requester_id_fkey(id, first_name, nickname, bio, avatar_config, custom_avatar_url, city_id)
    `)
    .eq('addressee_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as unknown as { requester: PublicProfile };
    return r.requester;
  });
}

export async function acceptFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId);
  if (error) throw error;
}

export async function declineFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId);
  if (error) throw error;
}
