import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function AppLayout() {
  const { session, isOnboardingComplete, isLoading } = useAuthStore();
  const { t } = useTranslation(['feed', 'gromady', 'events', 'messages', 'profile']);

  if (!isLoading && !session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isLoading && !isOnboardingComplete) {
    return <Redirect href="/(onboarding)/profile-setup" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="(feed)"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏕️" label={t('feed:title')} focused={focused} />
          ),
          tabBarAccessibilityLabel: t('feed:title'),
        }}
      />
      <Tabs.Screen
        name="(gromady)"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🌿" label={t('gromady:title')} focused={focused} />
          ),
          tabBarAccessibilityLabel: t('gromady:title'),
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" label={t('events:title')} focused={focused} />
          ),
          tabBarAccessibilityLabel: t('events:title'),
        }}
      />
      <Tabs.Screen
        name="(messages)"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label={t('messages:title')} focused={focused} />
          ),
          tabBarAccessibilityLabel: t('messages:title'),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🦡" label={t('profile:title')} focused={focused} />
          ),
          tabBarAccessibilityLabel: t('profile:title'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.tabBar,
    borderTopColor: theme.colors.tabBarBorder,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  tabLabelFocused: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.medium,
  },
});
