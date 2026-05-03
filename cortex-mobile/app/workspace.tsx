/**
 * Workspace — Granite chat over diary, with explicit "Send to Bob" escalation.
 *
 * Same data flow as before: search recent entries, surface the top match,
 * optionally queue the prompt to Bob via /actions/queue.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Header, Pill } from '../src/components/ui';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { apiCreateEntry, apiQueueAction, apiSearchEntries, isApiConfigured } from '../src/services/api';

interface Citation { id: number; text: string; score: number; }
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  ts: number;
  escalated?: boolean;
}

const SUGGESTED = [
  'Authentication',
  'Recent fixes',
  "Today's decisions",
];

export default function WorkspaceScreen() {
  const { Colors } = useThemeMode();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => { isApiConfigured().then(setConfigured); }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { role: 'user', text, ts: Date.now() }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      let answer = '';
      const citations: Citation[] = [];
      if (configured) {
        await apiCreateEntry({ text, source: 'mobile', kind: 'note' });
        const hits = await apiSearchEntries(text, 5);
        if (hits.length > 0) {
          answer =
            `Found ${hits.length} related ${hits.length === 1 ? 'entry' : 'entries'}.\n\n` +
            `Top match: "${hits[0].text.slice(0, 200)}${hits[0].text.length > 200 ? '…' : ''}"`;
          for (const h of hits) citations.push({ id: h.id, text: h.text, score: h.score });
        } else {
          answer = 'No related entries yet — save your insights as you discover them.';
        }
      } else {
        answer = 'Granite is offline (cortex-api not configured). Connect in Settings to enable RAG.';
      }
      setMessages((m) => [...m, { role: 'assistant', text: answer, citations, ts: Date.now() }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Error: ${String(e)}`, ts: Date.now() }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }

  async function escalateLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setMessages((m) => m.map((msg) => (msg === lastUser ? { ...msg, escalated: true } : msg)));
    if (!configured) return;
    try {
      await apiQueueAction('free', { prompt: lastUser.text });
    } catch {
      setMessages((m) => m.map((msg) => (msg === lastUser ? { ...msg, escalated: false } : msg)));
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: Colors.background }]} edges={['top']}>
      <Header
        title="Workspace"
        eyebrow="06 · the hand-off"
        back
        right={
          configured === null ? null
            : configured
              ? <Pill label="Granite RAG" tone="success" icon="sparkles" />
              : <Pill label="API offline" tone="neutral" icon="cloud-offline" />
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + Spacing.lg, gap: Spacing.sm }}
        >
          {messages.length === 0 ? (
            <Card variant="primary" size="hero" padding="lg">
              <Text style={[Typography.codeSm, { color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase' }]}>
                from phone to bob.
              </Text>
              <Text style={[Typography.h2, { color: Colors.onPrimaryFixed, marginTop: 6, letterSpacing: -0.5 }]}>
                In one tap.
              </Text>
              <Text style={[Typography.bodyLg, { color: Colors.onPrimaryFixed, opacity: 0.8, marginTop: Spacing.sm }]}>
                Ask Granite over your diary. When the work needs IBM Bob, queue it with a tap — Bob picks up at the start of its next session.
              </Text>
              <View style={s.suggested}>
                {SUGGESTED.map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    activeOpacity={0.85}
                    onPress={() => setInput(sug)}
                    style={[s.sugChip, { backgroundColor: Colors.surfaceContainerLowest }]}
                  >
                    <Text style={[Typography.labelSm, { color: Colors.primary }]}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          ) : (
            messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <View
                  key={i}
                  style={[
                    s.bubble,
                    isUser
                      ? { alignSelf: 'flex-end', backgroundColor: Colors.primary }
                      : { alignSelf: 'flex-start', backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant, borderWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={[Typography.body, { color: isUser ? Colors.onPrimary : Colors.onSurface }]}>
                    {m.text}
                  </Text>
                  {m.citations?.length ? (
                    <View style={s.citations}>
                      {m.citations.map((c) => (
                        <View key={c.id} style={[s.citation, { backgroundColor: Colors.surfaceContainer }]}>
                          <Text style={[Typography.codeSm, { color: Colors.onSurfaceVariant }]}>
                            #{c.id} · {c.score.toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {isUser && (
                    <TouchableOpacity
                      onPress={escalateLast}
                      activeOpacity={0.85}
                      disabled={m.escalated}
                      style={[s.escalate, { backgroundColor: m.escalated ? Colors.success : Colors.primaryContainer }]}
                    >
                      <Ionicons
                        name={m.escalated ? 'checkmark-circle' : 'rocket'}
                        size={13}
                        color={Colors.onPrimary}
                      />
                      <Text style={[Typography.labelSm, { color: Colors.onPrimary }]}>
                        {m.escalated ? 'Sent to Bob' : 'Send to Bob'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          {busy && (
            <View style={s.busy}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant }]}>
                Granite is thinking…
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            s.composer,
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
            placeholder="Ask Bob…"
            placeholderTextColor={Colors.outline}
            multiline
            style={[s.input, { backgroundColor: Colors.surfaceContainer, color: Colors.onSurface }]}
          />
          <TouchableOpacity
            disabled={!input.trim() || busy}
            onPress={send}
            style={[s.sendBtn, { backgroundColor: input.trim() ? Colors.primary : Colors.surfaceContainerHigh }]}
          >
            <Ionicons name="arrow-up" size={20} color={input.trim() ? Colors.onPrimary : Colors.outline} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  suggested: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md, flexWrap: 'wrap' },
  sugChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.chip },

  bubble: {
    maxWidth: '88%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  citations: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  citation: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.chip },
  escalate: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.chip, alignSelf: 'flex-start',
  },

  busy: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.input,
    ...Typography.body,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
