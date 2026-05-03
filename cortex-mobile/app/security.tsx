/**
 * Security Dashboard — beautiful OWASP security status with all features.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../src/constants/layout';
import { Colors } from '../src/constants/theme';

const SECURITY_FEATURES = [
  { id: 'auth',       title: 'Bearer Token Auth',        desc: 'All API endpoints protected with bearer token authentication', status: 'active',   layer: 'backend',  icon: 'key-outline',              color: '#198038' },
  { id: 'secrets',    title: 'Secret Detection',         desc: '11 patterns + entropy heuristic. Blocks AWS keys, GitHub tokens, JWTs, private keys', status: 'active', layer: 'backend', icon: 'shield-checkmark-outline', color: '#198038' },
  { id: 'cors',       title: 'CORS Tightening',          desc: 'Production: only cortex.dev + localhost:5173. Dev: wildcard', status: 'active',   layer: 'backend',  icon: 'globe-outline',            color: '#198038' },
  { id: 'headers',    title: 'Security Headers',         desc: 'X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy, HSTS', status: 'active', layer: 'backend', icon: 'lock-closed-outline', color: '#198038' },
  { id: 'ratelimit',  title: 'Server-Side Rate Limiting',desc: 'Per-IP sliding window: 60 req/min default, 20 creates/min, 30 searches/min, 10 LLM/min', status: 'active', layer: 'backend', icon: 'speedometer-outline', color: '#198038' },
  { id: 'pydantic',   title: 'Input Validation (Pydantic)',desc: 'All API inputs validated with Pydantic models. Type safety enforced at runtime', status: 'active', layer: 'backend', icon: 'checkmark-circle-outline', color: '#198038' },
  { id: 'encrypt',    title: 'Token Encryption',         desc: 'XOR cipher with browser fingerprint. Tokens never stored in plaintext', status: 'active',   layer: 'frontend', icon: 'lock-open-outline',        color: '#f1c21b' },
  { id: 'csp',        title: 'Content Security Policy',  desc: 'CSP headers prevent XSS and malicious script injection', status: 'active',   layer: 'frontend', icon: 'shield-outline',           color: '#198038' },
  { id: 'validation', title: 'Input Validation (Client)', desc: 'Query length, entry ID, API URL validation before any API call', status: 'active',   layer: 'frontend', icon: 'filter-outline',           color: '#198038' },
  { id: 'csrf',       title: 'CSRF Protection',          desc: 'Double-submit cookie pattern. Token regenerated on login/logout', status: 'active',   layer: 'frontend', icon: 'finger-print-outline',     color: '#198038' },
  { id: 'ratelimitfe','title': 'Client-Side Rate Limiting', desc: 'Sliding window: search 10/min, API 30/min, entries 5/min', status: 'active',   layer: 'frontend', icon: 'timer-outline',            color: '#198038' },
  { id: 'errorsanitize','title': 'Error Sanitization',   desc: 'Production: generic error messages. Dev: full details. Prevents info disclosure', status: 'active', layer: 'frontend', icon: 'eye-off-outline', color: '#198038' },
  { id: 'botguard',   title: 'Bot Secret Guard',         desc: 'Client-side secret detection in Telegram bot before API round-trip', status: 'active',   layer: 'bot',      icon: 'chatbubble-outline',       color: '#198038' },
  { id: 'https',      title: 'HTTPS Enforcement',        desc: 'Production requires HTTPS. HTTP blocked in prod mode', status: 'partial',  layer: 'frontend', icon: 'lock-closed-outline',      color: '#f1c21b' },
  { id: 'audit',      title: 'Audit Logging',            desc: 'Request/response audit trail for security forensics', status: 'planned',  layer: 'backend',  icon: 'document-text-outline',    color: '#da1e28' },
  { id: 'mfa',        title: 'Multi-Factor Auth',        desc: 'Second authentication factor for enhanced security', status: 'planned',  layer: 'backend',  icon: 'phone-portrait-outline',   color: '#da1e28' },
];

const OWASP_COVERAGE = [
  { id: 'A01', name: 'Broken Access Control',    status: 'mitigated',  note: 'Bearer token on all endpoints' },
  { id: 'A02', name: 'Cryptographic Failures',   status: 'partial',    note: 'Token encrypted (XOR cipher)' },
  { id: 'A03', name: 'Injection',                status: 'mitigated',  note: 'Pydantic + parameterized queries' },
  { id: 'A04', name: 'Insecure Design',          status: 'mitigated',  note: 'Threat model documented' },
  { id: 'A05', name: 'Security Misconfiguration',status: 'mitigated',  note: 'CORS tightened, security headers' },
  { id: 'A06', name: 'Vulnerable Components',    status: 'partial',    note: 'Dependency scanning recommended' },
  { id: 'A07', name: 'Auth Failures',            status: 'partial',    note: 'Token + rate limiting, no MFA' },
  { id: 'A08', name: 'Software Integrity',       status: 'partial',    note: 'No audit logging yet' },
  { id: 'A09', name: 'Logging Failures',         status: 'planned',    note: 'Structured security logging TODO' },
  { id: 'A10', name: 'SSRF',                     status: 'na',         note: 'No outbound requests from backend' },
];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  active:    { color: '#198038', bg: '#defbe6', label: 'Active' },
  partial:   { color: '#f1c21b', bg: '#fdf6dd', label: 'Partial' },
  planned:   { color: '#da1e28', bg: '#ffdad6', label: 'Planned' },
  mitigated: { color: '#198038', bg: '#defbe6', label: 'Mitigated' },
  na:        { color: '#5d5f5f', bg: '#e0e0e0', label: 'N/A' },
};

const LAYER_COLORS: Record<string, string> = {
  backend: '#0f62fe', frontend: '#8a3ffc', bot: '#198038',
};

export default function SecurityScreen() {
  const router = useRouter();
  const [layerFilter, setLayerFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = SECURITY_FEATURES.filter(f => f.status === 'active').length;
  const partial = SECURITY_FEATURES.filter(f => f.status === 'partial').length;
  const planned = SECURITY_FEATURES.filter(f => f.status === 'planned').length;
  const score = Math.round((active + partial * 0.5) / SECURITY_FEATURES.length * 100);

  const filtered = layerFilter === 'all' ? SECURITY_FEATURES : SECURITY_FEATURES.filter(f => f.layer === layerFilter);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Security Dashboard</Text>
        <View style={[S.scoreBadge, { backgroundColor: score >= 80 ? '#defbe6' : '#fdf6dd' }]}>
          <Text style={[S.scoreTxt, { color: score >= 80 ? '#198038' : '#f1c21b' }]}>{score}%</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}>
        {/* Score card */}
        <View style={S.scoreCard}>
          <View style={S.scoreLeft}>
            <Text style={S.scoreTitle}>Security Score</Text>
            <Text style={S.scoreSubtitle}>OWASP Top 10 compliance</Text>
            <View style={S.scoreBar}>
              <View style={[S.scoreBarFill, { width: `${score}%` as any, backgroundColor: score >= 80 ? '#198038' : '#f1c21b' }]} />
            </View>
          </View>
          <View style={S.scoreCircle}>
            <Text style={[S.scoreNum, { color: score >= 80 ? '#198038' : '#f1c21b' }]}>{score}</Text>
            <Text style={S.scorePercent}>%</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={S.statsRow}>
          {[
            { label: 'Active', value: active, color: '#198038', bg: '#defbe6' },
            { label: 'Partial', value: partial, color: '#f1c21b', bg: '#fdf6dd' },
            { label: 'Planned', value: planned, color: '#da1e28', bg: '#ffdad6' },
            { label: 'Total', value: SECURITY_FEATURES.length, color: Colors.primary, bg: Colors.primaryLight },
          ].map(s => (
            <View key={s.label} style={[S.statCard, { backgroundColor: s.bg }]}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[S.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Layer filter */}
        <View style={S.filterRow}>
          {['all', 'backend', 'frontend', 'bot'].map(l => (
            <TouchableOpacity key={l} style={[S.filterChip, layerFilter === l && S.filterChipActive]} onPress={() => setLayerFilter(l)}>
              <Text style={[S.filterChipTxt, layerFilter === l && S.filterChipTxtActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features list */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Security Features</Text>
          {filtered.map(f => {
            const sm = STATUS_META[f.status];
            const isExpanded = expandedId === f.id;
            return (
              <TouchableOpacity key={f.id} style={S.featureCard} onPress={() => setExpandedId(isExpanded ? null : f.id)} activeOpacity={0.85}>
                <View style={S.featureTop}>
                  <View style={[S.featureIcon, { backgroundColor: f.color + '20' }]}>
                    <Ionicons name={f.icon as any} size={18} color={f.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.featureTitle}>{f.title}</Text>
                    <View style={S.featureMeta}>
                      <View style={[S.layerBadge, { backgroundColor: LAYER_COLORS[f.layer] + '20' }]}>
                        <Text style={[S.layerTxt, { color: LAYER_COLORS[f.layer] }]}>{f.layer}</Text>
                      </View>
                      <View style={[S.statusBadge, { backgroundColor: sm.bg }]}>
                        <Text style={[S.statusTxt, { color: sm.color }]}>{sm.label}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.outline} />
                </View>
                {isExpanded && <Text style={S.featureDesc}>{f.desc}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* OWASP Top 10 */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>OWASP Top 10 Coverage</Text>
          <View style={S.owaspCard}>
            {OWASP_COVERAGE.map((item, i) => {
              const sm = STATUS_META[item.status];
              return (
                <View key={item.id} style={[S.owaspRow, i < OWASP_COVERAGE.length - 1 && S.owaspRowBorder]}>
                  <Text style={S.owaspId}>{item.id}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.owaspName}>{item.name}</Text>
                    <Text style={S.owaspNote}>{item.note}</Text>
                  </View>
                  <View style={[S.statusBadge, { backgroundColor: sm.bg }]}>
                    <Text style={[S.statusTxt, { color: sm.color }]}>{sm.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rate limits */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Rate Limits (Server-Side)</Text>
          <View style={S.owaspCard}>
            {[
              { endpoint: 'All endpoints',           limit: '60 req/min per IP' },
              { endpoint: 'POST /api/v1/entries',    limit: '20 req/min per IP' },
              { endpoint: 'GET /api/v1/search',      limit: '30 req/min per IP' },
              { endpoint: 'POST /api/v1/chat',       limit: '10 req/min per IP' },
            ].map((r, i, arr) => (
              <View key={r.endpoint} style={[S.owaspRow, i < arr.length - 1 && S.owaspRowBorder]}>
                <Text style={[S.owaspNote, { fontFamily: 'monospace', flex: 1 }]}>{r.endpoint}</Text>
                <View style={[S.statusBadge, { backgroundColor: Colors.primaryLight }]}>
                  <Text style={[S.statusTxt, { color: Colors.primary }]}>{r.limit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191b24' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  scoreTxt: { fontSize: 13, fontWeight: '700' },
  scoreCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 20, gap: 16 },
  scoreLeft: { flex: 1, gap: 6 },
  scoreTitle: { fontSize: 16, fontWeight: '700', color: '#191b24' },
  scoreSubtitle: { fontSize: 12, color: Colors.onSurfaceVariant },
  scoreBar: { height: 8, backgroundColor: Colors.outlineVariant, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f4f5fb', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#198038' },
  scoreNum: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  scorePercent: { fontSize: 10, color: Colors.outline },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '300', lineHeight: 26 },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.outlineVariant, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipTxt: { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  filterChipTxtActive: { color: '#fff' },
  section: { paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  featureCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, padding: 12, gap: 8 },
  featureTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#191b24' },
  featureMeta: { flexDirection: 'row', gap: 6, marginTop: 3 },
  layerBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  layerTxt: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  statusTxt: { fontSize: 10, fontWeight: '700' },
  featureDesc: { fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 18, paddingLeft: 46 },
  owaspCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.outlineVariant, overflow: 'hidden' },
  owaspRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  owaspRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  owaspId: { fontSize: 12, fontWeight: '700', color: Colors.primary, width: 36, fontFamily: 'monospace' },
  owaspName: { fontSize: 13, fontWeight: '600', color: '#191b24' },
  owaspNote: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 },
});
