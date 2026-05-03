/**
 * Security — real audit log + summary from cortex-api.
 *
 * Pulls /api/v1/security/audit and /api/v1/security/summary. Each
 * skill.create / skill.update / skill.delete writes a row, so the
 * dashboard reflects real activity. Falls back to a clear notice when
 * the API isn't connected so the screen still demos.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { Radius, Shadow, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import {
  apiAuditLog,
  apiAuditSummary,
  isApiConfigured,
  type AuditEvent,
} from '../src/services/api';

const WINDOWS = [
  { hours: 1, label: '1h' },
  { hours: 24, label: '24h' },
  { hours: 168, label: '7d' },
];

function relTime(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

type Palette = ReturnType<typeof useThemeMode>['Colors'];

function actionTint(action: string, Colors: Palette): { bg: string; fg: string } {
  if (action.endsWith('.create')) return { bg: Colors.primaryFixed, fg: Colors.primary };
  if (action.endsWith('.update')) return { bg: Colors.tertiaryFixed, fg: Colors.tertiary };
  if (action.endsWith('.delete')) return { bg: Colors.errorContainer, fg: Colors.error };
  if (action.endsWith('.read'))   return { bg: Colors.secondaryFixed, fg: Colors.secondary };
  return { bg: Colors.surfaceContainer, fg: Colors.onSurfaceVariant };
}

export default function SecurityScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();
  const S = makeStyles(Colors);
  const [windowHours, setWindowHours] = useState(24);
  const [summary, setSummary] = useState<{ total: number; by_action: Record<string, number> } | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isApiConfigured().then(setConfigured);
  }, []);

  async function load() {
    if (!configured) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const since = Date.now() - windowHours * 3600 * 1000;
      const [s, e] = await Promise.all([
        apiAuditSummary(windowHours),
        apiAuditLog(since, 200),
      ]);
      setSummary({ total: s.total, by_action: s.by_action });
      setEvents(e.events ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [configured, windowHours]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const topActions: [string, number][] = summary
    ? (Object.entries(summary.by_action) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];
  const maxCount = topActions.length
    ? Math.max(...topActions.map(([, n]) => n), 1)
    : 1;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Security</Text>
        <View style={S.windowToggle}>
          {WINDOWS.map((w) => (
            <TouchableOpacity
              key={w.hours}
              style={[S.windowBtn, windowHours === w.hours && S.windowBtnActive]}
              onPress={() => setWindowHours(w.hours)}
            >
              <Text
                style={[
                  S.windowText,
                  windowHours === w.hours && { color: Colors.onPrimary },
                ]}
              >
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={S.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        {!configured && (
          <View style={S.notice}>
            <Ionicons name="cloud-offline" size={20} color={Colors.outline} />
            <Text style={S.noticeText}>Connect cortex-api in Profile to view real audit data.</Text>
          </View>
        )}
        {error && (
          <View style={[S.notice, { borderColor: Colors.error }]}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={[S.noticeText, { color: Colors.error }]}>{error}</Text>
          </View>
        )}
        {loading && configured && (
          <View style={S.notice}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={S.noticeText}>Loading audit log…</Text>
          </View>
        )}

        {summary && (
          <View style={[S.card, Shadow.cardPrimary]}>
            <Text style={S.cardLabel}>EVENTS · LAST {windowHours}h</Text>
            <Text style={S.cardValue}>{summary.total}</Text>
            <View style={S.bars}>
              {topActions.map(([action, count]) => {
                const tint = actionTint(action, Colors);
                return (
                  <View key={action} style={S.barRow}>
                    <View style={[S.barPill, { backgroundColor: tint.bg }]}>
                      <Text style={[S.barAction, { color: tint.fg }]}>{action}</Text>
                    </View>
                    <View style={S.barTrack}>
                      <View
                        style={[
                          S.barFill,
                          { width: `${(count / maxCount) * 100}%` as any, backgroundColor: tint.fg },
                        ]}
                      />
                    </View>
                    <Text style={S.barCount}>{count}</Text>
                  </View>
                );
              })}
              {topActions.length === 0 && configured && (
                <Text style={S.empty}>No audited activity in this window.</Text>
              )}
            </View>
          </View>
        )}

        {events.length > 0 && (
          <View style={S.card}>
            <Text style={S.cardLabel}>RECENT EVENTS</Text>
            {events.map((e) => {
              const tint = actionTint(e.action, Colors);
              return (
                <View key={e.id} style={S.eventRow}>
                  <View style={[S.eventDot, { backgroundColor: tint.fg }]} />
                  <View style={{ flex: 1 }}>
                    <View style={S.eventTopLine}>
                      <Text style={S.eventAction}>{e.action}</Text>
                      {e.target ? (
                        <Text style={S.eventTarget} numberOfLines={1}>{e.target}</Text>
                      ) : null}
                    </View>
                    <Text style={S.eventMeta}>
                      {e.actor} · {relTime(e.ts)}
                      {e.note ? ` · ${e.note}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  headerTitle: { ...Typography.heading, color: Colors.onSurface },

  windowToggle: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: Colors.surfaceContainer,
    padding: 2,
    borderRadius: Radius.chip,
  },
  windowBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.chip,
  },
  windowBtnActive: { backgroundColor: Colors.primary },
  windowText: { ...Typography.labelSm, color: Colors.onSurfaceVariant },

  content: {
    padding: Spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + Spacing.xl,
    gap: Spacing.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  noticeText: { ...Typography.bodySm, color: Colors.onSurfaceVariant, flex: 1 },

  card: {
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.card,
  },
  cardLabel: {
    ...Typography.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '300',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },

  bars: { gap: Spacing.sm, marginTop: Spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.chip,
    minWidth: 110,
    alignItems: 'center',
  },
  barAction: { ...Typography.codeSm, fontWeight: '600' },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4 },
  barCount: {
    ...Typography.code,
    color: Colors.onSurface,
    minWidth: 28,
    textAlign: 'right',
  },
  empty: { ...Typography.bodySm, color: Colors.onSurfaceVariant },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  eventTopLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventAction: { ...Typography.label, color: Colors.onSurface },
  eventTarget: { ...Typography.code, color: Colors.outline, flex: 1 },
  eventMeta: { ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
});
