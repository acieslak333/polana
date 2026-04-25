import { useState, useCallback, useRef } from 'react';
import { fetchCityEvents, upsertRSVP, type EventWithRSVP } from '@/services/api/events';
import { useAuthStore } from '@/stores/authStore';

export function useCityEvents(cityId: string) {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventWithRSVP[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const load = useCallback(async (reset = false) => {
    if (!user || (!hasMore && !reset)) return;
    if (reset) { pageRef.current = 0; setHasMore(true); }
    reset ? setRefreshing(true) : setLoading(true);
    try {
      const data = await fetchCityEvents(cityId, user.id, pageRef.current);
      setEvents((prev) => (reset ? data : [...prev, ...data]));
      if (data.length < 30) setHasMore(false);
      pageRef.current += 1;
    } catch { /* stay cached */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [cityId, user, hasMore]);

  const refresh = useCallback(() => load(true), [load]);

  const rsvp = useCallback(async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return;
    // Optimistic update
    setEvents((prev) => prev.map((e) =>
      e.id !== eventId ? e : {
        ...e,
        user_rsvp: status,
        rsvp_count: status === 'going'
          ? e.rsvp_count + (e.user_rsvp === 'going' ? 0 : 1)
          : e.rsvp_count - (e.user_rsvp === 'going' ? 1 : 0),
      },
    ));
    try { await upsertRSVP(eventId, user.id, status); }
    catch { load(true); /* revert via refresh */ }
  }, [user, load]);

  return { events, loading, refreshing, hasMore, load, refresh, rsvp };
}
