/**
 * Scheduler — cron-style automations, wired to the real cortex-api.
 *
 * Backend supports three trigger kinds:
 *   notify   audit-log only (passive ping)
 *   recall   queues a recall on pending_actions for IBM Bob
 *   report   runs daily_narrative + queues the result for Bob
 *
 * Schedule is a 5-field cron expression. The backend validates at create-time.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Header,
  IconButton,
  Pill,
  Screen,
  Section,
  StatusBanner,
} from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import {
  apiCreateAutomation,
  apiDeleteAutomation,
  apiListAutomations,
  apiRunAutomationNow,
  apiTickScheduler,
  apiToggleAutomation,
  isApiConfigured,
  type Automation,
} from '../src/services/api';

const TRIGGER_KINDS = [
  { id: 'notify', label: 'Notify',  icon: 'notifications' as const, body: 'Audit-log a ping at the schedule.' },
  { id: 'recall', label: 'Recall',  icon: 'sparkles' as const,      body: 'Ask Bob to recall something on the schedule.' },
  { id: 'report', label: 'Report',  icon: 'document-text' as const, body: 'Generate a daily narrative for Bob.' },
] as const;

const SCHEDULE_PRESETS = [
  { label: 'Every 5 min', cron: '*/5 * * * *' },
  { label: 'Hourly',      cron: '0 * * * *'   },
  { label: '9am daily',   cron: '0 9 * * *'   },
  { label: '5pm daily',   cron: '0 17 * * *'  },
  { label: 'Mon 9am',     cron: '0 9 * * 1'   },
];

export default function SchedulerScreen() {
  const { Colors } = useThemeMode();

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [action, setAction] = useState('');
  const [schedule, setSchedule] = useState('0 9 * * *');
  const [triggerKind, setTriggerKind] = useState<typeof TRIGGER_KINDS[number]['id']>('recall');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const ok = await isApiConfigured();
    setConfigured(ok);
    if (!ok) { setLoading(false); return; }
    setError(null);
    try {
      setAutomations(await apiListAutomations());
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    if (!name.trim() || !action.trim() || !schedule.trim()) {
      Alert.alert('Missing fields', 'Name, action, and schedule are required.');
      return;
    }
    setSaving(true);
    try {
      await apiCreateAutomation({
        name: name.trim(),
        trigger_kind: triggerKind,
        action: action.trim(),
        schedule: schedule.trim(),
      });
      setShowCreate(false);
      setName(''); setAction('');
      load();
    } catch (e: any) {
      Alert.alert('Could not create', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: number, enabled: boolean) {
    try { await apiToggleAutomation(id, enabled); load(); }
    catch (e: any) { Alert.alert('Toggle failed', String(e?.message ?? e)); }
  }

  async function runNow(id: number) {
    try {
      const r = await apiRunAutomationNow(id);
      Alert.alert('Fired', `Status: ${r.status}${r.reason ? '\n' + r.reason : ''}`);
      load();
    } catch (e: any) {
      Alert.alert('Run failed', String(e?.message ?? e));
    }
  }

  async function remove(id: number) {
    Alert.alert('Delete automation?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await apiDeleteAutomation(id); load(); }
          catch (e: any) { Alert.alert('Delete failed', String(e?.message ?? e)); }
        },
      },
    ]);
  }

  async function tickAll() {
    try {
      const r = await apiTickScheduler();
      Alert.alert('Scheduler tick', `${r.count} job(s) fired.`);
      load();
    } catch (e: any) {
      Alert.alert('Tick failed', String(e?.message ?? e));
    }
  }

  return (
    <>
      <Header
        title="Scheduler"
        eyebrow="07 · automate"
        back
        right={
          <IconButton icon="add" variant="primary" size="md" onPress={() => setShowCreate(true)} accessibilityLabel="New automation" />
        }
      />

      <Screen padding={Spacing.md}>
        {!configured ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Connect cortex-api"
            body="Scheduler reads and writes through the API. Configure your connection in Settings."
            ctaLabel="Open Settings"
            onCta={() => {/* router push handled elsewhere */}}
            tone="primary"
          />
        ) : error ? (
          <StatusBanner tone="error" title="Couldn't load automations" body={error} ctaLabel="Retry" onCta={load} />
        ) : loading ? (
          <EmptyState icon="time-outline" title="Loading…" tone="neutral" />
        ) : automations.length === 0 ? (
          <EmptyState
            icon="flash-outline"
            title="Set work on a schedule."
            body="Define a cron expression, pick a trigger, and Cortex (or Bob) handles the rest."
            ctaLabel="New automation"
            onCta={() => setShowCreate(true)}
            tone="primary"
          />
        ) : (
          <>
            <Card variant="primary" size="hero" padding="lg" style={{ marginBottom: Spacing.md }}>
              <Text style={[Typography.codeSm, { color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase' }]}>
                automate.
              </Text>
              <Text style={[Typography.h3, { color: Colors.onPrimaryFixed, marginTop: 4 }]}>
                {automations.length} automation{automations.length === 1 ? '' : 's'}
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                <Button label="Run all due now" icon="flash" size="sm" variant="primary" onPress={tickAll} />
              </View>
            </Card>

            <Section title="Automations">
              {automations.map((a) => (
                <Card key={a.id} variant="surface" size="list" padding="md">
                  <View style={s.row}>
                    <View style={[s.iconWrap, { backgroundColor: a.enabled ? Colors.primaryFixed : Colors.surfaceContainer }]}>
                      <Ionicons
                        name={triggerIcon(a.trigger_kind)}
                        size={18}
                        color={a.enabled ? Colors.primary : Colors.outline}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.label, { color: Colors.onSurface }]} numberOfLines={1}>
                        {a.name}
                      </Text>
                      <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                        {a.schedule || 'event-driven'} · {a.trigger_kind}
                      </Text>
                      <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant, marginTop: 4 }]} numberOfLines={2}>
                        {a.action}
                      </Text>
                      <View style={s.metaRow}>
                        {a.run_count != null && (
                          <Pill label={`${a.run_count} runs`} tone="neutral" />
                        )}
                        {a.last_run_at ? (
                          <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                            last {relTime(a.last_run_at)}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Switch
                      value={a.enabled}
                      onValueChange={(v) => toggle(a.id, v)}
                      trackColor={{ true: Colors.primary, false: Colors.outlineVariant }}
                      thumbColor={Colors.onPrimary}
                    />
                  </View>
                  <View style={s.cardActions}>
                    <Button label="Run now" icon="play" size="sm" variant="secondary" onPress={() => runNow(a.id)} />
                    <Button label="Delete" icon="trash" size="sm" variant="danger" onPress={() => remove(a.id)} />
                  </View>
                </Card>
              ))}
            </Section>
          </>
        )}
      </Screen>

      {/* Create modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <Header
          title="New automation"
          right={
            <IconButton icon="close" size="sm" onPress={() => setShowCreate(false)} />
          }
        />
        <Screen padding={Spacing.md} scroll={true}>
          <Section title="Trigger">
            <View style={s.kindGrid}>
              {TRIGGER_KINDS.map((k) => {
                const active = k.id === triggerKind;
                return (
                  <TouchableOpacity
                    key={k.id}
                    activeOpacity={0.85}
                    onPress={() => setTriggerKind(k.id)}
                    style={[
                      s.kindCard,
                      {
                        backgroundColor: active ? Colors.primaryFixed : Colors.surfaceContainerLowest,
                        borderColor: active ? Colors.primary : Colors.outlineVariant,
                      },
                    ]}
                  >
                    <Ionicons name={k.icon} size={20} color={active ? Colors.primary : Colors.outline} />
                    <Text style={[Typography.label, { color: active ? Colors.primary : Colors.onSurface }]}>
                      {k.label}
                    </Text>
                    <Text style={[Typography.codeSm, { color: Colors.outline, textAlign: 'center' }]}>
                      {k.body}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Section>

          <Section title="Details">
            <Card variant="surface" padding="md">
              <Text style={[Typography.labelSm, { color: Colors.onSurfaceVariant, textTransform: 'uppercase' }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Morning recall"
                placeholderTextColor={Colors.outline}
                style={[s.input, { backgroundColor: Colors.surfaceContainer, color: Colors.onSurface }]}
              />
              <View style={{ height: Spacing.md }} />
              <Text style={[Typography.labelSm, { color: Colors.onSurfaceVariant, textTransform: 'uppercase' }]}>
                Action
              </Text>
              <TextInput
                value={action}
                onChangeText={setAction}
                placeholder={
                  triggerKind === 'recall'
                    ? 'what did I work on yesterday'
                    : triggerKind === 'report'
                    ? 'daily summary'
                    : 'ping me'
                }
                placeholderTextColor={Colors.outline}
                multiline
                style={[s.input, { backgroundColor: Colors.surfaceContainer, color: Colors.onSurface, minHeight: 60 }]}
              />
            </Card>
          </Section>

          <Section title="Schedule (cron)">
            <Card variant="surface" padding="md">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs, marginBottom: Spacing.sm }}>
                {SCHEDULE_PRESETS.map((p) => {
                  const active = p.cron === schedule;
                  return (
                    <TouchableOpacity
                      key={p.cron}
                      onPress={() => setSchedule(p.cron)}
                      style={[
                        s.preset,
                        {
                          backgroundColor: active ? Colors.primary : Colors.surfaceContainerLowest,
                          borderColor: active ? Colors.primary : Colors.outlineVariant,
                        },
                      ]}
                    >
                      <Text style={[Typography.codeSm, { color: active ? Colors.onPrimary : Colors.onSurfaceVariant }]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TextInput
                value={schedule}
                onChangeText={setSchedule}
                placeholder="0 9 * * *"
                placeholderTextColor={Colors.outline}
                autoCapitalize="none"
                autoCorrect={false}
                style={[s.input, { backgroundColor: Colors.surfaceContainer, color: Colors.onSurface, fontFamily: 'SpaceGrotesk-Regular' }]}
              />
              <Text style={[Typography.codeSm, { color: Colors.outline, marginTop: 4 }]}>
                minute · hour · day-of-month · month · day-of-week
              </Text>
            </Card>
          </Section>

          <Button
            label={saving ? 'Saving…' : 'Create automation'}
            icon="checkmark"
            onPress={create}
            loading={saving}
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </Screen>
      </Modal>
    </>
  );
}

// helpers --------------------------------------------------------------------

function triggerIcon(k: string): keyof typeof Ionicons.glyphMap {
  if (k === 'notify') return 'notifications';
  if (k === 'recall') return 'sparkles';
  if (k === 'report') return 'document-text';
  return 'flash';
}

function relTime(ms: number): string {
  if (!ms) return 'never';
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },

  kindGrid: { flexDirection: 'row', gap: Spacing.sm },
  kindCard: {
    flex: 1, padding: Spacing.md, gap: Spacing.xs,
    borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },

  input: {
    padding: Spacing.md,
    borderRadius: Radius.input,
    marginTop: 6,
    ...Typography.body,
  },
  preset: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
