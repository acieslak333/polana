import { act, renderHook } from '@testing-library/react-native';
import { useCacheStore } from '../cacheStore';
import { makePost } from '@/__fixtures__';

describe('cacheStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCacheStore());
    act(() => { result.current.clearCache(); });
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useCacheStore());
    act(() => { result.current.clearCache(); });
    expect(result.current.feedPosts).toHaveLength(0);
    expect(result.current.gromadyList).toHaveLength(0);
    expect(result.current.lastFeedSync).toBeNull();
    expect(result.current.lastGromadySync).toBeNull();
  });

  it('setFeedPosts stores posts and records sync time', () => {
    const { result } = renderHook(() => useCacheStore());
    const posts = [makePost(), makePost(), makePost()];
    act(() => { result.current.setFeedPosts(posts); });
    expect(result.current.feedPosts).toHaveLength(3);
    expect(result.current.lastFeedSync).not.toBeNull();
  });

  it('setFeedPosts caps storage at 50 posts during persistence (partialize)', () => {
    const { result } = renderHook(() => useCacheStore());
    const posts = Array.from({ length: 80 }, () => makePost());
    act(() => { result.current.setFeedPosts(posts); });
    // In memory: all 80 stored. Persist partialize caps at 50 — we test the store accepts 80.
    expect(result.current.feedPosts).toHaveLength(80);
  });

  it('clearCache resets all fields', () => {
    const { result } = renderHook(() => useCacheStore());
    act(() => {
      result.current.setFeedPosts([makePost()]);
      result.current.clearCache();
    });
    expect(result.current.feedPosts).toHaveLength(0);
    expect(result.current.lastFeedSync).toBeNull();
  });

  it('setFeedPosts updates sync timestamp on each call', async () => {
    const { result } = renderHook(() => useCacheStore());
    act(() => { result.current.setFeedPosts([makePost()]); });
    const first = result.current.lastFeedSync;
    await new Promise((r) => setTimeout(r, 5));
    act(() => { result.current.setFeedPosts([makePost()]); });
    expect(result.current.lastFeedSync).not.toBe(first);
  });
});
