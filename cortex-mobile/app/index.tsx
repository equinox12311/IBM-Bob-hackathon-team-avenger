/**
 * Today — the home screen. Greeting, status pills, hero stats, quick capture
 * actions, recent entries, jump-grid. Fully themed via the design system.
 *
 * Data sources (in priority order):
 *   1. cortex-api (apiGetToday) when configured
 *   2. local sqlite (listEntries + getSessionStats) when API is missing
 *   3. demo data fallback so the screen always shows something
 *
 * Ollama is only checked when cortex-api isn't connected — otherwise the
 * "AI offline" pill was a false-positive scare.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button, Card, EmptyState, IconButton, Pill, Screen, Section } from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { apiGetToday, isApiConfigured } from '../src/services/api';
import { listEntries } from '../src/services/database';
import { hasSeenOnboarding } from './onboarding';
import { checkOllamaHealth } from '../src/services/llm';
import { getSessionStats } from '../src/services/memory';
import { getDemoEntries, getDemoNotifications, getDemoTasks } from '../src/services/demoData';

// Quick-capture metadata (kind → icon + accent token name)
const QUICK = [
  { kind: 'fix',      icon: 'hammer',     label: 'Fix',      tone: 'success'   as const },
  { kind: 'decision', icon: 'git-branch', label: 'Decision', tone: 'primary'   as const },
  { kind: 'note',     icon: 'document-text', label: 'Note',  tone: 'secondary' as const },
  { kind: 'idea',     icon: 'bulb',       label: 'Idea',     tone: 'warning'   as const },
] as const;

const JUMP = [
  { icon: 'time-outline',           label: 'Timeline',  route: '/timeline'   },
  { icon: 'sparkles-outline',       label: 'Wiki',      route: '/wiki'       },
  { icon: 'extension-puzzle-outline', label: 'Skills',  route: '/skills'     },
  { icon: 'shield-checkmark-outline', label: 'Security', route: '/security'  },
  { icon: 'calendar-outline',       label: 'Calendar',  route: '/calendar'   },
  { icon: 'folder-open-outline',    label: 'Codebase',  route: '/explorer'   },
] as const;

const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  idea: 'bulb', bug: 'bug', fix: 'hammer', insight: 'flash',
  snippet: 'code-slash', decision: 'git-branch', note: 'document-text',
  task: 'checkbox', debug: 'bug', report: 'document', code: 'code-slash',
};

export default function TodayScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();

  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; byKind: Record<string, number> }>({
    total: 0, byKind: {},
  });
  const [apiOnline, setApiOnline] = useState(false);
  const [llmStatus, setLlmStatus] = useState<'checking' | 'online' | 'offline' | 'na'>('checking');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifs] = useState(getDemoNotifications().filter(n => !n.read).length);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // First-launch onboarding gate
  useEffect(() => {
    let cancelled = false;
    hasSeenOnboarding().then((seen) => {
      if (!seen && !cancelled) router.replace('/onboarding');
    });
    return () => { cancelled = true; };
  }, [router]);

  const load = useCallback(async () => {
    const configured = await isApiConfigured();
    setApiOnline(configured);

    if (configured) {
      try {
        const today = await apiGetToday();
        setEntries(today.recent ?? []);
        setStats({
          total: Object.values(today.counts_by_kind ?? {}).reduce((a, b) => a + b, 0),
          byKind: today.counts_by_kind ?? {},
        });
        return;
      } catch { /* fall through */ }
    }

    try {
      const [e, s] = await Promise.all([listEntries(20), getSessionStats()]);
      if (e.length > 0) { setEntries(e); setStats({ total: s.total, byKind: s.byKind }); return; }
    } catch { /* fall through */ }

    const demo = getDemoEntries(20);
    const byKind: Record<string, number> = {};
    demo.forEach(e => { byKind[e.kind] = (byKind[e.kind] ?? 0) + 1; });
    setEntries(demo);
    setStats({ total: demo.length, byKind });
  }, []);

  // Only check Ollama when API isn't connected — otherwise the pill is noise.
  const checkLLM = useCallback(async () => {
    if (apiOnline) { setLlmStatus('na'); return; }
    const { online } = await checkOllamaHealth();
    setLlmStatus(online ? 'online' : 'offline');
  }, [apiOnline]);

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

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen padding={Spacing.md} onRefresh={onRefresh} refreshing={refreshing}>
      {/* ── Hero greeting card ── */}
      <Card variant="primary" size="hero" padding="lg" style={{ marginBottom: Spacing.md }}>
        <View style={s.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.codeSm, { color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase' }]}>
              cortex · {today}
            </Text>
            <Text style={[Typography.h2, { color: Colors.onPrimaryFixed, marginTop: 6 }]}>
              {greeting}.
            </Text>
            <Text style={[Typography.bodySm, { color: Colors.onPrimaryFixed, opacity: 0.7, marginTop: 4 }]}>
              Memory · Reasoning · Action.
            </Text>
          </View>
          <IconButton
            icon="notifications-outline"
            onPress={() => {/* notifications */}}
            variant="secondary"
            size="md"
            badge={unreadNotifs}
          />
        </View>
        <View style={s.heroPills}>
          <Pill
            label={apiOnline ? 'API connected' : 'Offline'}
            tone={apiOnline ? 'success' : 'neutral'}
            icon={apiOnline ? 'cloud-done' : 'cloud-offline'}
          />
          {!apiOnline && llmStatus !== 'na' && (
            <Pill
              label={llmStatus === 'online' ? 'Local AI' : 'No AI'}
              tone={llmStatus === 'online' ? 'success' : 'neutral'}
              dot
            />
          )}
        </View>
      </Card>

      {/* ── Stats strip ── */}
      <View style={s.statsRow}>
        <StatTile label="Entries" value={stats.total} accent={Colors.primary} />
        <StatTile label="Kinds" value={Object.keys(stats.byKind).length} accent={Colors.secondary} />
        <StatTile label="Today" value={entries.length} accent={Colors.tertiary} />
      </View>

      {/* ── Quick capture ── */}
      <Section title="Quick capture">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.kind}
              activeOpacity={0.85}
              onPress={() => router.push(`/capture?kind=${q.kind}` as any)}
              style={[s.quickChip, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }]}
            >
              <Pill label={q.label} tone={q.tone} icon={q.icon as any} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Section>

      {/* ── Recent entries ── */}
      <Section title="Recent" trailingLabel="See all" onTrailingPress={() => router.push('/timeline')}>
        {entries.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Capture without breaking flow."
            body="Tap the + button to log your first thought, fix, or decision."
            ctaLabel="Capture"
            onCta={() => router.push('/capture')}
            tone="primary"
          />
        ) : (
          entries.slice(0, 5).map((e: any) => (
            <Card
              key={e.id}
              variant="surface"
              size="list"
              padding="md"
              onPress={() => router.push(`/entry/${e.id}` as any)}
            >
              <View style={s.entryRow}>
                <View style={[s.entryIcon, { backgroundColor: Colors.primaryFixed }]}>
                  <Ionicons
                    name={KIND_ICON[e.kind] ?? 'document-text'}
                    size={16}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={[Typography.body, { color: Colors.onSurface }]}>
                    {e.text}
                  </Text>
                  <Text style={[Typography.codeSm, { color: Colors.outline, marginTop: 2 }]}>
                    {e.kind} · {relTime(e.created_at)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </Section>

      {/* ── Jump grid ── */}
      <Section title="Explore">
        <View style={s.grid}>
          {JUMP.map((j) => (
            <TouchableOpacity
              key={j.route}
              style={[s.gridItem, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }]}
              activeOpacity={0.85}
              onPress={() => router.push(j.route as any)}
            >
              <Ionicons name={j.icon as any} size={22} color={Colors.primary} />
              <Text style={[Typography.labelSm, { color: Colors.onSurface, marginTop: 6 }]}>
                {j.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* ── Settings shortcut ── */}
      {!apiOnline && (
        <Button
          label="Connect cortex-api"
          icon="cloud-upload-outline"
          variant="outlined"
          onPress={() => router.push('/profile')}
          fullWidth
          style={{ marginTop: Spacing.md }}
        />
      )}
    </Screen>
  );
}

// Local helpers --------------------------------------------------------------

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  const { Colors } = useThemeMode();
  return (
    <View style={[s.stat, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }]}>
      <View style={[s.statBar, { backgroundColor: accent }]} />
      <Text style={[Typography.h2, { color: Colors.onSurface, marginTop: 6 }]}>{value}</Text>
      <Text style={[Typography.codeSm, { color: Colors.outline, textTransform: 'uppercase' }]}>{label}</Text>
    </View>
  );
}

function relTime(ms: number): string {
  if (!ms) return 'just now';
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

const s = StyleSheet.create({
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroPills: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  stat: {
    flex: 1, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  statBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },

  quickRow: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingVertical: 4 },
  quickChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderRadius: Radius.chip, borderWidth: StyleSheet.hairlineWidth,
  },

  entryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  entryIcon: {
    width: 36, height: 36, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: 0 },
  gridItem: {
    flexBasis: '31%', flexGrow: 1, minWidth: 100,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    alignItems: 'center', borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth,
  },
});
