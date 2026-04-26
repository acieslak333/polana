import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { isToday, isYesterday, format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { ChatBubble } from '@/components/chat/ChatBubble';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useChatMessages } from '@/hooks/useMessages';
import type { Message } from '@/services/api/messages';

const MAX_MSG = 2000;

type ListItem =
  | { kind: 'message'; message: Message; showAvatar: boolean }
  | { kind: 'separator'; label: string };

function daySeparatorLabel(iso: string, today: string, yesterday: string): string {
  const date = new Date(iso);
  if (isToday(date)) return today;
  if (isYesterday(date)) return yesterday;
  return format(date, 'd MMMM yyyy', { locale: pl });
}

export default function ChatScreen() {
  const { t } = useTranslation(['messages', 'common']);
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const chatRoomId = Array.isArray(_rawId) ? _rawId[0] : (_rawId ?? '');
  const { user } = useAuthStore();

  const { messages, loading, hasMore, loadMore, send } = useChatMessages(chatRoomId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Build list items: interleave day separators between date-boundary messages
  const todayLabel = t('common:today');
  const yesterdayLabel = t('common:yesterday');

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastDay = '';

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const dayLabel = daySeparatorLabel(msg.created_at, todayLabel, yesterdayLabel);

      if (dayLabel !== lastDay) {
        items.push({ kind: 'separator', label: dayLabel });
        lastDay = dayLabel;
      }

      const prevMsg = i > 0 ? messages[i - 1] : null;
      const showAvatar = msg.sender_id !== user?.id && prevMsg?.sender_id !== msg.sender_id;
      items.push({ kind: 'message', message: msg, showAvatar });
    }

    return items;
  }, [messages, user?.id]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      await send(body);
    } finally {
      setSending(false);
    }
  }, [text, sending, send]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t("common:back")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('messages:chats')}</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={listItems}
          keyExtractor={(item) =>
            item.kind === 'separator'
              ? `sep-${item.label}`
              : item.message.id
          }
          contentContainerStyle={styles.msgList}
          onStartReached={loadMore}
          onStartReachedThreshold={0.2}
          ListHeaderComponent={
            hasMore ? (
              <ActivityIndicator
                style={{ padding: theme.spacing.md }}
                color={theme.colors.accent}
              />
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === 'separator') {
              return (
                <View style={styles.daySeparatorRow}>
                  <View style={styles.daySeparatorLine} />
                  <Text style={styles.daySeparatorLabel}>{item.label}</Text>
                  <View style={styles.daySeparatorLine} />
                </View>
              );
            }
            const isOwn = item.message.sender_id === user?.id;
            return (
              <ChatBubble
                message={item.message}
                isOwn={isOwn}
                showAvatar={item.showAvatar}
              />
            );
          }}
        />

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t("messages:message_placeholder")}
            placeholderTextColor={theme.colors.textTertiary}
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_MSG))}
            multiline
            maxLength={MAX_MSG}
            accessibilityLabel={t("messages:message_placeholder")}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel={t("common:send")}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={({ pressed }) => [
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendIcon}>→</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  msgList: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  daySeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.md,
  },
  daySeparatorLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  daySeparatorLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: theme.fontWeight.bold },
});
