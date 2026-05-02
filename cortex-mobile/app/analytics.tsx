/**
 * Session Analytics — time allocation, focus timer, activity timeline.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Colors, Spacing } from '../src/constants/theme';
import { listEntries, type Entry } from '../src/services/database';
import { apiGetSessionAnalytics, apiListEntries, getToken } from '../src/services/api';

const WINDOWS = [{ m: 15, l: '15m' }, { m: 60, l: '1h' }, { m: 90, l: '90m' }, { m: 240, l: '4h' }];
const KIND_COLOR: Record<string, string> = { idea: '#0f62fe', bug: '#da1e28', insight: '#198038', snippet: '#8a3ffc', note: '#5d5f5f' };

export default function AnalyticsScreen() {
  const [windowMin, setWindowMin] = useState(90);
  const [stats, setStats] = useState<{ total: number; by_kind: Record<string, number>; by_source: Record<string, number>; files_touched: string[] } | null>(null);
  const [recent, setRecent] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [focusSecs, setFocusSecs] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const tok = await getToken();
      if (tok) {
        const [s, entries] = await Promise.all([
          apiGetSessionAnalytics(windowMin),
          apiListEntries(10),
        ]);
        setStats(s);
        setRecent(entries as any);
      } else {
        const entries = await listEntries(10);
        const by_kind: Record<string, number> = {};
        entries.forEach(e => { by_kind[e.kind] = (by_kind[e.kind] ?? 0) + 1; });
        setStats({ total: entries.length, by_kind, by_source: {}, files_touched: [] });
        setRecent(entries);
      }
    } catch {
      const entries = await listEntries(10);
      const by_kind: Record<string, number> = {};
      entries.forEach(e => { by_kind[e.kind] = (by_kind[e.kind] ?? 0) + 1; });
      setStats({ total: entries.length, by_kind, by_source: {}, files_touched: [] });
      setRecent(entries);
    }
    setLoading(false);
  }, [windowMin]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!timerRunning) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setFocusSecs(s => { if (s <= 1) { setTimerRunning(false); return 25 * 60; } return s - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Analytics</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 16 }}
      >
        {/* Window selector */}
        <View style={S.windowRow}>
          {WINDOWS.map(w => (
            <TouchableOpacity key={w.m} style={[S.windowBtn, windowMin === w.m && S.windowBtnActive]} onPress={() => setWindowMin(w.m)}>
              <Text style={[S.windowBtnText, windowMin === w.m && S.windowBtnTextActive]}>{w.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : stats && (
          <>
            {/* Stats row */}
            <View style={S.statsRow}>
              {[
                { label: 'Entries', value: stats.total, color: Colors.primary },
                { label: 'Kinds', value: Object.keys(stats.by_kind).length, color: '#8a3ffc' },
                { label: 'Files', value: stats.files_touched.length, color: '#198038' },
              ].map(s => (
                <View key={s.label} style={S.statCard}>
                  <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={S.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Time allocation */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Time Allocation</Text>
              {Object.entries(stats.by_kind).map(([kind, count]) => {
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const color = KIND_COLOR[kind] ?? Colors.secondary;
                return (
                  <View key={kind} style={S.barRow}>
                    <View style={[S.barDot, { backgroundColor: color }]} />
                    <Text style={S.barLabel}>{kind}</Text>
                    <View style={S.barTrack}>
                      <View style={[S.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                    </View>
                    <Text style={S.barCount}>{count}</Text>
                  </View>
                );
              })}
              {Object.keys(stats.by_kind).length === 0 && (
                <Text style={S.emptyText}>No entries in this window</Text>
              )}
            </View>

            {/* Focus Timer */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Focus Timer</Text>
              <Text style={S.timerDisplay}>{fmt(focusSecs)}</Text>
              <View style={S.timerBtns}>
                <TouchableOpacity style={S.timerBtn} onPress={() => setTimerRunning(!timerRunning)}>
                  <Text style={S.timerBtnText}>{timerRunning ? 'Pause' : 'Start'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.timerBtn, S.timerBtnSecondary]} onPress={() => { setTimerRunning(false); setFocusSecs(25 * 60); }}>
                  <Text style={[S.timerBtnText, { color: Colors.primary }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent activity timeline */}
            <View style={S.card}>
              <Text style={S.cardTitle}>Recent Activity</Text>
              <View style={S.timeline}>
                {recent.map((e, i) => {
                  const color = KIND_COLOR[e.kind] ?? Colors.secondary;
                  return (
                    <View key={e.id} style={S.timelineItem}>
                      <View style={[S.timelineDot, { backgroundColor: color }]} />
                      {i < recent.length - 1 && <View style={S.timelineLine} />}
                      <View style={S.timelineContent}>
                        <View style={S.timelineTop}>
                          <View style={[S.kindPill, { backgroundColor: color + '20' }]}>
                            <Text style={[S.kindPillText, { color }]}>{e.kind}</Text>
                          </View>
                          <Text style={S.timelineTime}>
                            {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text style={S.timelineText} numberOfLines={2}>{e.text}</Text>
                      </View>
                    </View>
                  );
                })}
                {recent.length === 0 && <Text style={S.emptyText}>No recent activity</Text>}
              </View>
            </View>
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
  windowRow: { flexDirection: 'row', gap: 8 },
  windowBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', alignItems: 'center' },
  windowBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  windowBtnText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  windowBtnTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#191b24', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barDot: { width: 10, height: 10, borderRadius: 5 },
  barLabel: { fontSize: 12, color: '#191b24', width: 60, textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.outlineVariant, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barCount: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, width: 24, textAlign: 'right' },
  emptyText: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 8 },
  timerDisplay: { fontSize: 56, fontFamily: 'monospace', fontWeight: '300', color: '#191b24', textAlign: 'center', marginVertical: 12 },
  timerBtns: { flexDirection: 'row', gap: 12 },
  timerBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  timerBtnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.outlineVariant },
  timerBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  timelineLine: { position: 'absolute', left: 4, top: 14, bottom: 0, width: 2, backgroundColor: Colors.outlineVariant },
  timelineContent: { flex: 1 },
  timelineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  kindPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  kindPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  timelineTime: { fontSize: 11, color: Colors.outline },
  timelineText: { fontSize: 13, color: '#191b24', lineHeight: 18 },
});
