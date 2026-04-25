export const MINDFUL_TEXTS = {
  notifications: [
    'Polana nie naciska na powiadomienia. Twoja wolna głowa to priorytet.',
    'Powiadomienia są po to, żebyś nie przegapił fajnych rzeczy — nie żeby cię męczyć.',
    'Cisza jest cenna. Powiadomienia włączysz kiedy chcesz, wyłączysz kiedy chcesz.',
    'Twój telefon nie powinien być smyczą. Dostaniesz tylko to, co naprawdę ważne.',
    'Szanujemy twoją uwagę. Żadnego spamu, żadnych sztuczek.',
    'Nie będziemy cię budzić o 3 w nocy. Obiecujemy.',
    'Powiadomienia? Tylko o spotkaniach i wiadomościach. Zero algorytmicznego szumu.',
    'Twoja uwaga jest cenna — wydawaj ją na ludzi, nie na apkę.',
    'Polana działa najlepiej, kiedy o niej nie myślisz. Serio.',
    'Włącz lub wyłącz — zero guilt tripping. To twój wybór, zawsze.',
  ],
  general: [
    'Nie spiesz się. Dobre rzeczy buduje się powoli.',
    'Każda Gromada zaczynała od jednej osoby.',
    'Bycie trochę dziwnym jest fajne. Tu to rozumiemy.',
    'Nie musisz być perfekcyjny. Musisz być obecny.',
    'Najlepsze rozmowy zaczynają się od cześć.',
    'Wyjdź z apki. Spotkaj się z ludźmi. Po to tu jesteśmy.',
    'Twoja Gromada na ciebie czeka. Bez pośpiechu.',
    'Pomaganie innym to supermoc. Używaj jej.',
    'Małe społeczności, wielkie serca.',
    'Offline > online. Zawsze.',
  ],
  safety: [
    'Spotykaj się w miejscach publicznych, szczególnie gdy kogoś nie znasz.',
    'Ufaj intuicji. Jeśli coś ci nie pasuje, to prawdopodobnie nie pasuje.',
    'Dbajmy o siebie nawzajem — online i offline.',
    'Nie udostępniaj prywatnych danych osobom, których nie znasz.',
    'Bezpieczeństwo jest wspólne. Zgłoś, jeśli widzisz coś niepokojącego.',
  ],
  empty_states: [
    'Tu jeszcze pusto — ale nie na długo!',
    'Każda wielka Gromada zaczynała od pustej polany.',
    'Bądź pierwszą osobą, która coś tu napisze.',
    'Cisza przed burzą aktywności.',
    'Ktoś musi być pierwszy. Czemu nie ty?',
  ],
} as const;

export type MindfulCategory = keyof typeof MINDFUL_TEXTS;

export function getRandomMindfulText(category: MindfulCategory): string {
  const texts = MINDFUL_TEXTS[category];
  return texts[Math.floor(Math.random() * texts.length)];
}
