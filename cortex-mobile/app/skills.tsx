/**
 * Skill Creator — list / create / edit / delete Bob skills (SKILL.md files
 * under bob/skills/<slug>/). Uses the real cortex_api backend; gracefully
 * falls back to an "API not configured" notice when offline.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors, Radius, Shadow, Spacing, Typography } from '../src/constants/theme';
import {
  apiCreateSkill,
  apiDeleteSkill,
  apiGetSkill,
  apiListSkills,
  apiUpdateSkill,
  isApiConfigured,
  type Skill,
  type SkillSummary,
} from '../src/services/api';

export default function SkillsScreen() {
  const router = useRouter();

  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [editorSlug, setEditorSlug] = useState('');
  const [editorName, setEditorName] = useState('');
  const [editorDesc, setEditorDesc] = useState('');
  const [editorBody, setEditorBody] = useState('');
  const [saving, setSaving] = useState(false);

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
      const r = await apiListSkills();
      setSkills(r.skills ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [configured]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openCreate() {
    setEditing(null);
    setEditorSlug('');
    setEditorName('');
    setEditorDesc('');
    setEditorBody('');
    setEditorOpen(true);
  }

  async function openEdit(slug: string) {
    if (!configured) return;
    try {
      const skill = await apiGetSkill(slug);
      setEditing(skill);
      setEditorSlug(skill.slug);
      setEditorName(skill.name);
      setEditorDesc(skill.description);
      setEditorBody(skill.body);
      setEditorOpen(true);
    } catch (e) {
      Alert.alert("Couldn't load", String(e));
    }
  }

  async function save() {
    if (editorDesc.trim().length < 30 || !editorBody.trim() || (!editing && !editorSlug.trim())) {
      Alert.alert(
        'Missing fields',
        'Slug, body, and a 30+ character description are required so Bob can match this skill.',
      );
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiUpdateSkill(editing.slug, {
          name: editorName.trim() || undefined,
          description: editorDesc.trim(),
          body: editorBody.trim(),
        });
      } else {
        await apiCreateSkill({
          slug: editorSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          name: editorName.trim() || undefined,
          description: editorDesc.trim(),
          body: editorBody.trim(),
        });
      }
      setEditorOpen(false);
      Alert.alert('Saved', 'Run `make install-bob` to deploy this skill to ~/.bob/skills/.');
      load();
    } catch (e) {
      Alert.alert('Save failed', String(e));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(slug: string) {
    Alert.alert(
      'Delete skill?',
      `bob/skills/${slug}/SKILL.md will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeleteSkill(slug);
              load();
            } catch (e) {
              Alert.alert('Delete failed', String(e));
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={S.headerTitle}>Skill Creator</Text>
          <Text style={S.headerSub}>{skills.length} skill{skills.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={S.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        {!configured && (
          <View style={S.notice}>
            <Ionicons name="cloud-offline" size={20} color={Colors.outline} />
            <Text style={S.noticeText}>Connect cortex-api in Profile to manage Bob skills.</Text>
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
            <Text style={S.noticeText}>Loading skills…</Text>
          </View>
        )}
        {!loading && configured && skills.length === 0 && (
          <View style={[S.notice, Shadow.cardPrimary]}>
            <Ionicons name="bulb" size={20} color={Colors.primary} />
            <Text style={S.noticeText}>
              No skills yet. Tap the + to add one — Bob auto-activates skills based on their description.
            </Text>
          </View>
        )}

        {skills.map((s) => (
          <View key={s.slug} style={[S.card, Shadow.card]}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>{s.name}</Text>
              {s.managed && (
                <View style={S.managedPill}>
                  <Ionicons name="lock-closed" size={11} color={Colors.onSurfaceVariant} />
                  <Text style={S.managedTxt}>read-only</Text>
                </View>
              )}
            </View>
            <Text style={S.cardSlug}>{s.slug}</Text>
            <Text style={S.cardDesc} numberOfLines={3}>
              {s.description}
            </Text>
            <Text style={S.cardPath}>{s.path}</Text>
            <View style={S.cardActions}>
              <TouchableOpacity style={S.cardBtn} onPress={() => openEdit(s.slug)}>
                <Ionicons name={s.managed ? 'eye' : 'create'} size={14} color={Colors.primary} />
                <Text style={S.cardBtnText}>{s.managed ? 'View' : 'Edit'}</Text>
              </TouchableOpacity>
              {!s.managed && (
                <TouchableOpacity
                  style={[S.cardBtn, { borderColor: Colors.error }]}
                  onPress={() => confirmDelete(s.slug)}
                >
                  <Ionicons name="trash" size={14} color={Colors.error} />
                  <Text style={[S.cardBtnText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Editor Modal */}
      <Modal
        visible={editorOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditorOpen(false)}
      >
        <SafeAreaView style={S.safe} edges={['top']}>
          <View style={S.header}>
            <Text style={S.headerTitle}>
              {editing ? `Edit · ${editing.slug}` : 'New skill'}
            </Text>
            <TouchableOpacity onPress={() => setEditorOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.outline} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={S.editor} keyboardShouldPersistTaps="handled">
            {!editing && (
              <View style={S.field}>
                <Text style={S.label}>Slug</Text>
                <TextInput
                  style={S.input}
                  placeholder="weekly-summary"
                  placeholderTextColor={Colors.outline}
                  value={editorSlug}
                  onChangeText={setEditorSlug}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={S.help}>Lowercase letters, numbers, and hyphens only.</Text>
              </View>
            )}
            <View style={S.field}>
              <Text style={S.label}>Display name (optional)</Text>
              <TextInput
                style={S.input}
                placeholder="Weekly Summary"
                placeholderTextColor={Colors.outline}
                value={editorName}
                onChangeText={setEditorName}
              />
            </View>
            <View style={S.field}>
              <Text style={S.label}>
                Description ({editorDesc.length}/30+)
              </Text>
              <TextInput
                style={[S.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Specific phrases that help Bob's matcher pick this skill — what is it for, when should Bob use it?"
                placeholderTextColor={Colors.outline}
                value={editorDesc}
                onChangeText={setEditorDesc}
                multiline
                editable={!editing?.managed}
              />
            </View>
            <View style={S.field}>
              <Text style={S.label}>Body (Markdown)</Text>
              <TextInput
                style={[S.input, { minHeight: 200, textAlignVertical: 'top' }]}
                placeholder="What Bob should do when this skill is active. Step-by-step is fine."
                placeholderTextColor={Colors.outline}
                value={editorBody}
                onChangeText={setEditorBody}
                multiline
                editable={!editing?.managed}
              />
            </View>
            {editing?.managed ? (
              <View style={S.notice}>
                <Ionicons name="lock-closed" size={16} color={Colors.outline} />
                <Text style={S.noticeText}>
                  This skill is managed by the project and can't be edited from the app.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[S.saveBtn, saving && { opacity: 0.5 }]}
                onPress={save}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="save" size={16} color={Colors.onPrimary} />
                    <Text style={S.saveBtnText}>
                      {editing ? 'Save changes' : 'Create skill'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <Text style={S.deployHint}>
              After saving, run <Text style={S.code}>make install-bob</Text> to deploy to{' '}
              <Text style={S.code}>~/.bob/skills/</Text>.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
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
  headerSub: { ...Typography.codeSm, color: Colors.onSurfaceVariant, marginTop: 1 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.chip,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: {
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
    gap: Spacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...Typography.h3, color: Colors.onSurface },
  managedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surfaceContainer,
  },
  managedTxt: { ...Typography.codeSm, color: Colors.onSurfaceVariant },
  cardSlug: { ...Typography.code, color: Colors.outline },
  cardDesc: { ...Typography.body, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },
  cardPath: { ...Typography.codeSm, color: Colors.outline, marginTop: Spacing.xs },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.input,
  },
  cardBtnText: { ...Typography.labelSm, color: Colors.primary },

  editor: { padding: Spacing.md, gap: Spacing.lg },
  field: { gap: Spacing.xs },
  label: { ...Typography.labelSm, color: Colors.onSurfaceVariant, textTransform: 'uppercase' },
  help: { ...Typography.codeSm, color: Colors.outline },
  input: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.input,
    ...Typography.body,
    color: Colors.onSurface,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.input,
  },
  saveBtnText: { ...Typography.label, color: Colors.onPrimary },
  deployHint: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  code: { ...Typography.code, color: Colors.primary },
});
