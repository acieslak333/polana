import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { ChatBubble } from '@/components/chat/ChatBubble';
import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useChatMessages } from '@/hooks/useMessages';

const MAX_MSG = 2000;

export default function ChatScreen() {
  const { id: _rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const chatRoomId = Array.isArray(_rawId) ? _rawId[0] : (_rawId ?? '');
  const { user } = useAuthStore();

  const { messages, loading, hasMore, loadMore, send } = useChatMessages(chatRoomId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try { await send(body); }
    finally { setSending(false); }
  }, [text, sending, send]);

  if (loading) return (
    <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Czat</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          onStartReached={loadMore}
          onStartReachedThreshold={0.2}
          renderItem={({ item, index }) => {
            const isOwn = item.sender_id === user?.id;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showAvatar = !isOwn && prevMsg?.sender_id !== item.sender_id;
            return <ChatBubble message={item} isOwn={isOwn} showAvatar={showAvatar} />;
          }}
          ListHeaderComponent={
            hasMore ? <ActivityIndicator style={{ padding: theme.spacing.md }} color={theme.colors.accent} /> : null
          }
        />

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Napisz wiadomość..."
            placeholderTextColor={theme.colors.textTertiary}
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_MSG))}
            multiline
            maxLength={MAX_MSG}
            accessibilityLabel="Napisz wiadomość"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Wyślij"
            style={({ pressed }) => [
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendIcon}>↑</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: theme.colors.accent },
  headerTitle: { flex: 1, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  msgList: { padding: theme.spacing.md, gap: theme.spacing.xs, paddingBottom: theme.spacing.xl },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm, padding: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  input: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: theme.colors.backgroundCard, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, fontSize: theme.fontSize.body, color: theme.colors.textPrimary },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: theme.fontWeight.bold },
});
