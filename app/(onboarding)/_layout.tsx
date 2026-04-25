import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function OnboardingLayout() {
  const { session, isOnboardingComplete, isLoading } = useAuthStore();

  if (!isLoading && !session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isLoading && isOnboardingComplete) {
    return <Redirect href="/(app)/(feed)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="city" />
      <Stack.Screen name="gromada-pick" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="community-rules" />
      <Stack.Screen name="ready" />
    </Stack>
  );
}
