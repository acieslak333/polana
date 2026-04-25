export const AVATAR_PARTS = {
  base: ['cat', 'dog', 'owl', 'fox', 'bear', 'bunny', 'frog', 'hedgehog', 'otter', 'capybara'],
  eyes: ['round', 'sleepy', 'happy', 'surprised', 'wink', 'heart'],
  nose: ['button', 'triangle', 'dot', 'heart'],
  mouth: ['smile', 'grin', 'tongue', 'neutral', 'happy'],
  accessories: ['none', 'glasses', 'sunglasses', 'monocle', 'bow_tie'],
  hat: ['none', 'beanie', 'flower_crown', 'top_hat', 'bandana', 'chef_hat'],
  special: ['none', 'blush', 'freckles', 'scar', 'star', 'leaf'],
} as const;

export type AvatarPartKey = keyof typeof AVATAR_PARTS;
export type AvatarConfig = { [K in AvatarPartKey]: string } & { primaryColor: string; secondaryColor: string };

export const AVATAR_COLORS = {
  primary: ['#C4705A', '#7A9E7E', '#D4956A', '#8B6F47', '#6B7B8D', '#9B7EC8', '#5B8A8B'],
  secondary: ['#F2E6D9', '#E8DFD4', '#C4A882', '#9B8B7A', '#D4C5B5'],
} as const;

// Emoji representations for each part combination (used for rendering without SVG assets)
export const BASE_EMOJIS: Record<string, string> = {
  cat: '🐱', dog: '🐶', owl: '🦉', fox: '🦊', bear: '🐻',
  bunny: '🐰', frog: '🐸', hedgehog: '🦔', otter: '🦦', capybara: '🦫',
};

export const HAT_EMOJIS: Record<string, string> = {
  none: '', beanie: '🧢', flower_crown: '💐', top_hat: '🎩', bandana: '🎗️', chef_hat: '👨‍🍳',
};

export const ACCESSORY_EMOJIS: Record<string, string> = {
  none: '', glasses: '👓', sunglasses: '🕶️', monocle: '🧐', bow_tie: '🎀',
};

function randomFrom<T extends readonly string[]>(arr: T): T[number] {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomAvatarConfig(): AvatarConfig {
  return {
    base: randomFrom(AVATAR_PARTS.base),
    eyes: randomFrom(AVATAR_PARTS.eyes),
    nose: randomFrom(AVATAR_PARTS.nose),
    mouth: randomFrom(AVATAR_PARTS.mouth),
    accessories: randomFrom(AVATAR_PARTS.accessories),
    hat: randomFrom(AVATAR_PARTS.hat),
    special: randomFrom(AVATAR_PARTS.special),
    primaryColor: randomFrom(AVATAR_COLORS.primary),
    secondaryColor: randomFrom(AVATAR_COLORS.secondary),
  };
}

export function isValidAvatarConfig(config: unknown): config is AvatarConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.base === 'string' &&
    typeof c.primaryColor === 'string'
  );
}
