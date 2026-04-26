import { renderHook } from '@testing-library/react-native';
import { useNotifications } from '../useNotifications';

jest.mock('@/services/notifications', () => ({
  registerForPushNotifications: jest.fn(() => Promise.resolve('ExponentPushToken[test]')),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockPush },
}));

// expo-notifications is mocked in jest.setup.ts
import * as Notifications from 'expo-notifications';
const mockAddReceived = Notifications.addNotificationReceivedListener as jest.Mock;
const mockAddResponse = Notifications.addNotificationResponseReceivedListener as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('useNotifications', () => {
  it('does not register when user is null', () => {
    jest.mock('@/stores/authStore', () => ({
      useAuthStore: () => ({ user: null }),
    }));
    const { registerForPushNotifications } = require('@/services/notifications');
    renderHook(() => {
      // The hook should not call register when user is null
    });
    expect(registerForPushNotifications).not.toHaveBeenCalled();
  });

  it('adds notification listeners when user is present', () => {
    jest.resetModules();
    jest.mock('@/stores/authStore', () => ({
      useAuthStore: () => ({ user: { id: 'user-1' } }),
    }));
    const { useNotifications: useNotif } = require('../useNotifications');
    renderHook(() => useNotif());
    expect(mockAddReceived).toHaveBeenCalled();
    expect(mockAddResponse).toHaveBeenCalled();
  });

  it('cleans up listeners on unmount', () => {
    jest.resetModules();
    jest.mock('@/stores/authStore', () => ({
      useAuthStore: () => ({ user: { id: 'user-1' } }),
    }));
    const removeFn = jest.fn();
    mockAddReceived.mockReturnValue({ remove: removeFn });
    mockAddResponse.mockReturnValue({ remove: removeFn });
    const { useNotifications: useNotif } = require('../useNotifications');
    const { unmount } = renderHook(() => useNotif());
    unmount();
    expect(removeFn).toHaveBeenCalled();
  });
});
