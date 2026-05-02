/**
 * Profile + AI Settings — with working Ollama setup and auto-detect.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  getProfile,
  getWellnessStats,
  logBreak,
  updateProfile,
  type Profile,
} from '../src/services/database';
import {
  checkOllamaHealth,
  getOllamaHost,
  isModelAvailable,
  pullModel,
  setOllamaHost,
} from '../src/services/llm';
import { getSessionStats } from '../src/services/memory';
import {
  checkApiHealth,
  getApiBase,
  getToken,
  setApiBase,
  setToken,
} from '../src/services/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ total: 0, byKind: {} as Record<string, number>, topTags: [] as string[] });
  const [wellness, setWellness] = useState({ breaks_today: 0, last_break_at: null as number | null });
  const [ollamaHost, setOllamaHostState] = useState('');  // keep for type compat
  const [hostInput, setHostInput] = useState('');
  const [llmStatus, setLlmStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [llmError, setLlmError] = useState('');
  const [modelAvailable, setModelAvailable] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState('');
  const [pullPercent, setPullPercent] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cortex API connection
  const [apiBase, setApiBaseState] = useState('');
  const [apiBaseInput, setApiBaseInput] = useState('');
  const [apiToken, setApiTokenState] = useState('');
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');

  const load = useCallback(async () => {
    const [p, s, w, host, base, tok] = await Promise.all([
      getProfile(),
      getSessionStats(),
      getWellnessStats(),
      getOllamaHost(),
      getApiBase(),
      getToken(),
    ]);
    setProfile(p);
    setStats(s);
    setWellness(w);
    setHostInput(host);
    setApiBaseState(base);
    setApiBaseInput(base);
    setApiTokenState(tok);
    setApiTokenInput(tok);
    if (host) runCheckLLM(host);
    if (base) checkApi(base);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const runCheckLLM = async (hostOverride?: string) => {
    setLlmStatus('checking');
    setLlmError('');
    setModelAvailable(false);
    const { online, error } = await checkOllamaHealth();
    setLlmStatus(online ? 'online' : 'offline');
    if (!online) {
      setLlmError(error ?? 'Cannot connect');
    } else {
      const avail = await isModelAvailable();
      setModelAvailable(avail);
    }
  };

  const handleConnect = async () => {
    const h = hostInput.trim();
    if (!h) {
      Alert.alert('Enter host', 'Please enter the Ollama host URL first.\nExample: http://192.168.1.5:11434');
      return;
    }
    await setOllamaHost(h);
    runCheckLLM(h);
  };

  const checkApi = async (base?: string) => {
    setApiStatus('checking');
    try {
      await checkApiHealth();
      setApiStatus('online');
    } catch {
      setApiStatus('offline');
    }
  };

  const handleApiConnect = async () => {
    const base = apiBaseInput.trim();
    const tok = apiTokenInput.trim();
    if (!base) { Alert.alert('Enter URL', 'Enter the cortex-api URL.\nExample: http://10.221.151.4:8080'); return; }
    if (!tok) { Alert.alert('Enter token', 'Enter your DIARY_TOKEN from .env'); return; }
    await setApiBase(base);
    await setToken(tok);
    setApiBaseState(base);
    setApiTokenState(tok);
    checkApi(base);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await updateProfile(profile);
    setSaving(false);
    setEditingProfile(false);
  };

  const handlePullModel = async () => {
    setPulling(true);
    setPullProgress('Connecting…');
    setPullPercent(0);
    const ok = await pullModel((status, percent) => {
      setPullProgress(status);
      setPullPercent(percent);
    });
    setPulling(false);
    if (ok) {
      setModelAvailable(true);
      Alert.alert('✅ Done!', 'Granite 3.3:2b is ready!\nGo to AI Chat to start talking.');
    } else {
      Alert.alert('Pull failed', 'Make sure Ollama is running and the host is correct.');
    }
  };

  const handleBreak = async () => {
    await logBreak();
    const w = await getWellnessStats();
    setWellness(w);
    Alert.alert('Break logged 🌿', 'Great job taking care of yourself!');
  };

  const statusColor =
    llmStatus === 'online' ? Colors.llmOnline
    : llmStatus === 'offline' ? Colors.llmOffline
    : llmStatus === 'checking' ? Colors.llmLoading
    : Colors.outline;

  const statusLabel =
    llmStatus === 'online' ? '● Connected'
    : llmStatus === 'offline' ? '● Disconnected'
    : llmStatus === 'checking' ? '● Checking…'
    : '● Not configured';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile?.name ?? '…'}</Text>
              <Text style={styles.profileHandle}>@{profile?.handle ?? '…'}</Text>
              {!!profile?.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}
            </View>
            <TouchableOpacity onPress={() => setEditingProfile(!editingProfile)} style={styles.iconBtn}>
              <Ionicons
                name={editingProfile ? 'checkmark-circle' : 'pencil-outline'}
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          {editingProfile && profile && (
            <View style={styles.editForm}>
              {(['name', 'handle', 'bio', 'timezone'] as const).map(field => (
                <View key={field} style={styles.editField}>
                  <Text style={styles.editLabel}>{field.toUpperCase()}</Text>
                  <TextInput
                    style={styles.editInput}
                    value={(profile as any)[field] ?? ''}
                    onChangeText={v => setProfile({ ...profile, [field]: v })}
                    autoCapitalize={field === 'bio' ? 'sentences' : 'none'}
                    placeholder={field}
                    placeholderTextColor={Colors.outline}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.primaryBtn} onPress={saveProfile} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.primaryBtnText}>Save Profile</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Entries', value: stats.total, color: Colors.primary },
            { label: 'Tags', value: stats.topTags.length, color: '#8a3ffc' },
            { label: 'Breaks', value: wellness.breaks_today, color: Colors.success },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Wellness */}
        <Text style={styles.sectionLabel}>Wellness</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Last break</Text>
              <Text style={styles.rowValue}>
                {wellness.last_break_at
                  ? new Date(wellness.last_break_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'None today'}
              </Text>
            </View>
            <TouchableOpacity style={styles.greenBtn} onPress={handleBreak}>
              <Ionicons name="leaf-outline" size={14} color="#fff" />
              <Text style={styles.greenBtnText}>Log Break</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cortex API Connection ── */}
        <Text style={styles.sectionLabel}>Cortex API (Backend)</Text>
        <View style={styles.card}>
          {/* Status */}
          <View style={[styles.row, styles.cardRow]}>
            <View style={[styles.statusIcon, {
              backgroundColor: apiStatus === 'online' ? '#defbe6' : apiStatus === 'offline' ? '#fff1f2' : '#fffbeb',
            }]}>
              <Ionicons
                name="server-outline"
                size={18}
                color={apiStatus === 'online' ? Colors.llmOnline : apiStatus === 'offline' ? Colors.llmOffline : Colors.llmLoading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>cortex-api</Text>
              <Text style={[styles.statusText, {
                color: apiStatus === 'online' ? Colors.llmOnline : apiStatus === 'offline' ? Colors.llmOffline : Colors.outline
              }]}>
                {apiStatus === 'online' ? '● Connected' : apiStatus === 'offline' ? '● Disconnected' : apiStatus === 'checking' ? '● Checking…' : '● Not configured'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => checkApi()} style={styles.iconBtn}>
              {apiStatus === 'checking'
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name="refresh-outline" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          </View>

          {/* API URL */}
          <View style={[styles.hostRow, styles.cardRow]}>
            <TextInput
              style={styles.hostInput}
              value={apiBaseInput}
              onChangeText={setApiBaseInput}
              placeholder="http://10.221.151.4:8080"
              placeholderTextColor={Colors.outline}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
            />
          </View>

          {/* Token */}
          <View style={[styles.hostRow, styles.cardRow]}>
            <TextInput
              style={styles.hostInput}
              value={apiTokenInput}
              onChangeText={setApiTokenInput}
              placeholder="DIARY_TOKEN (e.g. test)"
              placeholderTextColor={Colors.outline}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleApiConnect}
            />
            <TouchableOpacity style={styles.connectBtn} onPress={handleApiConnect}>
              <Text style={styles.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AI Settings ── */}
        <Text style={styles.sectionLabel}>AI — Granite 3.3:2b via Ollama</Text>
        <View style={styles.card}>

          {/* Status row */}
          <View style={[styles.row, styles.cardRow]}>
            <View style={[styles.statusIcon, {
              backgroundColor: llmStatus === 'online' ? '#defbe6'
                : llmStatus === 'offline' ? '#fff1f2' : '#fffbeb'
            }]}>
              <Ionicons
                name="hardware-chip-outline"
                size={18}
                color={statusColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Ollama Connection</Text>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              {!!llmError && <Text style={styles.errorText}>{llmError}</Text>}
            </View>
            <TouchableOpacity
              onPress={() => runCheckLLM()}
              disabled={llmStatus === 'checking'}
              style={styles.iconBtn}
            >
              {llmStatus === 'checking'
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Ionicons name="refresh-outline" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          </View>

          {/* Host input */}
          <View style={[styles.hostRow, styles.cardRow]}>
            <TextInput
              style={styles.hostInput}
              value={hostInput}
              onChangeText={setHostInput}
              placeholder="http://192.168.1.x:11434"
              placeholderTextColor={Colors.outline}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={handleConnect}
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
              <Text style={styles.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>

          {/* Model row — only when online */}
          {llmStatus === 'online' && (
            <View style={[styles.row, styles.cardRow]}>
              <Ionicons
                name={modelAvailable ? 'checkmark-circle' : 'cloud-download-outline'}
                size={18}
                color={modelAvailable ? Colors.llmOnline : Colors.onSurfaceVariant}
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.modelName}>granite3.3:2b</Text>
                <Text style={[styles.modelStatus, { color: modelAvailable ? Colors.llmOnline : Colors.llmOffline }]}>
                  {modelAvailable ? 'Ready to use' : 'Not downloaded yet'}
                </Text>
              </View>
              {!modelAvailable && !pulling && (
                <TouchableOpacity style={styles.pullBtn} onPress={handlePullModel}>
                  <Ionicons name="cloud-download-outline" size={13} color="#fff" />
                  <Text style={styles.pullBtnText}>Pull ~1.6 GB</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Pull progress */}
          {pulling && (
            <View style={[styles.cardRow, { gap: 6 }]}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pullPercent}%` as any }]} />
              </View>
              <Text style={styles.progressText}>
                {pullProgress}{pullPercent > 0 ? ` — ${pullPercent}%` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Setup Guide */}
        <Text style={styles.sectionLabel}>How to connect AI</Text>
        <View style={styles.card}>
          {[
            {
              n: '1',
              title: 'Install Ollama on your PC/Mac',
              body: 'Download from ollama.com',
            },
            {
              n: '2',
              title: 'Start Ollama with network access',
              body: 'Windows CMD:\nset OLLAMA_HOST=0.0.0.0 && ollama serve\n\nMac / Linux:\nOLLAMA_HOST=0.0.0.0 ollama serve',
              code: true,
            },
            {
              n: '3',
              title: 'Find your PC\'s local IP',
              body: 'Windows: ipconfig → IPv4 Address\nMac: ifconfig → inet under en0\n\nExample: 192.168.1.5',
            },
            {
              n: '4',
              title: 'Enter the host URL above',
              body: 'http://YOUR_IP:11434\ne.g. http://192.168.1.5:11434\n\nThen tap Connect.',
              code: true,
            },
            {
              n: '5',
              title: 'Pull the model',
              body: 'Tap "Pull ~1.6 GB" above, or run:\nollama pull granite3.3:2b',
              code: true,
            },
            {
              n: '6',
              title: 'Same WiFi required',
              body: 'Your phone and PC must be on the same WiFi network.',
            },
          ].map((item, idx, arr) => (
            <View
              key={item.n}
              style={[styles.stepRow, idx < arr.length - 1 && styles.stepRowBorder]}
            >
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{item.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={[styles.stepBody, item.code && styles.stepCode]}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5fb' },

  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#191b24', letterSpacing: -0.3 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.outline,
    textTransform: 'uppercase', letterSpacing: 0.6,
    paddingHorizontal: Spacing.md, marginBottom: 6, marginTop: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },

  // Profile
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  profileName: { fontSize: 17, fontWeight: '700', color: '#191b24' },
  profileHandle: { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 1 },
  profileBio: { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  iconBtn: { padding: 6 },
  editForm: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outlineVariant, gap: 10 },
  editField: { gap: 3 },
  editLabel: { fontSize: 10, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 },
  editInput: {
    fontSize: 14, color: '#191b24',
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
    paddingVertical: 6,
  },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant,
    padding: 12, alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 },

  // Generic row
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  rowLabel: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase' },
  rowValue: { fontSize: 15, fontWeight: '600', color: '#191b24', marginTop: 2 },

  // Wellness
  greenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  greenBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // AI status
  statusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  statusText: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  errorText: { fontSize: 11, color: Colors.error, marginTop: 2 },

  // Host input
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostInput: {
    flex: 1, fontSize: 13, color: '#191b24',
    backgroundColor: '#f4f5fb', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    fontFamily: 'monospace',
  },
  connectBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  connectBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Model
  modelName: { fontSize: 13, fontWeight: '600', color: '#191b24', fontFamily: 'monospace' },
  modelStatus: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  pullBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  pullBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Progress
  progressBar: { height: 6, backgroundColor: Colors.outlineVariant, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { fontSize: 11, color: Colors.onSurfaceVariant },

  // Steps
  stepRow: { flexDirection: 'row', gap: 10, padding: 12 },
  stepRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#191b24', marginBottom: 3 },
  stepBody: { fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18 },
  stepCode: {
    fontFamily: 'monospace', fontSize: 11, color: '#191b24',
    backgroundColor: '#f0f0f8', padding: 6, borderRadius: 4, marginTop: 3,
    overflow: 'hidden',
  },
});
