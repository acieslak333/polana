import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

export default function TermsScreen() {
  const { t } = useTranslation('common');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Regulamin Polany</Text>

        <Text style={styles.section}>1. Postanowienia ogólne</Text>
        <Text style={styles.body}>
          Polana to platforma społecznościowa służąca budowaniu lokalnych mikro-wspólnot
          opartych na zainteresowaniach. Korzystając z aplikacji, akceptujesz niniejszy regulamin.
        </Text>

        <Text style={styles.section}>2. Zasady społeczności</Text>
        <Text style={styles.body}>
          Użytkownicy zobowiązują się do wzajemnego szacunku, tolerancji i dbania o bezpieczeństwo
          społeczności. Zabrania się treści obraźliwych, dyskryminacyjnych i spamu.
        </Text>

        <Text style={styles.section}>3. Prywatność danych</Text>
        <Text style={styles.body}>
          Twoje dane są przechowywane na serwerach w UE i nie są sprzedawane ani udostępniane
          podmiotom trzecim w celach marketingowych. Nie używamy danych do trenowania modeli AI.
        </Text>

        <Text style={styles.section}>4. Bezpieczeństwo spotkań</Text>
        <Text style={styles.body}>
          Polana zachęca do spotykania się w miejscach publicznych, szczególnie przy pierwszych
          spotkaniach. Platforma nie ponosi odpowiedzialności za przebieg spotkań offline.
        </Text>

        <Text style={styles.section}>5. Konto i członkostwo</Text>
        <Text style={styles.body}>
          Każdy użytkownik może należeć do maksymalnie 3 Gromad. Polana zastrzega prawo do
          usunięcia kont naruszających regulamin.
        </Text>

        <View style={styles.actions}>
          <Button
            label={t('close')}
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  },
  section: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: theme.fontSize.body,
    color: theme.colors.textSecondary,
    lineHeight: theme.fontSize.body * theme.lineHeight.relaxed,
  },
  actions: {
    marginTop: theme.spacing.xxl,
  },
});
