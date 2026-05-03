/**
 * Ask — Granite chat. Uses cortex-api /chat (RAG with citations) when
 * connected, otherwise Ollama local fallback. The status pill quietly
 * tells the user which backend is responding.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, IconButton, Pill } from '../src/components/ui';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { apiChat, isApiConfigured } from '../src/services/api';
import { clearConversation, getConversationHistory } from '../src/services/database';
import { chat, checkOllamaHealth } from '../src/services/llm';
import { buildLLMContext } from '../src/services/memory';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const QUICK_PROMPTS = [
  'Summarise my recent work',
  'What was I debugging?',
  'List my top ideas',
  'Help me write a commit message',
];

export default function ChatScreen() {
  const { Colors } = useThemeMode();

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);
  const [localOnline, setLocalOnline] = useState<boolean | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadHistory = useCallback(async () => {
    const history = await getConversationHistory(20);
    setMessages(
      history.map((m) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    );
  }, []);

  const refreshStatus = useCallback(async () => {
    const ok = await isApiConfigured();
    setApiEnabled(ok);
    if (ok) { setLocalOnline(null); return; }
    const { online } = await checkOllamaHealth();
    setLocalOnline(online);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      refreshStatus();
    }, [loadHistory, refreshStatus]),
  );

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || isStreaming) return;
    Keyboard.dismiss();
    setInput('');

    const userMsg: UIMessage = { id: `u-${Date.now()}`, role: 'user', content: userText };
    const aId = `a-${Date.now()}`;
    const aMsg: UIMessage = { id: aId, role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, userMsg, aMsg]);
    setIsStreaming(true);
    scrollToBottom();

    // Backend RAG path (preferred — has citations)
    if (apiEnabled) {
      try {
        const res = await apiChat(userText, 5);
        const cites = res.citations?.length
          ? '\n\n— citations: ' + res.citations.map((c) => `#${c.id}`).join(', ')
          : '';
        const full = res.answer + cites;
        setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: full, streaming: false } : m)));
        setIsStreaming(false);
        return;
      } catch { /* fall through to local */ }
    }

    // Local Ollama fallback
    const ctx = await buildLLMContext(userText);
    await chat(
      userText, ctx,
      (token) => {
        setMessages((p) =>
          p.map((m) => (m.id === aId ? { ...m, content: m.content + token } : m)),
        );
        scrollToBottom();
      },
      () => {
        setMessages((p) => p.map((m) => (m.id === aId ? { ...m, streaming: false } : m)));
        setIsStreaming(false);
        setLocalOnline(true);
      },
      (err) => {
        setMessages((p) =>
          p.map((m) =>
            m.id === aId
              ? {
                  ...m,
                  content: `Couldn't reach a model.\n\n${err}\n\nConnect cortex-api in Settings, or run a local Ollama with granite3.3:2b.`,
                  streaming: false,
                }
              : m,
          ),
        );
        setIsStreaming(false);
        setLocalOnline(false);
      },
    );
  };

  const clearAll = () =>
    Alert.alert('Clear chat?', 'This deletes all conversation history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => { await clearConversation(); setMessages([]); },
      },
    ]);

  const statusPill = apiEnabled
    ? <Pill label="Granite RAG" tone="success" icon="sparkles" />
    : localOnline === true
    ? <Pill label="Local · Granite 2B" tone="primary" dot />
    : localOnline === false
    ? <Pill label="No model" tone="warning" dot />
    : <Pill label="Checking…" tone="neutral" />;

  const renderMessage = ({ item }: { item: UIMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.row, isUser && s.rowUser]}>
        {!isUser && (
          <View style={[s.avatar, { backgroundColor: Colors.primaryFixed }]}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
          </View>
        )}
        <View
          style={[
            s.bubble,
            isUser
              ? { backgroundColor: Colors.primary }
              : { backgroundColor: Colors.surfaceContainer },
          ]}
        >
          {item.streaming && item.content === '' ? (
            <ActivityIndicator size="small" color={isUser ? Colors.onPrimary : Colors.primary} />
          ) : (
            <Text
              style={[
                Typography.body,
                { color: isUser ? Colors.onPrimary : Colors.onSurface },
              ]}
            >
              {item.content}
              {item.streaming ? ' ▋' : ''}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: Colors.background }]} edges={['top']}>
      <Header
        title="Ask"
        eyebrow="Granite"
        right={
          <>
            {statusPill}
            <IconButton icon="refresh-outline" onPress={refreshStatus} size="sm" />
            <IconButton icon="trash-outline" onPress={clearAll} size="sm" />
          </>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={s.emptyWrap}>
            <View style={[s.emptyIcon, { backgroundColor: Colors.primaryFixed }]}>
              <Ionicons name="sparkles" size={28} color={Colors.primary} />
            </View>
            <Text style={[Typography.h3, { color: Colors.onSurface, textAlign: 'center' }]}>
              Ask Granite anything from your diary.
            </Text>
            <Text style={[Typography.body, { color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 320 }]}>
              {apiEnabled
                ? 'Cortex-api will retrieve the relevant entries and Granite will answer with citations.'
                : 'Connect cortex-api in Settings for grounded answers, or run Granite locally.'}
            </Text>
            <View style={s.quickRow}>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.85}
                  onPress={() => send(p)}
                  style={[s.quickChip, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }]}
                >
                  <Text style={[Typography.bodySm, { color: Colors.onSurface }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Input bar */}
        <View
          style={[
            s.inputBar,
            {
              backgroundColor: Colors.surfaceContainerLowest,
              borderTopColor: Colors.outlineVariant,
              paddingBottom: TAB_BAR_HEIGHT + Spacing.sm,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Cortex…"
            placeholderTextColor={Colors.outline}
            multiline
            style={[
              s.input,
              { backgroundColor: Colors.surfaceContainer, color: Colors.onSurface },
            ]}
          />
          <TouchableOpacity
            disabled={isStreaming || !input.trim()}
            onPress={() => send()}
            style={[
              s.sendBtn,
              {
                backgroundColor: input.trim() ? Colors.primary : Colors.surfaceContainerHigh,
                opacity: isStreaming ? 0.5 : 1,
              },
            ]}
          >
            {isStreaming ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={18}
                color={input.trim() ? Colors.onPrimary : Colors.outline}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center', marginTop: Spacing.sm },
  quickChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
  },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, maxWidth: '92%' },
  rowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    maxWidth: '88%',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.input,
    ...Typography.body,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
