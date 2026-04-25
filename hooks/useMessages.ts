import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { fetchMessages, sendMessage, type Message } from '@/services/api/messages';
import { useAuthStore } from '@/stores/authStore';

export function useChatMessages(chatRoomId: string) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  // Initial load
  useEffect(() => {
    if (!chatRoomId) return;
    pageRef.current = 0;
    fetchMessages(chatRoomId, 0)
      .then((data) => { setMessages(data); if (data.length < 50) setHasMore(false); pageRef.current = 1; })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${chatRoomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_room_id=eq.${chatRoomId}` },
        (payload) => {
          const msg = payload.new as Message;
          // Avoid duplicates (our optimistic messages already set)
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatRoomId]);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    try {
      const older = await fetchMessages(chatRoomId, pageRef.current);
      setMessages((prev) => [...older, ...prev]);
      if (older.length < 50) setHasMore(false);
      pageRef.current += 1;
    } catch { /* keep existing */ }
  }, [chatRoomId, hasMore]);

  const send = useCallback(async (body: string) => {
    if (!user || !body.trim()) return;

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      chat_room_id: chatRoomId,
      sender_id: user.id,
      body: body.trim(),
      media_url: null,
      created_at: new Date().toISOString(),
      profiles: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await sendMessage({ chat_room_id: chatRoomId, sender_id: user.id, body: body.trim() });
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? real : m));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  }, [chatRoomId, user]);

  return { messages, loading, hasMore, loadMore, send };
}
