import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { fetchPendingReports, resolveReport, undoResolveReport, type ReportRow } from '@/services/api/moderation';
import { fetchGromadyForElder } from '@/services/api/gromady';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Nękanie',
  inappropriate: 'Nieodpowiednia treść',
  other: 'Inne',
};

export default function ModerationScreen() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gromadaIds, setGromadaIds] = useState<string[]>([]);
  const [undoToast, setUndoToast] = useState<{
    message: string;
    onUndo: () => void;
    timerId: ReturnType<typeof setTimeout>;
  } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const gromady = await fetchGromadyForElder(user.id);
      const ids = gromady.map((g) => g.id);
      setGromadaIds(ids);
      const data = await fetchPendingReports(ids);
      setReports(data);
    } catch { /* stay empty */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function handleAction(
    report: ReportRow,
    action: 'hide' | 'dismiss',
  ): Promise<void> {
    setReports((prev) => prev.filter((r) => r.id !== report.id));

    const targetId = report.post_id ?? report.comment_id;
    const targetType: 'post' | 'comment' | null = report.post_id
      ? 'post'
      : report.comment_id
        ? 'comment'
        : null;

    try {
      await resolveReport(report.id, action, targetId, targetType);
    } catch {
      setReports((prev) => [report, ...prev]);
      return;
    }

    if (undoToast) {
      clearTimeout(undoToast.timerId);
      setUndoToast(null);
    }

    const timerId = setTimeout(() => setUndoToast(null), 7000);
    setUndoToast({
      message: action === 'hide' ? 'Treść ukryta' : 'Zgłoszenie odrzucone',
      timerId,
      onUndo: async () => {
        clearTimeout(timerId);
        setUndoToast(null);
        try {
          await undoResolveReport(report.id, action, targetId, targetType);
          setReports((prev) => [report, ...prev]);
        } catch { /* undo failed silently */ }
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Zgłoszenia</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.reason}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
                <Text style={styles.time}>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: pl })}
                </Text>
              </View>
              <Text style={styles.content} numberOfLines={3}>
                {item.post_content ?? item.comment_content ?? '(brak treści)'}
              </Text>
              {item.description && (
                <Text style={styles.description}>„{item.description}"</Text>
              )}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.btnHide]}
                  onPress={() => { void handleAction(item, 'hide'); }}
                  accessibilityRole="button"
                  accessibilityLabel="Ukryj treść"
                >
                  <Text style={styles.btnHideText}>Ukryj treść</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnDismiss]}
                  onPress={() => { void handleAction(item, 'dismiss'); }}
                  accessibilityRole="button"
                  accessibilityLabel="Odrzuć zgłoszenie"
                >
                  <Text style={styles.btnDismissText}>Odrzuć</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>Brak oczekujących zgłoszeń</Text>
            </View>
          }
        />
      )}

      {undoToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{undoToast.message}</Text>
          <Pressable
            onPress={undoToast.onUndo}
            accessibilityRole="button"
            accessibilityLabel="Cofnij"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toastUndo}>Cofnij</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  title: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  list: { padding: theme.spacing.xl, gap: theme.spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  card: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reason: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.error },
  time: { fontSize: theme.fontSize.xs, color: theme.colors.textTertiary },
  content: { fontSize: theme.fontSize.body, color: theme.colors.textPrimary, lineHeight: 22 },
  description: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  btn: { flex: 1, minHeight: 44, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnHide: { backgroundColor: theme.colors.error },
  btnHideText: { color: '#fff', fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  btnDismiss: { borderWidth: 1, borderColor: theme.colors.border },
  btnDismissText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  toast: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  toastText: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, flex: 1 },
  toastUndo: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: theme.fontWeight.semibold },
});
