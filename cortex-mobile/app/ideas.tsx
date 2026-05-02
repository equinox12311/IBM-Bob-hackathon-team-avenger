/**
 * Idea Mapper — grid of ideas with search and tag filtering.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { Colors, Spacing } from '../src/constants/theme';
import { insertEntry, listEntries, type Entry } from '../src/services/database';
import { autoTag } from '../src/services/llm';
import { apiCreateEntry, apiListEntries, getToken } from '../src/services/api';

export default function IdeasScreen() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiTagging, setAiTagging] = useState(false);

  const load = useCallback(async () => {
    try {
      const tok = await getToken();
      if (tok) {
        const remote = await apiListEntries(100, 'idea');
        setIdeas(remote as any);
      } else {
        setIdeas(await listEntries(100, 'idea'));
      }
    } catch {
      setIdeas(await listEntries(100, 'idea'));
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const allTags = Array.from(new Set(ideas.flatMap(i => i.tags)));
  const filtered = ideas.filter(i => {
    const matchSearch = !search || i.text.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || i.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  const handleAiTag = async () => {
    if (!draft.trim()) return;
    setAiTagging(true);
    const tags = await autoTag(draft);
    if (tags.length) setDraftTags(tags.join(', '));
    setAiTagging(false);
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const tags = draftTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    try {
      const tok = await getToken();
      if (tok) {
        await apiCreateEntry({ text: draft.trim(), kind: 'idea', tags });
      } else {
        await insertEntry({ text: draft.trim(), kind: 'idea', tags });
      }
      setDraft(''); setDraftTags(''); setShowAdd(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Save failed');
    }
    setSaving(false);
  };

  const renderIdea = ({ item, index }: { item: Entry; index: number }) => {
    const isLarge = index === 0 || index % 5 === 0;
    return (
      <TouchableOpacity
        style={[S.card, isLarge && S.cardLarge]}
        onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
        activeOpacity={0.75}
      >
        <View style={S.cardHeader}>
          <Text style={S.cardTitle} numberOfLines={isLarge ? 2 : 1}>{item.text.slice(0, 60)}{item.text.length > 60 ? '…' : ''}</Text>
          <Ionicons name="arrow-forward-outline" size={14} color={Colors.outlineVariant} />
        </View>
        <Text style={S.cardBody} numberOfLines={isLarge ? 3 : 2}>{item.text.slice(60)}</Text>
        {item.tags.length > 0 && (
          <View style={S.tagsRow}>
            {item.tags.slice(0, 3).map(t => (
              <Text key={t} style={S.tag}>#{t}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <Ionicons name="bulb-outline" size={22} color={Colors.primary} />
          <Text style={S.headerTitle}>Idea Mapper</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={S.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={S.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.outline} />
        <TextInput
          style={S.searchInput}
          placeholder="Filter ideas…"
          placeholderTextColor={Colors.outline}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.chips} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          <TouchableOpacity style={[S.chip, !selectedTag && S.chipActive]} onPress={() => setSelectedTag(null)}>
            <Text style={[S.chipText, !selectedTag && S.chipTextActive]}>#all</Text>
          </TouchableOpacity>
          {allTags.slice(0, 8).map(t => (
            <TouchableOpacity key={t} style={[S.chip, selectedTag === t && S.chipActive]} onPress={() => setSelectedTag(t === selectedTag ? null : t)}>
              <Text style={[S.chipText, selectedTag === t && S.chipTextActive]}>#{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={S.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => String(e.id)}
          renderItem={renderIdea}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.center}>
              <Ionicons name="bulb-outline" size={40} color={Colors.outlineVariant} />
              <Text style={S.emptyText}>No ideas yet</Text>
              <Text style={S.emptySub}>Tap "New" to capture your first idea</Text>
            </View>
          }
        />
      )}

      {/* Add Idea Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={S.modal} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>New Idea</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setDraft(''); setDraftTags(''); }}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <TextInput
              style={S.modalInput}
              placeholder="What's the idea?"
              placeholderTextColor={Colors.outline}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
            />
            <View style={S.tagsInputRow}>
              <TextInput
                style={[S.modalInput, { minHeight: 44, marginBottom: 0 }]}
                placeholder="tags, comma-separated"
                placeholderTextColor={Colors.outline}
                value={draftTags}
                onChangeText={setDraftTags}
                autoCapitalize="none"
              />
              <TouchableOpacity style={S.aiTagBtn} onPress={handleAiTag} disabled={aiTagging || !draft.trim()}>
                {aiTagging ? <ActivityIndicator size="small" color={Colors.primary} /> : (
                  <><Ionicons name="sparkles-outline" size={14} color={Colors.primary} /><Text style={S.aiTagText}>AI Tag</Text></>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[S.saveBtn, (!draft.trim() || saving) && S.saveBtnDim]} onPress={handleSave} disabled={!draft.trim() || saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.saveBtnText}>Save Idea</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: 10, paddingVertical: 4 },
  searchInput: { flex: 1, fontSize: 14, color: '#191b24', paddingVertical: 8 },
  chips: { maxHeight: 40, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', marginRight: 6 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.onSurface },
  emptySub: { fontSize: 13, color: Colors.onSurfaceVariant },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, minHeight: 120 },
  cardLarge: { minHeight: 160 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, paddingBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#191b24', flex: 1, marginRight: 4 },
  cardBody: { fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18, flex: 1 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  tag: { fontSize: 10, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
  modal: { flex: 1, backgroundColor: '#f4f5fb' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  modalInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, padding: 12, fontSize: 15, color: '#191b24', margin: 16, minHeight: 120, textAlignVertical: 'top' },
  tagsInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16 },
  aiTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: 72, justifyContent: 'center' },
  aiTagText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginHorizontal: 16 },
  saveBtnDim: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
