/**
 * Skill Creator — create, manage, and invoke Bob skills from mobile.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';
import { getDemoSkills, type DemoSkill } from '../src/services/demoData';

const CATEGORIES = ['all', 'debugging', 'documentation', 'productivity', 'code', 'security', 'reporting'];
const CAT_COLORS: Record<string, string> = {
  debugging: '#da1e28', documentation: '#0f62fe', productivity: '#198038',
  code: '#8a3ffc', security: '#f1c21b', reporting: '#5d5f5f',
};

function relTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

export default function SkillsScreen() {
  const router = useRouter();
  const [skills, setSkills] = useState<DemoSkill[]>(getDemoSkills());
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<DemoSkill | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [trigger, setTrigger] = useState('on_entry_kind:note');
  const [category, setCategory] = useState('productivity');
  const [invoking, setInvoking] = useState<string | null>(null);

  const filtered = filter === 'all' ? skills : skills.filter(s => s.category === filter);

  const toggleSkill = (id: string) => setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

  const createSkill = () => {
    if (!name.trim()) return;
    const newSkill: DemoSkill = {
      id: `s-${Date.now()}`, name: name.trim(), description: desc.trim(),
      trigger, actions: ['save_to_journal', 'notify'], enabled: true,
      usageCount: 0, lastUsed: Date.now(), category,
    };
    setSkills(prev => [newSkill, ...prev]);
    setName(''); setDesc(''); setShowCreate(false);
    Alert.alert('✅ Skill Created', `"${newSkill.name}" is now active and will run when triggered.`);
  };

  const invokeSkill = async (skill: DemoSkill) => {
    setInvoking(skill.id);
    // Simulate invocation
    await new Promise(r => setTimeout(r, 1500));
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, usageCount: s.usageCount + 1, lastUsed: Date.now() } : s));
    setInvoking(null);
    Alert.alert('✅ Skill Invoked', `"${skill.name}" ran successfully.\n\nActions executed:\n${skill.actions.map(a => `• ${a}`).join('\n')}`);
  };

  const deleteSkill = (id: string) => {
    Alert.alert('Delete Skill', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setSkills(prev => prev.filter(s => s.id !== id)) },
    ]);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={S.headerTitle}>Skill Creator</Text>
          <Text style={S.headerSub}>{skills.filter(s => s.enabled).length} active skills</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[S.filterChip, filter === c && S.filterChipActive]} onPress={() => setFilter(c)}>
            <Text style={[S.filterChipTxt, filter === c && S.filterChipTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 10 }}>
        {filtered.map(skill => (
          <TouchableOpacity key={skill.id} style={S.skillCard} onPress={() => setShowDetail(skill)} activeOpacity={0.85}>
            <View style={S.skillTop}>
              <View style={[S.skillIcon, { backgroundColor: (CAT_COLORS[skill.category] ?? Colors.primary) + '20' }]}>
                <Ionicons name="flash-outline" size={20} color={CAT_COLORS[skill.category] ?? Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.skillName}>{skill.name}</Text>
                <View style={S.skillMeta}>
                  <View style={[S.catBadge, { backgroundColor: (CAT_COLORS[skill.category] ?? Colors.primary) + '20' }]}>
                    <Text style={[S.catBadgeTxt, { color: CAT_COLORS[skill.category] ?? Colors.primary }]}>{skill.category}</Text>
                  </View>
                  <Text style={S.usageCount}>Used {skill.usageCount}× · {relTime(skill.lastUsed)}</Text>
                </View>
              </View>
              <Switch value={skill.enabled} onValueChange={() => toggleSkill(skill.id)}
                trackColor={{ true: Colors.primary, false: Colors.outlineVariant }} thumbColor="#fff" />
            </View>
            <Text style={S.skillDesc} numberOfLines={2}>{skill.description}</Text>
            <View style={S.skillFooter}>
              <View style={S.triggerBadge}>
                <Ionicons name="play-circle-outline" size={12} color={Colors.outline} />
                <Text style={S.triggerTxt}>{skill.trigger}</Text>
              </View>
              <View style={S.skillBtns}>
                <TouchableOpacity style={S.invokeBtn} onPress={() => invokeSkill(skill)} disabled={invoking === skill.id}>
                  {invoking === skill.id
                    ? <Text style={S.invokeBtnTxt}>Running…</Text>
                    : <><Ionicons name="play" size={12} color="#fff" /><Text style={S.invokeBtnTxt}>Run</Text></>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={S.deleteBtn} onPress={() => deleteSkill(skill.id)}>
                  <Ionicons name="trash-outline" size={15} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
            <Ionicons name="flash-outline" size={40} color={Colors.outlineVariant} />
            <Text style={{ fontSize: 14, color: Colors.onSurfaceVariant }}>No skills in this category</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Skill Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={S.modal} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>Create Skill</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View><Text style={S.fieldLabel}>Skill Name</Text>
              <TextInput style={S.fieldInput} value={name} onChangeText={setName} placeholder="e.g. Auto Bug Reporter" placeholderTextColor={Colors.outline} autoFocus /></View>
            <View><Text style={S.fieldLabel}>Description</Text>
              <TextInput style={[S.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc} placeholder="What does this skill do?" placeholderTextColor={Colors.outline} multiline /></View>
            <View><Text style={S.fieldLabel}>Trigger</Text>
              <TextInput style={S.fieldInput} value={trigger} onChangeText={setTrigger} placeholder="on_entry_kind:debug" placeholderTextColor={Colors.outline} autoCapitalize="none" /></View>
            <View><Text style={S.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {CATEGORIES.filter(c => c !== 'all').map(c => (
                  <TouchableOpacity key={c} style={[S.filterChip, category === c && S.filterChipActive, { marginRight: 8 }]} onPress={() => setCategory(c)}>
                    <Text style={[S.filterChipTxt, category === c && S.filterChipTxtActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={[S.saveBtn, !name.trim() && S.saveBtnDim]} onPress={createSkill} disabled={!name.trim()}>
              <Text style={S.saveBtnTxt}>Create Skill</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Skill Detail Modal */}
      {showDetail && (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={S.modal} edges={['top']}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>{showDetail.name}</Text>
              <TouchableOpacity onPress={() => setShowDetail(null)}>
                <Ionicons name="close" size={24} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              <View style={S.detailCard}>
                <Text style={S.detailLabel}>Description</Text>
                <Text style={S.detailValue}>{showDetail.description}</Text>
              </View>
              <View style={S.detailCard}>
                <Text style={S.detailLabel}>Trigger</Text>
                <Text style={[S.detailValue, { fontFamily: 'monospace', color: Colors.primary }]}>{showDetail.trigger}</Text>
              </View>
              <View style={S.detailCard}>
                <Text style={S.detailLabel}>Actions</Text>
                {showDetail.actions.map(a => (
                  <View key={a} style={S.actionRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.llmOnline} />
                    <Text style={S.actionTxt}>{a}</Text>
                  </View>
                ))}
              </View>
              <View style={S.detailCard}>
                <Text style={S.detailLabel}>Stats</Text>
                <Text style={S.detailValue}>Used {showDetail.usageCount} times · Last run {relTime(showDetail.lastUsed)}</Text>
              </View>
              <TouchableOpacity style={S.saveBtn} onPress={() => { setShowDetail(null); invokeSkill(showDetail); }}>
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={S.saveBtnTxt}>Run Now</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  headerSub: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterRow: { maxHeight: 44, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', marginRight: 6 },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipTxt: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  filterChipTxtActive: { color: '#fff' },
  skillCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 14, gap: 8 },
  skillTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  skillName: { fontSize: 14, fontWeight: '700', color: '#191b24' },
  skillMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  catBadgeTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  usageCount: { fontSize: 11, color: Colors.outline },
  skillDesc: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19 },
  skillFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  triggerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f4f5fb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  triggerTxt: { fontSize: 11, color: Colors.outline, fontFamily: 'monospace' },
  skillBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  invokeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  invokeBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  deleteBtn: { padding: 6 },
  modal: { flex: 1, backgroundColor: '#f4f5fb' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, padding: 12, fontSize: 14, color: '#191b24' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14 },
  saveBtnDim: { opacity: 0.4 },
  saveBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 14, gap: 6 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: '#191b24', lineHeight: 22 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  actionTxt: { fontSize: 13, color: '#191b24', fontFamily: 'monospace' },
});
