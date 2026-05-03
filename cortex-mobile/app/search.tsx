/**
 * Search — keyword + semantic recall over the diary.
 *
 * When cortex-api is connected, it uses the server's vector + recency rerank.
 * Otherwise it falls back to a local sqlite full-text scan.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Card, EmptyState, Header, Pill, Screen } from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { apiSearchEntries, isApiConfigured, type ApiEntry } from '../src/services/api';
import { searchEntries, type Entry } from '../src/services/database';
import { recallRelevant } from '../src/services/memory';

type SearchMode = 'api' | 'recall' | 'keyword';
type Result = Entry | ApiEntry;

const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  idea: 'bulb', bug: 'bug', fix: 'hammer',
  insight: 'flash', snippet: 'code-slash', note: 'document-text',
  decision: 'git-branch', task: 'checkbox', code: 'code-slash',
};

export default function SearchScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<SearchMode>('keyword');
  const [searched, setSearched] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      isApiConfigured().then((ok) => {
        setApiEnabled(ok);
        if (ok && mode === 'keyword') setMode('api');
      });
    }, [mode]),
  );

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]); setSearched(false); return;
      }
      setLoading(true); setSearched(true);
      try {
        if (mode === 'api' && apiEnabled) {
          setResults(await apiSearchEntries(q, 20));
        } else if (mode === 'recall') {
          setResults((await recallRelevant(q, 20)) as Result[]);
        } else {
          setResults((await searchEntries(q, 20)) as Result[]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [mode, apiEnabled],
  );

  return (
    <>
      <Header title="Search" />
      <Screen padding={Spacing.md} scroll={false}>
        {/* Search input */}
        <View
          style={[
            s.searchBar,
            { backgroundColor: Colors.surfaceContainer, borderColor: Colors.outlineVariant },
          ]}
        >
          <Ionicons name="search" size={18} color={Colors.outline} />
          <TextInput
            placeholder="Find a thought, decision, or fix…"
            placeholderTextColor={Colors.outline}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType="search"
            autoFocus
            style={[s.searchInput, { color: Colors.onSurface }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mode chips */}
        <View style={s.modeRow}>
          {([
            { id: 'api',     label: 'Granite',  disabled: !apiEnabled, icon: 'sparkles' as const },
            { id: 'recall',  label: 'Semantic', disabled: false,        icon: 'magnet' as const },
            { id: 'keyword', label: 'Keyword',  disabled: false,        icon: 'text' as const },
          ] as const).map((m) => {
            const active = mode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                disabled={m.disabled}
                onPress={() => setMode(m.id as SearchMode)}
                activeOpacity={0.85}
                style={[
                  s.modeChip,
                  {
                    backgroundColor: active ? Colors.primary : Colors.surfaceContainerLowest,
                    borderColor: active ? Colors.primary : Colors.outlineVariant,
                    opacity: m.disabled ? 0.4 : 1,
                  },
                ]}
              >
                <Ionicons name={m.icon} size={13} color={active ? Colors.onPrimary : Colors.onSurfaceVariant} />
                <Text
                  style={[
                    Typography.labelSm,
                    { color: active ? Colors.onPrimary : Colors.onSurfaceVariant },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Results */}
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : !searched ? (
          <EmptyState
            icon="search-outline"
            title="What do you want to remember?"
            body={
              apiEnabled
                ? 'Granite will reason over your diary and cite the entries it used.'
                : 'Connect cortex-api in Settings for semantic search powered by Granite.'
            }
            tone="primary"
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Nothing matched"
            body="Try a broader query or switch search mode."
            tone="neutral"
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item: any) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: Spacing.sm, paddingTop: Spacing.sm }}
            renderItem={({ item }: { item: any }) => (
              <Card
                variant="surface"
                size="list"
                padding="md"
                onPress={() => router.push(`/entry/${item.id}` as any)}
              >
                <View style={s.row}>
                  <View style={[s.kindIcon, { backgroundColor: Colors.primaryFixed }]}>
                    <Ionicons
                      name={KIND_ICON[item.kind] ?? 'document-text'}
                      size={16}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={[Typography.body, { color: Colors.onSurface }]}>
                      {item.text}
                    </Text>
                    <View style={s.meta}>
                      <Pill label={item.kind} tone="neutral" />
                      {typeof item.score === 'number' && (
                        <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                          score {item.score.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </Screen>
    </>
  );
}

const s = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, ...Typography.body, paddingVertical: 0 },

  modeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, marginBottom: Spacing.md },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.chip, borderWidth: StyleSheet.hairlineWidth,
  },

  loading: { paddingVertical: Spacing.xxl, alignItems: 'center' },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  kindIcon: { width: 36, height: 36, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 },
});
