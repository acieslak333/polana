import { supabase } from '@/services/supabase';

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  // 23505 = unique_violation: block already exists, treat as success
  if (error && error.code !== '23505') throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function fetchBlockedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.blocked_id as string);
}

export async function muteChat(chatRoomId: string, userId: string, hours = 24): Promise<void> {
  const mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('chat_mutes')
    .upsert({ chat_room_id: chatRoomId, user_id: userId, muted_until: mutedUntil });
  if (error) throw error;
}

export async function unmuteChat(chatRoomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_mutes')
    .delete()
    .eq('chat_room_id', chatRoomId)
    .eq('user_id', userId);
  if (error) throw error;
}
