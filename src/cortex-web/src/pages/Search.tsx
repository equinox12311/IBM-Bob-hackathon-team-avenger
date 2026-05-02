import {
  InlineLoading,
  InlineNotification,
  Search as SearchInput,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { searchEntries } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";
import { validateSearchQuery } from "@/lib/validation";
import { rateLimiters } from "@/lib/rateLimit";

export default function Search() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!token) return;
    
    // Rate limiting (OWASP Phase 3)
    if (!rateLimiters.search.canMakeRequest()) {
      const waitTime = Math.ceil(rateLimiters.search.getTimeUntilNextRequest() / 1000);
      setError(`Rate limited. Please wait ${waitTime} seconds before searching again.`);
      return;
    }
    
    setBusy(true);
    setError(null);
    
    try {
      // Validate and sanitize query (OWASP Phase 1)
      const validQuery = validateSearchQuery(query);
      const r = await searchEntries(token, validQuery, 10);
      setResults(r.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={5} style={{ maxWidth: 720 }}>
      <h2>Search</h2>
      <SearchInput
        labelText=""
        placeholder="What did I learn about…"
        value={query}
        onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") run();
        }}
      />
      {busy && <InlineLoading description="Searching…" />}
      {error && (
        <InlineNotification
          kind="error"
          title="Search failed"
          subtitle={error}
          hideCloseButton
        />
      )}
      {results && results.length === 0 && !busy && (
        <Tile>
          <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
            No matches for "{query}". Try a more specific phrase.
          </p>
        </Tile>
      )}
      {results &&
        results.map((e) => (
          <Tile key={e.id} style={{ padding: "1rem" }}>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
              <Tag type={sourceBadgeColor(e.source)}>{e.source}</Tag>
              <Tag type="green">score {e.score.toFixed(2)}</Tag>
              <span style={{ color: "var(--cds-text-secondary)", fontSize: 12 }}>
                #{e.id} · {relativeTime(e.created_at)}
              </span>
            </div>
            <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <p style={{ margin: 0 }}>{e.text}</p>
            </Link>
          </Tile>
        ))}
    </Stack>
  );
}
