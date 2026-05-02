/**
 * Today Hub — full-featured dashboard with demo data fallback.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { checkOllamaHealth } from '../src/services/llm';
import { getSessionStats } from '../src/services/memory';
import { apiGetToday, isApiConfigured } from '../src/services/api';
import { getDemoEntries, getDemoTasks, getDemoNotifications } from '../src/services/demoData';

const KIND_META: Record<string, { color: string; icon: string; bg: string }> = {
  idea:     { color: '#0f62fe', icon: 'bulb',          bg: '#dbe1ff' },
  bug:      { color: '#da1e28', icon: 'bug',            bg: '#ffdad6' },
  fix:      { color: '#198038', icon: 'hammer',         bg: '#defbe6' },
  insight:  { color: '#198038', icon: 'flash',          bg: '#defbe6' },
  snippet:  { color: '#8a3ffc', icon: 'code-slash',     bg: '#e8daff' },
  decision: { color: '#8a3ffc', icon: 'git-branch',     bg: '#e8daff' },
  note:     { color: '#5d5f5f', icon: 'document-text',  bg: '#e0e0e0' },
  task:     { color: '#f1c21b', icon: 'checkbox',       bg: '#fdf6dd' },
  debug:    { color: '#da1e28', icon: 'bug',            bg: '#ffdad6' },
  report:   { color: '#0f62fe', icon: 'document',       bg: '#dbe1ff' },
};
const km = (k: string) => KIND_META[k] ?? KIND_META.note;

const QUICK_ACTIONS = [
  { kind: 'fix',      emoji: '🐛', title: 'Log a Fix',      hint: 'Document a resolved bug',        color: '#198038' },
  { kind: 'decision', emoji: '🏛️', title: 'Save Decision',  hint: 'Record an architecture choice',  color: '#0f62fe' },
  { kind: 'note',     emoji: '📝', title: 'Quick Note',     hint: 'Jot a fleeting thought',         color: '#8a3ffc' },
  { kind: 'idea',     emoji: '💡', title: 'Capture Idea',   hint: 'Save a brilliant insight',       color: '#f1c21b' },
];

const QUICK_LINKS = [
  { icon: 'git-branch-outline', label: 'GitHub',    route: '/github',      color: '#da1e28' },
  { icon: 'bulb-outline',       label: 'Ideas',     route: '/ideas',       color: '#f1c21b' },
  { icon: 'bar-chart-outline',  label: 'Analytics', route: '/analytics',   color: '#198038' },
  { icon: 'time-outline',       label: 'Timeline',  route: '/timeline',    color: '#0f62fe' },
  { icon: 'document-text-outline', label: 'Report', route: '/report',      color: '#8a3ffc' },
  { icon: 'leaf-outline',       label: 'Wellness',  route: '/wellness',    color: '#198038' },
];

export default function TodayScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, byKind: {} as Record<string, number>, topTags: [] as string[] });
  const [llmStatus, setLlmStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiOnline, setApiOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState(getDemoTasks());
  const [notifications, setNotifications] = useState(getDemoNotifications());
  const [showNotifs, setShowNotifs] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const configured = await isApiConfigured();
    setApiOnline(configured);

    if (configured) {
      try {
        const today = await apiGetToday();
        setEntries(today.recent ?? []);
        setStats({
          total: Object.values(today.counts_by_kind).reduce((a, b) => a + b, 0),
          byKind: today.counts_by_kind,
          topTags: [],
        });
        return;
      } catch {}
    }

    // Local DB
    try {
      const [e, s] = await Promise.all([listEntries(20), getSessionStats()]);
      if (e.length > 0) { setEntries(e); setStats(s); return; }
    } catch {}

    // Demo data fallback
    const demo = getDemoEntries(20);
    setEntries(demo);
    const byKind: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    demo.forEach(e => {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
      (e.tags ?? []).forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
    });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
    setStats({ total: demo.length, byKind, topTags });
  }, []);

  const checkLLM = useCallback(async () => {
    const { online } = await checkOllamaHealth();
    setLlmStatus(online ? 'online' : 'offline');
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    checkLLM();
    intervalRef.current = setInterval(checkLLM, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [checkLLM]);

  const onRefresh = async () => { setRefreshing(true); await Promise.all([load(), checkLLM()]); setRefreshing(false); };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 8 }}
      >
        {/* ── Hero ── */}
        <View style={S.hero}>
          <View style={S.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={S.greeting}>{greeting} 👋</Text>
              <Text style={S.date}>{today}</Text>
            </View>
            <View style={S.heroActions}>
              {/* Notification bell */}
              <TouchableOpacity style={S.notifBtn} onPress={() => setShowNotifs(!showNotifs)}>
                <Ionicons name="notifications-outline" size={22} color={Colors.onSurface} />
                {unreadNotifs > 0 && (
                  <View style={S.notifBadge}><Text style={S.notifBadgeText}>{unreadNotifs}</Text></View>
                )}
              </TouchableOpacity>
              {/* Status pills */}
              <TouchableOpacity style={[S.pill, llmStatus === 'online' ? S.pillGreen : S.pillRed]} onPress={() => router.push('/profile')}>
                <View style={[S.pillDot, { backgroundColor: llmStatus === 'online' ? Colors.llmOnline : Colors.llmOffline }]} />
                <Text style={[S.pillTxt, { color: llmStatus === 'online' ? Colors.llmOnline : Colors.llmOffline }]}>AI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.pill, apiOnline ? S.pillGreen : S.pillGray]} onPress={() => router.push('/profile')}>
                <Ionicons name={apiOnline ? 'cloud' : 'cloud-offline-outline'} size={11} color={apiOnline ? Colors.llmOnline : Colors.outline} />
                <Text style={[S.pillTxt, { color: apiOnline ? Colors.llmOnline : Colors.outline }]}>{apiOnline ? 'API' : 'Local'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={S.statsRow}>
            <View style={[S.statCard, { borderLeftColor: Colors.primary }]}>
              <Text style={S.statNum}>{stats.total}</Text>
              <Text style={S.statLbl}>Entries</Text>
            </View>
            {Object.entries(stats.byKind).slice(0, 2).map(([kind, count]) => (
              <View key={kind} style={[S.statCard, { borderLeftColor: km(kind).color }]}>
                <Text style={[S.statNum, { color: km(kind).color }]}>{count}</Text>
                <Text style={S.statLbl}>{kind}s</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Notifications panel ── */}
        {showNotifs && (
          <View style={S.notifPanel}>
            <View style={S.notifHeader}>
              <Text style={S.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => { setNotifications(n => n.map(x => ({ ...x, read: true }))); }}>
                <Text style={S.notifMarkAll}>Mark all read</Text>
              </TouchableOpacity>
            </View>
            {notifications.map(n => (
              <TouchableOpacity key={n.id} style={[S.notifItem, !n.read && S.notifItemUnread]}
                onPress={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                <Ionicons
                  name={n.type === 'success' ? 'checkmark-circle' : n.type === 'error' ? 'close-circle' : n.type === 'warning' ? 'warning' : 'information-circle'}
                  size={18}
                  color={n.type === 'success' ? Colors.llmOnline : n.type === 'error' ? Colors.error : n.type === 'warning' ? '#f1c21b' : Colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={S.notifItemTitle}>{n.title}</Text>
                  <Text style={S.notifItemMsg} numberOfLines={1}>{n.message}</Text>
                </View>
                {!n.read && <View style={S.notifDot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Quick Actions</Text>
          <View style={S.quickGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.kind} style={S.quickCard}
                onPress={() => router.push({ pathname: '/capture', params: { kind: a.kind } })} activeOpacity={0.75}>
                <Text style={S.quickEmoji}>{a.emoji}</Text>
                <Text style={S.quickTitle}>{a.title}</Text>
                <Text style={S.quickHint}>{a.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Quick Links ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Features</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_LINKS.map(l => (
              <TouchableOpacity key={l.route} style={S.linkChip} onPress={() => router.push(l.route as any)} activeOpacity={0.75}>
                <View style={[S.linkIcon, { backgroundColor: l.color + '20' }]}>
                  <Ionicons name={l.icon as any} size={18} color={l.color} />
                </View>
                <Text style={S.linkLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Tasks ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/automations')}>
              <Text style={S.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          {tasks.slice(0, 4).map(t => (
            <TouchableOpacity key={t.id} style={S.taskRow} onPress={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, completed: !x.completed } : x))} activeOpacity={0.75}>
              <Ionicons name={t.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20}
                color={t.completed ? Colors.llmOnline : t.priority === 'critical' ? Colors.error : t.priority === 'high' ? '#f1c21b' : Colors.outline} />
              <View style={{ flex: 1 }}>
                <Text style={[S.taskTitle, t.completed && S.taskDone]}>{t.title}</Text>
                <Text style={S.taskPriority}>{t.priority} priority</Text>
              </View>
              <View style={[S.priorityDot, { backgroundColor: t.priority === 'critical' ? Colors.error : t.priority === 'high' ? '#f1c21b' : Colors.outlineVariant }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Capture + Chat ── */}
        <View style={S.actionRow}>
          <TouchableOpacity style={S.captureBtn} onPress={() => router.push('/capture')} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={S.captureBtnText}>Capture a thought</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.chatBtn} onPress={() => router.push('/chat')} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Recent Entries ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push('/timeline')}>
              <Text style={S.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {entries.length === 0 ? (
            <View style={S.empty}>
              <Ionicons name="journal-outline" size={36} color={Colors.outlineVariant} />
              <Text style={S.emptyTitle}>Nothing here yet</Text>
              <Text style={S.emptySub}>Tap "Capture a thought" to add your first entry.</Text>
            </View>
          ) : (
            entries.slice(0, 8).map((entry: any) => {
              const meta = km(entry.kind);
              return (
                <TouchableOpacity key={entry.id} style={S.entryCard}
                  onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })} activeOpacity={0.75}>
                  <View style={[S.entryBar, { backgroundColor: meta.color }]} />
                  <View style={S.entryBody}>
                    <View style={S.entryMeta}>
                      <View style={[S.kindPill, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={11} color={meta.color} />
                        <Text style={[S.kindPillText, { color: meta.color }]}>{entry.kind}</Text>
                      </View>
                      <Text style={S.entryTime}>
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={S.entryText} numberOfLines={2}>{entry.text}</Text>
                    {(entry.tags ?? []).length > 0 && (
                      <View style={S.tagsRow}>
                        {(entry.tags ?? []).slice(0, 3).map((t: string) => (
                          <Text key={t} style={S.tag}>#{t}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.outlineVariant} style={{ alignSelf: 'center', marginRight: 10 }} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  hero: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  date: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pillRed: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  pillGray: { backgroundColor: '#f4f5fb', borderColor: Colors.outlineVariant },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillTxt: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#f8f9ff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, borderLeftWidth: 3, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '300', color: Colors.primary, lineHeight: 30 },
  statLbl: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 },
  // Notifications
  notifPanel: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#191b24' },
  notifMarkAll: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  notifItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  notifItemUnread: { backgroundColor: '#f8f9ff' },
  notifItemTitle: { fontSize: 13, fontWeight: '600', color: '#191b24' },
  notifItemMsg: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  // Sections
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.6 },
  seeAll: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, alignItems: 'center', gap: 4 },
  quickEmoji: { fontSize: 22 },
  quickTitle: { fontSize: 11, fontWeight: '700', color: '#191b24', textAlign: 'center' },
  quickHint: { fontSize: 10, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 14 },
  // Quick links
  linkChip: { alignItems: 'center', gap: 4, marginRight: 12, width: 60 },
  linkIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textAlign: 'center' },
  // Tasks
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, marginBottom: 6 },
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#191b24' },
  taskDone: { textDecorationLine: 'line-through', color: Colors.outline },
  taskPriority: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1, textTransform: 'capitalize' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  // Action row
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  captureBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  captureBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  chatBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  // Entries
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 20 },
  entryCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 8, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  entryBar: { width: 4 },
  entryBody: { flex: 1, padding: 10 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  kindPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  kindPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  entryTime: { fontSize: 11, color: Colors.outline },
  entryText: { fontSize: 14, color: '#191b24', lineHeight: 20 },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  tag: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
});
