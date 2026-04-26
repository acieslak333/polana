import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CreateEventForm } from '@/components/event/CreateEventForm';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function CreateEventScreen() {
  const { t } = useTranslation('common');
  const { profile } = useAuthStore();
  const { gromadaId } = useLocalSearchParams<{ gromadaId?: string }>();
  const cityId = profile?.city_id ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Nowe wydarzenie</Text>
        </View>

        <View style={styles.content}>
          <CreateEventForm
            gromadaId={gromadaId ?? null}
            cityId={cityId}
            onSuccess={(eventId) => router.replace(`/event/${eventId}`)}
            onCancel={() => router.back()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  content: { flex: 1, padding: theme.spacing.xl },
});
