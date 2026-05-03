// Explorer — codebase indexer browser.
// Maps to "Code Explorer - IBM Bob" mockup (Untitled (1).txt).

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  apiAnalyzeCode,
  apiIndexCodebase,
  apiListIndexedFiles,
  isApiConfigured,
  type IndexedFile,
} from "../src/services/api";

interface CodeFile {
  path: string;
  kind: "source" | "test" | "config" | "doc";
  lines: number;
  indexed: boolean;
}

function classifyKind(path: string): CodeFile["kind"] {
  const lower = path.toLowerCase();
  if (lower.startsWith("tests/") || lower.includes("__tests__") || lower.includes(".test.") || lower.includes(".spec.")) return "test";
  if (lower.startsWith("docs/") || lower.endsWith(".md") || lower === "readme") return "doc";
  if (lower === "makefile" || lower === "dockerfile" || lower.endsWith(".yml") || lower.endsWith(".yaml") || lower.endsWith(".toml") || lower.endsWith(".json")) return "config";
  return "source";
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
  const [indexing, setIndexing] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [indexedRepo, setIndexedRepo] = useState<string | null>(null);
  const [files, setFiles] = useState<CodeFile[]>(DEMO_FILES);

  useEffect(() => {
    isApiConfigured().then(setConfigured);
  }, []);

  // On mount, if the API is reachable, replace demo data with whatever is
  // already indexed. Failures fall back silently to the demo list.
  useEffect(() => {
    if (!configured) return;
    apiListIndexedFiles()
      .then((res) => {
        if (!res.files || res.files.length === 0) return;
        const real: CodeFile[] = res.files.map((f: IndexedFile) => ({
          path: f.path,
          kind: classifyKind(f.path),
          lines: f.lines || 0,
          indexed: true,
        }));
        setFiles(real);
        if (res.files[0]?.repo) setIndexedRepo(res.files[0].repo);
      })
      .catch(() => undefined);
  }, [configured]);

  const indexedCount = files.filter((f) => f.indexed).length;
  const visible = files.filter(
    (f) => !filter || f.path.toLowerCase().includes(filter.toLowerCase()),
  );

  async function indexAll() {
    if (!configured) {
      Alert.alert(
        "API not configured",
        "Set the cortex-api base URL and bearer token in Profile to enable real indexing.",
      );
      return;
    }
    // No path picker on mobile; let the user paste, defaulting to the api's cwd.
    Alert.prompt?.(
      "Index repo",
      "Absolute path of the repo to index (defaults to cortex-api cwd)",
      async (input) => {
        const path = (input ?? "").trim() || ".";
        setIndexing(true);
        try {
          const summary = await apiIndexCodebase(path, { max_files: 200 });
          Alert.alert(
            "Indexed",
            `${summary.indexed} files (skipped ${summary.skipped_existing} existing, ${summary.skipped_large} large, ${summary.errors} errors).`,
          );
          // Refresh the list
          const res = await apiListIndexedFiles();
          if (res.files?.length) {
            setFiles(res.files.map((f: IndexedFile) => ({
              path: f.path,
              kind: classifyKind(f.path),
              lines: f.lines || 0,
              indexed: true,
            })));
            if (res.files[0]?.repo) setIndexedRepo(res.files[0].repo);
          }
        } catch (e) {
          Alert.alert("Index failed", String(e));
        } finally {
          setIndexing(false);
        }
      },
    );
  }

  async function ask() {
    if (!selected || !question.trim()) return;
    if (!configured) {
      setAnswer(
        "(API not configured — connect cortex-api in Profile to enable real Granite analysis.)",
      );
      return;
    }
    setBusy(true);
    setAnswer(null);
    try {
      const r = await apiAnalyzeCode(selected.path, question.trim(), 8);
      const cites = r.citations
        .slice(0, 4)
        .map((c) => (c.lines ? `\`${c.lines}\`` : `#${c.id}`))
        .join(", ");
      setAnswer(
        `${r.answer}\n\n_(${r.model}${r.fallback_used ? " · vector fallback" : ""}; cited ${cites || "no chunks"})_`,
      );
    } catch (e) {
      setAnswer(`(Granite call failed: ${String(e)})`);
    } finally {
      setBusy(false);
    }
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
        <TouchableOpacity
          style={[styles.indexBtn, indexing && { opacity: 0.6 }]}
          onPress={indexAll}
          disabled={indexing}
        >
          {indexing ? (
            <ActivityIndicator size="small" color={Colors.onPrimary} />
          ) : (
            <Ionicons name="sync" size={16} color={Colors.onPrimary} />
          )}
          <Text style={styles.indexBtnText}>{indexing ? "Indexing…" : "Index"}</Text>
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
