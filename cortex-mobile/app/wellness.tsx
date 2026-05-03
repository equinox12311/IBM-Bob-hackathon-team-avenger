/**
 * Touch Grass — wellness break tracker.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { getWellnessStats, logBreak } from '../src/services/database';
import { apiGetWellness, apiLogBreak, getToken } from '../src/services/api';
import { getDemoWellness } from '../src/services/demoData';

const RESETS = [
  { icon: 'body-outline', label: '5-minute stretch' },
  { icon: 'walk-outline', label: 'Walk around the block' },
  { icon: 'water-outline', label: 'Hydrate' },
  { icon: 'cloud-outline', label: 'Deep breathing' },
  { icon: 'eye-off-outline', label: 'Look away from screen' },
];

export default function WellnessScreen() {
  const { Colors } = useThemeMode();
  const S = makeStyles(Colors);
  const [data, setData] = useState<{ break_due?: boolean; minutes_since_break?: number; breaks_today: number; last_break_at: number | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const tok = await getToken();
      if (tok) {
        const w = await apiGetWellness();
        setData({ break_due: w.break_due, minutes_since_break: w.minutes_since_break, breaks_today: w.breaks_today, last_break_at: w.last_break_at });
      } else {
        const w = await getWellnessStats();
        if (w.breaks_today > 0 || w.last_break_at) {
          const mins = w.last_break_at ? Math.floor((Date.now() - w.last_break_at) / 60000) : 0;
          setData({ break_due: mins > 90, minutes_since_break: mins, breaks_today: w.breaks_today, last_break_at: w.last_break_at });
        } else {
          setData(getDemoWellness());
        }
      }
    } catch {
      const w = await getWellnessStats();
      const mins = w.last_break_at ? Math.floor((Date.now() - w.last_break_at) / 60000) : 0;
      setData(w.breaks_today > 0 ? { break_due: mins > 90, minutes_since_break: mins, breaks_today: w.breaks_today, last_break_at: w.last_break_at } : getDemoWellness());
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]));

  const handleBreak = async () => {
    setBusy(true);
    try {
      const tok = await getToken();
      if (tok) await apiLogBreak(); else await logBreak();
      await load();
      Alert.alert('Break logged! 🌿', 'Great job taking care of yourself.');
    } catch {}
    setBusy(false);
  };

  const mins = data?.minutes_since_break ?? 0;
  const breakDue = data?.break_due ?? mins > 90;
  const pct = Math.min((data?.breaks_today ?? 0) / 5, 1) * 100;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>🌿 Touch Grass</Text>
        <Text style={S.headerSub}>Step away when focus stretches too long</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 16 }}>
        {/* Hero button */}
        <View style={S.heroSection}>
          <TouchableOpacity
            style={[S.heroBtn, breakDue && S.heroBtnDue]}
            onPress={handleBreak}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? <ActivityIndicator size="large" color="#fff" /> : (
              <>
                <Ionicons name="leaf" size={40} color="#fff" style={{ marginBottom: 8 }} />
                <Text style={S.heroBtnText}>I took a break</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={S.heroStats}>
            <Text style={[S.heroMins, breakDue && { color: Colors.error }]}>
              {mins}m
            </Text>
            <Text style={S.heroMinsLabel}>since last break</Text>
            <Text style={[S.heroStatus, breakDue && { color: Colors.error }]}>
              {breakDue ? '⚠️ Overdue — take a break!' : '✅ You\'re in good shape'}
            </Text>
          </View>
        </View>

        {/* Daily balance */}
        <View style={S.card}>
          <View style={S.cardHeaderRow}>
            <Text style={S.cardTitle}>Daily Balance</Text>
            <Text style={S.cardBadge}>{data?.breaks_today ?? 0} / 5 breaks</Text>
          </View>
          <View style={S.progressTrack}>
            <View style={[S.progressFill, { width: `${pct}%` as any }]} />
          </View>
          {data?.last_break_at && (
            <Text style={S.lastBreak}>
              Last break: {new Date(data.last_break_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Quick resets */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Quick Resets</Text>
          {RESETS.map((r, i) => (
            <TouchableOpacity key={r.label} style={[S.resetRow, i < RESETS.length - 1 && S.resetRowBorder]} activeOpacity={0.7}>
              <Ionicons name={r.icon as any} size={20} color={Colors.onSurfaceVariant} />
              <Text style={S.resetLabel}>{r.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.outlineVariant} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ReturnType<typeof useThemeMode>['Colors']) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
  heroSection: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  heroBtn: { width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  heroBtnDue: { backgroundColor: Colors.error },
  heroBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center' },
  heroStats: { flex: 1 },
  heroMins: { fontSize: 48, fontWeight: '300', color: Colors.primary, lineHeight: 52 },
  heroMinsLabel: { fontSize: 12, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroStatus: { fontSize: 13, color: Colors.success, marginTop: 8, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#191b24', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBadge: { fontSize: 12, fontWeight: '600', color: Colors.primary, backgroundColor: '#dbe1ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  progressTrack: { height: 8, backgroundColor: Colors.outlineVariant, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 4 },
  lastBreak: { fontSize: 12, color: Colors.onSurfaceVariant },
  resetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  resetRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  resetLabel: { flex: 1, fontSize: 14, color: '#191b24' },
});
