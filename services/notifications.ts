import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Polana',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4705A',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await supabase
    .from('profiles')
    .update({ push_token: token, push_token_updated_at: new Date().toISOString() })
    .eq('id', userId);

  return token;
}

export async function clearPushToken(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);
}
