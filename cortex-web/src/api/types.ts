// Mirrors docs/CONTRACTS.md::Entry. Keep in sync with cortex-api models.

export type EntrySource =
  | "bob"
  | "telegram-text"
  | "telegram-voice"
  | "web";

export interface Entry {
  id: number;
  text: string;
  score: number;
  source: EntrySource;
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
  repo?: string;
  file?: string;
  line_start?: number;
  line_end?: number;
  tags?: string[];
}
