import { supabase } from '@/services/supabase';
import {
  fetchMyGromady,
  fetchGromada,
  joinGromada,
  leaveGromada,
  fetchAllGromady,
  fetchGromadaMembers,
  fetchUpcomingEvents,
} from '../gromady';
import { makeGromada } from '@/__fixtures__';
import { mockSuccess, mockError, mockSingle } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('fetchMyGromady', () => {
  it('returns empty array when user has no memberships', async () => {
    FROM.mockReturnValueOnce(mockSuccess([])); // gromada_members
    const result = await fetchMyGromady('user-1');
    expect(result).toHaveLength(0);
    expect(FROM).toHaveBeenCalledTimes(1);
  });

  it('fetches gromady for member IDs', async () => {
    const gromady = [makeGromada(), makeGromada()];
    FROM
      .mockReturnValueOnce(mockSuccess([{ gromada_id: 'g1' }, { gromada_id: 'g2' }])) // memberships
      .mockReturnValueOnce(mockSuccess(gromady)); // gromady
    const result = await fetchMyGromady('user-1');
    expect(result).toHaveLength(2);
  });

  it('throws when memberships query fails', async () => {
    FROM.mockReturnValueOnce(mockError('DB error'));
    await expect(fetchMyGromady('user-1')).rejects.toThrow();
  });
});

describe('fetchGromada', () => {
  it('returns a single gromada', async () => {
    const gromada = makeGromada({ id: 'g1', name: 'Test Gromada' });
    FROM.mockReturnValueOnce(mockSingle(gromada));
    const result = await fetchGromada('g1');
    expect(result.id).toBe('g1');
  });

  it('throws when gromada not found', async () => {
    FROM.mockReturnValueOnce(mockError('Not found', 'PGRST116'));
    await expect(fetchGromada('missing')).rejects.toThrow();
  });
});

describe('joinGromada', () => {
  it('inserts membership record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(joinGromada('g1', 'user-1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('gromada_members');
  });

  it('ignores duplicate key error (user already a member)', async () => {
    FROM.mockReturnValueOnce(mockError('duplicate', '23505'));
    await expect(joinGromada('g1', 'user-1')).resolves.not.toThrow();
  });

  it('throws on other DB errors', async () => {
    FROM.mockReturnValueOnce(mockError('server error', '500'));
    await expect(joinGromada('g1', 'user-1')).rejects.toThrow();
  });
});

describe('leaveGromada', () => {
  it('deletes the membership record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(leaveGromada('g1', 'user-1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('gromada_members');
  });
});

describe('fetchAllGromady', () => {
  it('returns all active gromady in city', async () => {
    const gromady = [makeGromada(), makeGromada()];
    FROM.mockReturnValueOnce(mockSuccess(gromady));
    const result = await fetchAllGromady('city-1');
    expect(result).toHaveLength(2);
  });

  it('applies interest filter when provided', async () => {
    FROM.mockReturnValueOnce(mockSuccess([]));
    await fetchAllGromady('city-1', 0, 'interest-id');
    expect(FROM).toHaveBeenCalledWith('gromady');
  });
});

describe('fetchGromadaMembers', () => {
  it('returns member list', async () => {
    FROM.mockReturnValueOnce(mockSuccess([{ user_id: 'u1', role: 'member', joined_at: '' }]));
    const result = await fetchGromadaMembers('g1');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('fetchUpcomingEvents', () => {
  it('returns upcoming events for gromada', async () => {
    FROM.mockReturnValueOnce(mockSuccess([{ id: 'e1', title: 'Test Event', starts_at: '' }]));
    const result = await fetchUpcomingEvents('g1');
    expect(Array.isArray(result)).toBe(true);
  });
});
