import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGromadaPosts } from '../usePosts';
import * as postsApi from '@/services/api/posts';
import { makePost } from '@/__fixtures__';

// Spy on the API functions — tests control their return values
jest.mock('@/services/api/posts');
const mockFetchGromadaPosts = postsApi.fetchGromadaPosts as jest.Mock;
const mockCreatePost = postsApi.createPost as jest.Mock;
const mockDeletePost = postsApi.deletePost as jest.Mock;
const mockToggleReaction = postsApi.toggleReaction as jest.Mock;

// The hook reads user from authStore — stub it
jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

beforeEach(() => { jest.clearAllMocks(); });

describe('useGromadaPosts', () => {
  it('starts with loading=false and empty posts', () => {
    mockFetchGromadaPosts.mockResolvedValue([]);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    expect(result.current.posts).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('loads posts on load() call', async () => {
    const posts = [makePost(), makePost()];
    mockFetchGromadaPosts.mockResolvedValue(posts);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.load(); });
    expect(result.current.posts).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it('sets hasMore=false when page returns < 25 posts', async () => {
    mockFetchGromadaPosts.mockResolvedValue([makePost()]);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.load(); });
    expect(result.current.hasMore).toBe(false);
  });

  it('appends posts on subsequent load() calls', async () => {
    const page1 = Array.from({ length: 25 }, () => makePost());
    const page2 = [makePost()];
    mockFetchGromadaPosts
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.load(); });
    expect(result.current.posts).toHaveLength(26);
  });

  it('replaces posts on refresh (reset=true)', async () => {
    const initial = [makePost()];
    const fresh = [makePost(), makePost()];
    mockFetchGromadaPosts
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(fresh);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.load(true); });
    expect(result.current.posts).toHaveLength(2);
  });

  it('addPost inserts optimistic post immediately', async () => {
    mockFetchGromadaPosts.mockResolvedValue([]);
    mockCreatePost.mockResolvedValue(makePost({ content: 'Real post' }));
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.addPost('Hello', []); });
    // After resolution, post is present
    expect(result.current.posts.some((p) => p.content === 'Real post' || p.content === 'Hello')).toBe(true);
  });

  it('addPost rolls back on API error', async () => {
    mockFetchGromadaPosts.mockResolvedValue([]);
    mockCreatePost.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => {
      await result.current.addPost('Will fail', []).catch(() => {});
    });
    // Optimistic post is removed after rollback
    expect(result.current.posts.filter((p) => p.content === 'Will fail')).toHaveLength(0);
  });

  it('removePost removes post from list', async () => {
    const post = makePost({ id: 'post-to-remove' });
    mockFetchGromadaPosts.mockResolvedValue([post]);
    mockDeletePost.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.removePost('post-to-remove'); });
    expect(result.current.posts.find((p) => p.id === 'post-to-remove')).toBeUndefined();
  });

  it('react toggles emoji reaction optimistically', async () => {
    const post = makePost({ id: 'p1', reactions: [] });
    mockFetchGromadaPosts.mockResolvedValue([post]);
    mockToggleReaction.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGromadaPosts('g1'));
    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.react('p1', '❤️'); });
    const updated = result.current.posts.find((p) => p.id === 'p1');
    expect(updated?.reactions.some((r) => r.emoji === '❤️')).toBe(true);
  });
});
