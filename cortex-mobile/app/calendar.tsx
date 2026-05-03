/**
 * Calendar — developer schedule with events, deadlines, and focus blocks.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { getDemoCalendarEvents, type DemoCalendarEvent } from '../src/services/demoData';

const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  meeting:  { icon: 'people-outline',      color: '#0f62fe', bg: '#dbe1ff', label: 'Meeting' },
  focus:    { icon: 'eye-outline',          color: '#198038', bg: '#defbe6', label: 'Focus' },
  deadline: { icon: 'flag-outline',         color: '#da1e28', bg: '#ffdad6', label: 'Deadline' },
  break:    { icon: 'cafe-outline',         color: '#f1c21b', bg: '#fdf6dd', label: 'Break' },
  reminder: { icon: 'notifications-outline',color: '#8a3ffc', bg: '#e8daff', label: 'Reminder' },
  review:   { icon: 'code-slash-outline',   color: '#8a3ffc', bg: '#e8daff', label: 'Review' },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarScreen() {
  const { Colors } = useThemeMode();
  const S = makeStyles(Colors);
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [events, setEvents] = useState<DemoCalendarEvent[]>(getDemoCalendarEvents());
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newType, setNewType] = useState<DemoCalendarEvent['type']>('meeting');
  const [newDesc, setNewDesc] = useState('');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsForDate = (date: string) => events.filter(e => e.date === date);
  const selectedEvents = eventsForDate(selectedDate);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const addEvent = () => {
    if (!newTitle.trim()) return;
    const newEvent: DemoCalendarEvent = {
      id: `e-${Date.now()}`, title: newTitle.trim(), date: selectedDate,
      time: newTime, endTime: newTime, type: newType, description: newDesc,
      attendees: [], location: '', completed: false,
      color: TYPE_META[newType].color,
    };
    setEvents(prev => [...prev, newEvent]);
    setNewTitle(''); setNewDesc(''); setShowAdd(false);
  };

  const toggleComplete = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const deleteEvent = (id: string) => {
    Alert.alert('Delete event', 'Remove this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setEvents(prev => prev.filter(e => e.id !== id)) },
    ]);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Calendar</Text>
        <TouchableOpacity style={S.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}>
        {/* Month navigator */}
        <View style={S.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={S.navBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={S.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={S.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={S.dayHeaders}>
          {DAYS.map(d => <Text key={d} style={S.dayHeader}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={S.grid}>
          {Array.from({ length: firstDay }).map((_, i) => <View key={`empty-${i}`} style={S.dayCell} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === today.toISOString().slice(0, 10);
            const isSelected = dateStr === selectedDate;
            const dayEvents = eventsForDate(dateStr);
            return (
              <TouchableOpacity key={d} style={[S.dayCell, isSelected && S.dayCellSelected, isToday && !isSelected && S.dayCellToday]}
                onPress={() => setSelectedDate(dateStr)} activeOpacity={0.7}>
                <Text style={[S.dayNum, isSelected && S.dayNumSelected, isToday && !isSelected && S.dayNumToday]}>{d}</Text>
                {dayEvents.length > 0 && (
                  <View style={S.dotRow}>
                    {dayEvents.slice(0, 3).map(e => (
                      <View key={e.id} style={[S.dot, { backgroundColor: e.color }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day events */}
        <View style={S.eventsSection}>
          <View style={S.eventsSectionHeader}>
            <Text style={S.eventsSectionTitle}>
              {selectedDate === today.toISOString().slice(0, 10) ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={S.eventsCount}>{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</Text>
          </View>

          {selectedEvents.length === 0 ? (
            <View style={S.emptyDay}>
              <Ionicons name="calendar-outline" size={36} color={Colors.outlineVariant} />
              <Text style={S.emptyDayText}>No events scheduled</Text>
              <TouchableOpacity style={S.addEventBtn} onPress={() => setShowAdd(true)}>
                <Text style={S.addEventBtnText}>+ Add event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedEvents.sort((a, b) => a.time.localeCompare(b.time)).map(event => {
              const meta = TYPE_META[event.type];
              return (
                <View key={event.id} style={[S.eventCard, event.completed && S.eventCardDone]}>
                  <View style={[S.eventTypeBar, { backgroundColor: event.color }]} />
                  <View style={S.eventBody}>
                    <View style={S.eventTop}>
                      <View style={[S.eventTypeBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                        <Text style={[S.eventTypeTxt, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={S.eventTime}>{event.time}{event.endTime !== event.time ? ` – ${event.endTime}` : ''}</Text>
                    </View>
                    <Text style={[S.eventTitle, event.completed && S.eventTitleDone]}>{event.title}</Text>
                    {!!event.description && <Text style={S.eventDesc} numberOfLines={1}>{event.description}</Text>}
                    {event.attendees.length > 0 && (
                      <View style={S.attendeeRow}>
                        <Ionicons name="people-outline" size={12} color={Colors.outline} />
                        <Text style={S.attendeeTxt}>{event.attendees.slice(0, 2).join(', ')}{event.attendees.length > 2 ? ` +${event.attendees.length - 2}` : ''}</Text>
                      </View>
                    )}
                  </View>
                  <View style={S.eventActions}>
                    <TouchableOpacity onPress={() => toggleComplete(event.id)} style={S.eventActionBtn}>
                      <Ionicons name={event.completed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={event.completed ? Colors.llmOnline : Colors.outline} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEvent(event.id)} style={S.eventActionBtn}>
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={S.modal} edges={['top']}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>New Event</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View>
              <Text style={S.fieldLabel}>Title</Text>
              <TextInput style={S.fieldInput} value={newTitle} onChangeText={setNewTitle} placeholder="Event title" placeholderTextColor={Colors.outline} autoFocus />
            </View>
            <View>
              <Text style={S.fieldLabel}>Time</Text>
              <TextInput style={S.fieldInput} value={newTime} onChangeText={setNewTime} placeholder="09:00" placeholderTextColor={Colors.outline} keyboardType="numbers-and-punctuation" />
            </View>
            <View>
              <Text style={S.fieldLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {(Object.keys(TYPE_META) as DemoCalendarEvent['type'][]).map(t => (
                  <TouchableOpacity key={t} style={[S.typeChip, newType === t && { backgroundColor: TYPE_META[t].color, borderColor: TYPE_META[t].color }]}
                    onPress={() => setNewType(t)}>
                    <Ionicons name={TYPE_META[t].icon as any} size={13} color={newType === t ? '#fff' : Colors.onSurfaceVariant} />
                    <Text style={[S.typeChipTxt, newType === t && { color: '#fff' }]}>{TYPE_META[t].label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View>
              <Text style={S.fieldLabel}>Description</Text>
              <TextInput style={[S.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]} value={newDesc} onChangeText={setNewDesc} placeholder="Optional description" placeholderTextColor={Colors.outline} multiline />
            </View>
            <TouchableOpacity style={[S.saveBtn, !newTitle.trim() && S.saveBtnDim]} onPress={addEvent} disabled={!newTitle.trim()}>
              <Text style={S.saveBtnTxt}>Add Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ReturnType<typeof useThemeMode>['Colors']) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  dayHeaders: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8, paddingBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', paddingHorizontal: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayCellSelected: { backgroundColor: Colors.primary, borderRadius: 10 },
  dayCellToday: { backgroundColor: Colors.primaryLight, borderRadius: 10 },
  dayNum: { fontSize: 14, fontWeight: '500', color: '#191b24' },
  dayNumSelected: { color: '#fff', fontWeight: '700' },
  dayNumToday: { color: Colors.primary, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  eventsSection: { padding: 16 },
  eventsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventsSectionTitle: { fontSize: 16, fontWeight: '700', color: '#191b24' },
  eventsCount: { fontSize: 12, fontWeight: '600', color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  emptyDay: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyDayText: { fontSize: 14, color: Colors.onSurfaceVariant },
  addEventBtn: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary },
  addEventBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  eventCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: 8, overflow: 'hidden' },
  eventCardDone: { opacity: 0.6 },
  eventTypeBar: { width: 4 },
  eventBody: { flex: 1, padding: 12 },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eventTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  eventTypeTxt: { fontSize: 10, fontWeight: '700' },
  eventTime: { fontSize: 11, color: Colors.outline, fontFamily: 'monospace' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#191b24', marginBottom: 2 },
  eventTitleDone: { textDecorationLine: 'line-through', color: Colors.outline },
  eventDesc: { fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 4 },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeTxt: { fontSize: 11, color: Colors.outline },
  eventActions: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 8, gap: 4 },
  eventActionBtn: { padding: 6 },
  modal: { flex: 1, backgroundColor: '#f4f5fb' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 10, padding: 12, fontSize: 14, color: '#191b24' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', marginRight: 8 },
  typeChipTxt: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnDim: { opacity: 0.4 },
  saveBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
