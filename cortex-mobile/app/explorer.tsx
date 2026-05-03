// Explorer — codebase indexer browser.
// Maps to "Code Explorer - IBM Bob" mockup (Untitled (1).txt).

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
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

interface CodeFile {
  path: string;
  kind: "source" | "test" | "config" | "doc";
  lines: number;
  indexed: boolean;
}

const KIND_META = {
  source: { label: "src",    bg: Colors.primaryFixed,   fg: Colors.primary },
  test:   { label: "test",   bg: Colors.secondaryFixed, fg: Colors.secondary },
  config: { label: "config", bg: Colors.tertiaryFixed,  fg: Colors.tertiary },
  doc:    { label: "doc",    bg: Colors.surfaceContainer, fg: Colors.onSurfaceVariant },
} as const;

const DEMO_FILES: CodeFile[] = [
  { path: "src/cortex-api/cortex_api/server.py",      kind: "source", lines: 412, indexed: true },
  { path: "src/cortex-api/cortex_api/storage.py",     kind: "source", lines: 489, indexed: true },
  { path: "src/cortex-api/cortex_api/llm.py",         kind: "source", lines: 178, indexed: true },
  { path: "src/cortex-api/cortex_api/secrets.py",     kind: "source", lines: 96,  indexed: true },
  { path: "src/cortex-api/cortex_api/retrieval.py",   kind: "source", lines: 52,  indexed: false },
  { path: "tests/test_storage.py",                    kind: "test",   lines: 142, indexed: true },
  { path: "tests/test_api.py",                        kind: "test",   lines: 168, indexed: true },
  { path: "docker-compose.yml",                       kind: "config", lines: 64,  indexed: false },
  { path: "Makefile",                                 kind: "config", lines: 105, indexed: false },
  { path: "docs/V0_3_PLAN.md",                        kind: "doc",    lines: 230, indexed: false },
  { path: "docs/CONTRACTS.md",                        kind: "doc",    lines: 175, indexed: true },
  { path: "docs/PLAN.md",                             kind: "doc",    lines: 198, indexed: false },
];

export default function ExplorerScreen() {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<CodeFile | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<CodeFile[]>(DEMO_FILES);

  const indexedCount = files.filter((f) => f.indexed).length;
  const visible = files.filter(
    (f) => !filter || f.path.toLowerCase().includes(filter.toLowerCase()),
  );

  function indexAll() {
    // TODO Phase C: POST /api/v1/codebase/index { path: cwd }
    setFiles((fs) => fs.map((f) => ({ ...f, indexed: true })));
  }

  async function ask() {
    if (!selected || !question.trim()) return;
    setBusy(true);
    // TODO Phase C: POST /api/v1/analyze/code { file, question }
    setTimeout(() => {
      setAnswer(
        `(Granite would answer here, grounded in indexed contents of ${selected.path}. ` +
        `Endpoint /api/v1/analyze/code is not yet wired — see docs/V0_3_PLAN.md.)`,
      );
      setBusy(false);
    }, 600);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="folder-open" size={22} color={Colors.primary} />
          <Text style={styles.headerTitle}>Code Explorer</Text>
        </View>
        <Text style={styles.headerSub}>{indexedCount} / {files.length} indexed</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.outline} style={{ marginLeft: Spacing.sm }} />
          <TextInput
            style={styles.search}
            placeholder="Filter files…"
            placeholderTextColor={Colors.outline}
            value={filter}
            onChangeText={setFilter}
          />
        </View>
        <TouchableOpacity style={styles.indexBtn} onPress={indexAll}>
          <Ionicons name="sync" size={16} color={Colors.onPrimary} />
          <Text style={styles.indexBtnText}>Index all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.map((f) => {
          const m = KIND_META[f.kind];
          const active = selected?.path === f.path;
          return (
            <TouchableOpacity
              key={f.path}
              style={[styles.fileRow, active && styles.fileRowActive]}
              onPress={() => { setSelected(f); setAnswer(null); }}
            >
              <View style={[styles.kindPill, { backgroundColor: m.bg }]}>
                <Text style={[styles.kindText, { color: m.fg }]}>{m.label}</Text>
              </View>
              <Text style={styles.filePath} numberOfLines={1}>{f.path}</Text>
              <Text style={styles.fileMeta}>{f.lines}L{f.indexed ? " · ✓" : " · —"}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selected && (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{selected.path}</Text>
          <View style={styles.askRow}>
            <TextInput
              style={styles.askInput}
              placeholder="Ask Granite about this file…"
              placeholderTextColor={Colors.outline}
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={ask}
            />
            <TouchableOpacity
              style={[styles.askBtn, (!question.trim() || busy) && { opacity: 0.4 }]}
              onPress={ask}
              disabled={!question.trim() || busy}
            >
              <Ionicons name="sparkles" size={18} color={Colors.onPrimary} />
            </TouchableOpacity>
          </View>
          {answer && (
            <View style={styles.answer}>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerTitle: { ...Typography.heading, color: Colors.onSurface },
  headerSub: { ...Typography.labelSm, color: Colors.onSurfaceVariant },
  toolbar: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
  },
  searchWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.input, borderWidth: 1, borderColor: Colors.surfaceVariant,
  },
  search: { flex: 1, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, ...Typography.body, color: Colors.onSurface },
  indexBtn: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.input,
  },
  indexBtnText: { ...Typography.labelSm, color: Colors.onPrimary },
  list: { paddingVertical: Spacing.sm, paddingBottom: TAB_BAR_HEIGHT + 250 },
  fileRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  fileRowActive: { backgroundColor: Colors.primaryFixed },
  kindPill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.chip, minWidth: 50, alignItems: "center" },
  kindText: { ...Typography.codeSm, fontWeight: "600" },
  filePath: { flex: 1, ...Typography.code, color: Colors.onSurface },
  fileMeta: { ...Typography.codeSm, color: Colors.outline },
  detail: {
    position: "absolute", bottom: TAB_BAR_HEIGHT, left: 0, right: 0,
    padding: Spacing.lg, backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1, borderTopColor: Colors.surfaceVariant,
    gap: Spacing.sm, ...Shadow.card,
  },
  detailTitle: { ...Typography.code, color: Colors.onSurface },
  askRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  askInput: {
    flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainer, borderRadius: Radius.input,
    ...Typography.body, color: Colors.onSurface,
  },
  askBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center",
  },
  answer: {
    padding: Spacing.md, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.lg, borderLeftWidth: 3, borderLeftColor: Colors.secondary,
  },
  answerText: { ...Typography.body, color: Colors.onSurface },
});
