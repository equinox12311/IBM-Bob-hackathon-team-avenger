/**
 * Calendar — month grid coloured by activity. Local-only.
 *
 * Backend: GET /api/v1/calendar?month=YYYY-MM returns
 *   { month: "2026-05", days: [{ date, count, kinds: {...} }] }
 *
 * Tap a day → expands into a list of that day's entries below the grid.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card, EmptyState, Header, Pill, Screen } from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import {
  apiCalendar,
  apiListEntries,
  isApiConfigured,
  type ApiEntry,
  type CalendarDay,
} from '../src/services/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const KIND_COLOR: Record<string, string> = {
  decision: '#0f62fe', idea: '#0f62fe', fix: '#198038',
  debug: '#da1e28', code: '#8a3ffc', note: '#5d5f5f',
  task: '#f1c21b', wiki: '#8e4000', report: '#0f62fe',
};

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [dayEntries, setDayEntries] = useState<ApiEntry[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const load = useCallback(async () => {
    const ok = await isApiConfigured();
    setConfigured(ok);
    if (!ok) { setLoading(false); return; }
    setLoading(true);
    try {
      const m = `${year}-${String(month + 1).padStart(2, '0')}`;
      const r = await apiCalendar(m);
      setDays(r.days ?? []);
    } catch { setDays([]); }
    finally { setLoading(false); }
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const loadDay = useCallback(async (date: string) => {
    if (!configured) { setDayEntries([]); return; }
    setDayLoading(true);
    try {
      const all = await apiListEntries(200);
      const filtered = all.filter((e) => {
        const d = new Date(e.created_at).toISOString().slice(0, 10);
        return d === date;
      });
      setDayEntries(filtered);
    } catch { setDayEntries([]); }
    finally { setDayLoading(false); }
  }, [configured]);

  useFocusEffect(useCallback(() => { loadDay(selectedDate); }, [selectedDate, loadDay]));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const dayMap = new Map(days.map((d) => [d.date, d]));
  const counts = days.map((d) => d.count);
  const maxCount = counts.length ? Math.max(...counts, 1) : 1;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const totalEntries = days.reduce((sum, d) => sum + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  return (
    <>
      <Header title="Calendar" eyebrow={`${activeDays} days · ${totalEntries} entries`} back />
      <Screen padding={Spacing.md}>
        {!configured ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Connect cortex-api"
            body="Calendar is grouped by entry timestamps from your diary."
            tone="primary"
          />
        ) : (
          <>
            <Card variant="surface" padding="md" size="hero" style={{ marginBottom: Spacing.md }}>
              <View style={s.monthRow}>
                <TouchableOpacity onPress={prevMonth} style={[s.navBtn, { backgroundColor: Colors.surfaceContainer }]}>
                  <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={[Typography.h3, { color: Colors.onSurface, letterSpacing: -0.3 }]}>
                  {MONTHS[month]} {year}
                </Text>
                <TouchableOpacity onPress={nextMonth} style={[s.navBtn, { backgroundColor: Colors.surfaceContainer }]}>
                  <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={s.dayHeaderRow}>
                {DAYS.map((d) => (
                  <Text key={d} style={[Typography.codeSm, { color: Colors.outline, flex: 1, textAlign: 'center' }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {loading ? (
                <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : (
                <View style={s.grid}>
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <View key={`empty-${i}`} style={s.cell} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const date = ymd(year, month, d);
                    const dayData = dayMap.get(date);
                    const count = dayData?.count ?? 0;
                    const intensity = count / maxCount;
                    const isToday =
                      d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSelected = date === selectedDate;
                    return (
                      <TouchableOpacity
                        key={date}
                        activeOpacity={0.85}
                        onPress={() => setSelectedDate(date)}
                        style={[
                          s.cell,
                          {
                            backgroundColor:
                              count > 0
                                ? `rgba(0,76,202,${0.12 + intensity * 0.6})`
                                : Colors.surfaceContainer,
                            borderColor: isSelected
                              ? Colors.primary
                              : isToday
                              ? Colors.primaryFixed
                              : 'transparent',
                            borderWidth: isSelected || isToday ? 2 : 0,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontFamily: 'SpaceGrotesk-Medium',
                            fontSize: 14,
                            color: count > 0 ? '#fff' : Colors.onSurfaceVariant,
                            fontWeight: '600',
                          }}
                        >
                          {d}
                        </Text>
                        {count > 0 && (
                          <Text
                            style={{
                              fontFamily: 'SpaceGrotesk-Regular',
                              fontSize: 9,
                              color: '#fff',
                              opacity: 0.8,
                            }}
                          >
                            {count}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>

            <Text
              style={[
                Typography.labelSm,
                {
                  color: Colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: Spacing.sm,
                  marginLeft: Spacing.sm,
                },
              ]}
            >
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {dayLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : dayEntries.length === 0 ? (
              <Card variant="surface" padding="lg" size="hero">
                <Text style={[Typography.bodySm, { color: Colors.onSurfaceVariant, textAlign: 'center' }]}>
                  No entries on this day. Tap the + below to capture one.
                </Text>
              </Card>
            ) : (
              dayEntries.map((e) => (
                <Card
                  key={e.id}
                  variant="surface"
                  padding="md"
                  size="list"
                  onPress={() => router.push(`/entry/${e.id}` as any)}
                >
                  <View style={s.entryRow}>
                    <View
                      style={[
                        s.entryDot,
                        { backgroundColor: KIND_COLOR[e.kind] ?? Colors.outline },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={s.entryMeta}>
                        <Pill label={e.kind} tone="neutral" />
                        <Text style={[Typography.codeSm, { color: Colors.outline }]}>
                          {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[Typography.body, { color: Colors.onSurface, marginTop: 4 }]}
                      >
                        {e.text}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </Screen>
    </>
  );
}

const s = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  dayHeaderRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    marginVertical: 2,
  },

  entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  entryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8, flexShrink: 0 },
  entryMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
