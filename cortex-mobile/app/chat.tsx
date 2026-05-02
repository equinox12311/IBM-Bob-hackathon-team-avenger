/**
 * AI Chat — Granite 3.3:2b via Ollama
 * Input bar is OUTSIDE KeyboardAvoidingView so it's always visible on Android.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors, Spacing } from '../src/constants/theme';
import { clearConversation, getConversationHistory } from '../src/services/database';
import { chat, checkOllamaHealth, getOllamaHost } from '../src/services/llm';
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
  const router = useRouter();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [llmOnline, setLlmOnline] = useState<boolean | null>(null);
  const [llmHost, setLlmHost] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const checkStatus = useCallback(async () => {
    const host = await getOllamaHost();
    setLlmHost(host);
    if (!host) { setLlmOnline(false); return; }
    const { online } = await checkOllamaHealth();
    setLlmOnline(online);
  }, []);

  const loadHistory = useCallback(async () => {
    const history = await getConversationHistory(20);
    setMessages(history.map(m => ({
      id: String(m.id),
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })));
  }, []);

  useFocusEffect(useCallback(() => {
    loadHistory();
    checkStatus();
  }, [loadHistory, checkStatus]));

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || isStreaming) return;
    Keyboard.dismiss();
    setInput('');

    const userMsg: UIMessage = { id: `u-${Date.now()}`, role: 'user', content: userText };
    const aId = `a-${Date.now()}`;
    const aMsg: UIMessage = { id: aId, role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, aMsg]);
    setIsStreaming(true);
    scrollToBottom();

    const ctx = await buildLLMContext(userText);

    await chat(
      userText, ctx,
      token => {
        setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: m.content + token } : m));
        scrollToBottom();
      },
      _full => {
        setMessages(prev => prev.map(m => m.id === aId ? { ...m, streaming: false } : m));
        setIsStreaming(false);
        setLlmOnline(true);
      },
      err => {
        setMessages(prev => prev.map(m =>
          m.id === aId ? { ...m, content: `⚠️ ${err}\n\nGo to Profile → AI Settings.`, streaming: false } : m
        ));
        setIsStreaming(false);
        setLlmOnline(false);
      }
    );
  };

  const handleClear = () =>
    Alert.alert('Clear chat', 'Delete all history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearConversation(); setMessages([]); } },
    ]);

  const statusColor = llmOnline === true ? Colors.llmOnline
    : llmOnline === false ? Colors.llmOffline : Colors.llmLoading;

  const renderMessage = ({ item }: { item: UIMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[S.row, isUser && S.rowUser]}>
        {!isUser && (
          <View style={S.avatar}>
            <Ionicons name="hardware-chip-outline" size={14} color={Colors.primary} />
          </View>
        )}
        <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleAI]}>
          {item.streaming && item.content === '' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[S.bubbleText, isUser && S.bubbleTextUser]}>
              {item.content}{item.streaming ? ' ▋' : ''}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    // edges={['top']} only — bottom is handled manually so input stays above tab bar
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <View style={S.hLeft}>
          <View style={[S.chip2, {
            backgroundColor: llmOnline ? '#defbe6' : llmOnline === null ? '#fffbeb' : '#fff1f2',
          }]}>
            <Ionicons name="hardware-chip-outline" size={16} color={statusColor} />
          </View>
          <View>
            <Text style={S.hTitle}>Granite 3.3:2b</Text>
            <TouchableOpacity onPress={checkStatus}>
              <Text style={[S.hStatus, { color: statusColor }]}>
                {llmOnline === null ? '● Checking…' : llmOnline ? '● Online' : llmHost ? '● Offline' : '● Not configured'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={S.hRight}>
          <TouchableOpacity onPress={checkStatus} style={S.hBtn}>
            <Ionicons name="refresh-outline" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={S.hBtn}>
            <Ionicons name="trash-outline" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Offline banner ── */}
      {llmOnline === false && (
        <TouchableOpacity style={S.banner} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Ionicons name="warning-outline" size={14} color="#7a3800" />
          <Text style={S.bannerTxt}>
            {llmHost ? `Cannot reach ${llmHost}` : 'No host set'} — tap to fix
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#7a3800" />
        </TouchableOpacity>
      )}

      {/* ── Messages ── fills all space between header and input ── */}
      <View style={S.msgArea}>
        {messages.length === 0 ? (
          <View style={S.empty}>
            <View style={S.emptyIcon}>
              <Ionicons name="hardware-chip-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={S.emptyTitle}>Ask Cortex anything</Text>
            <Text style={S.emptySub}>Granite 3.3:2b · on your local network</Text>
            <View style={S.quickList}>
              {QUICK_PROMPTS.map(p => (
                <TouchableOpacity key={p} style={S.quickItem} onPress={() => sendMessage(p)} activeOpacity={0.75}>
                  <Ionicons name="flash-outline" size={13} color={Colors.primary} />
                  <Text style={S.quickTxt}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={renderMessage}
            contentContainerStyle={S.list}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      {/* ── Input bar — FIXED above tab bar, never hidden ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + 10 : 0}
      >
        <View style={S.inputOuter}>
          <View style={S.inputInner}>
            <TextInput
              ref={inputRef}
              style={S.input}
              placeholder="Type a message…"
              placeholderTextColor="#737687"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              returnKeyType="default"
              blurOnSubmit={false}
              editable={!isStreaming}
            />
            <TouchableOpacity
              style={[S.sendBtn, (!input.trim() || isStreaming) && S.sendOff]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || isStreaming}
              activeOpacity={0.85}
            >
              {isStreaming
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Space so content doesn't hide behind tab bar */}
      <View style={{ height: TAB_BAR_HEIGHT }} />

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#c3c6d8',
  },
  hLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hRight: { flexDirection: 'row' },
  chip2: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 14, fontWeight: '700', color: '#191b24' },
  hStatus: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  hBtn: { padding: 8 },

  /* Banner */
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff7ed', borderBottomWidth: 1, borderBottomColor: '#fed7aa',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  bannerTxt: { flex: 1, fontSize: 12, color: '#7a3800' },

  /* Message area */
  msgArea: { flex: 1 },
  list: { padding: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  rowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#dbe1ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: '#004ccd', borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#c3c6d8', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#191b24', lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },

  /* Empty state */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#dbe1ff', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  emptySub: { fontSize: 13, color: '#424656', marginTop: 5, textAlign: 'center' },
  quickList: { marginTop: 18, width: '100%', gap: 8 },
  quickItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#c3c6d8',
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14,
  },
  quickTxt: { fontSize: 14, color: '#004ccd', fontWeight: '500' },

  /* ── Input bar ── */
  inputOuter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#c3c6d8',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f2f3ff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#c3c6d8',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#191b24',
    maxHeight: 120,
    paddingTop: 6,
    paddingBottom: 6,
    lineHeight: 22,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#004ccd',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    marginBottom: 1,
  },
  sendOff: { opacity: 0.3 },
});
