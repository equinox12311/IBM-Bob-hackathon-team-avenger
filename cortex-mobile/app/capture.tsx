/**
 * Capture Screen — quick entry creation with AI auto-tagging.
 * Memory-efficient: auto-tag runs async after save, doesn't block UI.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { Colors, Spacing, Typography } from '../src/constants/theme';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { insertEntry } from '../src/services/database';
import { autoTag } from '../src/services/llm';
import { extractAndStoreFacts } from '../src/services/memory';

const KINDS = ['note', 'idea', 'bug', 'insight', 'snippet'] as const;
type Kind = typeof KINDS[number];

const KIND_ICONS: Record<Kind, string> = {
  note: 'document-text-outline',
  idea: 'bulb-outline',
  bug: 'bug-outline',
  insight: 'flash-outline',
  snippet: 'code-slash-outline',
};

export default function CaptureScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<Kind>('note');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textRef = useRef<TextInput>(null);

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
      await insertEntry({
        text: text.trim(),
        kind,
        source: 'mobile',
        tags: parsedTags,
        file: file.trim() || undefined,
      });

      // Background: extract facts for memory layer (non-blocking)
      extractAndStoreFacts(text.trim()).catch(() => {});

      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Capture</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || !text.trim()}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.surfaceContainerLowest} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Kind Selector */}
          <View style={styles.kindRow}>
            {KINDS.map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.kindChip, kind === k && styles.kindChipActive]}
                onPress={() => setKind(k)}
              >
                <Ionicons
                  name={KIND_ICONS[k] as any}
                  size={14}
                  color={kind === k ? Colors.surfaceContainerLowest : Colors.onSurfaceVariant}
                />
                <Text style={[styles.kindChipText, kind === k && styles.kindChipTextActive]}>
                  {k}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main Text Input */}
          <View style={styles.textContainer}>
            <TextInput
              ref={textRef}
              style={styles.textInput}
              placeholder="What's on your mind? Paste code, describe a bug, capture an idea…"
              placeholderTextColor={Colors.outline}
              multiline
              autoFocus
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
          </View>

          {/* Tags Row */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Ionicons name="pricetag-outline" size={16} color={Colors.onSurfaceVariant} />
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder="tags, comma-separated"
              placeholderTextColor={Colors.outline}
              value={tags}
              onChangeText={setTags}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.aiTagBtn, autoTagging && styles.aiTagBtnLoading]}
              onPress={handleAutoTag}
              disabled={autoTagging || !text.trim()}
            >
              {autoTagging ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={14} color={Colors.primary} />
                  <Text style={styles.aiTagText}>AI Tag</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Advanced Toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? 'Hide' : 'Show'} advanced fields
            </Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedFields}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="document-outline" size={16} color={Colors.onSurfaceVariant} />
                </View>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="file path (e.g. src/auth/login.ts)"
                  placeholderTextColor={Colors.outline}
                  value={file}
                  onChangeText={setFile}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips</Text>
            <Text style={styles.tipText}>• Use "AI Tag" to auto-generate tags with Granite 3.3</Text>
            <Text style={styles.tipText}>• Tags help with semantic search and recall</Text>
            <Text style={styles.tipText}>• Bugs and insights get special treatment in analytics</Text>
          </View>

          <View style={{ height: TAB_BAR_HEIGHT + 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...Typography.label, color: Colors.surfaceContainerLowest, fontWeight: '600' },
  scroll: { flex: 1 },
  kindRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexWrap: 'wrap',
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  kindChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kindChipText: { ...Typography.label, color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  kindChipTextActive: { color: Colors.surfaceContainerLowest },
  textContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    minHeight: 180,
  },
  textInput: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    padding: Spacing.md,
    minHeight: 180,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  fieldIcon: { padding: 4 },
  fieldInput: {
    ...Typography.body,
    flex: 1,
    color: Colors.onSurface,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  aiTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    minWidth: 72,
    justifyContent: 'center',
  },
  aiTagBtnLoading: { opacity: 0.6 },
  aiTagText: { ...Typography.label, color: Colors.primary, fontWeight: '600' },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  advancedToggleText: { ...Typography.label, color: Colors.onSurfaceVariant },
  advancedFields: { marginBottom: Spacing.sm },
  tips: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  tipsTitle: { ...Typography.label, color: Colors.outline, textTransform: 'uppercase', marginBottom: 6 },
  tipText: { ...Typography.label, color: Colors.onSurfaceVariant, marginBottom: 4, lineHeight: 18 },
});
