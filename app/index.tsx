import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/constants/theme';

export default function Index() {
  const { session, isLoading, isOnboardingComplete } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isOnboardingComplete) {
    return <Redirect href="/(onboarding)/profile-setup" />;
  }

  return <Redirect href="/(app)/(feed)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
