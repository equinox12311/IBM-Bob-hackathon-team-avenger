// Mirrors docs/CONTRACTS.md::Entry. Keep in sync with cortex-api models.

export type EntrySource =
  | "bob"
  | "telegram-text"
  | "telegram-voice"
  | "web";

export type EntryKind =
  | "note"
  | "idea"
  | "debug"
  | "decision"
  | "fix"
  | "task"
  | "report"
  | "wellness"
  | "client";

export interface Entry {
  id: number;
  text: string;
  score: number;
  source: EntrySource;
  kind: EntryKind;
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  tags?: string[];
  created_at: number;
}

export interface CreateEntryRequest {
  text: string;
  source: EntrySource;
  kind?: EntryKind;
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  tags?: string[];
}

// ---------- v0.2 feature shapes ----------

export interface TodaySummary {
  greeting: string;
  current_focus: Entry | null;
  counts_by_kind: Record<string, number>;
  recent: Entry[];
}

export interface DailyReport {
  date_start: number;
  date_end: number;
  total_entries: number;
  by_kind: Record<string, number>;
  highlights: Entry[];
}

export interface SessionAnalytics {
  window_minutes: number;
  total: number;
  by_kind: Record<string, number>;
  by_source: Record<string, number>;
  files_touched: string[];
}

export interface IdentityGraphNode {
  id: string;
  label: string;
  kind: string;
  weight: number;
}
export interface IdentityGraphEdge {
  source: string;
  target: string;
  weight: number;
}
export interface IdentityGraph {
  nodes: IdentityGraphNode[];
  edges: IdentityGraphEdge[];
}

export interface GitHubActivity {
  user: string;
  days: number;
  contributions: { date: string; count: number }[];
  streak: number;
}

export interface WellnessStatus {
  minutes_since_break: number;
  break_due: boolean;
  last_break_at: number | null;
  breaks_today: number;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  pronouns?: string;
  timezone: string;
  public_url?: string;
}

export interface Automation {
  id: number;
  name: string;
  trigger_kind: string;
  action: string;
  enabled: number;
  created_at: number;
}
