import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import {
  type AvatarConfig,
  BASE_EMOJIS,
  HAT_EMOJIS,
  ACCESSORY_EMOJIS,
  isValidAvatarConfig,
  generateRandomAvatarConfig,
} from './avatarParts';
import { theme } from '@/constants/theme';

type ProceduralAvatarProps = {
  config: AvatarConfig | Record<string, unknown> | null | undefined;
  size?: number;
  style?: ViewStyle;
};

export function ProceduralAvatar({ config, size = 56, style }: ProceduralAvatarProps) {
  const validated: AvatarConfig = isValidAvatarConfig(config)
    ? config
    : generateRandomAvatarConfig();

  const baseEmoji = BASE_EMOJIS[validated.base] ?? '🐱';
  const hatEmoji = HAT_EMOJIS[validated.hat] ?? '';
  const accessoryEmoji = ACCESSORY_EMOJIS[validated.accessories] ?? '';

  const fontSize = size * 0.55;
  const hatSize = size * 0.35;
  const badgeSize = size * 0.3;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: validated.primaryColor + '33', // 20% opacity
          borderColor: validated.primaryColor + '66',
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Avatar: ${validated.base}`}
    >
      {/* Hat overlay */}
      {hatEmoji ? (
        <Text style={[styles.hat, { fontSize: hatSize, top: -hatSize * 0.4 }]}>
          {hatEmoji}
        </Text>
      ) : null}

      {/* Main animal */}
      <Text style={{ fontSize }}>{baseEmoji}</Text>

      {/* Accessory badge */}
      {accessoryEmoji ? (
        <View style={[styles.badge, { width: badgeSize, height: badgeSize, bottom: 0, right: 0 }]}>
          <Text style={{ fontSize: badgeSize * 0.7 }}>{accessoryEmoji}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'visible',
  },
  hat: {
    position: 'absolute',
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
