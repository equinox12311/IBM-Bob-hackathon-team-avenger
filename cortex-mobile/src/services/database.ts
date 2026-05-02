/**
 * SQLite database — uses the SYNCHRONOUS expo-sqlite API.
 *
 * WHY SYNC: expo-sqlite v16 async API (prepareAsync / runAsync) throws
 * NullPointerException on Android with New Architecture disabled.
 * The synchronous API (useSQLiteContext / openDatabaseSync) is stable
 * on all architectures and Expo Go versions.
 *
 * Pattern: open once at module level, run all queries synchronously.
 * All exported functions are still async-shaped so callers don't change.
 */
import * as SQLite from 'expo-sqlite';

// ─── Singleton DB ─────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

function db(): SQLite.SQLiteDatabase {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync('cortex.db');
  initSchema(_db);
  return _db;
}

function initSchema(d: SQLite.SQLiteDatabase) {
  d.execSync(`PRAGMA journal_mode = WAL;`);
  d.execSync(`PRAGMA synchronous = NORMAL;`);
  d.execSync(`PRAGMA cache_size = -2000;`);

  d.execSync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'note',
      source TEXT NOT NULL DEFAULT 'mobile',
      tags TEXT DEFAULT '[]',
      repo TEXT,
      file TEXT,
      line_start INTEGER,
      line_end INTEGER,
      embedding TEXT,
      score REAL DEFAULT 0.0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);

  d.execSync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);

  d.execSync(`
    CREATE TABLE IF NOT EXISTS memory_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);

  d.execSync(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Developer',
      handle TEXT DEFAULT 'dev',
      bio TEXT DEFAULT '',
      pronouns TEXT DEFAULT '',
      timezone TEXT DEFAULT 'UTC',
      public_url TEXT DEFAULT '',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);

  d.execSync(`
    CREATE TABLE IF NOT EXISTS wellness_breaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);

  // Indexes
  d.execSync(`CREATE INDEX IF NOT EXISTS idx_entries_kind ON entries(kind);`);
  d.execSync(`CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at DESC);`);
  d.execSync(`CREATE INDEX IF NOT EXISTS idx_conv_created ON conversations(created_at DESC);`);

  // Seed profile row
  d.execSync(`INSERT OR IGNORE INTO profile (id, name) VALUES (1, 'Developer');`);
}

// ─── Initialise (call from app startup) ──────────────────────────────────────

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  return db();
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export interface Entry {
  id: number;
  text: string;
  kind: string;
  source: string;
  tags: string[];
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  embedding?: number[];
  score: number;
  created_at: number;
}

export async function insertEntry(params: {
  text: string;
  kind?: string;
  source?: string;
  tags?: string[];
  repo?: string;
  file?: string;
  embedding?: number[];
}): Promise<number> {
  const result = db().runSync(
    `INSERT INTO entries (text, kind, source, tags, repo, file, embedding)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params.text,
    params.kind ?? 'note',
    params.source ?? 'mobile',
    JSON.stringify(params.tags ?? []),
    params.repo ?? null,
    params.file ?? null,
    params.embedding ? JSON.stringify(params.embedding) : null
  );
  return result.lastInsertRowId;
}

export async function listEntries(limit = 50, kind?: string): Promise<Entry[]> {
  const rows = kind
    ? db().getAllSync<any>(
        'SELECT * FROM entries WHERE kind = ? ORDER BY created_at DESC LIMIT ?',
        kind, limit
      )
    : db().getAllSync<any>(
        'SELECT * FROM entries ORDER BY created_at DESC LIMIT ?',
        limit
      );
  return rows.map(parseEntry);
}

export async function searchEntries(query: string, limit = 20): Promise<Entry[]> {
  const rows = db().getAllSync<any>(
    `SELECT * FROM entries WHERE text LIKE ? ORDER BY created_at DESC LIMIT ?`,
    `%${query}%`, limit
  );
  return rows.map(parseEntry);
}

export async function getEntry(id: number): Promise<Entry | null> {
  const row = db().getFirstSync<any>('SELECT * FROM entries WHERE id = ?', id);
  return row ? parseEntry(row) : null;
}

export async function deleteEntry(id: number): Promise<void> {
  db().runSync('DELETE FROM entries WHERE id = ?', id);
}

function parseEntry(row: any): Entry {
  return {
    ...row,
    tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
    embedding: row.embedding ? (() => { try { return JSON.parse(row.embedding); } catch { return undefined; } })() : undefined,
  };
}

// ─── Conversations ────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  created_at: number;
}

export async function saveMessage(role: string, content: string, tokens = 0): Promise<void> {
  db().runSync(
    'INSERT INTO conversations (role, content, tokens_used) VALUES (?, ?, ?)',
    role, content, tokens
  );
  // Keep only last 100 messages
  db().runSync(
    `DELETE FROM conversations WHERE id NOT IN (
       SELECT id FROM conversations ORDER BY created_at DESC LIMIT 100
     )`
  );
}

export async function getConversationHistory(limit = 20): Promise<Message[]> {
  const rows = db().getAllSync<Message>(
    'SELECT * FROM conversations ORDER BY created_at DESC LIMIT ?',
    limit
  );
  return [...rows].reverse();
}

export async function clearConversation(): Promise<void> {
  db().runSync('DELETE FROM conversations');
}

// ─── Memory Context ───────────────────────────────────────────────────────────

export async function setMemory(key: string, value: string): Promise<void> {
  db().runSync(
    `INSERT INTO memory_context (key, value, updated_at)
     VALUES (?, ?, strftime('%s','now') * 1000)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key, value
  );
}

export async function getMemory(key: string): Promise<string | null> {
  const row = db().getFirstSync<{ value: string }>(
    'SELECT value FROM memory_context WHERE key = ?', key
  );
  return row?.value ?? null;
}

export async function getAllMemory(): Promise<Record<string, string>> {
  const rows = db().getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM memory_context ORDER BY updated_at DESC LIMIT 50'
  );
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  name: string;
  handle: string;
  bio: string;
  pronouns: string;
  timezone: string;
  public_url: string;
}

export async function getProfile(): Promise<Profile> {
  const row = db().getFirstSync<Profile>('SELECT * FROM profile WHERE id = 1');
  return row ?? { name: 'Developer', handle: 'dev', bio: '', pronouns: '', timezone: 'UTC', public_url: '' };
}

export async function updateProfile(fields: Partial<Profile>): Promise<void> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = Object.values(fields);
  db().runSync(
    `UPDATE profile SET ${sets}, updated_at = strftime('%s','now') * 1000 WHERE id = 1`,
    ...vals
  );
}

// ─── Wellness ─────────────────────────────────────────────────────────────────

export async function logBreak(): Promise<void> {
  db().runSync(
    'INSERT INTO wellness_breaks (created_at) VALUES (strftime(\'%s\',\'now\') * 1000)'
  );
}

export async function getWellnessStats(): Promise<{
  breaks_today: number;
  last_break_at: number | null;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const countRow = db().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM wellness_breaks WHERE created_at >= ?',
    todayMs
  );
  const lastRow = db().getFirstSync<{ created_at: number }>(
    'SELECT created_at FROM wellness_breaks ORDER BY created_at DESC LIMIT 1'
  );

  return {
    breaks_today: countRow?.count ?? 0,
    last_break_at: lastRow?.created_at ?? null,
  };
}
