/**
 * GitHub Velocity — contribution heatmap derived from entry timestamps.
 * Real GitHub API is a v2 enhancement; heatmap uses entry timestamps.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
import { listEntries } from '../src/services/database';
import { apiListEntries, getToken } from '../src/services/api';

const RANGES = [7, 30, 90];

interface DayContrib { date: string; count: number; }

function buildHeatmap(entries: any[], days: number): DayContrib[] {
  const map: Record<string, number> = {};
  const now = Date.now();
  // Init all days to 0
  for (let i = 0; i < days; i++) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }
  // Count entries per day
  entries.forEach(e => {
    const key = new Date(e.created_at).toISOString().slice(0, 10);
    if (key in map) map[key] = (map[key] ?? 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

function calcStreak(contribs: DayContrib[]): number {
  let streak = 0;
  const sorted = [...contribs].sort((a, b) => b.date.localeCompare(a.date));
  for (const c of sorted) {
    if (c.count > 0) streak++;
    else break;
  }
  return streak;
}

export default function GitHubScreen() {
  const [days, setDays] = useState(30);
  const [contribs, setContribs] = useState<DayContrib[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const tok = await getToken();
      const entries = tok ? (await apiListEntries(500) as any[]) : await listEntries(500);
      setContribs(buildHeatmap(entries, days));
    } catch {
      const entries = await listEntries(500);
      setContribs(buildHeatmap(entries, days));
    }
    setLoading(false);
  }, [days]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const total = contribs.reduce((s, c) => s + c.count, 0);
  const streak = calcStreak(contribs);
  const max = Math.max(...contribs.map(c => c.count), 1);

  const cellColor = (count: number) => {
    if (count === 0) return Colors.outlineVariant;
    const intensity = Math.ceil((count / max) * 4);
    return ['#bcd5ff', '#7aa6ff', '#3878ff', '#0f62fe'][intensity - 1] ?? '#0f62fe';
  };

  // Group into weeks (7 cols)
  const weeks: DayContrib[][] = [];
  for (let i = 0; i < contribs.length; i += 7) {
    weeks.push(contribs.slice(i, i + 7));
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>GitHub Velocity</Text>
        <Text style={S.headerSub}>Captures plotted day-by-day</Text>
      </View>

      {/* Range selector */}
      <View style={S.rangeRow}>
        {RANGES.map(d => (
          <TouchableOpacity key={d} style={[S.rangeBtn, days === d && S.rangeBtnActive]} onPress={() => setDays(d)}>
            <Text style={[S.rangeBtnText, days === d && S.rangeBtnTextActive]}>{d}d</Text>
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
            {/* Stats */}
            <View style={S.statsRow}>
              {[
                { label: 'Streak', value: `${streak}d`, color: Colors.primary },
                { label: 'Total', value: String(total), color: '#8a3ffc' },
                { label: 'Window', value: `${days}d`, color: '#198038' },
              ].map(s => (
                <View key={s.label} style={S.statCard}>
                  <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={S.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Heatmap */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Daily Heatmap</Text>
              {contribs.length === 0 ? (
                <Text style={S.emptyText}>No activity yet</Text>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={S.heatmapGrid}>
                      {weeks.map((week, wi) => (
                        <View key={wi} style={S.heatmapCol}>
                          {week.map(day => (
                            <View
                              key={day.date}
                              style={[S.heatmapCell, { backgroundColor: cellColor(day.count) }]}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  {/* Legend */}
                  <View style={S.legend}>
                    <Text style={S.legendText}>Less</Text>
                    {[0, 1, 2, 3, 4].map(i => (
                      <View key={i} style={[S.legendCell, { backgroundColor: i === 0 ? Colors.outlineVariant : cellColor(i) }]} />
                    ))}
                    <Text style={S.legendText}>More</Text>
                  </View>
                </>
              )}
            </View>

            {/* Top active days */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Most Active Days</Text>
              {contribs
                .filter(c => c.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(c => (
                  <View key={c.date} style={S.dayRow}>
                    <Text style={S.dayDate}>{new Date(c.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <View style={S.dayBarTrack}>
                      <View style={[S.dayBarFill, { width: `${(c.count / max) * 100}%` as any }]} />
                    </View>
                    <Text style={S.dayCount}>{c.count}</Text>
                  </View>
                ))}
              {contribs.every(c => c.count === 0) && (
                <Text style={S.emptyText}>No entries in this range</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  rangeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4, marginTop: 8 },
  rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', alignItems: 'center' },
  rangeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rangeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  rangeBtnTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#191b24', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  heatmapGrid: { flexDirection: 'row', gap: 3 },
  heatmapCol: { flexDirection: 'column', gap: 3 },
  heatmapCell: { width: 14, height: 14, borderRadius: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' },
  legendText: { fontSize: 10, color: Colors.onSurfaceVariant },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  emptyText: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dayDate: { fontSize: 12, color: '#191b24', width: 100 },
  dayBarTrack: { flex: 1, height: 6, backgroundColor: Colors.outlineVariant, borderRadius: 3, overflow: 'hidden' },
  dayBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  dayCount: { fontSize: 12, fontWeight: '600', color: Colors.primary, width: 24, textAlign: 'right' },
});
