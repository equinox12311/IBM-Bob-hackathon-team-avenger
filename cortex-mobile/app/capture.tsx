/**
 * Capture — fast entry creation. Hit the FAB → land here → type → save.
 *
 * Saves to cortex-api when configured, otherwise local sqlite. Auto-tag is
 * a one-tap suggestion that uses the local LLM (or watsonx via the API).
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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

import { Button, Header, Pill, Screen, Section } from '../src/components/ui';
import { Radius, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { apiCreateEntry, isApiConfigured } from '../src/services/api';
import { insertEntry } from '../src/services/database';
import { autoTag } from '../src/services/llm';
import { extractAndStoreFacts } from '../src/services/memory';

const KINDS = [
  { id: 'note',     icon: 'document-text' as const, label: 'Note' },
  { id: 'idea',     icon: 'bulb' as const,          label: 'Idea' },
  { id: 'bug',      icon: 'bug' as const,           label: 'Bug' },
  { id: 'fix',      icon: 'hammer' as const,        label: 'Fix' },
  { id: 'decision', icon: 'git-branch' as const,    label: 'Decision' },
  { id: 'insight',  icon: 'flash' as const,         label: 'Insight' },
  { id: 'snippet',  icon: 'code-slash' as const,    label: 'Snippet' },
  { id: 'task',     icon: 'checkbox' as const,      label: 'Task' },
] as const;

type Kind = (typeof KINDS)[number]['id'];

export default function CaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; prefill?: string }>();
  const { Colors } = useThemeMode();

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
    // Auto-focus the textarea when the screen opens
    setTimeout(() => textRef.current?.focus(), 200);
  }, []);

  const handleAutoTag = async () => {
    if (!text.trim()) return;
    setAutoTagging(true);
    try {
      const suggested = await autoTag(text);
      if (suggested.length > 0) {
        const existing = tags.split(',').map((t) => t.trim()).filter(Boolean);
        const merged = Array.from(new Set([...existing, ...suggested]));
        setTags(merged.join(', '));
      }
    } catch { /* silent */ }
    setAutoTagging(false);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Empty entry', 'Please write something first.');
      return;
    }
    setSaving(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
      const data = {
        text: text.trim(),
        kind,
        source: 'mobile' as const,
        tags: parsedTags,
        file: file.trim() || undefined,
      };
      if (apiEnabled) {
        try { await apiCreateEntry(data); } catch { await insertEntry(data); }
      } else {
        await insertEntry(data);
      }
      extractAndStoreFacts(text.trim()).catch(() => {});
      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        title="Capture"
        eyebrow={apiEnabled ? '01 · memory · synced' : '01 · memory · local'}
        back
        right={
          <TouchableOpacity onPress={() => setShowAdvanced(v => !v)} hitSlop={8}>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.outline}
            />
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen padding={Spacing.md} scroll={false}>
          {/* Kind selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.kindRow}
          >
            {KINDS.map((k) => {
              const active = k.id === kind;
              return (
                <TouchableOpacity
                  key={k.id}
                  activeOpacity={0.85}
                  onPress={() => setKind(k.id)}
                  style={[
                    s.kindChip,
                    {
                      backgroundColor: active ? Colors.primary : Colors.surfaceContainerLowest,
                      borderColor: active ? Colors.primary : Colors.outlineVariant,
                    },
                  ]}
                >
                  <Ionicons
                    name={k.icon}
                    size={14}
                    color={active ? Colors.onPrimary : Colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      Typography.labelSm,
                      { color: active ? Colors.onPrimary : Colors.onSurfaceVariant },
                    ]}
                  >
                    {k.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Body */}
          <TextInput
            ref={textRef}
            multiline
            value={text}
            onChangeText={setText}
            placeholder={`What's the ${kind}?`}
            placeholderTextColor={Colors.outline}
            style={[
              s.body,
              {
                backgroundColor: Colors.surfaceContainerLowest,
                borderColor: Colors.outlineVariant,
                color: Colors.onSurface,
              },
            ]}
          />

          {/* Tags */}
          <View style={s.tagsRow}>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="tags (comma separated)"
              placeholderTextColor={Colors.outline}
              autoCapitalize="none"
              style={[
                s.tagsInput,
                {
                  backgroundColor: Colors.surfaceContainer,
                  color: Colors.onSurface,
                },
              ]}
            />
            <Button
              label={autoTagging ? '…' : 'Auto'}
              icon="sparkles"
              variant="secondary"
              size="sm"
              onPress={handleAutoTag}
              loading={autoTagging}
            />
          </View>

          {/* Advanced */}
          {showAdvanced && (
            <Section title="Advanced">
              <TextInput
                value={file}
                onChangeText={setFile}
                placeholder="file path (optional)"
                placeholderTextColor={Colors.outline}
                autoCapitalize="none"
                style={[
                  s.advanced,
                  {
                    backgroundColor: Colors.surfaceContainer,
                    color: Colors.onSurface,
                  },
                ]}
              />
            </Section>
          )}

          <View style={{ flex: 1 }} />

          {/* Footer with sync hint + save */}
          <View style={s.footer}>
            <Pill
              label={apiEnabled ? 'API + local' : 'local only'}
              tone={apiEnabled ? 'success' : 'neutral'}
              icon={apiEnabled ? 'cloud-done' : 'phone-portrait'}
            />
            <Button
              label={saving ? 'Saving…' : 'Save entry'}
              icon="checkmark"
              onPress={handleSave}
              loading={saving}
              fullWidth
              style={{ flex: 1 }}
            />
          </View>
        </Screen>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  kindRow: { gap: Spacing.xs, paddingVertical: Spacing.xs },
  kindChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.chip, borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    minHeight: 200,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    textAlignVertical: 'top',
    ...Typography.body,
  },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  tagsInput: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.input,
    ...Typography.body,
  },
  advanced: {
    padding: Spacing.md,
    borderRadius: Radius.input,
    ...Typography.body,
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
});
