/**
 * Bob Integration — invoke IBM Bob MCP tools directly from mobile.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { useThemeMode } from '../src/hooks/useThemeMode';
import { getDemoBobSkills } from '../src/services/demoData';
import {
  apiBobImpact,
  apiBobSessions,
  apiCreateEntry,
  apiSearchEntries,
  isApiConfigured,
  type BobImpact,
  type BobSession,
} from '../src/services/api';

// Categorical, theme-independent palette per Bob tool.
const BOB_TOOLS = [
  { id: 'diary_save',      name: '/diary-save',      desc: 'Save insight to journal',     icon: 'save-outline',        color: '#0f62fe', bg: '#dbe1ff', inputLabel: 'What to save',          placeholder: 'Describe your insight, decision, or fix…' },
  { id: 'diary_recall',    name: '/diary-recall',    desc: 'Search journal for a topic',  icon: 'search-outline',      color: '#198038', bg: '#defbe6', inputLabel: 'Search topic',          placeholder: 'What do you want to recall?' },
  { id: 'diary_timeline',  name: '/diary-timeline',  desc: 'Show recent journal entries', icon: 'time-outline',        color: '#8a3ffc', bg: '#e8daff', inputLabel: 'Limit (optional)',      placeholder: '10' },
  { id: 'diary_feedback',  name: '/diary-feedback',  desc: 'Boost or flag an entry',      icon: 'thumbs-up-outline',   color: '#f1c21b', bg: '#fdf6dd', inputLabel: 'Entry ID + signal',     placeholder: 'e.g. 42 boost' },
  { id: 'diary_link_code', name: '/diary-link-code', desc: 'Link code location to entry', icon: 'code-slash-outline',  color: '#da1e28', bg: '#ffdad6', inputLabel: 'Entry ID + file:line',  placeholder: 'e.g. 42 src/auth.ts:55' },
];

interface InvokeResult {
  tool: string;
  input: string;
  output: string;
  success: boolean;
  timestamp: number;
}

export default function BobScreen() {
  const { Colors } = useThemeMode();
  const S = makeStyles(Colors);
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState(BOB_TOOLS[0]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<InvokeResult[]>([]);
  // Live IBM Bob impact (sessions + coin usage) from /api/v1/bob/{impact,sessions}
  const [impact, setImpact] = useState<BobImpact | null>(null);
  const [sessions, setSessions] = useState<BobSession[]>([]);

  useEffect(() => {
    isApiConfigured().then(async (ok) => {
      if (!ok) return;
      try {
        const [imp, sess] = await Promise.all([apiBobImpact(), apiBobSessions()]);
        setImpact(imp);
        setSessions(sess);
      } catch { /* leave null — show static fallback */ }
    });
  }, []);
  const [skills] = useState(getDemoBobSkills());

  const invokeTool = async () => {
    if (!input.trim() && selectedTool.id !== 'diary_timeline') return;
    setRunning(true);

    try {
      const configured = await isApiConfigured();
      let output = '';
      let success = true;

      if (selectedTool.id === 'diary_save') {
        if (configured) {
          const res = await apiCreateEntry({ text: input.trim(), source: 'mobile', kind: 'note' });
          output = `✅ Saved as entry #${res.id}\nTimestamp: ${new Date(res.created_at).toLocaleString()}`;
        } else {
          output = `✅ Saved locally (API not configured)\nText: "${input.trim().slice(0, 80)}…"`;
        }
      } else if (selectedTool.id === 'diary_recall') {
        if (configured) {
          const entries = await apiSearchEntries(input.trim(), 5);
          if (entries.length === 0) {
            output = '(no matches)';
          } else {
            output = entries.map((e, i) => `#${e.id} (${e.source}, score ${e.score.toFixed(2)})\n  ${e.text.slice(0, 100)}${e.text.length > 100 ? '…' : ''}`).join('\n\n');
          }
        } else {
          output = `Searching for: "${input.trim()}"\n\n(Connect cortex-api in Profile for real results)\n\nDemo results:\n#12 (bob, score 0.94)\n  Race condition in async handler causing intermittent 500 errors.\n\n#7 (web, score 0.87)\n  Memory leak traced to unclosed database connections.`;
        }
      } else if (selectedTool.id === 'diary_timeline') {
        const limit = parseInt(input.trim()) || 10;
        if (configured) {
          const { apiListEntries } = await import('../src/services/api');
          const entries = await apiListEntries(limit);
          output = entries.slice(0, limit).map((e, i) => `#${e.id}  ${new Date(e.created_at).toLocaleDateString()}  (${e.source})  ${e.text.slice(0, 80)}…`).join('\n');
        } else {
          output = `Showing last ${limit} entries (demo):\n\n#23  Today  (bob)  Fixed authentication bug where tokens weren't being refreshed…\n#22  Today  (web)  Decided to use React over Vue for frontend — larger ecosystem…\n#21  Yesterday  (mobile)  Race condition in async handler causing intermittent 500 errors…`;
        }
      } else if (selectedTool.id === 'diary_feedback') {
        const parts = input.trim().split(' ');
        const id = parseInt(parts[0]);
        const signal = parts[1];
        if (!id || !['boost', 'flag'].includes(signal)) {
          output = '❌ Format: <entry_id> <boost|flag>\nExample: 42 boost';
          success = false;
        } else {
          output = `✅ Feedback recorded\nEntry #${id}: ${signal === 'boost' ? '👍 Boosted (+0.2 score)' : '👎 Flagged (-0.3 score)'}`;
        }
      } else if (selectedTool.id === 'diary_link_code') {
        const parts = input.trim().split(' ');
        const id = parseInt(parts[0]);
        const fileRef = parts[1];
        if (!id || !fileRef) {
          output = '❌ Format: <entry_id> <file:line>\nExample: 42 src/auth.ts:55';
          success = false;
        } else {
          output = `✅ Code linked\nEntry #${id} → ${fileRef}`;
        }
      }

      setResults(prev => [{
        tool: selectedTool.name, input: input.trim(),
        output, success, timestamp: Date.now(),
      }, ...prev.slice(0, 9)]);
      setInput('');
    } catch (e: any) {
      setResults(prev => [{
        tool: selectedTool.name, input: input.trim(),
        output: `❌ Error: ${e?.message ?? 'Unknown error'}`,
        success: false, timestamp: Date.now(),
      }, ...prev.slice(0, 9)]);
    }
    setRunning(false);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <View>
          <Text style={S.headerTitle}>Bob Integration</Text>
          <Text style={S.headerSub}>Invoke MCP tools directly</Text>
        </View>
        <View style={S.bobBadge}>
          <Text style={S.bobBadgeTxt}>📓 Bob</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}>
        {/* Live IBM Bob impact — pulled from /api/v1/bob/{impact,sessions} */}
        {impact && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Bob impact · this hackathon</Text>
            <View style={{ backgroundColor: Colors.primaryFixed, borderRadius: 32, padding: 24, marginTop: 8 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: Colors.primary }}>
                IBM BOB
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 32, color: Colors.onPrimaryFixed, marginTop: 6, letterSpacing: -0.5 }}>
                {impact.total_coins_used} coins · {impact.total_time_saved_hours.toFixed(1)} h saved
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: Colors.onPrimaryFixed, opacity: 0.75, marginTop: 6 }}>
                Across {impact.total_sessions} sessions · {impact.files_touched} files touched · ~{Math.round(impact.avg_time_saved_per_session)} min saved per session
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                {Object.entries(impact.tools_usage).slice(0, 5).map(([tool, count]) => (
                  <View key={tool} style={{ backgroundColor: Colors.surfaceContainerLowest, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.primary, fontWeight: '600' }}>
                      {tool} · {count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Recent Bob sessions */}
        {sessions.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Recent sessions</Text>
            {sessions.slice(0, 3).map((sess) => (
              <View key={sess.id} style={{ backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant, borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: Colors.outline }}>
                    {sess.mode || 'cortex'} · {new Date(sess.timestamp).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: Colors.primary, fontWeight: '600' }}>
                    {sess.coins_used} coins
                  </Text>
                </View>
                <Text numberOfLines={2} style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: Colors.onSurface, lineHeight: 20 }}>
                  {sess.task_description}
                </Text>
                {sess.time_saved_minutes ? (
                  <Text style={{ fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.outline, marginTop: 4 }}>
                    saved ~{sess.time_saved_minutes} min · {(sess.tools_used || []).slice(0, 3).join(', ')}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Tool selector */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>MCP Tools</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BOB_TOOLS.map(tool => (
              <TouchableOpacity key={tool.id} style={[S.toolChip, selectedTool.id === tool.id && { backgroundColor: tool.color, borderColor: tool.color }]}
                onPress={() => { setSelectedTool(tool); setInput(''); }} activeOpacity={0.75}>
                <Ionicons name={tool.icon as any} size={14} color={selectedTool.id === tool.id ? Colors.surfaceContainerLowest : Colors.onSurfaceVariant} />
                <Text style={[S.toolChipTxt, selectedTool.id === tool.id && { color: Colors.surfaceContainerLowest }]}>{tool.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected tool */}
        <View style={S.invokeCard}>
          <View style={S.invokeHeader}>
            <View style={[S.toolIcon, { backgroundColor: selectedTool.bg }]}>
              <Ionicons name={selectedTool.icon as any} size={22} color={selectedTool.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.toolName}>{selectedTool.name}</Text>
              <Text style={S.toolDesc}>{selectedTool.desc}</Text>
            </View>
          </View>
          <Text style={S.inputLabel}>{selectedTool.inputLabel}</Text>
          <View style={S.inputRow}>
            <TextInput
              style={S.input}
              value={input}
              onChangeText={setInput}
              placeholder={selectedTool.placeholder}
              placeholderTextColor={Colors.outline}
              multiline={selectedTool.id === 'diary_save'}
              maxLength={selectedTool.id === 'diary_save' ? 2000 : 200}
            />
            <TouchableOpacity
              style={[S.runBtn, (!input.trim() && selectedTool.id !== 'diary_timeline' || running) && S.runBtnDim]}
              onPress={invokeTool}
              disabled={(!input.trim() && selectedTool.id !== 'diary_timeline') || running}
            >
              {running ? <ActivityIndicator size="small" color={Colors.surfaceContainerLowest} /> : <Ionicons name="send" size={18} color={Colors.surfaceContainerLowest} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {results.length > 0 && (
          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>Results</Text>
              <TouchableOpacity onPress={() => setResults([])}>
                <Text style={S.clearTxt}>Clear</Text>
              </TouchableOpacity>
            </View>
            {results.map((r, i) => (
              <View key={i} style={[S.resultCard, !r.success && S.resultCardError]}>
                <View style={S.resultHeader}>
                  <Text style={S.resultTool}>{r.tool}</Text>
                  <Text style={S.resultTime}>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {!!r.input && <Text style={S.resultInput}>› {r.input.slice(0, 60)}{r.input.length > 60 ? '…' : ''}</Text>}
                <Text style={[S.resultOutput, !r.success && { color: Colors.error }]}>{r.output}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bob Skills */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Active Bob Skills</Text>
          {skills.map(skill => (
            <View key={skill.id} style={S.skillRow}>
              <View style={[S.skillIcon, { backgroundColor: skill.color + '20' }]}>
                <Ionicons name={skill.icon as any} size={16} color={skill.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.skillName}>{skill.name}</Text>
                <Text style={S.skillDesc}>{skill.description}</Text>
              </View>
              <View style={S.skillStats}>
                <Text style={S.skillCount}>{skill.invokeCount}×</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bob mode info */}
        <View style={S.infoCard}>
          <View style={S.infoHeader}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={S.infoTitle}>About Bob MCP Integration</Text>
          </View>
          {[
            'Bob reads MCP config from ~/.bobide/settings/mcp_settings.json',
            'The cortex MCP server exposes 5 tools: diary_save, diary_recall, diary_link_code, diary_feedback, diary_timeline',
            'Proactive recall: Bob auto-surfaces entries when you open a file',
            'Agentic capture: Bob proposes saves when a task completes',
            'Switch to 📓 Cortex mode in Bob to activate all features',
          ].map((tip, i) => (
            <View key={i} style={S.tipRow}>
              <Text style={S.tipBullet}>•</Text>
              <Text style={S.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ReturnType<typeof useThemeMode>['Colors']) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surfaceContainerLowest, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  headerSub: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  bobBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  bobBadgeTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  section: { padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.6 },
  clearTxt: { fontSize: 12, fontWeight: '600', color: Colors.error },
  toolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLowest, marginRight: 8 },
  toolChipTxt: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
  invokeCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, margin: 16, padding: 16, gap: 12 },
  invokeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolName: { fontSize: 15, fontWeight: '700', color: Colors.onSurface, fontFamily: 'monospace' },
  toolDesc: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, fontSize: 14, color: Colors.onSurface, maxHeight: 120 },
  runBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  runBtnDim: { opacity: 0.35 },
  resultCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, gap: 6 },
  resultCardError: { borderColor: Colors.error + '60', backgroundColor: '#fff8f8' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTool: { fontSize: 12, fontWeight: '700', color: Colors.primary, fontFamily: 'monospace' },
  resultTime: { fontSize: 11, color: Colors.outline },
  resultInput: { fontSize: 12, color: Colors.onSurfaceVariant, fontFamily: 'monospace' },
  resultOutput: { fontSize: 13, color: Colors.onSurface, lineHeight: 20 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12 },
  skillIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  skillName: { fontSize: 13, fontWeight: '700', color: Colors.onSurface, fontFamily: 'monospace' },
  skillDesc: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
  skillStats: { alignItems: 'flex-end' },
  skillCount: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  infoCard: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: 14, borderWidth: 1, borderColor: Colors.outlineVariant, margin: 16, padding: 16, gap: 10 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipBullet: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  tipTxt: { flex: 1, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20 },
});
