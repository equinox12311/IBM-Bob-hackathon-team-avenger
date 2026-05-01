// ⌘K command palette — quick search from anywhere.
// Phase 3 polish (M3). Triggers semantic search and routes to entry detail.

import {
  Modal,
  Search as SearchInput,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { searchEntries } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";

export default function CommandPalette() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[]>([]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open || !token) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await searchEntries(token, q, 5);
        setResults(r.entries);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open, token]);

  function pick(id: number) {
    setOpen(false);
    setQuery("");
    navigate(`/entry/${id}`);
  }

  return (
    <Modal
      open={open}
      modalHeading="Quick search"
      passiveModal
      onRequestClose={() => setOpen(false)}
    >
      <Stack gap={4}>
        <SearchInput
          labelText=""
          placeholder="Search your second brain… (⌘K)"
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          autoFocus
        />
        {results.map((e) => (
          <Tile
            key={e.id}
            style={{ padding: ".75rem", cursor: "pointer" }}
            onClick={() => pick(e.id)}
          >
            <div style={{ display: "flex", gap: ".5rem", marginBottom: ".25rem", fontSize: 12 }}>
              <Tag type={sourceBadgeColor(e.source)} size="sm">
                {e.source}
              </Tag>
              <span style={{ color: "var(--cds-text-secondary)" }}>
                #{e.id} · {relativeTime(e.created_at)}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>
              {e.text.slice(0, 160)}
              {e.text.length > 160 ? "…" : ""}
            </p>
          </Tile>
        ))}
      </Stack>
    </Modal>
  );
}
