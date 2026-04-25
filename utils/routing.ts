// Expo Router useLocalSearchParams can return string | string[]
// Always resolve to a single string.
export function resolveParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
