import { useState, useCallback } from 'react';
import {
  fetchGromadaFavors,
  createFavorRequest,
  offerHelp,
  markFavorHelped,
  type FavorRequest,
} from '@/services/api/favors';
import { useAuthStore } from '@/stores/authStore';

export function useFavors(gromadaId: string) {
  const { user } = useAuthStore();
  const [favors, setFavors] = useState<FavorRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!gromadaId) return;
    setLoading(true);
    try {
      const data = await fetchGromadaFavors(gromadaId);
      setFavors(data);
    } catch { /* stay empty */ }
    finally { setLoading(false); }
  }, [gromadaId]);

  const create = useCallback(async (description: string) => {
    if (!user || !gromadaId) return;
    const favor = await createFavorRequest({
      gromada_id: gromadaId,
      requested_by: user.id,
      description,
    });
    setFavors((prev) => [favor, ...prev]);
  }, [gromadaId, user]);

  const offer = useCallback(async (favorId: string, message?: string) => {
    if (!user) return;
    await offerHelp({ favor_request_id: favorId, offered_by: user.id, message });
  }, [user]);

  const markHelped = useCallback(async (favorId: string) => {
    await markFavorHelped(favorId);
    setFavors((prev) => prev.filter((f) => f.id !== favorId));
  }, []);

  return { favors, loading, load, create, offer, markHelped };
}
