/**
 * Capture — create entries with all kinds, AI auto-tag, saves to API + local DB.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors, Spacing, Typography } from '../src/constants/theme';
import { insertEntry } from '../src/services/database';
import { autoTag } from '../src/services/llm';
import { extractAndStoreFacts } from '../src/services/memory';
import { apiCreateEntry, isApiConfigured } from '../src/services/api';

const KINDS = [
  { id: 'note',     icon: 'document-text-outline', label: 'Note' },
  { id: 'idea',     icon: 'bulb-outline',           label: 'Idea' },
  { id: 'bug',      icon: 'bug-outline',            label: 'Bug' },
  { id: 'fix',      icon: 'hammer-outline',         label: 'Fix' },
  { id: 'decision', icon: 'git-branch-outline',     label: 'Decision' },
  { id: 'insight',  icon: 'flash-outline',          label: 'Insight' },
  { id: 'snippet',  icon: 'code-slash-outline',     label: 'Snippet' },
  { id: 'task',     icon: 'checkbox-outline',       label: 'Task' },
] as const;

type Kind = typeof KINDS[number]['id'];

const KIND_COLOR: Record<Kind, string> = {
  note: '#5d5f5f', idea: '#0f62fe', bug: '#da1e28',
  fix: '#198038', decision: '#8a3ffc', insight: '#0f62fe',
  snippet: '#8a3ffc', task: '#f1c21b',
};

export default function CaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; prefill?: string }>();
  const [text, setText] = useState(params.prefill ?? '');
  const [kind, setKind] = useState<Kind>((params.kind as Kind) ?? 'note');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);
  const textRef = useRef<TextInput>(null);

  useEffect(() => {
    isApiConfigured().then(setApiEnabled);
  }, []);

  const handleAutoTag = async () => {
    if (!text.trim()) return;
    setAutoTagging(true);
    try {
      const suggested = await autoTag(text);
      if (suggested.length > 0) {
        const existing = tags.split(',').map(t => t.trim()).filter(Boolean);
        const merged = Array.from(new Set([...existing, ...suggested]));
        setTags(merged.join(', '));
      }
    } catch {}
    setAutoTagging(false);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Empty entry', 'Please write something first.');
      return;
    }
    setSaving(true);
    try {
      const parsedTags = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      const entryData = {
        text: text.trim(),
        kind,
        source: 'mobile' as const,
        tags: parsedTags,
        file: file.trim() || undefined,
      };

      // Save to API if configured, otherwise local only
      if (apiEnabled) {
        try {
          await apiCreateEntry(entryData);
        } catch {
          // Fall back to local if API fails
          await insertEntry(entryData);
        }
      } else {
        await insertEntry(entryData);
      }

      // Background: extract facts for memory layer
      extractAndStoreFacts(text.trim()).catch(() => {});

      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Capture</Text>
          <View style={S.headerRight}>
            {apiEnabled && (
              <View style={S.syncBadge}>
                <Ionicons name="cloud-outline" size={12} color={Colors.llmOnline} />
                <Text style={S.syncText}>Sync</Text>
              </View>
            )}
            <TouchableOpacity
              style={[S.saveBtn, (!text.trim() || saving) && S.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || !text.trim()}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={S.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Kind selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.kindScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
            {KINDS.map(k => (
              <TouchableOpacity
                key={k.id}
                style={[S.kindChip, kind === k.id && { backgroundColor: KIND_COLOR[k.id], borderColor: KIND_COLOR[k.id] }]}
                onPress={() => setKind(k.id)}
              >
                <Ionicons name={k.icon as any} size={13} color={kind === k.id ? '#fff' : Colors.onSurfaceVariant} />
                <Text style={[S.kindChipText, kind === k.id && { color: '#fff' }]}>{k.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Main text */}
          <View style={S.textBox}>
            <TextInput
              ref={textRef}
              style={S.textInput}
              placeholder={`What's on your mind? Capture a ${kind}…`}
              placeholderTextColor={Colors.outline}
              multiline
              autoFocus
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
          </View>

          {/* Tags row */}
          <View style={S.fieldRow}>
            <Ionicons name="pricetag-outline" size={16} color={Colors.onSurfaceVariant} style={{ marginLeft: 8 }} />
            <TextInput
              style={S.fieldInput}
              placeholder="tags, comma-separated"
              placeholderTextColor={Colors.outline}
              value={tags}
              onChangeText={setTags}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[S.aiTagBtn, (autoTagging || !text.trim()) && { opacity: 0.4 }]}
              onPress={handleAutoTag}
              disabled={autoTagging || !text.trim()}
            >
              {autoTagging
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <><Ionicons name="sparkles-outline" size={13} color={Colors.primary} /><Text style={S.aiTagText}>AI Tag</Text></>
              }
            </TouchableOpacity>
          </View>

          {/* Advanced toggle */}
          <TouchableOpacity style={S.advToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
            <Text style={S.advToggleText}>{showAdvanced ? 'Hide' : 'Show'} advanced fields</Text>
            <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={S.fieldRow}>
              <Ionicons name="document-outline" size={16} color={Colors.onSurfaceVariant} style={{ marginLeft: 8 }} />
              <TextInput
                style={S.fieldInput}
                placeholder="file path (e.g. src/auth/login.ts)"
                placeholderTextColor={Colors.outline}
                value={file}
                onChangeText={setFile}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Tips */}
          <View style={S.tips}>
            <Text style={S.tipsTitle}>Tips</Text>
            <Text style={S.tipText}>• Tap "AI Tag" to auto-generate tags with Granite 3.3</Text>
            <Text style={S.tipText}>• Use "Fix" for resolved bugs, "Decision" for architecture choices</Text>
            <Text style={S.tipText}>• {apiEnabled ? '☁️ Syncing to cortex-api' : '📱 Saving locally (configure API in Profile)'}</Text>
          </View>

          <View style={{ height: TAB_BAR_HEIGHT + 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#defbe6', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
  syncText: { fontSize: 10, fontWeight: '700', color: Colors.llmOnline },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  kindScroll: { maxHeight: 44, marginVertical: 10 },
  kindChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest, marginRight: 6 },
  kindChipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  textBox: { marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, minHeight: 180 },
  textInput: { fontSize: 16, color: Colors.onSurface, padding: 14, minHeight: 180, lineHeight: 24 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, paddingVertical: 4 },
  fieldInput: { flex: 1, fontSize: 14, color: Colors.onSurface, paddingVertical: 8, paddingHorizontal: 8 },
  aiTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, marginRight: 6, minWidth: 72, justifyContent: 'center' },
  aiTagText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  advToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
  advToggleText: { fontSize: 12, color: Colors.onSurfaceVariant },
  tips: { marginHorizontal: 16, padding: 14, backgroundColor: Colors.surfaceContainerLow, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant },
  tipsTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  tipText: { fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 4, lineHeight: 18 },
});
