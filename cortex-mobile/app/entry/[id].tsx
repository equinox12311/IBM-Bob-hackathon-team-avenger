/**
 * Entry Detail Screen — view, edit, and AI-summarise a single entry.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { Colors, Spacing, Typography } from '../../src/constants/theme';
import { deleteEntry, listEntries, type Entry } from '../../src/services/database';
import { summariseEntry } from '../../src/services/llm';
import { apiGetEntry, apiFeedback, getToken } from '../../src/services/api';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarising, setSummarising] = useState(false);
  const [voting, setVoting] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      try {
        const tok = await getToken();
        if (tok) {
          const remote = await apiGetEntry(Number(id));
          setEntry(remote as any);
          setScore((remote as any).score ?? 0);
          return;
        }
      } catch {}
      const entries = await listEntries(1000);
      const found = entries.find(e => e.id === Number(id));
      setEntry(found ?? null);
      setScore(found?.score ?? 0);
    };
    loadEntry();
  }, [id]);

  const handleVote = async (signal: 'boost' | 'flag') => {
    if (!entry || voting) return;
    setVoting(true);
    try {
      const tok = await getToken();
      if (tok) {
        const res = await apiFeedback(entry.id, signal);
        setScore((res as any).score ?? score);
        Alert.alert(signal === 'boost' ? '👍 Boosted!' : '👎 Flagged', signal === 'boost' ? 'Entry ranked higher in future recalls.' : 'Entry ranked lower in future recalls.');
      } else {
        Alert.alert('Connect API', 'Connect cortex-api in Profile to use feedback.');
      }
    } catch (e: any) { Alert.alert('Error', e?.message); }
    setVoting(false);
  };

  const handleSummarise = async () => {
    if (!entry) return;
    setSummarising(true);
    const s = await summariseEntry(entry.text);
    setSummary(s || 'Could not generate summary (AI offline).');
    setSummarising(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete entry', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (entry) await deleteEntry(entry.id);
          router.back();
        },
      },
    ]);
  };

  const kindColor = (kind: string) => {
    switch (kind) {
      case 'idea': return '#0f62fe';
      case 'bug': return '#da1e28';
      case 'insight': return '#198038';
      default: return Colors.secondary;
    }
  };

  if (!entry) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Kind + Date */}
        <View style={styles.metaRow}>
          <View style={[styles.kindBadge, { backgroundColor: kindColor(entry.kind) + '20' }]}>
            <Text style={[styles.kindText, { color: kindColor(entry.kind) }]}>{entry.kind}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(entry.created_at).toLocaleString()}
          </Text>
        </View>

        {/* Main Text */}
        <View style={styles.textCard}>
          <Text style={styles.entryText}>{entry.text}</Text>
        </View>

        {/* AI Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
            <Text style={styles.summaryTitle}>AI Summary</Text>
          </View>
          {summary ? (
            <Text style={styles.summaryText}>{summary}</Text>
          ) : (
            <TouchableOpacity
              style={[styles.summariseBtn, summarising && styles.summariseBtnLoading]}
              onPress={handleSummarise}
              disabled={summarising}
            >
              {summarising ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.summariseBtnText}>Generate summary with Granite 3.3</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Feedback */}
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            style={[styles.feedbackBtn, styles.feedbackBoost]}
            onPress={() => handleVote('boost')}
            disabled={voting}
          >
            {voting ? <ActivityIndicator size="small" color="#fff" /> : (
              <><Text style={styles.feedbackIcon}>👍</Text><Text style={styles.feedbackText}>Boost</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackBtn, styles.feedbackFlag]}
            onPress={() => handleVote('flag')}
            disabled={voting}
          >
            <Text style={styles.feedbackIcon}>👎</Text>
            <Text style={[styles.feedbackText, { color: Colors.error }]}>Flag</Text>
          </TouchableOpacity>
          {score !== null && (
            <View style={styles.scoreChip}>
              <Text style={styles.scoreText}>score {score.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {entry.tags.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* File reference */}
        {entry.file && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>File</Text>
            <View style={styles.fileCard}>
              <Ionicons name="document-outline" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.fileText}>{entry.file}</Text>
              {entry.line_start && (
                <Text style={styles.lineText}>:{entry.line_start}</Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.heading, color: Colors.onSurface },
  deleteBtn: { padding: 4 },
  scroll: { flex: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  kindBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kindText: { ...Typography.label, fontWeight: '600', textTransform: 'capitalize' },
  dateText: { ...Typography.label, color: Colors.outline },
  textCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  entryText: { ...Typography.bodyLg, color: Colors.onSurface, lineHeight: 26 },
  summarySection: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  summaryTitle: { ...Typography.label, color: Colors.primary, fontWeight: '600', textTransform: 'uppercase' },
  summaryText: { ...Typography.body, color: Colors.onSurface, lineHeight: 22 },
  summariseBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  summariseBtnLoading: { opacity: 0.6 },
  summariseBtnText: { ...Typography.label, color: Colors.primary, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: { ...Typography.label, color: Colors.outline, textTransform: 'uppercase', marginBottom: Spacing.sm },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { ...Typography.code, color: Colors.onSurface },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  fileText: { ...Typography.code, color: Colors.onSurface, flex: 1 },
  lineText: { ...Typography.code, color: Colors.primary },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  feedbackBoost: { backgroundColor: '#defbe6', borderColor: '#a7f3d0' },
  feedbackFlag: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  feedbackIcon: { fontSize: 16 },
  feedbackText: { fontSize: 13, fontWeight: '700', color: Colors.success },
  scoreChip: { marginLeft: 'auto', backgroundColor: Colors.surfaceContainerLow, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.outlineVariant },
  scoreText: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
});
