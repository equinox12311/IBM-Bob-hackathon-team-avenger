/**
 * Explorer — codebase indexer + Granite analysis.
 *
 * Lists indexed files, lets the user index a new repo, and asks
 * Granite questions scoped to a single file via /api/v1/analyze/code.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, Header, IconButton, Pill } from '../src/components/ui';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import {
  apiAnalyzeCode,
  apiIndexCodebase,
  apiListIndexedFiles,
  isApiConfigured,
  type IndexedFile,
} from '../src/services/api';

interface CodeFile {
  path: string;
  kind: 'source' | 'test' | 'config' | 'doc';
  lines: number;
  indexed: boolean;
}

/**
 * Each entry in /api/v1/codebase/files corresponds to ONE chunk
 * (the indexer splits files at 200 lines). The same path may appear
 * many times — we want one CodeFile per path, with `chunks` summed
 * and `lines` aggregated, so React's reconciler stays happy.
 */
function dedupeByPath(files: IndexedFile[]): CodeFile[] {
  const byPath = new Map<string, { chunks: number; lines: number }>();
  for (const f of files) {
    const cur = byPath.get(f.path);
    if (cur) {
      cur.chunks += (f.chunks ?? 1);
      cur.lines = Math.max(cur.lines, f.lines || 0);
    } else {
      byPath.set(f.path, { chunks: f.chunks ?? 1, lines: f.lines || 0 });
    }
  }
  return Array.from(byPath.entries()).map(([path, agg]) => ({
    path,
    kind: classifyKind(path),
    lines: agg.lines,
    indexed: true,
  }));
}

function classifyKind(path: string): CodeFile['kind'] {
  const lower = path.toLowerCase();
  if (lower.startsWith('tests/') || lower.includes('__tests__') || lower.includes('.test.') || lower.includes('.spec.')) return 'test';
  if (lower.startsWith('docs/') || lower.endsWith('.md') || lower === 'readme') return 'doc';
  if (lower === 'makefile' || lower === 'dockerfile' || lower.endsWith('.yml') || lower.endsWith('.yaml') || lower.endsWith('.toml') || lower.endsWith('.json')) return 'config';
  return 'source';
}

const KIND_TONE = {
  source: 'primary',   // blue
  test:   'secondary', // purple
  config: 'tertiary',  // rust
  doc:    'neutral',
} as const;

export default function ExplorerScreen() {
  const { Colors } = useThemeMode();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<CodeFile | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);

  useEffect(() => { isApiConfigured().then(setConfigured); }, []);

  useEffect(() => {
    if (!configured) return;
    apiListIndexedFiles()
      .then((res) => {
        if (!res.files?.length) return;
        setFiles(dedupeByPath(res.files));
      })
      .catch(() => undefined);
  }, [configured]);

  const indexedCount = files.filter((f) => f.indexed).length;
  const visible = files.filter((f) => !filter || f.path.toLowerCase().includes(filter.toLowerCase()));

  async function indexAll() {
    if (!configured) {
      Alert.alert('Connect cortex-api', 'Configure your API URL in Settings to enable indexing.');
      return;
    }
    Alert.prompt?.(
      'Index repo',
      'Absolute path of the repo (defaults to cortex-api cwd).',
      async (input) => {
        const path = (input ?? '').trim() || '.';
        setIndexing(true);
        try {
          const summary = await apiIndexCodebase(path, { max_files: 200 });
          Alert.alert('Indexed', `${summary.indexed} files (${summary.skipped_existing} skipped, ${summary.errors} errors).`);
          const res = await apiListIndexedFiles();
          setFiles(dedupeByPath(res.files ?? []));
        } catch (e) {
          Alert.alert('Index failed', String(e));
        } finally {
          setIndexing(false);
        }
      },
    );
  }

  async function ask() {
    if (!selected || !question.trim()) return;
    if (!configured) {
      setAnswer('(Connect cortex-api in Settings to enable Granite analysis.)');
      return;
    }
    setBusy(true); setAnswer(null);
    try {
      const r = await apiAnalyzeCode(selected.path, question.trim(), 8);
      const cites = r.citations
        .slice(0, 4)
        .map((c) => (c.lines ? `\`${c.lines}\`` : `#${c.id}`))
        .join(', ');
      setAnswer(`${r.answer}\n\n— ${r.model}${r.fallback_used ? ' · vector fallback' : ''}; cited ${cites || 'no chunks'}`);
    } catch (e) {
      setAnswer(`(Granite call failed: ${String(e)})`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: Colors.background }]} edges={['top']}>
      <Header
        title="Codebase"
        eyebrow={`${indexedCount} of ${files.length} indexed`}
        back
        right={
          <IconButton
            icon={indexing ? 'hourglass' : 'sync'}
            variant="primary"
            size="md"
            onPress={indexAll}
            accessibilityLabel="Index repo"
          />
        }
      />

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: Colors.surfaceContainer, borderColor: Colors.outlineVariant }]}>
        <Ionicons name="search" size={16} color={Colors.outline} />
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter files…"
          placeholderTextColor={Colors.outline}
          style={[s.searchInput, { color: Colors.onSurface }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.md,
          paddingBottom: TAB_BAR_HEIGHT + (selected ? 280 : Spacing.lg),
          gap: Spacing.xs,
        }}
      >
        {!configured ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Connect cortex-api"
            body="The codebase indexer runs on the API. Configure in Settings."
            tone="primary"
          />
        ) : files.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title="analyze."
            body="Tap Index to embed your repo so Granite can reason over it."
            ctaLabel="Index now"
            onCta={indexAll}
            tone="secondary"
          />
        ) : (
          visible.map((f) => {
            const active = selected?.path === f.path;
            return (
              <Card
                key={f.path}
                variant={active ? 'primary' : 'surface'}
                size="list"
                padding="sm"
                onPress={() => { setSelected(f); setAnswer(null); }}
              >
                <View style={s.fileRow}>
                  <Pill label={f.kind} tone={KIND_TONE[f.kind]} />
                  <Text
                    numberOfLines={1}
                    style={[Typography.code, { color: Colors.onSurface, flex: 1 }]}
                  >
                    {f.path}
                  </Text>
                  <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                    {f.lines}L
                  </Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Detail / ask panel */}
      {selected && (
        <View
          style={[
            s.detail,
            {
              backgroundColor: Colors.surfaceContainerLowest,
              borderTopColor: Colors.outlineVariant,
              paddingBottom: TAB_BAR_HEIGHT + Spacing.sm,
            },
          ]}
        >
          <Text style={[Typography.code, { color: Colors.onSurface }]} numberOfLines={1}>
            {selected.path}
          </Text>
          <View style={s.askRow}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask Granite about this file…"
              placeholderTextColor={Colors.outline}
              onSubmitEditing={ask}
              style={[s.askInput, { backgroundColor: Colors.surfaceContainer, color: Colors.onSurface }]}
            />
            <TouchableOpacity
              disabled={!question.trim() || busy}
              onPress={ask}
              style={[s.askBtn, { backgroundColor: question.trim() ? Colors.secondary : Colors.surfaceContainerHigh }]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <Ionicons name="sparkles" size={18} color={question.trim() ? Colors.onPrimary : Colors.outline} />
              )}
            </TouchableOpacity>
          </View>
          {answer && (
            <View style={[s.answer, { backgroundColor: Colors.surfaceContainerLow, borderLeftColor: Colors.secondary }]}>
              <Text style={[Typography.body, { color: Colors.onSurface }]}>{answer}</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: Radius.input, borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, ...Typography.body, paddingVertical: 0 },

  fileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  detail: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  askInput: {
    flex: 1,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.input, ...Typography.body,
  },
  askBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  answer: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
  },
});
