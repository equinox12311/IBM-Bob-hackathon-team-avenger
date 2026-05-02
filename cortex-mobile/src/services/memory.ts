/**
 * Memory Layer — lightweight context management for on-device LLM.
 *
 * Strategy (mobile-optimised):
 * 1. Short-term: last 10 conversation turns (in SQLite)
 * 2. Working memory: key-value facts extracted from entries (in SQLite)
 * 3. Semantic recall: keyword-based search (no heavy vector math on mobile)
 *
 * We deliberately avoid loading all embeddings into RAM.
 * Instead we do lightweight keyword matching + recency scoring.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllMemory,
  getConversationHistory,
  listEntries,
  searchEntries,
  setMemory,
  type Entry,
} from './database';
import { generate } from './llm';

const MEMORY_VERSION_KEY = 'cortex.memory_version';

// ─── Build context for LLM ───────────────────────────────────────────────────

export async function buildLLMContext(userQuery: string): Promise<Record<string, string>> {
  const [memory, relevant] = await Promise.all([
    getAllMemory(),
    recallRelevant(userQuery, 3),
  ]);

  const context: Record<string, string> = { ...memory };

  // Add relevant entries as context
  relevant.forEach((entry, i) => {
    context[`recent_entry_${i + 1}`] = entry.text.slice(0, 200);
  });

  return context;
}

// ─── Recall relevant entries ─────────────────────────────────────────────────

export async function recallRelevant(query: string, limit = 5): Promise<Entry[]> {
  // Keyword-based recall (memory-efficient, no vector math)
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5);

  if (keywords.length === 0) {
    return listEntries(limit);
  }

  // Search for each keyword and merge results
  const resultMap = new Map<number, Entry>();
  for (const kw of keywords) {
    const results = await searchEntries(kw, limit);
    results.forEach(e => resultMap.set(e.id, e));
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
}

// ─── Extract and store facts from entry ──────────────────────────────────────

export async function extractAndStoreFacts(entryText: string): Promise<void> {
  // Only run if LLM is available — skip silently otherwise
  try {
    const raw = await generate(
      `Extract 1-2 key facts from this developer note as "key: value" pairs (one per line). Keys should be short (2-4 words). Only output the pairs, nothing else:\n\n${entryText.slice(0, 400)}`,
      80
    );

    const lines = raw.split('\n').filter(l => l.includes(':'));
    for (const line of lines.slice(0, 2)) {
      const [key, ...rest] = line.split(':');
      const k = key.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 40);
      const v = rest.join(':').trim().slice(0, 200);
      if (k && v) {
        await setMemory(k, v);
      }
    }
  } catch {
    // Silently fail — memory extraction is best-effort
  }
}

// ─── Summarise recent activity ────────────────────────────────────────────────

export async function summariseRecentActivity(): Promise<string> {
  const entries = await listEntries(10);
  if (entries.length === 0) return 'No recent activity.';

  const bullets = entries
    .slice(0, 5)
    .map(e => `- [${e.kind}] ${e.text.slice(0, 80)}`)
    .join('\n');

  return generate(
    `Summarise this developer's recent activity in 2-3 sentences:\n${bullets}`,
    128
  );
}

// ─── Session stats ────────────────────────────────────────────────────────────

export async function getSessionStats(): Promise<{
  total: number;
  byKind: Record<string, number>;
  topTags: string[];
}> {
  const entries = await listEntries(100);
  const byKind: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const e of entries) {
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    for (const tag of e.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return { total: entries.length, byKind, topTags };
}
