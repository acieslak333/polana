import { useState, useCallback, useRef } from 'react';
import {
  fetchGromadaPosts,
  createPost,
  deletePost,
  hidePost,
  toggleReaction,
  type Post,
} from '@/services/api/posts';
import { useAuthStore } from '@/stores/authStore';

export function useGromadaPosts(gromadaId: string) {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  const load = useCallback(async (reset = false) => {
    if (reset) {
      pageRef.current = 0;
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    reset ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const data = await fetchGromadaPosts(gromadaId, pageRef.current);
      setPosts((prev) => (reset ? data : [...prev, ...data]));
      if (data.length < 25) setHasMore(false);
      pageRef.current += 1;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Błąd ładowania postów');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gromadaId, hasMore]);

  const refresh = useCallback(() => load(true), [load]);

  const addPost = useCallback(
    async (content: string, mediaUrls: string[] = []) => {
      if (!user) return;

      // Optimistic insert
      const optimistic: Post = {
        id: `optimistic-${Date.now()}`,
        gromada_id: gromadaId,
        author_id: user.id,
        content,
        media_urls: mediaUrls,
        media_types: mediaUrls.map(() => 'image'),
        event_id: null,
        is_hidden: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: null,
        reactions: [],
        comment_count: 0,
      };
      setPosts((prev) => [optimistic, ...prev]);

      try {
        const real = await createPost({
          gromada_id: gromadaId,
          author_id: user.id,
          content,
          media_urls: mediaUrls,
          media_types: mediaUrls.map(() => 'image'),
        });
        setPosts((prev) => prev.map((p) => (p.id === optimistic.id ? real : p)));
      } catch {
        // Revert optimistic insert
        setPosts((prev) => prev.filter((p) => p.id !== optimistic.id));
      }
    },
    [gromadaId, user],
  );

  const removePost = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await deletePost(postId);
    } catch {
      // If server delete fails, re-fetch silently
      load(true);
    }
  }, [load]);

  const react = useCallback(
    async (postId: string, emoji: string) => {
      if (!user) return;
      const already = posts
        .find((p) => p.id === postId)
        ?.reactions.some((r) => r.emoji === emoji && r.user_id === user.id) ?? false;

      // Optimistic toggle
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const reactions = already
            ? p.reactions.filter((r) => !(r.emoji === emoji && r.user_id === user.id))
            : [...p.reactions, { emoji, user_id: user.id }];
          return { ...p, reactions };
        }),
      );

      try {
        await toggleReaction(postId, user.id, emoji, already);
      } catch {
        // Revert
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const reactions = already
              ? [...p.reactions, { emoji, user_id: user.id }]
              : p.reactions.filter((r) => !(r.emoji === emoji && r.user_id === user.id));
            return { ...p, reactions };
          }),
        );
      }
    },
    [posts, user],
  );

  return { posts, loading, refreshing, hasMore, error, load, refresh, addPost, removePost, react };
}
