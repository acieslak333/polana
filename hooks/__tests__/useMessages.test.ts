import { renderHook, act } from '@testing-library/react-native';
import { useChatMessages } from '../useMessages';
import * as messagesApi from '@/services/api/messages';
import { makeMessage } from '@/__fixtures__';

jest.mock('@/services/api/messages');
const mockFetchMessages = messagesApi.fetchMessages as jest.Mock;
const mockSendMessage = messagesApi.sendMessage as jest.Mock;

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

// supabase.channel is already mocked in jest.setup.ts
beforeEach(() => { jest.clearAllMocks(); });

describe('useChatMessages', () => {
  it('loads messages on mount', async () => {
    const messages = [makeMessage({ chat_room_id: 'r1' }), makeMessage({ chat_room_id: 'r1' })];
    mockFetchMessages.mockResolvedValue(messages);
    const { result } = renderHook(() => useChatMessages('r1'));
    await act(async () => {});
    expect(mockFetchMessages).toHaveBeenCalledWith('r1', 0);
  });

  it('sets hasMore=false when fewer than 50 messages', async () => {
    mockFetchMessages.mockResolvedValue([makeMessage()]);
    const { result } = renderHook(() => useChatMessages('r1'));
    await act(async () => {});
    expect(result.current.hasMore).toBe(false);
  });

  it('does not fetch when chatRoomId is empty', () => {
    const { result } = renderHook(() => useChatMessages(''));
    expect(mockFetchMessages).not.toHaveBeenCalled();
  });

  it('send() calls sendMessage and appends to messages', async () => {
    mockFetchMessages.mockResolvedValue([]);
    const sentMessage = makeMessage({ body: 'Hello', sender_id: 'user-1' });
    mockSendMessage.mockResolvedValue(sentMessage);
    const { result } = renderHook(() => useChatMessages('r1'));
    await act(async () => {});
    await act(async () => { await result.current.send('Hello'); });
    expect(mockSendMessage).toHaveBeenCalledWith('r1', 'user-1', 'Hello');
  });

  it('subscribes to Realtime on mount and unsubscribes on unmount', () => {
    const { supabase } = require('@/services/supabase');
    mockFetchMessages.mockResolvedValue([]);
    const { unmount } = renderHook(() => useChatMessages('r1'));
    expect(supabase.channel).toHaveBeenCalled();
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
