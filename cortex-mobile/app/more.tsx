/**
 * More — hub for all secondary features.
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
      { title: 'Timeline',       subtitle: 'All entries chronologically',    icon: 'time-outline',            color: '#0f62fe', bg: '#dbe1ff', route: '/timeline' },
      { title: 'Idea Mapper',    subtitle: 'Visual grid of your ideas',      icon: 'bulb-outline',            color: '#8a3ffc', bg: '#e8daff', route: '/ideas' },
      { title: 'Search',         subtitle: 'Semantic & keyword search',      icon: 'search-outline',          color: '#198038', bg: '#defbe6', route: '/search' },
    ],
  },
  {
    title: 'AI & Intelligence',
    items: [
      { title: 'AI Chat',        subtitle: 'Chat with Granite 3.3:2b',       icon: 'chatbubble-ellipses-outline', color: '#0f62fe', bg: '#dbe1ff', route: '/chat' },
      { title: 'Debug Helper',   subtitle: 'AI-powered debugging assistant', icon: 'bug-outline',             color: '#da1e28', bg: '#ffdad6', route: '/debug' },
      { title: 'Dev Identity',   subtitle: 'Knowledge graph & profile',      icon: 'person-circle-outline',   color: '#8a3ffc', bg: '#e8daff', route: '/identity' },
    ],
  },
  {
    title: 'Analytics & Reports',
    items: [
      { title: 'Analytics',      subtitle: 'Session stats & focus timer',    icon: 'bar-chart-outline',       color: '#198038', bg: '#defbe6', route: '/analytics' },
      { title: 'Daily Report',   subtitle: '1d / 7d / 30d highlights',       icon: 'document-text-outline',   color: '#0f62fe', bg: '#dbe1ff', route: '/report' },
      { title: 'GitHub Velocity',subtitle: 'Contribution heatmap',           icon: 'git-branch-outline',      color: '#da1e28', bg: '#ffdad6', route: '/github' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { title: 'Automations',    subtitle: 'Trigger rules on entry kinds',   icon: 'flash-outline',           color: '#f1c21b', bg: '#fdf6dd', route: '/automations' },
      { title: 'Touch Grass',    subtitle: 'Break tracker & wellness',       icon: 'leaf-outline',            color: '#198038', bg: '#defbe6', route: '/wellness' },
      { title: 'Dev News',       subtitle: 'Curated developer articles',     icon: 'newspaper-outline',       color: '#5d5f5f', bg: '#e0e0e0', route: '/news' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Profile',        subtitle: 'Account, AI & API config',       icon: 'settings-outline',        color: '#5d5f5f', bg: '#e0e0e0', route: '/profile' },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>All Features</Text>
        <Text style={S.headerSub}>Everything Cortex can do</Text>
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

        {/* Info card */}
        <View style={S.infoCard}>
          <Text style={S.infoTitle}>About Cortex</Text>
          {[
            { icon: 'hardware-chip-outline', text: 'AI: Granite 3.3:2b via Ollama (local)' },
            { icon: 'server-outline',        text: 'Backend: cortex-api (FastAPI + SQLite)' },
            { icon: 'shield-checkmark-outline', text: 'Secret detection on all entries' },
            { icon: 'phone-portrait-outline', text: 'Local-first: works offline with SQLite' },
            { icon: 'cube-outline',          text: 'IBM Bob MCP integration (5 tools)' },
          ].map(item => (
            <View key={item.text} style={S.infoRow}>
              <Ionicons name={item.icon as any} size={15} color={Colors.primary} />
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
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
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
