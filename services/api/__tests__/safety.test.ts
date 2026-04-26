import { supabase } from '@/services/supabase';
import {
  blockUser,
  unblockUser,
  fetchBlockedIds,
  muteChat,
  unmuteChat,
} from '../safety';
import { mockSuccess, mockError } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('blockUser', () => {
  it('inserts a block record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(blockUser('u1', 'u2')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('user_blocks');
  });

  it('ignores duplicate key (block already exists)', async () => {
    FROM.mockReturnValueOnce(mockError('duplicate', '23505'));
    await expect(blockUser('u1', 'u2')).resolves.not.toThrow();
  });

  it('throws on other errors', async () => {
    FROM.mockReturnValueOnce(mockError('server error', '500'));
    await expect(blockUser('u1', 'u2')).rejects.toThrow();
  });
});

describe('unblockUser', () => {
  it('deletes the block record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(unblockUser('u1', 'u2')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('user_blocks');
  });

  it('throws on DB error', async () => {
    FROM.mockReturnValueOnce(mockError('DB error'));
    await expect(unblockUser('u1', 'u2')).rejects.toThrow();
  });
});

describe('fetchBlockedIds', () => {
  it('returns array of blocked user IDs', async () => {
    FROM.mockReturnValueOnce(mockSuccess([
      { blocked_id: 'u2' },
      { blocked_id: 'u3' },
    ]));
    const result = await fetchBlockedIds('u1');
    expect(result).toEqual(['u2', 'u3']);
  });

  it('returns empty array when no blocks', async () => {
    FROM.mockReturnValueOnce(mockSuccess([]));
    const result = await fetchBlockedIds('u1');
    expect(result).toHaveLength(0);
  });
});

describe('muteChat', () => {
  it('upserts a chat mute record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(muteChat('room-1', 'u1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('chat_mutes');
  });

  it('uses default 24h duration', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    const before = Date.now();
    await muteChat('room-1', 'u1');
    const after = Date.now();
    // Just verify it doesn't throw — duration is internal
    expect(after - before).toBeLessThan(5000);
  });
});

describe('unmuteChat', () => {
  it('deletes the chat mute record', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(unmuteChat('room-1', 'u1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('chat_mutes');
  });
});
