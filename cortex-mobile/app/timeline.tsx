/**
 * Timeline — chronological list of all entries with kind filter.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, Header, Pill } from '../src/components/ui';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { apiListEntries, getToken } from '../src/services/api';
import { listEntries, type Entry } from '../src/services/database';
import { getDemoEntries } from '../src/services/demoData';

const KINDS = ['all', 'note', 'idea', 'bug', 'fix', 'decision', 'insight', 'snippet'] as const;

const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  idea: 'bulb', bug: 'bug', fix: 'hammer', insight: 'flash',
  snippet: 'code-slash', note: 'document-text', decision: 'git-branch',
  task: 'checkbox',
};

export default function TimelineScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const tok = await getToken();
      if (tok) {
        setEntries((await apiListEntries(100)) as any);
      } else {
        const local = await listEntries(100);
        setEntries(local.length > 0 ? local : (getDemoEntries(50) as any));
      }
    } catch {
      const local = await listEntries(100);
      setEntries(local.length > 0 ? local : (getDemoEntries(50) as any));
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  };

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.kind === filter);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: Colors.background }]} edges={['top']}>
      <Header
        title="Timeline"
        eyebrow={`${filtered.length} entries`}
        back
      />

      {/* Kind filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
      >
        {KINDS.map((k) => {
          const active = filter === k;
          return (
            <TouchableOpacity
              key={k}
              activeOpacity={0.85}
              onPress={() => setFilter(k)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? Colors.primary : Colors.surfaceContainerLowest,
                  borderColor: active ? Colors.primary : Colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  Typography.labelSm,
                  { color: active ? Colors.onPrimary : Colors.onSurfaceVariant, textTransform: 'capitalize' },
                ]}
              >
                {k}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ padding: Spacing.md }}>
          <EmptyState
            icon="time-outline"
            title="No entries match"
            body={filter === 'all' ? 'Capture your first thought to see it here.' : `Try a different filter or capture a "${filter}".`}
            ctaLabel="Capture"
            onCta={() => router.push('/capture')}
            tone="primary"
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => String(e.id)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + Spacing.lg, gap: Spacing.sm }}
          renderItem={({ item: e }) => (
            <Card
              variant="surface"
              size="list"
              padding="md"
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: e.id } } as any)}
            >
              <View style={s.row}>
                <View style={[s.icon, { backgroundColor: Colors.primaryFixed }]}>
                  <Ionicons
                    name={KIND_ICON[e.kind] ?? 'document-text'}
                    size={16}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.metaTop}>
                    <Pill label={e.kind} tone="neutral" />
                    <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                      {relTime(e.created_at)}
                    </Text>
                  </View>
                  <Text numberOfLines={3} style={[Typography.body, { color: Colors.onSurface, marginTop: 4 }]}>
                    {e.text}
                  </Text>
                  {e.file ? (
                    <Text style={[Typography.codeSm, { color: Colors.outline, marginTop: 4 }]}>
                      {e.file}
                      {e.line_start ? `:${e.line_start}` : ''}
                    </Text>
                  ) : null}
                  {e.tags?.length ? (
                    <View style={s.tags}>
                      {e.tags.slice(0, 5).map((t) => (
                        <Text key={t} style={[Typography.codeSm, { color: Colors.primary }]}>
                          #{t}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
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
  safe: { flex: 1 },
  chipRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loading: { paddingTop: Spacing.xxl, alignItems: 'center' },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  metaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 6 },
});
