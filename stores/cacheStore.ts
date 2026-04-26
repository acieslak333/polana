import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Post } from '@/services/api/posts'
import type { GromadaWithInterests } from '@/services/api/gromady'

interface CacheState {
  feedPosts: Post[]
  gromadyList: GromadaWithInterests[]
  lastFeedSync: string | null
  lastGromadySync: string | null
  setFeedPosts: (posts: Post[]) => void
  setGromadyList: (list: GromadaWithInterests[]) => void
  clearCache: () => void
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set) => ({
      feedPosts: [],
      gromadyList: [],
      lastFeedSync: null,
      lastGromadySync: null,
      setFeedPosts: (posts) =>
        set({ feedPosts: posts, lastFeedSync: new Date().toISOString() }),
      setGromadyList: (list) =>
        set({ gromadyList: list, lastGromadySync: new Date().toISOString() }),
      clearCache: () =>
        set({ feedPosts: [], gromadyList: [], lastFeedSync: null, lastGromadySync: null }),
    }),
    {
      name: 'polana-cache',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        feedPosts: state.feedPosts.slice(0, 50),
        gromadyList: state.gromadyList,
        lastFeedSync: state.lastFeedSync,
        lastGromadySync: state.lastGromadySync,
      }),
    },
  ),
)
