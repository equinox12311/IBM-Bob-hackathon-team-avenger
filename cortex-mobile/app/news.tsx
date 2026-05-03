/**
 * Developer News — curated feed (mock data, mirrors web DeveloperNews).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { useThemeMode } from '../src/hooks/useThemeMode';

interface Article {
  id: string;
  title: string;
  source: string;
  readTime: string;
  category: string;
  saved: boolean;
  summary: string;
}

const ARTICLES: Article[] = [
  { id: '1', title: 'GitHub Copilot Enterprise is now generally available', source: 'GitHub Changelog', readTime: '5 min', category: 'GitHub', saved: false, summary: 'GitHub announces general availability of Copilot Enterprise with advanced features for large organizations.' },
  { id: '2', title: '10 React Hooks you should start using today', source: 'Dev.to', readTime: '8 min', category: 'Dev.to', saved: false, summary: 'A comprehensive guide to modern React hooks that can dramatically improve your component architecture.' },
  { id: '3', title: 'IBM Granite 3.3 achieves state-of-the-art on coding benchmarks', source: 'IBM Research', readTime: '6 min', category: 'AI/ML', saved: false, summary: 'IBM\'s latest Granite model shows significant improvements in code generation and understanding tasks.' },
  { id: '4', title: 'TypeScript 5.5 brings major performance improvements', source: 'TypeScript Blog', readTime: '4 min', category: 'Dev.to', saved: false, summary: 'The latest TypeScript release focuses on compilation speed and new type inference capabilities.' },
  { id: '5', title: 'Building production-ready MCP servers with Python', source: 'Hacker News', readTime: '12 min', category: 'Hacker News', saved: false, summary: 'A deep dive into creating robust Model Context Protocol servers for AI agent integration.' },
  { id: '6', title: 'The future of AI-assisted development with IBM Bob', source: 'IBM Developer', readTime: '7 min', category: 'GitHub', saved: false, summary: 'How IBM Bob is changing the way enterprise developers write, review, and ship code.' },
  { id: '7', title: 'SQLite in 2026: The database that runs everywhere', source: 'Hacker News', readTime: '9 min', category: 'Hacker News', saved: false, summary: 'SQLite continues to dominate embedded databases with new features for vector search and JSON.' },
  { id: '8', title: 'FastAPI vs Django REST: Which to choose in 2026?', source: 'Dev.to', readTime: '10 min', category: 'Dev.to', saved: false, summary: 'A detailed comparison of the two most popular Python web frameworks for building APIs.' },
];

const FILTERS = ['All', 'GitHub', 'Dev.to', 'Hacker News', 'AI/ML'];
const CATEGORY_COLORS: Record<string, string> = {
  'GitHub': '#198038', 'Dev.to': '#0f62fe', 'Hacker News': '#da1e28', 'AI/ML': '#8a3ffc', 'IBM Developer': '#0f62fe',
};

export default function NewsScreen() {
  const { Colors } = useThemeMode();
  const S = makeStyles(Colors);
  const router = useRouter();
  const [articles, setArticles] = useState(ARTICLES);
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? articles : articles.filter(a => a.category === filter);

  const toggleSave = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, saved: !a.saved } : a));
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Developer News</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[S.filterChip, filter === f && S.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[S.filterChipText, filter === f && S.filterChipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 16, gap: 12 }}>
        {filtered.map(article => (
          <View key={article.id} style={S.articleCard}>
            {/* Color bar by category */}
            <View style={[S.categoryBar, { backgroundColor: CATEGORY_COLORS[article.category] ?? Colors.primary }]} />
            <View style={S.articleBody}>
              <View style={S.articleTop}>
                <View style={[S.sourceBadge, { backgroundColor: (CATEGORY_COLORS[article.category] ?? Colors.primary) + '20' }]}>
                  <Text style={[S.sourceText, { color: CATEGORY_COLORS[article.category] ?? Colors.primary }]}>{article.source}</Text>
                </View>
                <View style={S.articleMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.outline} />
                  <Text style={S.readTime}>{article.readTime} read</Text>
                </View>
              </View>
              <Text style={S.articleTitle}>{article.title}</Text>
              <Text style={S.articleSummary} numberOfLines={2}>{article.summary}</Text>
              <View style={S.articleFooter}>
                <TouchableOpacity style={S.readBtn}>
                  <Text style={S.readBtnText}>Read more</Text>
                  <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleSave(article.id)} style={S.saveBtn}>
                  <Ionicons
                    name={article.saved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={article.saved ? Colors.primary : Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="newspaper-outline" size={40} color={Colors.outlineVariant} />
            <Text style={{ fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 8 }}>No articles in this category</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ReturnType<typeof useThemeMode>['Colors']) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  filterRow: { maxHeight: 44, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff', marginRight: 6 },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant },
  filterChipTextActive: { color: '#fff' },
  articleCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  categoryBar: { width: 4 },
  articleBody: { flex: 1, padding: 14 },
  articleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  sourceText: { fontSize: 11, fontWeight: '700' },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  readTime: { fontSize: 11, color: Colors.outline },
  articleTitle: { fontSize: 15, fontWeight: '700', color: '#191b24', lineHeight: 22, marginBottom: 6 },
  articleSummary: { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19, marginBottom: 10 },
  articleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  saveBtn: { padding: 4 },
});
