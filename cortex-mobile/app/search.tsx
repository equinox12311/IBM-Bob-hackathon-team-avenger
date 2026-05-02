/**
 * Search — keyword + AI recall, uses API when configured, local DB as fallback.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors, Spacing, Typography } from '../src/constants/theme';
import { searchEntries, type Entry } from '../src/services/database';
import { recallRelevant } from '../src/services/memory';
import { apiSearchEntries, isApiConfigured, type ApiEntry } from '../src/services/api';

type SearchMode = 'keyword' | 'recall' | 'api';

const KIND_COLOR: Record<string, string> = {
  idea: '#0f62fe', bug: '#da1e28', fix: '#198038',
  insight: '#198038', snippet: '#8a3ffc', note: '#5d5f5f',
  decision: '#8a3ffc', task: '#f1c21b',
};

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Entry | ApiEntry)[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<SearchMode>('keyword');
  const [searched, setSearched] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);

  useFocusEffect(useCallback(() => {
    isApiConfigured().then(ok => {
      setApiEnabled(ok);
      if (ok && mode === 'keyword') setMode('api');
    });
  }, []));

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      if (mode === 'api' && apiEnabled) {
        const res = await apiSearchEntries(q, 20);
        setResults(res);
      } else if (mode === 'recall') {
        const res = await recallRelevant(q, 20);
        setResults(res);
      } else {
        const res = await searchEntries(q, 20);
        setResults(res);
      }
    } catch (e: any) {
      // Fall back to local on API error
      try {
        const res = await searchEntries(q, 20);
        setResults(res);
      } catch {}
    }
    setLoading(false);
  }, [mode, apiEnabled]);

  const MODES: { id: SearchMode; label: string; icon: string }[] = [
    ...(apiEnabled ? [{ id: 'api' as SearchMode, label: 'Semantic', icon: 'server-outline' }] : []),
    { id: 'keyword', label: 'Keyword', icon: 'text-outline' },
    { id: 'recall', label: 'AI Recall', icon: 'sparkles-outline' },
  ];

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Search</Text>
        {apiEnabled && (
          <View style={S.apiBadge}>
            <Ionicons name="cloud-outline" size={12} color={Colors.llmOnline} />
            <Text style={S.apiBadgeText}>API</Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={S.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.outline} />
        <TextInput
          style={S.searchInput}
          placeholder="Search entries…"
          placeholderTextColor={Colors.outline}
          value={query}
          onChangeText={q => { setQuery(q); if (q.length > 2) doSearch(q); }}
          onSubmitEditing={() => doSearch(query)}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={18} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mode toggle */}
      <View style={S.modeRow}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[S.modeBtn, mode === m.id && S.modeBtnActive]}
            onPress={() => { setMode(m.id); if (query) doSearch(query); }}
          >
            <Ionicons name={m.icon as any} size={13} color={mode === m.id ? '#fff' : Colors.onSurfaceVariant} />
            <Text style={[S.modeBtnText, mode === m.id && S.modeBtnTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading ? (
        <View style={S.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : searched && results.length === 0 ? (
        <View style={S.center}>
          <Ionicons name="search-outline" size={40} color={Colors.outlineVariant} />
          <Text style={S.emptyText}>No results for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={e => String(e.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 8, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={results.length > 0 ? (
            <Text style={S.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
          ) : null}
          renderItem={({ item }) => {
            const color = KIND_COLOR[item.kind] ?? Colors.secondary;
            const score = 'score' in item ? (item as ApiEntry).score : 0;
            return (
              <TouchableOpacity
                style={S.card}
                onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
                activeOpacity={0.75}
              >
                <View style={[S.kindBar, { backgroundColor: color }]} />
                <View style={S.cardBody}>
                  <View style={S.cardTop}>
                    <View style={[S.kindPill, { backgroundColor: color + '20' }]}>
                      <Text style={[S.kindPillText, { color }]}>{item.kind}</Text>
                    </View>
                    <View style={S.cardMeta}>
                      {score > 0 && <Text style={S.scoreText}>⭐ {score.toFixed(2)}</Text>}
                      <Text style={S.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={S.cardText} numberOfLines={3}>{item.text}</Text>
                  {(item.tags ?? []).length > 0 && (
                    <View style={S.tagsRow}>
                      {(item.tags ?? []).slice(0, 4).map(t => (
                        <Text key={t} style={S.tag}>#{t}</Text>
                      ))}
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.outlineVariant} style={{ alignSelf: 'center', marginRight: 8 }} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3, flex: 1 },
  apiBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#defbe6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  apiBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.llmOnline },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: 10, paddingVertical: 4 },
  searchInput: { flex: 1, fontSize: 15, color: '#191b24', paddingVertical: 10 },
  modeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff' },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  modeBtnTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: Colors.onSurfaceVariant },
  resultCount: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  kindBar: { width: 4 },
  cardBody: { flex: 1, padding: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  kindPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  kindPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  dateText: { fontSize: 11, color: Colors.outline },
  cardText: { fontSize: 14, color: '#191b24', lineHeight: 20 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  tag: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
});
