import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import '@/i18n';
import { initSentry } from '@/services/sentry';
import { initAnalytics, trackScreen, identifyUser } from '@/services/analytics';
import { supabase } from '@/services/supabase';
import { getProfile } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/constants/theme';
import { resolveDeepLink } from '@/utils/routing';

// Initialise error monitoring + analytics before any component renders
initSentry();
void initAnalytics();

function ScreenTracker() {
  const pathname = usePathname();
  useEffect(() => { trackScreen(pathname); }, [pathname]);
  return null;
}

export default function RootLayout() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch(() => setProfile(null))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Keep session in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            const profile = await getProfile(session.user.id);
            setProfile(profile);
            identifyUser(session.user.id, profile?.city_id ?? undefined);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
    );

    // Handle incoming deep links while the app is already open
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      const target = resolveDeepLink(url);
      if (!target) return;
      switch (target.type) {
        case 'gromada': router.push(`/(app)/(gromady)/${target.id}`); break;
        case 'event':   router.push(`/(app)/(map)/event/${target.id}`); break;
        case 'profile': router.push(`/(app)/(profile)/${target.id}`); break;
      }
    });

    return () => {
      linkSub.remove();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ScreenTracker />
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
