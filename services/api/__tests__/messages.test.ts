import { supabase } from '@/services/supabase';
import { fetchChatRooms, fetchMessages, sendMessage, getOrCreateDM } from '../messages';
import { makeMessage } from '@/__fixtures__';
import { mockSuccess, mockError, mockSingle } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('fetchChatRooms', () => {
  it('returns chat rooms for user', async () => {
    const rooms = [{ id: 'r1', type: 'direct', last_message: null }];
    FROM.mockReturnValueOnce(mockSuccess(rooms));
    const result = await fetchChatRooms('u1');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('fetchMessages', () => {
  it('returns messages for a chat room', async () => {
    const messages = [makeMessage({ chat_room_id: 'r1' })];
    FROM.mockReturnValueOnce(mockSuccess(messages));
    const result = await fetchMessages('r1');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('sendMessage', () => {
  it('inserts a message and returns it', async () => {
    const message = makeMessage({ body: 'Hello!' });
    FROM.mockReturnValueOnce(mockSingle(message));
    const result = await sendMessage('r1', 'u1', 'Hello!');
    expect(result.body).toBe('Hello!');
  });

  it('throws on DB error', async () => {
    FROM.mockReturnValueOnce(mockError('DB error'));
    await expect(sendMessage('r1', 'u1', 'Hello!')).rejects.toThrow();
  });
});

describe('getOrCreateDM', () => {
  it('returns existing DM room ID if found', async () => {
    const existing = { id: 'dm-room-1', type: 'direct', participant_1: 'u1', participant_2: 'u2' };
    const chain = mockSuccess([existing]);
    chain['maybeSingle'] = jest.fn(() => Promise.resolve({ data: existing, error: null }));
    FROM.mockReturnValueOnce(chain);
    const result = await getOrCreateDM('u1', 'u2');
    expect(result).toBe('dm-room-1');
  });

  it('creates a new DM room if none exists', async () => {
    const newRoom = { id: 'dm-room-new' };
    // First call: no existing room found
    const findChain = mockSuccess(null);
    findChain['maybeSingle'] = jest.fn(() => Promise.resolve({ data: null, error: null }));
    FROM
      .mockReturnValueOnce(findChain)         // query existing
      .mockReturnValueOnce(mockSingle(newRoom)); // insert new
    const result = await getOrCreateDM('u1', 'u2');
    expect(result).toBe('dm-room-new');
  });
});
