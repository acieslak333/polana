import { supabase } from '@/services/supabase';

export type Message = {
  id: string;
  chat_room_id: string;
  sender_id: string;
  body: string;
  media_url: string | null;
  created_at: string;
  profiles: { id: string; first_name: string; nickname: string | null; avatar_config: Record<string, unknown> } | null;
};

export type ChatRoom = {
  id: string;
  type: 'gromada' | 'event' | 'direct';
  gromada_id: string | null;
  event_id: string | null;
  participant_1: string | null;
  participant_2: string | null;
  created_at: string;
  // Joined
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  display_name?: string;
  display_avatar?: Record<string, unknown>;
};

const MESSAGE_QUERY = `
  id, chat_room_id, sender_id, body, media_url, created_at,
  profiles(id, first_name, nickname, avatar_config)
`;

export async function fetchChatRooms(userId: string): Promise<ChatRoom[]> {
  // Gromada chats the user is a member of
  const { data: memberships } = await supabase
    .from('gromada_members')
    .select('gromada_id')
    .eq('user_id', userId);
  const gromadaIds = (memberships ?? []).map((m) => m.gromada_id);

  const roomQueries = await Promise.all([
    // Gromada chat rooms
    gromadaIds.length > 0
      ? supabase.from('chat_rooms').select('id, type, gromada_id, gromady(name, avatar_config)').eq('type', 'gromada').in('gromada_id', gromadaIds)
      : Promise.resolve({ data: [], error: null }),
    // DMs
    supabase.from('chat_rooms').select('id, type, participant_1, participant_2, created_at').eq('type', 'direct').or(`participant_1.eq.${userId},participant_2.eq.${userId}`),
  ]);

  const gromadaRooms = (roomQueries[0].data ?? []).map((r: any) => ({
    ...r,
    display_name: r.gromady?.name ?? 'Gromada',
    display_avatar: r.gromady?.avatar_config ?? {},
  }));

  const dmRooms = (roomQueries[1].data ?? []) as ChatRoom[];

  return [...gromadaRooms, ...dmRooms] as ChatRoom[];
}

export async function fetchMessages(chatRoomId: string, page = 0): Promise<Message[]> {
  const from = page * 50;
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_QUERY)
    .eq('chat_room_id', chatRoomId)
    .order('created_at', { ascending: false })
    .range(from, from + 49);
  if (error) throw error;
  return ((data ?? []) as unknown as Message[]).reverse();
}

export async function sendMessage(payload: {
  chat_room_id: string;
  sender_id: string;
  body: string;
  media_url?: string | null;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select(MESSAGE_QUERY)
    .single();
  if (error) throw error;
  return data as unknown as Message;
}

export async function getOrCreateDM(userId: string, otherId: string): Promise<string> {
  const [p1, p2] = [userId, otherId].sort();
  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('type', 'direct')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({ type: 'direct', participant_1: p1, participant_2: p2 })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
