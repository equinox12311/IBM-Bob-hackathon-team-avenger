/**
 * More — complete feature hub with all Cortex capabilities.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';

const SECTIONS = [
  {
    title: 'Capture & Recall',
    items: [
      { title: 'Timeline',       subtitle: 'All entries chronologically',    icon: 'time-outline',                color: '#0f62fe', bg: '#dbe1ff', route: '/timeline' },
      { title: 'Idea Mapper',    subtitle: 'Visual grid of your ideas',      icon: 'bulb-outline',                color: '#8a3ffc', bg: '#e8daff', route: '/ideas' },
      { title: 'Search',         subtitle: 'Semantic & keyword search',      icon: 'search-outline',              color: '#198038', bg: '#defbe6', route: '/search' },
    ],
  },
  {
    title: 'AI & Intelligence',
    items: [
      { title: 'AI Chat',        subtitle: 'Chat with Granite 3.3:2b',       icon: 'chatbubble-ellipses-outline', color: '#0f62fe', bg: '#dbe1ff', route: '/chat' },
      { title: 'Debug Helper',   subtitle: 'AI-powered debugging assistant', icon: 'bug-outline',                 color: '#da1e28', bg: '#ffdad6', route: '/debug' },
      { title: 'Dev Identity',   subtitle: 'Knowledge graph & profile',      icon: 'person-circle-outline',       color: '#8a3ffc', bg: '#e8daff', route: '/identity' },
    ],
  },
  {
    title: 'IBM Bob Integration',
    items: [
      { title: 'Bob Tools',      subtitle: 'Invoke MCP tools directly',      icon: 'cube-outline',                color: '#0f62fe', bg: '#dbe1ff', route: '/bob' },
      { title: 'Skill Creator',  subtitle: 'Create & manage Bob skills',     icon: 'flash-outline',               color: '#8a3ffc', bg: '#e8daff', route: '/skills' },
      { title: 'Automations',    subtitle: 'Trigger rules on entry kinds',   icon: 'settings-outline',            color: '#f1c21b', bg: '#fdf6dd', route: '/automations' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { title: 'Calendar',       subtitle: 'Schedule & manage events',       icon: 'calendar-outline',            color: '#0f62fe', bg: '#dbe1ff', route: '/calendar' },
      { title: 'Scheduler',      subtitle: 'Automate recurring tasks',       icon: 'alarm-outline',               color: '#198038', bg: '#defbe6', route: '/scheduler' },
      { title: 'Touch Grass',    subtitle: 'Break tracker & wellness',       icon: 'leaf-outline',                color: '#198038', bg: '#defbe6', route: '/wellness' },
    ],
  },
  {
    title: 'Analytics & Reports',
    items: [
      { title: 'Analytics',      subtitle: 'Session stats & focus timer',    icon: 'bar-chart-outline',           color: '#198038', bg: '#defbe6', route: '/analytics' },
      { title: 'Daily Report',   subtitle: '1d / 7d / 30d highlights',       icon: 'document-text-outline',       color: '#0f62fe', bg: '#dbe1ff', route: '/report' },
      { title: 'GitHub Velocity',subtitle: 'Contribution heatmap',           icon: 'git-branch-outline',          color: '#da1e28', bg: '#ffdad6', route: '/github' },
    ],
  },
  {
    title: 'Security & Settings',
    items: [
      { title: 'Security',       subtitle: 'OWASP dashboard & features',     icon: 'shield-checkmark-outline',    color: '#198038', bg: '#defbe6', route: '/security' },
      { title: 'Dev News',       subtitle: 'Curated developer articles',     icon: 'newspaper-outline',           color: '#5d5f5f', bg: '#e0e0e0', route: '/news' },
      { title: 'Profile',        subtitle: 'Account, AI & API config',       icon: 'person-outline',              color: '#5d5f5f', bg: '#e0e0e0', route: '/profile' },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const totalFeatures = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>All Features</Text>
        <View style={S.countBadge}>
          <Text style={S.countTxt}>{totalFeatures} screens</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 20 }}>
        {SECTIONS.map(section => (
          <View key={section.title}>
            <Text style={S.sectionTitle}>{section.title}</Text>
            <View style={S.grid}>
              {section.items.map(f => (
                <TouchableOpacity
                  key={f.route}
                  style={S.card}
                  onPress={() => router.push(f.route as any)}
                  activeOpacity={0.75}
                >
                  <View style={[S.iconWrap, { backgroundColor: f.bg }]}>
                    <Ionicons name={f.icon as any} size={22} color={f.color} />
                  </View>
                  <Text style={S.cardTitle}>{f.title}</Text>
                  <Text style={S.cardSub}>{f.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Stack info */}
        <View style={S.infoCard}>
          <Text style={S.infoTitle}>Cortex Stack</Text>
          {[
            { icon: 'hardware-chip-outline',    color: Colors.primary,  text: 'AI: Granite 3.3:2b via Ollama (local)' },
            { icon: 'server-outline',           color: Colors.primary,  text: 'Backend: cortex-api (FastAPI + SQLite + sqlite-vec)' },
            { icon: 'shield-checkmark-outline', color: '#198038',       text: 'Security: OWASP Phase 1-3 implemented' },
            { icon: 'phone-portrait-outline',   color: Colors.primary,  text: 'Mobile: Expo + React Native (local-first)' },
            { icon: 'cube-outline',             color: '#8a3ffc',       text: 'IBM Bob: 5 MCP tools + mode + skill + commands + rules' },
            { icon: 'flash-outline',            color: '#f1c21b',       text: 'Automations: trigger rules on entry kinds' },
            { icon: 'calendar-outline',         color: '#0f62fe',       text: 'Calendar: schedule events and focus blocks' },
          ].map(item => (
            <View key={item.text} style={S.infoRow}>
              <Ionicons name={item.icon as any} size={15} color={item.color} />
              <Text style={S.infoText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  countBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47.5%', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 14, gap: 8 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#191b24' },
  cardSub: { fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 16 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 16, gap: 10 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#191b24', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 13, color: Colors.onSurface, flex: 1 },
});
