// Client-side mirror of the DB generate_gromada_name() SQL function
// Used in the create-Gromada flow before a DB round-trip

const ADJECTIVES = [
  'Szarżujące', 'Nocne', 'Dzielne', 'Wędrowne', 'Radosne', 'Ciche',
  'Odważne', 'Skoczne', 'Tajemnicze', 'Leniwe', 'Bystre', 'Kosmiczne',
  'Leśne', 'Magiczne', 'Zuchwałe', 'Błyszczące', 'Spokojne', 'Dzikie',
];

const ANIMALS = [
  'Chomiki', 'Wydry', 'Lisy', 'Sowy', 'Jeże', 'Kapibary',
  'Borsuki', 'Wiewiórki', 'Żaby', 'Kruki', 'Koty', 'Niedźwiedzie',
  'Pandy', 'Wilki', 'Bobry', 'Szopy', 'Pingwiny', 'Żółwie',
];

const SUFFIXES = [
  'Nocy', 'Świtu', 'Lasu', 'Polany', 'Gór', 'Rzeki',
  'Miasta', 'Parku', 'Ognia', 'Deszczu', 'Wiatru', 'Mgły',
  'Zmierzchu', 'Wiosny', 'Lata',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateGromadaName(): string {
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)} ${pick(SUFFIXES)}`;
}
