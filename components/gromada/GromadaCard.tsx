import { Pressable, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { WarmthIndicator } from './WarmthIndicator';
import { theme } from '@/constants/theme';
import type { GromadaWithInterests } from '@/services/api/gromady';

type GromadaCardProps = {
  gromada: GromadaWithInterests;
  isMember?: boolean;
};

export function GromadaCard({ gromada, isMember = true }: GromadaCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/(gromady)/${gromada.id}`)}
      accessibilityRole="button"
      accessibilityLabel={gromada.name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ProceduralAvatar config={gromada.avatar_config} size={52} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{gromada.name}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {gromada.member_count}/{gromada.max_members} osób
          </Text>
          {gromada.gromada_interests.slice(0, 2).map((gi) =>
            gi.interests ? (
              <Text key={gi.interest_id} style={styles.emoji}>{gi.interests.emoji}</Text>
            ) : null,
          )}
        </View>

        <WarmthIndicator
          meetingsThisMonth={gromada.meetings_this_month}
          favorsExchanged={gromada.favors_exchanged}
          memberCount={gromada.member_count}
          compact
        />
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 76,
  },
  pressed: { opacity: 0.75 },
  info: { flex: 1, gap: theme.spacing.xs },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  meta: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  emoji: { fontSize: 14 },
  chevron: { fontSize: theme.fontSize.xl, color: theme.colors.textTertiary },
});
