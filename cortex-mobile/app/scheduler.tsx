/**
 * Scheduler — schedule tasks, automations, and Bob skill invocations.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';
import { getDemoScheduledTasks, type DemoScheduledTask } from '../src/services/demoData';

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  low:      { color: '#5d5f5f', bg: '#e0e0e0' },
  medium:   { color: '#0f62fe', bg: '#dbe1ff' },
  high:     { color: '#f1c21b', bg: '#fdf6dd' },
  critical: { color: '#da1e28', bg: '#ffdad6' },
};
const STATUS_META: Record<string, { icon: string; color: string }> = {
  pending: { icon: 'time-outline',           color: Colors.outline },
  running: { icon: 'sync-outline',           color: Colors.primary },
  done:    { icon: 'checkmark-circle',       color: Colors.llmOnline },
  failed:  { icon: 'close-circle',           color: Colors.error },
};
const RECURRENCE_ICONS: Record<string, string> = {
  once: 'radio-button-on-outline', daily: 'today-outline',
  weekly: 'calendar-outline', monthly: 'calendar-number-outline',
};

function formatSchedule(ts: number) {
  const d = ts - Date.now();
  if (d < 0) return 'Overdue';
  if (d < 3600000) return `In ${Math.floor(d / 60000)}m`;
  if (d < 86400000) return `In ${Math.floor(d / 3600000)}h`;
  return `In ${Math.floor(d / 86400000)}d`;
}

export default function SchedulerScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<DemoScheduledTask[]>(getDemoScheduledTasks());
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'failed'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [recurrence, setRecurrence] = useState<DemoScheduledTask['recurrence']>('once');
  const [priority, setPriority] = useState<DemoScheduledTask['priority']>('medium');

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const runTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'running' } : t));
    setTimeout(() => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
      Alert.alert('✅ Task Complete', 'Scheduled task ran successfully.');
    }, 2000);
  };

  const createTask = () => {
    if (!title.trim()) return;
    const newTask: DemoScheduledTask = {
      id: `t-${Date.now()}`, title: title.trim(), description: desc.trim(),
      scheduledAt: Date.now() + 3600000, recurrence, priority,
      status: 'pending', category: 'custom', tags: [],
    };
    setTasks(prev => [newTask, ...prev]);
    setTitle(''); setDesc(''); setShowCreate(false);
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Remove this scheduled task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTasks(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  const pending = tasks.filter(t => t.status === 'pending').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const failed = tasks.filter(t => t.status === 'failed').length;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={S.headerTitle}>Scheduler</Text>
          <Text style={S.headerSub}>{pending} pending · {done} done · {failed} failed</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={S.statsRow}>
        {[
          { label: 'Pending', value: pending, color: Colors.primary },
          { label: 'Done', value: done, color: Colors.llmOnline },
          { label: 'Failed', value: failed, color: Colors.error },
          { label: 'Total', value: tasks.length, color: Colors.secondary },
        ].map(s => (
          <TouchableOpacity key={s.label} style={S.statCard} onPress={() => setFilter(s.label.toLowerCase() as any)}>
            <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={S.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter */}
      <View style={S.filterRow}>
        {(['all', 'pending', 'done', 'failed'] as const).map(f => (
          <TouchableOpacity key={f} style={[S.filterChip, filter === f && S.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[S.filterChipTxt, filter === f && S.filterChipTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 10 }}>
        {filtered.map(task => {
          const pm = PRIORITY_META[task.priority];
          const sm = STATUS_META[task.status];
          const isOverdue = task.scheduledAt < Date.now() && task.status === 'pending';
          return (
            <View key={task.id} style={[S.taskCard, isOverdue && S.taskCardOverdue]}>
              <View style={S.taskTop}>
                <View style={[S.priorityBadge, { backgroundColor: pm.bg }]}>
                  <Text style={[S.priorityTxt, { color: pm.color }]}>{task.priority}</Text>
                </View>
                <View style={S.taskMeta}>
                  <Ionicons name={RECURRENCE_ICONS[task.recurrence] as any} size={13} color={Colors.outline} />
                  <Text style={S.recurrenceTxt}>{task.recurrence}</Text>
                  <Text style={[S.scheduleTxt, isOverdue && { color: Colors.error }]}>
                    {formatSchedule(task.scheduledAt)}
                  </Text>
                </View>
                <Ionicons name={sm.icon as any} size={20} color={sm.color} />
              </View>
              <Text style={S.taskTitle}>{task.title}</Text>
              {!!task.description && <Text style={S.taskDesc} numberOfLines={2}>{task.description}</Text>}
              {task.tags.length > 0 && (
                <View style={S.tagsRow}>
                  {task.tags.map(t => <Text key={t} style={S.tag}>#{t}</Text>)}
                </View>
              )}
              <View style={S.taskFooter}>
                <View style={S.categoryBadge}>
                  <Text style={S.categoryTxt}>{task.category}</Text>
                </View>
                <View style={S.taskBtns}>
                  {task.status === 'pending' && (
                    <TouchableOpacity style={S.runBtn} onPress={() => runTask(task.id)}>
                      <Ionicons name="play" size={12} color="#fff" />
                      <Text style={S.runBtnTxt}>Run Now</Text>
                    </TouchableOpacity>
                  )}
                  {task.status === 'failed' && (
                    <TouchableOpacity style={[S.runBtn, { backgroundColor: Colors.error }]} onPress={() => runTask(task.id)}>
                      <Ionicons name="refresh" size={12} color="#fff" />
                      <Text style={S.runBtnTxt}>Retry</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={S.deleteBtn} onPress={() => deleteTask(task.id)}>
                    <Ionicons name="trash-outline" size={15} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
            <Ionicons name="calendar-outline" size={40} color={Colors.outlineVariant} />
            <Text style={{ fontSize: 14, color: Colors.onSurfaceVariant }}>No {filter} tasks</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={S.modal} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>Schedule Task</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View><Text style={S.fieldLabel}>Task Title</Text>
              <TextInput style={S.fieldInput} value={title} onChangeText={setTitle} placeholder="e.g. Daily Standup Summary" placeholderTextColor={Colors.outline} autoFocus /></View>
            <View><Text style={S.fieldLabel}>Description</Text>
              <TextInput style={[S.fieldInput, { minHeight: 70, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc} placeholder="What should this task do?" placeholderTextColor={Colors.outline} multiline /></View>
            <View><Text style={S.fieldLabel}>Recurrence</Text>
              <View style={S.optionRow}>
                {(['once', 'daily', 'weekly', 'monthly'] as const).map(r => (
                  <TouchableOpacity key={r} style={[S.optionChip, recurrence === r && S.optionChipActive]} onPress={() => setRecurrence(r)}>
                    <Text style={[S.optionChipTxt, recurrence === r && S.optionChipTxtActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View><Text style={S.fieldLabel}>Priority</Text>
              <View style={S.optionRow}>
                {(['low', 'medium', 'high', 'critical'] as const).map(p => (
                  <TouchableOpacity key={p} style={[S.optionChip, priority === p && { backgroundColor: PRIORITY_META[p].color, borderColor: PRIORITY_META[p].color }]} onPress={() => setPriority(p)}>
                    <Text style={[S.optionChipTxt, priority === p && { color: '#fff' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[S.saveBtn, !title.trim() && S.saveBtnDim]} onPress={createTask} disabled={!title.trim()}>
              <Text style={S.saveBtnTxt}>Schedule Task</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  headerSub: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  statCard: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 10, backgroundColor: '#f4f5fb' },
  statValue: { fontSize: 22, fontWeight: '300', lineHeight: 26 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 1 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipTxt: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  filterChipTxtActive: { color: '#fff' },
  taskCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 14, gap: 8 },
  taskCardOverdue: { borderColor: Colors.error + '60', backgroundColor: '#fff8f8' },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  priorityTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  taskMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  recurrenceTxt: { fontSize: 11, color: Colors.outline, textTransform: 'capitalize' },
  scheduleTxt: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#191b24' },
  taskDesc: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { fontSize: 11, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
  taskFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryBadge: { backgroundColor: '#f4f5fb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryTxt: { fontSize: 11, color: Colors.outline, textTransform: 'capitalize' },
  taskBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  runBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  runBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  deleteBtn: { padding: 6 },
  modal: { flex: 1, backgroundColor: '#f4f5fb' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, padding: 12, fontSize: 14, color: '#191b24' },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff' },
  optionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionChipTxt: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  optionChipTxtActive: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnDim: { opacity: 0.4 },
  saveBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
