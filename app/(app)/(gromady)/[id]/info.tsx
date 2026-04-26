import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { ProceduralAvatar } from '@/components/avatar/ProceduralAvatar';
import { WarmthIndicator } from '@/components/gromada/WarmthIndicator';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchGromada, leaveGromada, type GromadaWithInterests } from '@/services/api/gromady';
import { joinGromada } from '@/services/api/users';
import { useFavors } from '@/hooks/useFavors';
import { Input } from '@/components/ui/Input';
import { fetchCrossovers, voteCrossover, type CrossoverProposal } from '@/services/api/crossovers';
import { supabase } from '@/services/supabase';

interface Ally {
  id: string
  business_name: string
  category: string
  offer_text: string
}

export default function GromadaInfoScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(_rawId) ? _rawId[0] : _rawId;
  const { t } = useTranslation(['gromady', 'common']);
  const { user } = useAuthStore();
  const [gromada, setGromada] = useState<GromadaWithInterests | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [newFavor, setNewFavor] = useState('');
  const [creatingFavor, setCreatingFavor] = useState(false);
  const [crossovers, setCrossovers] = useState<CrossoverProposal[]>([]);
  const [allies, setAllies] = useState<Ally[]>([]);
  const { favors, load: loadFavors, create: createFavor, offer, markHelped } = useFavors(id ?? '');

  useEffect(() => {
    if (!id) return;
    fetchGromada(id).then(setGromada).catch(() => {}).finally(() => setLoading(false));
    loadFavors();
    fetchCrossovers(id).then(setCrossovers).catch(() => {});
    void supabase
      .from('gromada_allies')
      .select('id, business_name, category, offer_text')
      .eq('gromada_id', id)
      .then(({ data }) => setAllies((data ?? []) as Ally[]));
  }, [id]);

  const isMember = gromada?.gromada_members?.some((m) => m.user_id === user?.id) ?? false;
  const isElder = gromada?.elder_id === user?.id;

  async function handleJoin() {
    if (!user || !id) return;
    setActing(true);
    try { await joinGromada(id, user.id); await fetchGromada(id).then(setGromada); }
    catch { /* toast would go here */ }
    finally { setActing(false); }
  }

  async function handleLeave() {
    if (!user || !id) return;
    setActing(true);
    try { await leaveGromada(id, user.id); router.back(); }
    catch { }
    finally { setActing(false); }
  }

  if (loading) return (
    <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={theme.colors.accent} /></View></SafeAreaView>
  );
  if (!gromada) return (
    <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.errorText}>Nie znaleziono Gromady</Text></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('gromady:info')}</Text>
        {isElder && (
          <Pressable onPress={() => router.push(`/(app)/(gromady)/${id}/settings`)} style={styles.settingsBtn} accessibilityRole="button">
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identityBlock}>
          <ProceduralAvatar config={gromada.avatar_config} size={80} />
          <Text style={styles.gromadaName}>{gromada.name}</Text>
          {gromada.description ? <Text style={styles.description}>{gromada.description}</Text> : null}
          <Text style={styles.foundedText}>
            Założona {format(new Date(gromada.created_at), 'd MMMM yyyy', { locale: pl })}
          </Text>
        </View>

        {/* Interests */}
        {gromada.gromada_interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Zainteresowania</Text>
            <View style={styles.interestsRow}>
              {gromada.gromada_interests.map((gi) =>
                gi.interests ? (
                  <Badge key={gi.interest_id} label={gi.interests.name_pl} emoji={gi.interests.emoji} />
                ) : null,
              )}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Statystyki</Text>
          <View style={styles.statsGrid}>
            {[
              { label: t('gromady:meetings_this_month'), value: gromada.meetings_this_month },
              { label: t('gromady:total_meetings'), value: gromada.total_meetings_count },
              { label: t('gromady:favors_exchanged'), value: gromada.favors_exchanged },
              { label: 'Członkowie', value: `${gromada.member_count}/${gromada.max_members}` },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Warmth */}
        <View style={styles.section}>
          <WarmthIndicator
            meetingsThisMonth={gromada.meetings_this_month}
            favorsExchanged={gromada.favors_exchanged}
            memberCount={gromada.member_count}
          />
        </View>

        {/* Favors */}
        {isMember && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Potrzebne ręce</Text>

            {/* Create favor */}
            <View style={styles.favorComposer}>
              <Input
                label=""
                value={newFavor}
                onChangeText={(v) => setNewFavor(v.slice(0, 200))}
                placeholder="Czego potrzebujesz?"
                containerStyle={styles.favorInput}
              />
              <Button
                label={creatingFavor ? '' : 'Dodaj'}
                loading={creatingFavor}
                size="sm"
                onPress={async () => {
                  if (!newFavor.trim()) return;
                  setCreatingFavor(true);
                  try { await createFavor(newFavor.trim()); setNewFavor(''); }
                  finally { setCreatingFavor(false); }
                }}
                style={styles.favorBtn}
              />
            </View>

            {favors.length > 0 && favors.map((f) => {
              const isOwn = f.requested_by === user?.id;
              const authorName = f.profiles?.nickname ?? f.profiles?.first_name ?? 'Ktoś';
              return (
                <View key={f.id} style={styles.favorRow}>
                  <View style={styles.favorContent}>
                    <Text style={styles.favorAuthor}>{authorName}</Text>
                    <Text style={styles.favorDesc}>{f.description}</Text>
                  </View>
                  {isOwn ? (
                    <Button
                      label="Pomożono ✓"
                      size="sm"
                      variant="ghost"
                      onPress={() => markHelped(f.id)}
                    />
                  ) : (
                    <Button
                      label="Pomogę"
                      size="sm"
                      onPress={() => offer(f.id)}
                    />
                  )}
                </View>
              );
            })}

            {favors.length === 0 && (
              <Text style={styles.favorEmpty}>{t('profile:favors_empty')}</Text>
            )}
          </View>
        )}

        {/* Crossovers */}
        {crossovers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Crossovery</Text>
            {crossovers.map((c) => (
              <View key={c.id} style={styles.crossoverCard}>
                <View style={styles.crossoverInfo}>
                  <Text style={styles.crossoverTitle}>{c.title}</Text>
                  <Badge label={c.status} variant="default" />
                </View>
                {c.status === 'proposed' && isMember && (
                  <Button
                    label={`Wspieram (${c.vote_count})`}
                    size="sm"
                    variant="ghost"
                    onPress={() => voteCrossover(c.id).then(() =>
                      setCrossovers((prev) => prev.map((x) =>
                        x.id === c.id ? { ...x, vote_count: x.vote_count + 1 } : x
                      ))
                    ).catch(() => {})}
                    accessibilityLabel={`Zagłosuj na crossover ${c.title}`}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Allies */}
        {allies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sojusznicy</Text>
            {allies.map((a) => (
              <View key={a.id} style={styles.allyCard}>
                <Text style={styles.allyName}>{a.business_name}</Text>
                <Badge label={a.category} variant="default" />
                <Text style={styles.allyOffer}>{a.offer_text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action */}
        {!isMember ? (
          <Button
            label={acting ? '' : t('gromady:join')}
            loading={acting}
            onPress={handleJoin}
            size="lg"
            style={styles.actionBtn}
          />
        ) : !isElder ? (
          <Button
            label={acting ? '' : t('gromady:leave')}
            loading={acting}
            variant="ghost"
            onPress={handleLeave}
            style={styles.actionBtn}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.body },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { flex: 1, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  settingsBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 22 },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  identityBlock: { alignItems: 'center', gap: theme.spacing.sm },
  gromadaName: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, textAlign: 'center' },
  description: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: theme.fontSize.body * 1.5 },
  foundedText: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary },
  section: { gap: theme.spacing.sm },
  sectionLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, alignItems: 'center', gap: 4 },
  statValue: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.accent },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary, textAlign: 'center' },
  actionBtn: { width: '100%' },
  favorComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm },
  favorInput: { flex: 1, marginBottom: 0 },
  favorBtn: { minWidth: 64 },
  favorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  favorContent: { flex: 1, gap: 2 },
  favorAuthor: { fontSize: theme.fontSize.xs, color: theme.colors.accent, fontWeight: theme.fontWeight.medium },
  favorDesc: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  favorEmpty: { fontSize: theme.fontSize.body, color: theme.colors.textTertiary, fontStyle: 'italic' },
  crossoverCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: theme.spacing.sm, padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  crossoverInfo: { flex: 1, gap: 4 },
  crossoverTitle: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.medium, color: theme.colors.textPrimary },
  allyCard: {
    gap: theme.spacing.xs, padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  allyName: { fontSize: theme.fontSize.body, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  allyOffer: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
});
