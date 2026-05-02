/**
 * Search Screen — keyword search + AI-powered recall.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { Colors, Spacing, Typography } from '../src/constants/theme';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { searchEntries, type Entry } from '../src/services/database';
import { recallRelevant } from '../src/services/memory';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'keyword' | 'recall'>('keyword');
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = mode === 'recall'
        ? await recallRelevant(q, 20)
        : await searchEntries(q, 20);
      setResults(res);
    } catch {}
    setLoading(false);
  }, [mode]);

  const kindColor = (kind: string) => {
    switch (kind) {
      case 'idea': return '#0f62fe';
      case 'bug': return '#da1e28';
      case 'insight': return '#198038';
      default: return Colors.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
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

      {/* Mode Toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'keyword' && styles.modeBtnActive]}
          onPress={() => { setMode('keyword'); if (query) doSearch(query); }}
        >
          <Ionicons name="text-outline" size={14} color={mode === 'keyword' ? Colors.surfaceContainerLowest : Colors.onSurfaceVariant} />
          <Text style={[styles.modeBtnText, mode === 'keyword' && styles.modeBtnTextActive]}>Keyword</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'recall' && styles.modeBtnActive]}
          onPress={() => { setMode('recall'); if (query) doSearch(query); }}
        >
          <Ionicons name="sparkles-outline" size={14} color={mode === 'recall' ? Colors.surfaceContainerLowest : Colors.onSurfaceVariant} />
          <Text style={[styles.modeBtnText, mode === 'recall' && styles.modeBtnTextActive]}>AI Recall</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={Colors.outlineVariant} />
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={e => String(e.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
            >
              <View style={[styles.kindBar, { backgroundColor: kindColor(item.kind) }]} />
              <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                  <View style={[styles.kindBadge, { backgroundColor: kindColor(item.kind) + '20' }]}>
                    <Text style={[styles.kindText, { color: kindColor(item.kind) }]}>{item.kind}</Text>
                  </View>
                  <Text style={styles.resultTime}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.resultText} numberOfLines={3}>{item.text}</Text>
                {item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.slice(0, 4).map(t => (
                      <Text key={t} style={styles.tag}>#{t}</Text>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.headingLg, color: Colors.onBackground },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.onSurface,
    paddingVertical: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeBtnText: { ...Typography.label, color: Colors.onSurfaceVariant },
  modeBtnTextActive: { color: Colors.surfaceContainerLowest },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { ...Typography.body, color: Colors.onSurfaceVariant },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: TAB_BAR_HEIGHT + 8 },
  resultCount: { ...Typography.label, color: Colors.outline, textTransform: 'uppercase', marginBottom: Spacing.sm },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  kindBar: { width: 4 },
  resultContent: { flex: 1, padding: Spacing.sm },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kindBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kindText: { ...Typography.label, fontWeight: '600', textTransform: 'capitalize' },
  resultTime: { ...Typography.label, color: Colors.outline },
  resultText: { ...Typography.body, color: Colors.onSurface, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  tag: { ...Typography.label, color: Colors.onSurfaceVariant },
});
