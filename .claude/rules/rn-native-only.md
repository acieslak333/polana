# React Native — Native Components Only

These rules apply whenever writing or modifying any component file.

1. Use only native RN components: `View`, `Text`, `Pressable`, `FlatList`, `ScrollView`, `TextInput`, `Modal`, `ActivityIndicator`, `Image`, `KeyboardAvoidingView`, `SafeAreaView`
2. `StyleSheet.create()` for all styles — no inline style objects except for truly dynamic values (e.g., `{ width: dynamicWidth }`)
3. `constants/theme.ts` is the ONLY source for colors, spacing, font sizes, border radii — never hardcode `#hex` or `16` for spacing
4. Do NOT install UI component libraries (NativeBase, Tamagui, RN Paper, Gluestack, etc.) without explicit instruction
5. Tappable areas must be ≥ 44pt — use `hitSlop` if the visual size is smaller
6. Every interactive element needs `accessibilityLabel` and `accessibilityRole`
7. `Pressable` over `TouchableOpacity` — it supports `pressed` state styling natively
8. Lists must use `FlatList` or `FlashList` — never `ScrollView` + `map()` for variable-length lists
9. Images must have explicit `width` + `height` or `flex` — never rely on natural size
10. Animations via `Animated` API or `react-native-reanimated` only — no CSS transitions
