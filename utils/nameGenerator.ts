// utils/nameGenerator.ts
// Client-side name generator for instant preview in the create-Gromada flow.
// Mirrors the DB generate_gromada_name() SQL function's fallback chain.
// Fallback: requested language → en → pl.
// NOTE: word_pl column in DB stores the word in whichever language the row specifies (legacy name).

type WordLists = {
  adjectives: string[];
  animals: string[];
  suffixes: string[];
  pattern: string;
};

const WORDS: Record<string, WordLists> = {
  pl: {
    pattern: '{adj} {animal} {suffix}',
    adjectives: [
      'Szarżujące','Nocne','Dzielne','Wędrowne','Radosne','Ciche',
      'Odważne','Skoczne','Tajemnicze','Leniwe','Bystre','Kosmiczne',
      'Leśne','Magiczne','Zuchwałe',
    ],
    animals: [
      'Chomiki','Wydry','Lisy','Sowy','Jeże','Kapibary',
      'Borsuki','Wiewiórki','Żaby','Kruki','Koty','Niedźwiedzie',
      'Pandy','Wilki','Bobry',
    ],
    suffixes: [
      'Nocy','Świtu','Lasu','Polany','Gór','Rzeki',
      'Miasta','Parku','Ognia','Deszczu','Wiatru','Mgły',
    ],
  },
  en: {
    pattern: '{adj} {animal} {suffix}',
    adjectives: ['Bold','Wandering','Joyful','Brave','Quiet','Cosmic','Forest','Magical','Nocturnal','Bouncy'],
    animals:    ['Otters','Foxes','Owls','Hedgehogs','Badgers','Ravens','Beavers','Bears','Squirrels','Capybaras'],
    suffixes:   ['of the Night','of Dawn','of the Forest','of the Clearing','of the Mountains','of the River','of the City','of the Park','of the Mist'],
  },
  uk: {
    pattern: '{adj} {animal} {suffix}',
    adjectives: ['Сміливі','Мандрівні','Радісні','Хоробрі','Тихі','Космічні','Лісові','Магічні','Нічні','Стрімкі'],
    animals:    ['Видри','Лисиці','Сови','Їжаки','Борсуки','Крукони','Бобри','Ведмеді','Білки','Капібари'],
    suffixes:   ['Ночі','Світанку','Лісу','Галявини','Гір','Ріки','Міста','Парку','Туману'],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveLanguage(language: string): string {
  if (WORDS[language]) return language;
  if (WORDS['en']) return 'en';
  return 'pl';
}

/**
 * Generate a random Gromada name in the given language.
 * Falls back: language → en → pl (mirrors the DB function fallback chain).
 */
export function generateGromadaName(language = 'pl'): string {
  const lang = resolveLanguage(language);
  const { adjectives, animals, suffixes, pattern } = WORDS[lang];
  return pattern
    .replace('{adj}',    pick(adjectives))
    .replace('{animal}', pick(animals))
    .replace('{suffix}', pick(suffixes));
}
