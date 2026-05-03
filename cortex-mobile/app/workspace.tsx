// Workspace — Granite chat over diary + escalation to IBM Bob.
// Maps to "AI Workspace - IBM Bob" mockup in theme.md (lines 295-584).

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "../src/constants/layout";
import { Colors, Radius, Shadow, Spacing, Typography } from "../src/constants/theme";
import {
  apiCreateEntry,
  apiQueueAction,
  apiSearchEntries,
  isApiConfigured,
} from "../src/services/api";

interface Citation {
  id: number;
  text: string;
  score: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  timestamp: number;
  escalated?: boolean;
}

const SUGGESTED = [
  { label: "Authentication", bg: Colors.primaryFixed, fg: Colors.onPrimaryFixed },
  { label: "Recent fixes", bg: Colors.secondaryFixed, fg: Colors.onSecondaryFixed },
  { label: "Today's decisions", bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixed },
];

export default function WorkspaceScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    isApiConfigured().then(setConfigured);
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text, timestamp: Date.now() }]);

    try {
      let answer = "";
      const citations: Citation[] = [];

      if (configured) {
        // Save context, then recall — Granite RAG path lands when /chat is wired.
        await apiCreateEntry({ text, source: "mobile", kind: "note" });
        const hits = await apiSearchEntries(text, 5);
        if (hits.length > 0) {
          answer =
            `Found ${hits.length} related ${hits.length === 1 ? "entry" : "entries"}. ` +
            `Top match: "${hits[0].text.slice(0, 200)}${hits[0].text.length > 200 ? "…" : ""}"`;
          for (const h of hits) {
            citations.push({ id: h.id, text: h.text, score: h.score });
          }
        } else {
          answer = "No related entries yet. Save your insights as you discover them.";
        }
      } else {
        answer =
          "Granite is offline (API not configured). Configure cortex-api in Profile to enable RAG chat.";
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", text: answer, citations, timestamp: Date.now() },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${String(e)}`, timestamp: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function escalateLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Optimistic UI
    setMessages((m) =>
      m.map((msg) => (msg === lastUser ? { ...msg, escalated: true } : msg)),
    );
    if (!configured) return;
    try {
      await apiQueueAction("free", { prompt: lastUser.text });
    } catch {
      // Roll back the chip if the queue rejected it
      setMessages((m) =>
        m.map((msg) => (msg === lastUser ? { ...msg, escalated: false } : msg)),
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="rocket" size={22} color={Colors.primary} />
          <Text style={styles.headerTitle}>Workspace</Text>
        </View>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: configured ? Colors.llmOnline : Colors.llmOffline },
            ]}
          />
          <Text style={styles.statusText}>
            {configured ? "Granite online" : "Offline"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {messages.length === 0 ? (
          <View style={styles.hero}>
            <Text style={styles.heroH1}>How can I help you build today?</Text>
            <Text style={styles.heroSub}>Ask Granite. Powered by your Cortex history.</Text>
            <View style={styles.chips}>
              {SUGGESTED.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.chip, { backgroundColor: s.bg }]}
                  onPress={() => setInput(s.label)}
                >
                  <Text style={[styles.chipText, { color: s.fg }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              <Text style={[styles.bubbleText, m.role === "user" && { color: Colors.onPrimary }]}>
                {m.text}
              </Text>
              {m.citations && m.citations.length > 0 && (
                <View style={styles.citations}>
                  {m.citations.map((c) => (
                    <View key={c.id} style={styles.citation}>
                      <Text style={styles.citationText}>
                        #{c.id} · score {c.score.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {m.role === "user" && (
                <TouchableOpacity
                  onPress={escalateLast}
                  style={styles.escalate}
                  disabled={m.escalated}
                >
                  <Ionicons
                    name={m.escalated ? "checkmark-circle" : "rocket-outline"}
                    size={14}
                    color={Colors.onPrimary}
                  />
                  <Text style={styles.escalateText}>
                    {m.escalated ? "Sent to Bob" : "Send to Bob"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.busyText}>Granite is thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Bob…"
          placeholderTextColor={Colors.outline}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={send}
          disabled={!input.trim() || busy}
        >
          <Ionicons name="arrow-up" size={20} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerTitle: { ...Typography.heading, color: Colors.onSurface },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surfaceContainer,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Typography.labelSm, color: Colors.onSurfaceVariant },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: TAB_BAR_HEIGHT + Spacing.xl,
    gap: Spacing.md,
  },

  hero: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.md },
  heroH1: { ...Typography.h2, color: Colors.onSurface, textAlign: "center" },
  heroSub: { ...Typography.bodyLg, color: Colors.onSurfaceVariant, textAlign: "center" },
  chips: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap", justifyContent: "center" },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.chip },
  chipText: { ...Typography.labelSm },

  bubble: { maxWidth: "85%", padding: Spacing.md, borderRadius: Radius.card, ...Shadow.card },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.lg,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    borderBottomLeftRadius: Radius.lg,
  },
  bubbleText: { ...Typography.body, color: Colors.onSurface },
  citations: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginTop: Spacing.sm },
  citation: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.chip,
  },
  citationText: { ...Typography.codeSm, color: Colors.onSurfaceVariant },
  escalate: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.chip,
    alignSelf: "flex-start",
  },
  escalateText: { ...Typography.labelSm, color: Colors.onPrimary },

  busy: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.md },
  busyText: { ...Typography.bodySm, color: Colors.onSurfaceVariant },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.input,
    ...Typography.body,
    color: Colors.onSurface,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
