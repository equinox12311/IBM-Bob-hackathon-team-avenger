/**
 * Task Automation — CRUD for automation rules.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';
import { apiCreateEntry, apiListEntries, getToken } from '../src/services/api';

interface Automation { id: number; name: string; trigger_kind: string; action: string; enabled: boolean; }

const KINDS = ['note', 'idea', 'bug', 'insight', 'snippet', 'decision', 'fix', 'task'];
const ICON_MAP: Record<string, string> = { note: 'document-text-outline', idea: 'bulb-outline', bug: 'bug-outline', insight: 'flash-outline', snippet: 'code-slash-outline', decision: 'git-branch-outline', fix: 'hammer-outline', task: 'checkbox-outline' };

async function fetchAutomations(token: string): Promise<Automation[]> {
  const base = (await import('../src/services/api')).getApiBase ? await (await import('../src/services/api')).getApiBase() : 'http://localhost:8080';
  const tok = token;
  const res = await fetch(`${base}/api/v1/automations`, { headers: { Authorization: `Bearer ${tok}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.automations ?? [];
}

async function createAutomation(token: string, name: string, trigger_kind: string, action: string): Promise<void> {
  const base = await (await import('../src/services/api')).getApiBase();
  await fetch(`${base}/api/v1/automations`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, trigger_kind, action }) });
}

async function toggleAutomation(token: string, id: number, enabled: boolean): Promise<void> {
  const base = await (await import('../src/services/api')).getApiBase();
  await fetch(`${base}/api/v1/automations/${id}?enabled=${enabled}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
}

async function deleteAutomation(token: string, id: number): Promise<void> {
  const base = await (await import('../src/services/api')).getApiBase();
  await fetch(`${base}/api/v1/automations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

export default function AutomationsScreen() {
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('note');
  const [action, setAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState('');

  const load = useCallback(async () => {
    const tok = await getToken();
    setToken(tok);
    if (!tok) { setLoading(false); return; }
    try { setItems(await fetchAutomations(tok)); } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    if (!name.trim() || !action.trim() || !token) return;
    setSaving(true);
    try {
      await createAutomation(token, name.trim(), trigger, action.trim());
      setName(''); setAction(''); setShowAdd(false);
      load();
    } catch (e: any) { Alert.alert('Error', e?.message ?? 'Failed'); }
    setSaving(false);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    if (!token) return;
    setItems(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
    await toggleAutomation(token, id, enabled);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete automation', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAutomation(token, id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>Automations</Text>
        <TouchableOpacity style={S.addBtn} onPress={() => setShowAdd(true)} disabled={!token}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={S.addBtnText}>New Rule</Text>
        </TouchableOpacity>
      </View>

      {!token ? (
        <View style={S.center}>
          <Ionicons name="server-outline" size={40} color={Colors.outlineVariant} />
          <Text style={S.emptyText}>Connect cortex-api in Profile to use automations</Text>
        </View>
      ) : loading ? (
        <View style={S.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={a => String(a.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.center}>
              <Ionicons name="flash-outline" size={40} color={Colors.outlineVariant} />
              <Text style={S.emptyText}>No automations yet</Text>
              <Text style={S.emptySub}>Tap "New Rule" to create one</Text>
            </View>
          }
          renderItem={({ item: a }) => (
            <View style={S.card}>
              <View style={S.cardLeft}>
                <View style={S.iconWrap}>
                  <Ionicons name={ICON_MAP[a.trigger_kind] as any ?? 'flash-outline'} size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.cardName}>{a.name}</Text>
                  <Text style={S.cardMeta}>on <Text style={S.cardKind}>{a.trigger_kind}</Text> → {a.action}</Text>
                </View>
              </View>
              <View style={S.cardRight}>
                <Switch
                  value={!!a.enabled}
                  onValueChange={v => handleToggle(a.id, v)}
                  trackColor={{ true: Colors.primary, false: Colors.outlineVariant }}
                  thumbColor="#fff"
                />
                <TouchableOpacity onPress={() => handleDelete(a.id)} style={S.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={S.modal} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>New Automation Rule</Text>
            <TouchableOpacity onPress={() => { setShowAdd(false); setName(''); setAction(''); }}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View style={S.field}>
              <Text style={S.fieldLabel}>Rule Name</Text>
              <TextInput style={S.fieldInput} value={name} onChangeText={setName} placeholder="e.g. Post to Slack on bug" placeholderTextColor={Colors.outline} />
            </View>
            <View style={S.field}>
              <Text style={S.fieldLabel}>When entry of kind…</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {KINDS.map(k => (
                  <TouchableOpacity key={k} style={[S.kindChip, trigger === k && S.kindChipActive]} onPress={() => setTrigger(k)}>
                    <Ionicons name={ICON_MAP[k] as any} size={13} color={trigger === k ? '#fff' : Colors.onSurfaceVariant} />
                    <Text style={[S.kindChipText, trigger === k && S.kindChipTextActive]}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={S.field}>
              <Text style={S.fieldLabel}>Then run action</Text>
              <TextInput style={S.fieldInput} value={action} onChangeText={setAction} placeholder="e.g. post to Slack #standup" placeholderTextColor={Colors.outline} />
            </View>
            <TouchableOpacity style={[S.saveBtn, (!name.trim() || !action.trim() || saving) && S.saveBtnDim]} onPress={handleAdd} disabled={!name.trim() || !action.trim() || saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.saveBtnText}>Create Rule</Text>}
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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },
  emptySub: { fontSize: 12, color: Colors.outline, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 14, gap: 12 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#dbe1ff', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '700', color: '#191b24' },
  cardMeta: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  cardKind: { color: Colors.primary, fontWeight: '600' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn: { padding: 4 },
  modal: { flex: 1, backgroundColor: '#f4f5fb' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  field: {},
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, padding: 12, fontSize: 14, color: '#191b24' },
  kindChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', marginRight: 6 },
  kindChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kindChipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  kindChipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnDim: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
