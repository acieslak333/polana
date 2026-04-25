import { useMemo } from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { getRandomMindfulText, type MindfulCategory } from '@/constants/mindfulTexts';
import { theme } from '@/constants/theme';

type MindfulTextProps = {
  category: MindfulCategory;
  style?: TextStyle;
};

export function MindfulText({ category, style }: MindfulTextProps) {
  // Pick once on mount, stable for the lifetime of this component
  const text = useMemo(() => getRandomMindfulText(category), [category]);

  return (
    <Text style={[styles.text, style]} accessibilityRole="text">
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: theme.fontSize.md * theme.lineHeight.relaxed,
    fontStyle: 'italic',
  },
});
