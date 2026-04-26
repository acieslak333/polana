import { supabase } from '@/services/supabase';
import { createInvite, fetchInviteByCode } from '../invites';
import { mockSuccess, mockError, mockSingle } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('createInvite', () => {
  it('inserts an invite and returns it', async () => {
    const invite = { id: 'inv-1', gromada_id: 'g1', code: 'abc123', expires_at: '', used_by: null };
    FROM.mockReturnValueOnce(mockSingle(invite));
    const result = await createInvite('g1', 'u1');
    expect(result.code).toBe('abc123');
    expect(FROM).toHaveBeenCalledWith('gromada_invites');
  });

  it('throws on DB error', async () => {
    FROM.mockReturnValueOnce(mockError('DB error'));
    await expect(createInvite('g1', 'u1')).rejects.toThrow();
  });
});

describe('fetchInviteByCode', () => {
  it('returns invite with gromada data', async () => {
    const invite = {
      id: 'inv-1',
      gromada_id: 'g1',
      code: 'abc123',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      used_by: null,
      gromady: { name: 'Test Gromada', member_count: 5, max_members: 24 },
    };
    FROM.mockReturnValueOnce(mockSingle(invite));
    const result = await fetchInviteByCode('abc123');
    expect(result.code).toBe('abc123');
    expect(result.gromady.name).toBe('Test Gromada');
  });

  it('throws when invite not found', async () => {
    FROM.mockReturnValueOnce(mockError('not found', 'PGRST116'));
    await expect(fetchInviteByCode('invalid-code')).rejects.toThrow();
  });
});
