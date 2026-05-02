/**
 * LLM Service — Ollama + Granite 3.3:2b over local WiFi.
 *
 * KEY FIX: React Native / Hermes on Android does NOT support the
 * Web Streams API (res.body.getReader()). Calling it causes the request
 * to silently fail and the error handler fires, making the app show
 * "offline" even though Ollama is reachable.
 *
 * Solution: use stream:false for the actual chat request, get the full
 * JSON response at once, then simulate a typing effect in the UI by
 * emitting tokens word-by-word with a small delay.
 *
 * This works reliably on both Android and iOS.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getConversationHistory, saveMessage } from './database';

const OLLAMA_HOST_KEY = 'cortex.ollama_host';
const DEFAULT_MODEL = 'granite3.3:2b';
const MAX_CONTEXT_TOKENS = 2048;
const MAX_HISTORY_TURNS = 10;
const HEALTH_TIMEOUT_MS = 6000;
const CHAT_TIMEOUT_MS = 120_000; // 2 min — model can be slow on first run
const GENERATE_TIMEOUT_MS = 45_000;

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getLLMConfig() {
  const host = (await AsyncStorage.getItem(OLLAMA_HOST_KEY)) ?? '';
  return {
    host: host || 'http://localhost:11434',
    model: DEFAULT_MODEL,
    temperature: 0.7,
    num_ctx: MAX_CONTEXT_TOKENS,
    num_predict: 512,
  };
}

export async function setOllamaHost(host: string): Promise<void> {
  let h = host.trim();
  if (h && !h.startsWith('http')) h = 'http://' + h;
  h = h.replace(/\/$/, '');
  await AsyncStorage.setItem(OLLAMA_HOST_KEY, h);
}

export async function getOllamaHost(): Promise<string> {
  return (await AsyncStorage.getItem(OLLAMA_HOST_KEY)) ?? '';
}

// ─── Timeout fetch ────────────────────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function checkOllamaHealth(): Promise<{
  online: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const { host } = await getLLMConfig();
    const res = await fetchWithTimeout(
      `${host}/api/tags`,
      { method: 'GET' },
      HEALTH_TIMEOUT_MS
    );
    if (!res.ok) return { online: false, models: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = (data.models ?? []).map((m: any) => m.name as string);
    return { online: true, models };
  } catch (e: any) {
    const msg =
      e?.name === 'AbortError'
        ? 'Timeout — check host IP and WiFi'
        : (e?.message ?? 'Network error');
    return { online: false, models: [], error: msg };
  }
}

export async function isModelAvailable(): Promise<boolean> {
  const { online, models } = await checkOllamaHealth();
  if (!online) return false;
  return models.some(m => m.includes('granite3.3') || m.includes('granite3'));
}

// ─── Pull Model ───────────────────────────────────────────────────────────────

export async function pullModel(
  onProgress: (status: string, percent: number) => void
): Promise<boolean> {
  try {
    const { host } = await getLLMConfig();
    // Use stream:false for pull too — safer on Android
    onProgress('Downloading granite3.3:2b…', 0);
    const res = await fetchWithTimeout(
      `${host}/api/pull`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: DEFAULT_MODEL, stream: false }),
      },
      300_000 // 5 min for download
    );
    if (!res.ok) return false;
    onProgress('Complete', 100);
    return true;
  } catch {
    return false;
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(memoryContext: Record<string, string>): string {
  const lines = Object.entries(memoryContext)
    .slice(0, 8)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  return `You are Cortex, a developer's AI second brain.
Help capture ideas, debug code, recall past work, and give concise technical insights.
Be brief and precise. Prefer bullet points. No unnecessary preamble.${
    lines ? `\n\nMemory:\n${lines}` : ''
  }`;
}

// ─── Simulate typing effect ───────────────────────────────────────────────────
// Emits the full response word-by-word so the UI feels responsive
// even though we got the whole response at once (stream:false).

function simulateTyping(
  text: string,
  onToken: (t: string) => void,
  onDone: () => void
) {
  // Split into small chunks (~3 chars) for a smooth effect
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + 3, text.length);
    chunks.push(text.slice(i, end));
    i = end;
  }

  let idx = 0;
  const tick = () => {
    if (idx >= chunks.length) {
      onDone();
      return;
    }
    onToken(chunks[idx++]);
    // ~15ms per chunk ≈ 200 chars/sec — fast but visible
    setTimeout(tick, 15);
  };
  tick();
}

// ─── Chat (non-streaming — works on Android + iOS) ───────────────────────────

export async function chat(
  userMessage: string,
  memoryContext: Record<string, string>,
  onToken: (token: string) => void,
  onDone: (fullResponse: string) => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const config = await getLLMConfig();
    const history = await getConversationHistory(MAX_HISTORY_TURNS * 2);

    const messages = [
      { role: 'system', content: buildSystemPrompt(memoryContext) },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${config.host}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages,
            stream: false,          // ← CRITICAL: false works on Android
            options: {
              temperature: config.temperature,
              num_ctx: config.num_ctx,
              num_predict: config.num_predict,
              num_thread: 4,
              num_gpu: 0,
            },
          }),
        },
        CHAT_TIMEOUT_MS
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        onError(
          'Request timed out after 2 minutes.\n' +
          'The model may be loading — try again in a moment.'
        );
      } else {
        onError(
          `Cannot reach Ollama at ${config.host}.\n` +
          'Check Profile → AI Settings.'
        );
      }
      return;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      onError(`Ollama error ${res.status}: ${body || res.statusText}`);
      return;
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      onError('Could not parse Ollama response.');
      return;
    }

    const fullResponse: string =
      data?.message?.content ??
      data?.response ??
      '';

    if (!fullResponse) {
      onError('Empty response from model.');
      return;
    }

    // Persist to DB
    await saveMessage('user', userMessage);
    await saveMessage('assistant', fullResponse, data?.eval_count ?? 0);

    // Simulate typing so the UI feels live
    simulateTyping(
      fullResponse,
      onToken,
      () => onDone(fullResponse)
    );
  } catch (err: any) {
    onError(err?.message ?? 'Unknown error');
  }
}

// ─── Single-shot generate (for summaries / auto-tag) ─────────────────────────

export async function generate(prompt: string, maxTokens = 256): Promise<string> {
  try {
    const config = await getLLMConfig();
    const res = await fetchWithTimeout(
      `${config.host}/api/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_ctx: 1024,
            num_predict: maxTokens,
            num_thread: 4,
            num_gpu: 0,
          },
        }),
      },
      GENERATE_TIMEOUT_MS
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.response ?? '';
  } catch {
    return '';
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export async function summariseEntry(text: string): Promise<string> {
  return generate(
    `Summarise this developer note in one sentence (max 20 words):\n\n${text.slice(0, 500)}`,
    64
  );
}

export async function autoTag(text: string): Promise<string[]> {
  const raw = await generate(
    `Extract 2-4 technical tags from this developer note. Reply ONLY with a comma-separated list:\n\n${text.slice(0, 400)}`,
    32
  );
  return raw
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
    .filter(t => t.length > 1 && t.length < 30)
    .slice(0, 4);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
