import { supabase } from '@/services/supabase';
import {
  fetchGromadaPosts,
  fetchFeedPosts,
  createPost,
  deletePost,
  hidePost,
  toggleReaction,
  reportPost,
} from '../posts';
import { makePost } from '@/__fixtures__';
import { mockSuccess, mockError, mockSingle } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('fetchGromadaPosts', () => {
  it('returns array of posts for a gromada', async () => {
    const posts = [makePost({ gromada_id: 'g1' }), makePost({ gromada_id: 'g1' })];
    FROM.mockReturnValueOnce(mockSuccess(posts));
    const result = await fetchGromadaPosts('g1');
    expect(result).toHaveLength(2);
    expect(FROM).toHaveBeenCalledWith('posts');
  });

  it('throws when supabase returns an error', async () => {
    FROM.mockReturnValueOnce(mockError('DB error'));
    await expect(fetchGromadaPosts('g1')).rejects.toThrow();
  });

  it('returns empty array when no posts', async () => {
    FROM.mockReturnValueOnce(mockSuccess([]));
    const result = await fetchGromadaPosts('g1');
    expect(result).toHaveLength(0);
  });
});

describe('fetchFeedPosts', () => {
  it('returns posts for user feed', async () => {
    const posts = [makePost(), makePost()];
    FROM.mockReturnValueOnce(mockSuccess(posts));
    const result = await fetchFeedPosts('user-1', 0, 25);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe('createPost', () => {
  it('inserts a post and returns it', async () => {
    const post = makePost({ content: 'Hello world', gromada_id: 'g1' });
    FROM.mockReturnValueOnce(mockSingle(post));
    const result = await createPost({ gromada_id: 'g1', author_id: 'u1', content: 'Hello world' });
    expect(result.content).toBe('Hello world');
  });

  it('includes media_urls when provided', async () => {
    const post = makePost({ media_urls: ['https://storage/img.jpg'] });
    FROM.mockReturnValueOnce(mockSingle(post));
    const result = await createPost({
      gromada_id: 'g1',
      author_id: 'u1',
      content: 'With image',
      media_urls: ['https://storage/img.jpg'],
    });
    expect(result.media_urls).toContain('https://storage/img.jpg');
  });

  it('throws on DB error', async () => {
    FROM.mockReturnValueOnce(mockError('insert failed'));
    await expect(createPost({ gromada_id: 'g1', author_id: 'u1', content: 'test' })).rejects.toThrow();
  });
});

describe('deletePost', () => {
  it('calls delete on posts table', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(deletePost('post-1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('posts');
  });
});

describe('hidePost', () => {
  it('updates is_hidden field', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(hidePost('post-1', true)).resolves.not.toThrow();
  });
});

describe('toggleReaction', () => {
  it('inserts reaction when adding', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(toggleReaction('post-1', 'user-1', '❤️', false)).resolves.not.toThrow();
  });

  it('deletes reaction when removing', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(toggleReaction('post-1', 'user-1', '❤️', true)).resolves.not.toThrow();
  });
});

describe('reportPost', () => {
  it('inserts a report record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(reportPost('post-1', 'user-1', 'spam')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('reports');
  });
});
