/**
 * Developer Identity — knowledge graph + cognitive profile.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { apiGetProfile, apiListEntries, isApiConfigured } from '../src/services/api';
import { getDemoProfile, getDemoEntries } from '../src/services/demoData';

function relTime(ts: number) {
  const d = Date.now() - ts;
  const h = Math.floor(d / 3600000);
  const days = Math.floor(d / 86400000);
  const weeks = Math.floor(d / 604800000);
  if (h < 24) return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

export default function IdentityScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [topConcepts, setTopConcepts] = useState<{ name: string; count: number; lastSeen: number }[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [filesCount, setFilesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      const configured = await isApiConfigured();
      let prof: any = null;
      let entries: any[] = [];

      if (configured) {
        try { prof = await apiGetProfile(); } catch {}
        try { entries = await apiListEntries(500); } catch {}
      }
      if (!prof) {
        const local = await listEntries(500);
        entries = local.length > 0 ? local : getDemoEntries(50);
        prof = getDemoProfile();
      }
      if (entries.length === 0) entries = getDemoEntries(50);

      setProfile(prof);
      setTotalEntries(entries.length);
      setFilesCount(new Set(entries.filter((e: any) => e.file).map((e: any) => e.file)).size);

      // Extract top concepts from tags
      const tagMap = new Map<string, { count: number; lastSeen: number }>();
      entries.forEach((e: any) => {
        (e.tags ?? []).forEach((t: string) => {
          const ex = tagMap.get(t) ?? { count: 0, lastSeen: 0 };
          tagMap.set(t, { count: ex.count + 1, lastSeen: Math.max(ex.lastSeen, e.created_at) });
        });
      });
      const concepts = Array.from(tagMap.entries())
        .map(([name, d]) => ({ name, count: d.count, lastSeen: d.lastSeen }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setTopConcepts(concepts);
      setLoading(false);
    })();
  }, []));

  const level = Math.floor(totalEntries / 10);
  const conceptColors = ['#0f62fe', '#8a3ffc', '#198038', '#da1e28', '#f1c21b', '#5d5f5f'];

  if (loading) return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Developer Identity</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 16 }}>
        {/* Profile card */}
        <View style={S.card}>
          <View style={S.profileRow}>
            <View style={S.avatar}>
              <Text style={S.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.profileName}>{profile?.name ?? 'Developer'}</Text>
              <Text style={S.profileBio}>{profile?.bio ?? 'Software Engineer'}</Text>
              <View style={S.badgeRow}>
                <View style={S.badge}><Text style={S.badgeText}>Lvl. {level}</Text></View>
                <View style={[S.badge, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="hardware-chip-outline" size={11} color={Colors.primary} />
                  <Text style={[S.badgeText, { color: Colors.primary }]}>Core Node</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={S.aiSummary}>
            <Text style={S.aiSummaryLabel}>AI Summary</Text>
            <Text style={S.aiSummaryText}>
              Demonstrates expertise in {topConcepts[0]?.name ?? 'software development'}, with {totalEntries} documented entries across {filesCount} files. Active contributor with {level} experience levels.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={S.statsRow}>
          {[
            { label: 'Entries', value: totalEntries, color: Colors.primary },
            { label: 'Concepts', value: topConcepts.length, color: '#8a3ffc' },
            { label: 'Files', value: filesCount, color: '#198038' },
          ].map(s => (
            <View key={s.label} style={S.statCard}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Knowledge Graph (visual) */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Knowledge Graph</Text>
          <View style={S.graphContainer}>
            {/* Central node */}
            <View style={S.graphCenter}>
              <View style={S.centralNode}>
                <Text style={S.centralNodeText}>{topConcepts[0]?.name?.slice(0, 8) ?? 'Core'}</Text>
              </View>
              {/* Peripheral nodes */}
              {topConcepts.slice(1, 6).map((c, i) => {
                const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
                const r = 80;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                return (
                  <View key={c.name} style={[S.peripheralNode, { transform: [{ translateX: x }, { translateY: y }], backgroundColor: conceptColors[i + 1] + '20', borderColor: conceptColors[i + 1] }]}>
                    <Text style={[S.peripheralNodeText, { color: conceptColors[i + 1] }]}>{c.name.slice(0, 7)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Cognitive Profile */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Cognitive Profile</Text>
          {[
            { label: 'Conciseness', value: 85 },
            { label: 'Technical Depth', value: Math.min(95, 60 + level * 2) },
            { label: 'Exploratory', value: Math.min(80, 30 + topConcepts.length * 5) },
          ].map(item => (
            <View key={item.label} style={{ marginBottom: 12 }}>
              <View style={S.barHeader}>
                <Text style={S.barLabel}>{item.label}</Text>
                <Text style={S.barValue}>{item.value}%</Text>
              </View>
              <View style={S.barTrack}>
                <View style={[S.barFill, { width: `${item.value}%` as any, backgroundColor: item.value > 70 ? Colors.primary : Colors.secondary }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Top Concepts */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Top Concepts</Text>
          {topConcepts.map((c, i) => (
            <View key={c.name} style={[S.conceptRow, i < topConcepts.length - 1 && S.conceptRowBorder]}>
              <View style={[S.conceptIcon, { backgroundColor: conceptColors[i] + '20' }]}>
                <Ionicons name="code-slash-outline" size={16} color={conceptColors[i]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.conceptName}>{c.name}</Text>
                <Text style={S.conceptCount}>{c.count} references</Text>
              </View>
              <Text style={S.conceptTime}>{relTime(c.lastSeen)}</Text>
            </View>
          ))}
          {topConcepts.length === 0 && (
            <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
              Add entries with tags to build your knowledge graph
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 16 },
  profileRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.primary },
  profileName: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  profileBio: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f4f5fb', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.outlineVariant },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant },
  aiSummary: { backgroundColor: '#f4f5fb', borderRadius: 10, padding: 12 },
  aiSummaryLabel: { fontSize: 10, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  aiSummaryText: { fontSize: 13, color: '#191b24', lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#191b24', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  graphContainer: { height: 220, alignItems: 'center', justifyContent: 'center' },
  graphCenter: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  centralNode: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  centralNodeText: { fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center' },
  peripheralNode: { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  peripheralNodeText: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 12, fontWeight: '600', color: '#191b24', textTransform: 'uppercase', letterSpacing: 0.3 },
  barValue: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  barTrack: { height: 8, backgroundColor: Colors.outlineVariant, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  conceptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  conceptRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  conceptIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  conceptName: { fontSize: 14, fontWeight: '600', color: '#191b24', textTransform: 'capitalize' },
  conceptCount: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 },
  conceptTime: { fontSize: 11, color: Colors.outline },
});
