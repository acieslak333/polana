// Expo Router useLocalSearchParams can return string | string[]
// Always resolve to a single string.
export function resolveParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export type DeepLinkTarget =
  | { type: 'gromada'; id: string }
  | { type: 'event'; id: string }
  | { type: 'profile'; id: string }
  | { type: 'invite'; code: string }

export function buildDeepLink(target: DeepLinkTarget): string {
  switch (target.type) {
    case 'gromada': return `polana://gromada/${target.id}`
    case 'event':   return `polana://event/${target.id}`
    case 'profile': return `polana://profile/${target.id}`
    case 'invite':  return `polana://invite/${target.code}`
  }
}

export function resolveDeepLink(url: string): DeepLinkTarget | null {
  // parse polana:// or https://polana.app/ links
  const clean = url.replace('https://polana.app', 'polana:/').replace('polana://', 'polana://')
  const m = clean.match(/polana:\/\/(\w+)\/(.+)/)
  if (!m) return null
  const [, type, id] = m
  if (type === 'gromada') return { type: 'gromada', id }
  if (type === 'event')   return { type: 'event', id }
  if (type === 'profile') return { type: 'profile', id }
  if (type === 'invite')  return { type: 'invite', code: id }
  return null
}
