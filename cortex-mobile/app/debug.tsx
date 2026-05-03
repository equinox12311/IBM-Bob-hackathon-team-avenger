/**
 * Debugging Helper — AI chat with RAG citations, mirrors web DebuggingHelper.
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
import { useThemeMode } from '../src/hooks/useThemeMode';
import { insertEntry } from '../src/services/database';
import { chat, checkOllamaHealth, getOllamaHost } from '../src/services/llm';
import { buildLLMContext } from '../src/services/memory';
import { apiChat, apiCreateEntry, apiLlmInfo, apiSearchEntries, isApiConfigured } from '../src/services/api';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: { id: number; text: string; score: number }[];
  model?: string;
  streaming?: boolean;
}

const SYSTEM_MSG: ChatMsg = {
  id: 'sys',
  role: 'assistant',
  text: 'Paste a stack trace, error message, or describe a bug. I\'ll search past Cortex entries for matches and (if Granite is enabled) draft a fix path grounded in your journal.',
};

export default function DebugScreen() {
  const { Colors } = useThemeMode();
  const S = makeStyles(Colors);
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([SYSTEM_MSG]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [llmAvailable, setLlmAvailable] = useState<boolean | null>(null);
  const [llmProvider, setLlmProvider] = useState('');
  const [apiEnabled, setApiEnabled] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useFocusEffect(useCallback(() => {
    isApiConfigured().then(async ok => {
      setApiEnabled(ok);
      if (ok) {
        try {
          const info = await apiLlmInfo();
          setLlmAvailable(info.available);
          setLlmProvider(info.provider);
        } catch { setLlmAvailable(false); }
      } else {
        const host = await getOllamaHost();
        if (host) {
          const { online } = await checkOllamaHealth();
          setLlmAvailable(online);
          setLlmProvider(online ? 'granite3.3:2b (local)' : '');
        } else {
          setLlmAvailable(false);
        }
      }
    });
  }, []));

  const scrollToEnd = () => setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    Keyboard.dismiss();
    setInput('');
    setBusy(true);

    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', text: q };
    const aId = `a-${Date.now()}`;
    const aMsg: ChatMsg = { id: aId, role: 'assistant', text: '', streaming: true };
    setMessages(prev => [...prev, userMsg, aMsg]);
    scrollToEnd();

    // Save debug entry
    try {
      if (apiEnabled) await apiCreateEntry({ text: q, kind: 'debug', source: 'mobile' });
      else await insertEntry({ text: q, kind: 'debug', source: 'mobile' });
    } catch {}

    // Try backend RAG first
    if (apiEnabled && llmAvailable) {
      try {
        const res = await apiChat(q, 5);
        const citations = res.citations ?? [];
        const text = res.answer + (citations.length
          ? '\n\n📎 Sources:\n' + citations.map(c => `• #${c.id} (score ${c.score.toFixed(2)}): ${c.text.slice(0, 80)}…`).join('\n')
          : '');
        setMessages(prev => prev.map(m => m.id === aId ? { ...m, text, citations, model: res.model, streaming: false } : m));
        setBusy(false);
        scrollToEnd();
        return;
      } catch {}
    }

    // Try Ollama local
    if (llmAvailable && !apiEnabled) {
      const ctx = await buildLLMContext(q);
      let full = '';
      await chat(q, ctx,
        tok => {
          full += tok;
          setMessages(prev => prev.map(m => m.id === aId ? { ...m, text: full } : m));
          scrollToEnd();
        },
        _f => {
          setMessages(prev => prev.map(m => m.id === aId ? { ...m, streaming: false } : m));
          setBusy(false);
        },
        err => {
          setMessages(prev => prev.map(m => m.id === aId ? { ...m, text: `⚠️ ${err}`, streaming: false } : m));
          setBusy(false);
        }
      );
      return;
    }

    // Fallback: plain search
    try {
      let results: any[] = [];
      if (apiEnabled) results = await apiSearchEntries(q, 3);
      if (results.length === 0) {
        setMessages(prev => prev.map(m => m.id === aId ? {
          ...m,
          text: 'LLM is not available. Configure Ollama or cortex-api with LLM enabled.\n\nTip: Set LLM_PROVIDER=watsonx in .env and restart the API.',
          streaming: false,
        } : m));
      } else {
        const text = `Found ${results.length} related entries:\n\n` +
          results.map((e: any, i: number) => `${i + 1}. [${e.kind}] ${e.text.slice(0, 120)}…`).join('\n\n');
        setMessages(prev => prev.map(m => m.id === aId ? { ...m, text, streaming: false } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === aId ? { ...m, text: 'Could not search entries. Check your connection.', streaming: false } : m));
    }
    setBusy(false);
    scrollToEnd();
  };

  const renderMsg = ({ item }: { item: ChatMsg }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[S.msgRow, isUser && S.msgRowUser]}>
        {!isUser && (
          <View style={S.avatar}>
            <Ionicons name="hardware-chip-outline" size={14} color={Colors.primary} />
          </View>
        )}
        <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleAI]}>
          {item.streaming && item.text === '' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[S.bubbleText, isUser && S.bubbleTextUser]}>
              {item.text}{item.streaming ? ' ▋' : ''}
            </Text>
          )}
          {item.model && <Text style={S.modelTag}>via {item.model}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={S.headerTitle}>Debugging Helper</Text>
          <Text style={[S.headerSub, { color: llmAvailable ? Colors.llmOnline : Colors.outline }]}>
            {llmAvailable === null ? '● Checking…'
              : llmAvailable ? `● ${llmProvider || 'LLM ready'}`
              : '● LLM off — using recall fallback'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMessages([SYSTEM_MSG])} style={{ padding: 8 }}>
          <Ionicons name="trash-outline" size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMsg}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        />
      </View>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={TAB_BAR_HEIGHT}>
        <View style={S.inputOuter}>
          <View style={S.inputInner}>
            <TextInput
              style={S.input}
              placeholder="Paste stack trace, error, or describe a bug…"
              placeholderTextColor={Colors.outline}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={3000}
              editable={!busy}
            />
            <TouchableOpacity
              style={[S.sendBtn, (!input.trim() || busy) && S.sendOff]}
              onPress={send}
              disabled={!input.trim() || busy}
            >
              {busy ? <ActivityIndicator size="small" color={Colors.surfaceContainerLowest} /> : <Ionicons name="send" size={17} color={Colors.surfaceContainerLowest} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      <View style={{ height: TAB_BAR_HEIGHT }} />
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ReturnType<typeof useThemeMode>['Colors']) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  headerSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  list: { padding: 14, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.onSurface, lineHeight: 22 },
  bubbleTextUser: { color: Colors.surfaceContainerLowest },
  modelTag: { fontSize: 10, color: Colors.outline, marginTop: 4, fontStyle: 'italic' },
  inputOuter: { backgroundColor: Colors.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  inputInner: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#f2f3ff', borderRadius: 24, borderWidth: 1, borderColor: Colors.outlineVariant, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, minHeight: 48 },
  input: { flex: 1, fontSize: 14, color: Colors.onSurface, maxHeight: 120, paddingTop: 6, paddingBottom: 6, lineHeight: 20 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendOff: { opacity: 0.3 },
});
