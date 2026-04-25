import { Stack } from 'expo-router';

export default function GromadyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/members" />
      <Stack.Screen name="[id]/calendar" />
      <Stack.Screen name="[id]/info" />
      <Stack.Screen name="[id]/settings" />
    </Stack>
  );
}
