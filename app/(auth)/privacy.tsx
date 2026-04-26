import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { theme } from '@/constants/theme'

const sections = [
  {
    title: '1. Administrator danych',
    body: 'Administratorem Twoich danych osobowych jest Polana (podmiot niekomercyjny). Kontakt: privacy@polana.app',
  },
  {
    title: '2. Jakie dane zbieramy',
    body: 'Zbieramy: adres e-mail (rejestracja), imię i pseudonim (profil), datę urodzenia (weryfikacja wieku), miasto, zainteresowania, konfigurację awatara, posty i komentarze, RSVPs na wydarzenia, wiadomości czatu. Nie zbieramy danych lokalizacji w tle. Nie sprzedajemy żadnych danych.',
  },
  {
    title: '3. Cel przetwarzania',
    body: 'Dane przetwarzamy wyłącznie w celu: świadczenia usług Polany (tworzenie konta, wyświetlanie treści, komunikacja), bezpieczeństwa (moderacja, blokowanie), powiadamiania push (za Twoją zgodą) i monitorowania błędów technicznych (Sentry — bez danych osobowych w logach).',
  },
  {
    title: '4. Podstawa prawna (RODO)',
    body: 'Przetwarzamy Twoje dane na podstawie: umowy (art. 6 ust. 1 lit. b RODO) — wykonanie usługi; zgody (art. 6 ust. 1 lit. a) — powiadomienia push; prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f) — bezpieczeństwo i monitorowanie błędów.',
  },
  {
    title: '5. Przechowywanie danych',
    body: 'Dane przechowujemy przez czas korzystania z usługi. Po usunięciu konta dane są trwale kasowane w ciągu 30 dni, z wyjątkiem danych wymaganych przez prawo. Kopie zapasowe są usuwane w ciągu 90 dni.',
  },
  {
    title: '6. Twoje prawa (RODO Art. 15–22)',
    body: 'Masz prawo do: dostępu do danych, sprostowania, usunięcia („prawo do bycia zapomnianym"), ograniczenia przetwarzania, przenoszenia danych, sprzeciwu. Możesz je wykonać przez ekran „Twoje dane" w aplikacji lub pisząc na privacy@polana.app. Odpowiadamy w ciągu 30 dni.',
  },
  {
    title: '7. Udostępnianie danych',
    body: 'Nie udostępniamy danych podmiotom trzecim w celach marketingowych. Korzystamy z: Supabase (baza danych, UE), Sentry (logi błędów, dane bez PII), Expo (powiadomienia push). Wszystkie podmioty są zobowiązane umowami RODO.',
  },
  {
    title: '8. Kontakt i skargi',
    body: 'W sprawie danych osobowych: privacy@polana.app. Masz prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).',
  },
]

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Polityka prywatności</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Ostatnia aktualizacja: 26 kwietnia 2026</Text>

        {sections.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: theme.spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  content: { padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  updated: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  section: { gap: theme.spacing.sm },
  sectionTitle: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  sectionBody: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, lineHeight: 24 },
})
