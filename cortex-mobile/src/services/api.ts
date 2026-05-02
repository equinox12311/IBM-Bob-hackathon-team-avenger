/**
 * Cortex API client for the mobile app.
 * Mirrors the web client but adapted for React Native (no import.meta.env).
 * Connects to the same cortex-api backend as the web UI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_KEY = 'cortex.api_base_url';
const TOKEN_KEY = 'cortex.diary_token';

export async function getApiBase(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_BASE_KEY);
  return stored || 'http://localhost:8080';
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

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = await getApiBase();
  const headers = await authHeaders();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<{ status: string; version: string }> {
  const base = await getApiBase();
  const res = await fetch(`${base}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
  const base = await getApiBase();
  const headers = await authHeaders();
  await fetch(`${base}/api/v1/entries/${id}`, { method: 'DELETE', headers });
}

export async function apiFeedback(id: number, signal: 'boost' | 'flag'): Promise<void> {
  await apiFetch(`/api/v1/entries/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ signal }),
  });
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

export async function apiGetSessionAnalytics(window = 90): Promise<{
  total: number;
  by_kind: Record<string, number>;
  by_source: Record<string, number>;
  files_touched: string[];
  window_minutes: number;
}> {
  return apiFetch(`/api/v1/analytics/session?window=${window}`);
}

export async function apiGetToday(): Promise<{
  total_today: number;
  kinds: Record<string, number>;
  top_tags: string[];
  last_entry_at: number | null;
}> {
  return apiFetch('/api/v1/today');
}

// ─── Wellness ─────────────────────────────────────────────────────────────────

export async function apiGetWellness(): Promise<{
  break_due: boolean;
  minutes_since_break: number;
  breaks_today: number;
  last_break_at: number | null;
}> {
  return apiFetch('/api/v1/wellness/status');
}

export async function apiLogBreak(): Promise<void> {
  await apiFetch('/api/v1/wellness/break', { method: 'POST' });
}

// ─── LLM (via cortex-api) ─────────────────────────────────────────────────────

export async function apiLlmInfo(): Promise<{ provider: string; available: boolean }> {
  return apiFetch('/api/v1/llm/info');
}

export async function apiChat(query: string, k = 5): Promise<{
  answer: string;
  citations: { id: number; text: string; score: number }[];
  model: string;
}> {
  return apiFetch('/api/v1/chat', {
    method: 'POST',
    body: JSON.stringify({ query, k }),
  });
}
