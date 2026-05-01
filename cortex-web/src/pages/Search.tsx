// Semantic search page. Phase 3 (M3).

import { Search as SearchInput, Tag, Tile } from "@carbon/react";
import { useState } from "react";

import { searchEntries } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

export default function Search() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[]>([]);

  async function run(q: string) {
    if (!q.trim() || !token) return;
    const r = await searchEntries(token, q, 5);
    setResults(r.entries);
  }

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 720 }}>
      <h2>Search</h2>
      <SearchInput
        labelText=""
        placeholder="What did I learn about…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") run(query);
        }}
      />
      {results.map((e) => (
        <Tile key={e.id} style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
            <Tag type="blue">{e.source}</Tag>
            <Tag type="green">score {e.score.toFixed(2)}</Tag>
          </div>
          <p style={{ margin: 0 }}>{e.text}</p>
        </Tile>
      ))}
    </div>
  );
}
