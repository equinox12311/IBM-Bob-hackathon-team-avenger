/**
 * More — hub for all secondary features not in the main tab bar.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';

interface FeatureItem {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  route: string;
}

const FEATURES: FeatureItem[] = [
  {
    title: 'GitHub Velocity',
    subtitle: 'Contribution heatmap',
    icon: 'git-branch-outline',
    color: '#da1e28',
    bg: '#ffdad6',
    route: '/github',
  },
  {
    title: 'Timeline',
    subtitle: 'All entries chronologically',
    icon: 'time-outline',
    color: '#0f62fe',
    bg: '#dbe1ff',
    route: '/timeline',
  },
  {
    title: 'Idea Mapper',
    subtitle: 'Visual grid of your ideas',
    icon: 'bulb-outline',
    color: '#8a3ffc',
    bg: '#e8daff',
    route: '/ideas',
  },
  {
    title: 'Analytics',
    subtitle: 'Session stats & focus timer',
    icon: 'bar-chart-outline',
    color: '#198038',
    bg: '#defbe6',
    route: '/analytics',
  },
  {
    title: 'Daily Report',
    subtitle: 'Aggregated entry highlights',
    icon: 'document-text-outline',
    color: '#0f62fe',
    bg: '#dbe1ff',
    route: '/report',
  },
  {
    title: 'Touch Grass',
    subtitle: 'Break tracker & wellness',
    icon: 'leaf-outline',
    color: '#198038',
    bg: '#defbe6',
    route: '/wellness',
  },
  {
    title: 'Automations',
    subtitle: 'Trigger rules on entry kinds',
    icon: 'flash-outline',
    color: '#f1c21b',
    bg: '#fdf6dd',
    route: '/automations',
  },
  {
    title: 'Profile & Settings',
    subtitle: 'Account, AI & API config',
    icon: 'person-circle-outline',
    color: '#5d5f5f',
    bg: '#e0e0e0',
    route: '/profile',
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>More Features</Text>
        <Text style={S.headerSub}>All Cortex capabilities</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 10 }}
      >
        {/* Feature grid — 2 columns */}
        <View style={S.grid}>
          {FEATURES.map(f => (
            <TouchableOpacity
              key={f.route}
              style={S.featureCard}
              onPress={() => router.push(f.route as any)}
              activeOpacity={0.75}
            >
              <View style={[S.featureIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon as any} size={24} color={f.color} />
              </View>
              <Text style={S.featureTitle}>{f.title}</Text>
              <Text style={S.featureSub}>{f.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick stats */}
        <View style={S.infoCard}>
          <View style={S.infoRow}>
            <Ionicons name="hardware-chip-outline" size={16} color={Colors.primary} />
            <Text style={S.infoText}>AI powered by Granite 3.3:2b via Ollama</Text>
          </View>
          <View style={S.infoRow}>
            <Ionicons name="server-outline" size={16} color={Colors.primary} />
            <Text style={S.infoText}>Backend: cortex-api (FastAPI + SQLite)</Text>
          </View>
          <View style={S.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.success} />
            <Text style={S.infoText}>Secret detection on all entries</Text>
          </View>
          <View style={S.infoRow}>
            <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
            <Text style={S.infoText}>Local-first: works offline with SQLite</Text>
          </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 16,
    gap: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#191b24' },
  featureSub: { fontSize: 11, color: Colors.onSurfaceVariant, lineHeight: 16 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 16,
    gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 13, color: Colors.onSurface, flex: 1 },
});
