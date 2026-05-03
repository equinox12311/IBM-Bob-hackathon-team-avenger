/**
 * Cortex API client — full feature parity with the web app.
 * All endpoints from docs/CONTRACTS.md are implemented here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_KEY = 'cortex.api_base_url';
const TOKEN_KEY = 'cortex.diary_token';

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getApiBase(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_BASE_KEY);
  return stored || '';
}

export async function setApiBase(url: string): Promise<void> {
  await AsyncStorage.setItem(API_BASE_KEY, url.replace(/\/$/, ''));
}

export async function getToken(): Promise<string> {
  return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function isApiConfigured(): Promise<boolean> {
  const [base, token] = await Promise.all([getApiBase(), getToken()]);
  return !!(base && token);
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const base = await getApiBase();
  if (!base) throw new Error('API not configured. Go to Profile → Cortex API to set the URL.');
  const headers = await authHeaders();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers ?? {}) },
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${body || res.statusText}`);
    }
    return res.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Request timed out. Check your API URL.');
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<{ status: string; version: string }> {
  const base = await getApiBase();
  if (!base) throw new Error('No API URL configured');
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${base}/health`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(id);
  }
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export interface ApiEntry {
  id: number;
  text: string;
  kind: string;
  source: string;
  tags: string[];
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  score: number;
  created_at: number;
}

export async function apiListEntries(limit = 50, kind?: string): Promise<ApiEntry[]> {
  const p = new URLSearchParams({ limit: String(limit) });
  if (kind) p.set('kind', kind);
  const r = await apiFetch<{ entries: ApiEntry[] }>(`/api/v1/entries?${p}`);
  return r.entries;
}

export async function apiSearchEntries(query: string, k = 10): Promise<ApiEntry[]> {
  const p = new URLSearchParams({ q: query, k: String(k) });
  const r = await apiFetch<{ entries: ApiEntry[] }>(`/api/v1/search?${p}`);
  return r.entries;
}

export async function apiCreateEntry(body: {
  text: string;
  kind?: string;
  source?: string;
  tags?: string[];
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
}): Promise<{ id: number; created_at: number }> {
  return apiFetch('/api/v1/entries', {
    method: 'POST',
    body: JSON.stringify({ source: 'mobile', ...body }),
  });
}

export async function apiGetEntry(id: number): Promise<ApiEntry> {
  return apiFetch(`/api/v1/entries/${id}`);
}

export async function apiDeleteEntry(id: number): Promise<void> {
  await apiFetch(`/api/v1/entries/${id}`, { method: 'DELETE' });
}

export async function apiFeedback(
  id: number,
  signal: 'boost' | 'flag'
): Promise<{ id: number; score: number }> {
  return apiFetch(`/api/v1/entries/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ signal }),
  });
}

export async function apiLinkCode(
  id: number,
  body: { repo: string; file: string; line_start: number; line_end: number }
): Promise<void> {
  await apiFetch(`/api/v1/entries/${id}/link`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ─── Today ────────────────────────────────────────────────────────────────────

export interface TodaySummary {
  greeting: string;
  current_focus: ApiEntry | null;
  counts_by_kind: Record<string, number>;
  recent: ApiEntry[];
}

export async function apiGetToday(): Promise<TodaySummary> {
  return apiFetch('/api/v1/today');
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ApiProfile {
  name: string;
  handle: string;
  bio: string;
  pronouns: string;
  timezone: string;
  public_url: string;
}

export async function apiGetProfile(): Promise<ApiProfile> {
  return apiFetch('/api/v1/profile');
}

export async function apiUpdateProfile(fields: Partial<ApiProfile>): Promise<ApiProfile> {
  return apiFetch('/api/v1/profile', {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface SessionAnalytics {
  total: number;
  by_kind: Record<string, number>;
  by_source: Record<string, number>;
  files_touched: string[];
  window_minutes: number;
}

export async function apiGetSessionAnalytics(window = 90): Promise<SessionAnalytics> {
  return apiFetch(`/api/v1/analytics/session?window=${window}`);
}

// ─── Daily Report ─────────────────────────────────────────────────────────────

export interface DailyReport {
  date_start: number;
  date_end: number;
  total_entries: number;
  by_kind: Record<string, number>;
  highlights: ApiEntry[];
}

export async function apiGetDailyReport(days = 1): Promise<DailyReport> {
  return apiFetch(`/api/v1/reports/daily?days=${days}`);
}

// ─── GitHub Activity ──────────────────────────────────────────────────────────

export interface GitHubActivity {
  user: string;
  days: number;
  contributions: { date: string; count: number }[];
  streak: number;
}

export async function apiGetGitHubActivity(user = 'demo', days = 30): Promise<GitHubActivity> {
  return apiFetch(`/api/v1/github/activity?user=${encodeURIComponent(user)}&days=${days}`);
}

// ─── Identity Graph ───────────────────────────────────────────────────────────

export interface IdentityGraph {
  nodes: { id: string; label: string; kind: string; weight: number }[];
  edges: { source: string; target: string; weight: number }[];
}

export async function apiGetIdentityGraph(topN = 12): Promise<IdentityGraph> {
  return apiFetch(`/api/v1/identity/graph?top_n=${topN}`);
}

// ─── Wellness ─────────────────────────────────────────────────────────────────

export interface WellnessStatus {
  minutes_since_break: number;
  break_due: boolean;
  last_break_at: number | null;
  breaks_today: number;
}

export async function apiGetWellness(): Promise<WellnessStatus> {
  return apiFetch('/api/v1/wellness/status');
}

export async function apiLogBreak(): Promise<WellnessStatus> {
  return apiFetch('/api/v1/wellness/break', { method: 'POST' });
}

// ─── Automations ─────────────────────────────────────────────────────────────

export interface Automation {
  id: number;
  name: string;
  trigger_kind: string;
  action: string;
  enabled: boolean;
}

export async function apiListAutomations(): Promise<Automation[]> {
  const r = await apiFetch<{ automations: Automation[] }>('/api/v1/automations');
  return r.automations;
}

export async function apiCreateAutomation(body: {
  name: string;
  trigger_kind: string;
  action: string;
}): Promise<{ id: number }> {
  return apiFetch('/api/v1/automations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiToggleAutomation(id: number, enabled: boolean): Promise<void> {
  await apiFetch(`/api/v1/automations/${id}?enabled=${enabled}`, { method: 'PATCH' });
}

export async function apiDeleteAutomation(id: number): Promise<void> {
  await apiFetch(`/api/v1/automations/${id}`, { method: 'DELETE' });
}

// ─── LLM ─────────────────────────────────────────────────────────────────────

export interface LlmInfo {
  provider: string;
  available: boolean;
}

export async function apiLlmInfo(): Promise<LlmInfo> {
  return apiFetch('/api/v1/llm/info');
}

export interface ChatResponse {
  answer: string;
  citations: { id: number; text: string; score: number }[];
  model: string;
}

export async function apiChat(query: string, k = 5): Promise<ChatResponse> {
  return apiFetch('/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({ query, k }),
  }, 120_000); // 2 min timeout for LLM
}

export async function apiGenerateSummary(entryId: number): Promise<{ summary: string }> {
  return apiFetch(`/api/v1/generate/summary/${entryId}`, {
    method: 'POST',
  }, 60_000);
}

export async function apiGenerateReport(days = 1): Promise<{
  narrative: string;
  total_entries: number;
  model: string;
}> {
  return apiFetch(`/api/v1/generate/report?days=${days}`, {}, 60_000);
}

// ─── codebase indexer + Granite analysis ────────────────────────────────────

export interface IndexedFile {
  path: string;
  repo: string;
  chunks: number;
  lines: number;
}

export interface IndexSummary {
  root: string;
  indexed: number;
  skipped_large: number;
  skipped_existing: number;
  errors: number;
  by_extension: Record<string, number>;
  files: string[];
}

export async function apiIndexCodebase(
  path: string,
  options: { max_files?: number; skip_existing?: boolean } = {},
): Promise<IndexSummary> {
  return apiFetch('/api/v1/codebase/index', {
    method: 'POST',
    body: JSON.stringify({ path, ...options }),
  }, 300_000);
}

export async function apiListIndexedFiles(repo?: string): Promise<{ files: IndexedFile[] }> {
  const q = repo ? `?repo=${encodeURIComponent(repo)}` : '';
  return apiFetch(`/api/v1/codebase/files${q}`);
}

export async function apiGetIndexedFile(repo: string, path: string): Promise<{
  path: string;
  repo: string;
  lines: number;
  chunks: number;
  body: string;
}> {
  return apiFetch(
    `/api/v1/codebase/file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`,
  );
}

export interface AnalyzeCodeResponse {
  file: string;
  answer: string;
  fallback_used: boolean;
  citations: { id: number; lines: string | null; snippet: string }[];
  model: string;
}

export async function apiAnalyzeCode(
  file: string,
  question: string,
  k = 8,
): Promise<AnalyzeCodeResponse> {
  return apiFetch('/api/v1/analyze/code', {
    method: 'POST',
    body: JSON.stringify({ file, question, k }),
  }, 120_000);
}

export interface SuggestNextResponse {
  suggestions: string;
  based_on_count: number;
  by_kind?: Record<string, number>;
  model: string;
}

export async function apiSuggestNext(limit = 20): Promise<SuggestNextResponse> {
  return apiFetch(`/api/v1/suggest/next?limit=${limit}`, {}, 60_000);
}

// ─── pending_actions (Bob escalation queue) ──────────────────────────────────

export interface PendingAction {
  id: number;
  kind: 'recall' | 'save' | 'analyze' | 'free';
  payload: Record<string, unknown>;
  source: string;
  created_at: number;
  consumed_at?: number | null;
}

export async function apiQueueAction(
  kind: PendingAction['kind'],
  payload: Record<string, unknown>,
  source = 'mobile',
): Promise<{ id: number; created_at: number; queued: boolean }> {
  return apiFetch('/api/v1/actions/queue', {
    method: 'POST',
    body: JSON.stringify({ kind, payload, source }),
  });
}

export async function apiPendingActions(
  consume = false,
  limit = 50,
): Promise<{ actions: PendingAction[]; consumed: boolean }> {
  return apiFetch(`/api/v1/actions/pending?consume=${consume}&limit=${limit}`);
}

export async function apiAllActions(limit = 100): Promise<{ actions: PendingAction[] }> {
  return apiFetch(`/api/v1/actions/all?limit=${limit}`);
}

export async function apiDeleteAction(id: number): Promise<void> {
  await apiFetch(`/api/v1/actions/${id}`, { method: 'DELETE' });
}
