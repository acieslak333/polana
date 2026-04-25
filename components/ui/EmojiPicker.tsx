import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { theme } from '@/constants/theme';

const COMMON_EMOJIS = [
  '❤️','🔥','👏','😂','😍','🙏','💪','✨','🎉','😮',
  '😢','😡','🤔','👍','👎','🚀','💯','🌿','🤝','🫶',
  '😊','🥰','😎','🤣','😅','🥳','🤩','😴','👀','💬',
];

type EmojiPickerProps = {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export function EmojiPicker({ visible, onSelect, onClose }: EmojiPickerProps) {
  // query state reserved for future emoji search by name

  // No emoji name DB — just show all; search is a UI placeholder for future extension
  const filtered = COMMON_EMOJIS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Zamknij">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <FlatList
            data={filtered}
            keyExtractor={(e) => e}
            numColumns={7}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { onSelect(item); onClose(); }}
                accessibilityRole="button"
                accessibilityLabel={item}
                style={({ pressed }) => [styles.emojiBtn, pressed && styles.emojiBtnPressed]}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.backgroundElevated,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    paddingBottom: 32,
    paddingTop: theme.spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  grid: { paddingHorizontal: theme.spacing.md },
  emojiBtn: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    margin: 2,
    minHeight: 44,
    minWidth: 44,
  },
  emojiBtnPressed: { backgroundColor: theme.colors.border },
  emojiText: { fontSize: 26 },
});
