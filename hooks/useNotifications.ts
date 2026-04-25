import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { registerForPushNotifications } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const foregroundListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications(user.id).catch(() => {
      // Permission denied — handled gracefully; no crash
    });

    foregroundListener.current = Notifications.addNotificationReceivedListener(() => {
      // Foreground: notification handler (setNotificationHandler) already shows banner
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.chatRoomId) {
        router.push(`/(app)/(messages)/chat/${data.chatRoomId}`);
      } else if (data?.eventId) {
        router.push(`/event/${data.eventId}`);
      } else if (data?.gromadaId) {
        router.push(`/(app)/(gromady)/${data.gromadaId}`);
      }
    });

    return () => {
      foregroundListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);
}
