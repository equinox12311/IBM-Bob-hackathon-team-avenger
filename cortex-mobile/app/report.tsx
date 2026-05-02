/**
 * Daily Report — aggregated entries for today / 7d / 30d.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';
import { listEntries, type Entry } from '../src/services/database';
import { apiListEntries, getToken } from '../src/services/api';

const RANGES = [{ days: 1, label: 'Today' }, { days: 7, label: '7 days' }, { days: 30, label: '30 days' }];
const KIND_COLOR: Record<string, string> = { idea: '#0f62fe', bug: '#da1e28', insight: '#198038', snippet: '#8a3ffc', note: '#5d5f5f' };

export default function ReportScreen() {
  const router = useRouter();
  const [days, setDays] = useState(1);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    try {
      const tok = await getToken();
      const all = tok ? (await apiListEntries(200) as any[]) : await listEntries(200);
      setEntries(all.filter((e: Entry) => e.created_at >= cutoff));
    } catch {
      const all = await listEntries(200);
      setEntries(all.filter(e => e.created_at >= cutoff));
    }
    setLoading(false);
  }, [days]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const byKind: Record<string, number> = {};
  entries.forEach(e => { byKind[e.kind] = (byKind[e.kind] ?? 0) + 1; });
  const topTags = Object.entries(
    entries.flatMap(e => e.tags).reduce((acc, t) => { acc[t] = (acc[t] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Daily Report</Text>
      </View>

      {/* Range selector */}
      <View style={S.rangeRow}>
        {RANGES.map(r => (
          <TouchableOpacity key={r.days} style={[S.rangeBtn, days === r.days && S.rangeBtnActive]} onPress={() => setDays(r.days)}>
            <Text style={[S.rangeBtnText, days === r.days && S.rangeBtnTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 16 }}
      >
        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
          <>
            {/* Summary card */}
            <View style={S.summaryCard}>
              <Text style={S.summaryNum}>{entries.length}</Text>
              <Text style={S.summaryLabel}>{entries.length === 1 ? 'entry' : 'entries'} captured</Text>
              <View style={S.kindRow}>
                {Object.entries(byKind).map(([k, n]) => (
                  <View key={k} style={[S.kindBadge, { backgroundColor: (KIND_COLOR[k] ?? Colors.secondary) + '20' }]}>
                    <Text style={[S.kindBadgeText, { color: KIND_COLOR[k] ?? Colors.secondary }]}>{k}: {n}</Text>
                  </View>
                ))}
              </View>
              {topTags.length > 0 && (
                <View style={S.tagsRow}>
                  {topTags.map(t => <Text key={t} style={S.tag}>#{t}</Text>)}
                </View>
              )}
            </View>

            {/* Highlights */}
            <Text style={S.sectionTitle}>Highlights</Text>
            {entries.length === 0 ? (
              <View style={S.empty}>
                <Ionicons name="document-text-outline" size={40} color={Colors.outlineVariant} />
                <Text style={S.emptyText}>No entries in this range</Text>
              </View>
            ) : (
              entries.slice(0, 20).map(e => {
                const color = KIND_COLOR[e.kind] ?? Colors.secondary;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={S.entryCard}
                    onPress={() => router.push({ pathname: '/entry/[id]', params: { id: e.id } })}
                    activeOpacity={0.75}
                  >
                    <View style={[S.entryBar, { backgroundColor: color }]} />
                    <View style={S.entryBody}>
                      <View style={S.entryTop}>
                        <View style={[S.kindPill, { backgroundColor: color + '20' }]}>
                          <Text style={[S.kindPillText, { color }]}>{e.kind}</Text>
                        </View>
                        <Text style={S.entryTime}>
                          {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={S.entryText} numberOfLines={2}>{e.text}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  rangeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', alignItems: 'center' },
  rangeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rangeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  rangeBtnTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 20, alignItems: 'center' },
  summaryNum: { fontSize: 48, fontWeight: '300', color: Colors.primary, lineHeight: 52 },
  summaryLabel: { fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 12 },
  kindRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
  kindBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  kindBadgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  tag: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.6 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.onSurfaceVariant },
  entryCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 8, overflow: 'hidden' },
  entryBar: { width: 4 },
  entryBody: { flex: 1, padding: 10 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kindPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  kindPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  entryTime: { fontSize: 11, color: Colors.outline },
  entryText: { fontSize: 14, color: '#191b24', lineHeight: 20 },
});
