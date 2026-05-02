/**
 * Today Hub — polished dashboard with gradient header, stats, and LLM status.
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
import { Colors, Spacing, Typography } from '../src/constants/theme';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { listEntries, type Entry } from '../src/services/database';
import { checkOllamaHealth } from '../src/services/llm';
import { getSessionStats } from '../src/services/memory';
import { apiListEntries, checkApiHealth, getToken } from '../src/services/api';

const KIND_META: Record<string, { color: string; icon: string; bg: string }> = {
  idea:    { color: '#0f62fe', icon: 'bulb',          bg: '#dbe1ff' },
  bug:     { color: '#da1e28', icon: 'bug',            bg: '#ffdad6' },
  insight: { color: '#198038', icon: 'flash',          bg: '#defbe6' },
  snippet: { color: '#8a3ffc', icon: 'code-slash',     bg: '#e8daff' },
  note:    { color: '#5d5f5f', icon: 'document-text',  bg: '#e0e0e0' },
};
const kindMeta = (k: string) => KIND_META[k] ?? KIND_META.note;

export default function TodayScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    byKind: {} as Record<string, number>,
    topTags: [] as string[],
  });
  const [llmStatus, setLlmStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiOnline, setApiOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    // Try backend API first, fall back to local SQLite
    try {
      const tok = await getToken();
      if (tok) {
        const remote = await apiListEntries(30);
        // Map remote entries to local Entry shape
        setEntries(remote as any);
        const byKind: Record<string, number> = {};
        const tagCounts: Record<string, number> = {};
        remote.forEach(e => {
          byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
          (e.tags ?? []).forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
        });
        const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
        setStats({ total: remote.length, byKind, topTags });
        setApiOnline(true);
        return;
      }
    } catch { setApiOnline(false); }

    // Local fallback
    const [e, s] = await Promise.all([listEntries(30), getSessionStats()]);
    setEntries(e);
    setStats(s);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), checkLLM()]);
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 8 }}
      >
        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>{greeting} 👋</Text>
              <Text style={styles.heroDate}>{today}</Text>
            </View>
            {/* LLM Status Pill */}
            <TouchableOpacity
              style={[
                styles.llmPill,
                llmStatus === 'online'   && styles.llmPillOnline,
                llmStatus === 'offline'  && styles.llmPillOffline,
                llmStatus === 'checking' && styles.llmPillChecking,
              ]}
              onPress={() => router.push('/profile')}
              activeOpacity={0.75}
            >
              <View style={[
                styles.llmDot,
                llmStatus === 'online'   && { backgroundColor: Colors.llmOnline },
                llmStatus === 'offline'  && { backgroundColor: Colors.llmOffline },
                llmStatus === 'checking' && { backgroundColor: Colors.llmLoading },
              ]} />
              <Text style={[
                styles.llmPillText,
                llmStatus === 'online'   && { color: Colors.llmOnline },
                llmStatus === 'offline'  && { color: Colors.llmOffline },
                llmStatus === 'checking' && { color: '#7a5c00' },
              ]}>
                {llmStatus === 'checking' ? 'Checking…'
                  : llmStatus === 'online' ? 'AI Online'
                  : 'AI Offline'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLbl}>Entries</Text>
            </View>
            {Object.entries(stats.byKind).slice(0, 2).map(([kind, count]) => (
              <View key={kind} style={[styles.statCard, { borderLeftColor: kindMeta(kind).color }]}>
                <Text style={[styles.statNum, { color: kindMeta(kind).color }]}>{count}</Text>
                <Text style={styles.statLbl}>{kind}s</Text>
              </View>
            ))}
            {Object.keys(stats.byKind).length === 0 && (
              <>
                <View style={[styles.statCard, { borderLeftColor: KIND_META.idea.color }]}>
                  <Text style={[styles.statNum, { color: KIND_META.idea.color }]}>0</Text>
                  <Text style={styles.statLbl}>Ideas</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: KIND_META.bug.color }]}>
                  <Text style={[styles.statNum, { color: KIND_META.bug.color }]}>0</Text>
                  <Text style={styles.statLbl}>Bugs</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── AI Offline Banner ── */}
        {llmStatus === 'offline' && (
          <TouchableOpacity
            style={styles.offlineBanner}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="warning-outline" size={18} color="#7a3800" />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineBannerTitle}>Granite 3.3:2b is offline</Text>
              <Text style={styles.offlineBannerSub}>Tap to configure Ollama host in Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#7a3800" />
          </TouchableOpacity>
        )}

        {/* ── Top Tags ── */}
        {stats.topTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Tags</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stats.topTags.map(tag => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Quick Capture ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => router.push('/capture')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.captureBtnText}>Capture a thought</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push('/chat')}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Recent Entries ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {entries.length > 0 && (
              <Text style={styles.sectionCount}>{entries.length}</Text>
            )}
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="journal-outline" size={36} color={Colors.outlineVariant} />
              </View>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySub}>Tap "Capture a thought" to add your first entry.</Text>
            </View>
          ) : (
            entries.map(entry => {
              const meta = kindMeta(entry.kind);
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
                  activeOpacity={0.75}
                >
                  {/* Left accent bar */}
                  <View style={[styles.entryBar, { backgroundColor: meta.color }]} />

                  <View style={styles.entryBody}>
                    {/* Row 1: kind badge + time */}
                    <View style={styles.entryMeta}>
                      <View style={[styles.kindPill, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={11} color={meta.color} />
                        <Text style={[styles.kindPillText, { color: meta.color }]}>
                          {entry.kind}
                        </Text>
                      </View>
                      <Text style={styles.entryTime}>
                        {new Date(entry.created_at).toLocaleTimeString([], {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {/* Row 2: text */}
                    <Text style={styles.entryText} numberOfLines={2}>
                      {entry.text}
                    </Text>

                    {/* Row 3: tags */}
                    {entry.tags.length > 0 && (
                      <View style={styles.entryTagsRow}>
                        {entry.tags.slice(0, 4).map(t => (
                          <Text key={t} style={styles.entryTag}>#{t}</Text>
                        ))}
                      </View>
                    )}
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.outlineVariant}
                    style={{ alignSelf: 'center', marginRight: 10 }}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5fb' },

  // ── Hero ──
  hero: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  heroGreeting: { fontSize: 22, fontWeight: '700', color: Colors.onBackground, letterSpacing: -0.3 },
  heroDate: { ...Typography.label, color: Colors.onSurfaceVariant, marginTop: 2, textTransform: 'uppercase' },

  // LLM pill
  llmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  llmPillOnline:   { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  llmPillOffline:  { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  llmPillChecking: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  llmDot: { width: 7, height: 7, borderRadius: 4 },
  llmPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderLeftWidth: 3,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 26, fontWeight: '300', color: Colors.primary, lineHeight: 30 },
  statLbl: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.4 },

  // Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: 12,
  },
  offlineBannerTitle: { fontSize: 13, fontWeight: '700', color: '#7a3800' },
  offlineBannerSub:   { fontSize: 11, color: '#9a4f00', marginTop: 1 },

  // Tags
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionCount: {
    fontSize: 11, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10,
  },
  tagChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  tagChipText: { fontFamily: 'monospace', fontSize: 12, color: Colors.onSurface },

  // Quick row
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  captureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  captureBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  chatBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Entry cards
  entryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  entryBar: { width: 4 },
  entryBody: { flex: 1, padding: 10 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  kindPillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  entryTime: { fontSize: 11, color: Colors.outline },
  entryText: { fontSize: 14, color: Colors.onSurface, lineHeight: 20, fontWeight: '400' },
  entryTagsRow: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  entryTag: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
});
