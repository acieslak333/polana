import { supabase } from '@/services/supabase';
import {
  fetchPublicProfile,
  fetchFriendshipStatus,
  sendFriendRequest,
  fetchFriends,
  fetchPendingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  joinGromada,
} from '../users';
import { makeProfile } from '@/__fixtures__';
import { mockSuccess, mockError, mockSingle } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('fetchPublicProfile', () => {
  it('returns public profile for user', async () => {
    const profile = makeProfile({ id: 'u1', first_name: 'Alice' });
    FROM.mockReturnValueOnce(mockSingle(profile));
    const result = await fetchPublicProfile('u1');
    expect(result.first_name).toBe('Alice');
  });

  it('throws when user not found', async () => {
    FROM.mockReturnValueOnce(mockError('not found', 'PGRST116'));
    await expect(fetchPublicProfile('missing')).rejects.toThrow();
  });
});

describe('fetchFriendshipStatus', () => {
  it('returns none when no friendship record exists', async () => {
    const chain = mockSuccess(null);
    chain['maybeSingle'] = jest.fn(() => Promise.resolve({ data: null, error: null }));
    FROM.mockReturnValueOnce(chain);
    const result = await fetchFriendshipStatus('u1', 'u2');
    expect(result).toBe('none');
  });

  it('returns accepted when friendship is accepted', async () => {
    const chain = mockSuccess({ status: 'accepted', requester_id: 'u1' });
    chain['maybeSingle'] = jest.fn(() => Promise.resolve({
      data: { status: 'accepted', requester_id: 'u1' },
      error: null,
    }));
    FROM.mockReturnValueOnce(chain);
    const result = await fetchFriendshipStatus('u1', 'u2');
    expect(result).toBe('accepted');
  });

  it('returns pending_sent when current user is requester', async () => {
    const chain = mockSuccess(null);
    chain['maybeSingle'] = jest.fn(() => Promise.resolve({
      data: { status: 'pending', requester_id: 'u1' },
      error: null,
    }));
    FROM.mockReturnValueOnce(chain);
    const result = await fetchFriendshipStatus('u1', 'u2');
    expect(result).toBe('pending_sent');
  });

  it('returns pending_received when other user is requester', async () => {
    const chain = mockSuccess(null);
    chain['maybeSingle'] = jest.fn(() => Promise.resolve({
      data: { status: 'pending', requester_id: 'u2' },
      error: null,
    }));
    FROM.mockReturnValueOnce(chain);
    const result = await fetchFriendshipStatus('u1', 'u2');
    expect(result).toBe('pending_received');
  });
});

describe('sendFriendRequest', () => {
  it('inserts friendship record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(sendFriendRequest('u1', 'u2')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('friendships');
  });

  it('ignores duplicate key (request already sent)', async () => {
    FROM.mockReturnValueOnce(mockError('duplicate', '23505'));
    await expect(sendFriendRequest('u1', 'u2')).resolves.not.toThrow();
  });

  it('throws on other errors', async () => {
    FROM.mockReturnValueOnce(mockError('server error', '500'));
    await expect(sendFriendRequest('u1', 'u2')).rejects.toThrow();
  });
});

describe('fetchFriends', () => {
  it('returns empty array when no friends', async () => {
    FROM.mockReturnValueOnce(mockSuccess([]));
    const result = await fetchFriends('u1');
    expect(result).toHaveLength(0);
  });
});

describe('fetchPendingRequests', () => {
  it('returns pending requests directed at user', async () => {
    FROM.mockReturnValueOnce(mockSuccess([]));
    const result = await fetchPendingRequests('u1');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('acceptFriendRequest', () => {
  it('updates friendship status to accepted', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(acceptFriendRequest('u2', 'u1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('friendships');
  });
});

describe('declineFriendRequest', () => {
  it('deletes the friendship record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(declineFriendRequest('u2', 'u1')).resolves.not.toThrow();
  });
});

describe('joinGromada (users.ts)', () => {
  it('inserts gromada membership', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(joinGromada('g1', 'u1')).resolves.not.toThrow();
  });

  it('ignores duplicate key error', async () => {
    FROM.mockReturnValueOnce(mockError('duplicate', '23505'));
    await expect(joinGromada('g1', 'u1')).resolves.not.toThrow();
  });
});
