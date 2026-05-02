/**
 * Timeline — full chronological list of all entries with filter by kind.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors, Spacing } from '../src/constants/theme';
import { listEntries, type Entry } from '../src/services/database';
import { apiListEntries, getToken } from '../src/services/api';

const KINDS = ['all', 'note', 'idea', 'bug', 'insight', 'snippet'] as const;
const KIND_COLOR: Record<string, string> = {
  idea: '#0f62fe', bug: '#da1e28', insight: '#198038',
  snippet: '#8a3ffc', note: '#5d5f5f',
};

export default function TimelineScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const tok = await getToken();
      if (tok) {
        const remote = await apiListEntries(100);
        setEntries(remote as any);
      } else {
        setEntries(await listEntries(100));
      }
    } catch {
      setEntries(await listEntries(100));
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = filter === 'all' ? entries : entries.filter(e => e.kind === filter);

  const renderEntry = ({ item: e }: { item: Entry }) => {
    const color = KIND_COLOR[e.kind] ?? Colors.secondary;
    return (
      <TouchableOpacity
        style={S.card}
        onPress={() => router.push({ pathname: '/entry/[id]', params: { id: e.id } })}
        activeOpacity={0.75}
      >
        <View style={[S.kindBar, { backgroundColor: color }]} />
        <View style={S.cardBody}>
          <View style={S.cardTop}>
            <View style={[S.kindPill, { backgroundColor: color + '20' }]}>
              <Text style={[S.kindPillText, { color }]}>{e.kind}</Text>
            </View>
            <Text style={S.cardTime}>
              {new Date(e.created_at).toLocaleDateString()} · {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={S.cardText} numberOfLines={3}>{e.text}</Text>
          {e.file && <Text style={S.cardFile}>📍 {e.file}{e.line_start ? `:${e.line_start}` : ''}</Text>}
          {e.tags.length > 0 && (
            <View style={S.tagsRow}>
              {e.tags.slice(0, 4).map(t => <Text key={t} style={S.tag}>#{t}</Text>)}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.outlineVariant} style={{ alignSelf: 'center', marginRight: 8 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Timeline</Text>
        <Text style={S.headerCount}>{filtered.length} entries</Text>
      </View>

      {/* Kind filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.chips} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
        {KINDS.map(k => (
          <TouchableOpacity
            key={k}
            style={[S.chip, filter === k && S.chipActive]}
            onPress={() => setFilter(k)}
          >
            <Text style={[S.chipText, filter === k && S.chipTextActive]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={S.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => String(e.id)}
          renderItem={renderEntry}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.center}>
              <Ionicons name="time-outline" size={40} color={Colors.outlineVariant} />
              <Text style={S.emptyText}>No entries{filter !== 'all' ? ` of kind "${filter}"` : ''}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  headerCount: { fontSize: 12, fontWeight: '600', color: Colors.primary, backgroundColor: '#dbe1ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  chips: { maxHeight: 44, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', marginRight: 6 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.onSurfaceVariant },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 8, overflow: 'hidden' },
  kindBar: { width: 4 },
  cardBody: { flex: 1, padding: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  kindPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  kindPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  cardTime: { fontSize: 11, color: Colors.outline },
  cardText: { fontSize: 14, color: '#191b24', lineHeight: 20 },
  cardFile: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 4, fontFamily: 'monospace' },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
});
