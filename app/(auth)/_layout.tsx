import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout() {
  const { session, isOnboardingComplete, isLoading } = useAuthStore();

  if (!isLoading && session) {
    if (!isOnboardingComplete) return <Redirect href="/(onboarding)/profile-setup" />;
    return <Redirect href="/(app)/(feed)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}
