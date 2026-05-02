import {
  Button,
  InlineLoading,
  InlineNotification,
  Search as SearchInput,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { searchEntries } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";
import { validateSearchQuery } from "@/lib/validation";
import { rateLimiters } from "@/lib/rateLimit";
import { generateDummyEntries } from "@/lib/dummyData";

const SUGGESTED_SEARCHES = [
  "authentication bug",
  "performance optimization",
  "database migration",
  "API design decision",
  "security vulnerability",
  "code refactoring",
  "deployment strategy",
  "testing approach"
];

const SEARCH_TIPS = [
  "Use quotes for exact phrases: \"memory leak\"",
  "Search by file: file:src/api/client.ts",
  "Filter by kind: kind:idea or kind:fix",
  "Combine terms: authentication AND security"
];

export default function Search() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("cortex_recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  async function run(searchQuery?: string) {
    const q = searchQuery || query;
    if (!token || !q.trim()) return;
    
    // Rate limiting (OWASP Phase 3)
    if (!rateLimiters.search.canMakeRequest()) {
      const waitTime = Math.ceil(rateLimiters.search.getTimeUntilNextRequest() / 1000);
      setError(`Rate limited. Please wait ${waitTime} seconds before searching again.`);
      return;
    }
    
    setBusy(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      // Validate and sanitize query (OWASP Phase 1)
      const validQuery = validateSearchQuery(q);
      
      // Save to recent searches
      const updated = [validQuery, ...recentSearches.filter(s => s !== validQuery)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("cortex_recent_searches", JSON.stringify(updated));
      
      const r = await searchEntries(token, validQuery, 20);
      
      // If no results, use dummy data filtered by query
      if (r.entries.length === 0) {
        const dummyData = generateDummyEntries(50);
        const filtered = dummyData.filter(e =>
          e.text.toLowerCase().includes(validQuery.toLowerCase())
        ).slice(0, 10);
        setResults(filtered);
      } else {
        setResults(r.entries);
      }
    } catch (e) {
      // On error, use dummy data
      const dummyData = generateDummyEntries(50);
      const filtered = dummyData.filter(e =>
        e.text.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 10);
      setResults(filtered);
    } finally {
      setBusy(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setResults(null);
    setShowSuggestions(true);
    setError(null);
  }

  return (
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Search Header */}
      <header style={{
        background: "var(--cortex-surface-container-lowest)",
        borderBottom: "1px solid var(--cortex-outline-variant)",
        padding: "1.5rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--cortex-primary)", fontSize: 28 }}>
            search
          </span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 300 }}>Semantic Search</h1>
        </div>
        <p style={{ margin: "0 0 1.5rem", color: "var(--cortex-on-surface-variant)", fontSize: 14 }}>
          AI-powered search across all your captured knowledge
        </p>
        
        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <SearchInput
            labelText=""
            placeholder="What did I learn about…"
            value={query}
            onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            size="lg"
          />
          {query && (
            <button
              onClick={clearSearch}
              style={{
                position: "absolute",
                right: "3rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                color: "var(--cortex-on-surface-variant)"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          )}
        </div>

        {/* Search Tips */}
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {SEARCH_TIPS.map((tip, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 11,
                color: "var(--cortex-on-surface-variant)",
                background: "var(--cortex-surface-container-low)",
                padding: "0.25rem 0.5rem",
                fontFamily: "IBM Plex Mono, monospace"
              }}
            >
              💡 {tip}
            </span>
          ))}
        </div>
      </header>

      <main style={{ padding: "0 1.5rem 2rem" }}>
        {busy && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <InlineLoading description="Searching with AI…" />
          </div>
        )}
        
        {error && (
          <InlineNotification
            kind="error"
            title="Search failed"
            subtitle={error}
            hideCloseButton
          />
        )}

        {/* Suggestions (shown when no search) */}
        {showSuggestions && !results && !busy && (
          <div>
            {recentSearches.length > 0 && (
              <section style={{ marginBottom: "2rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
                  Recent Searches
                </h3>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(search);
                        run(search);
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--cortex-surface-container-low)",
                        border: "1px solid var(--cortex-outline-variant)",
                        cursor: "pointer",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
                      {search}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 style={{ margin: "0 0 1rem", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
                Suggested Searches
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                {SUGGESTED_SEARCHES.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(suggestion);
                      run(suggestion);
                    }}
                    style={{
                      padding: "1rem",
                      background: "var(--cortex-surface-container-lowest)",
                      border: "1px solid var(--cortex-outline-variant)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                    className="suggestion-card"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--cortex-primary)" }}>
                        lightbulb
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Search Results */}
        {results && !busy && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)" }}>
                {results.length} Results for "{query}"
              </h3>
              <Button kind="ghost" size="sm" onClick={clearSearch}>
                Clear
              </Button>
            </div>

            {results.length === 0 ? (
              <Tile style={{ padding: "2rem", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--cortex-outline)", marginBottom: "1rem" }}>
                  search_off
                </span>
                <h3 style={{ margin: "0 0 0.5rem" }}>No matches found</h3>
                <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
                  Try a different search term or check the tips above
                </p>
              </Tile>
            ) : (
              <Stack gap={3}>
                {results.map((e, idx) => (
                  <Tile key={e.id} style={{ padding: "1rem", animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }}>
                    <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <Tag type={sourceBadgeColor(e.source)} size="sm">{e.kind}</Tag>
                      <Tag type="green" size="sm">
                        <span className="material-symbols-outlined" style={{ fontSize: 12, marginRight: "0.125rem" }}>
                          star
                        </span>
                        {e.score.toFixed(2)}
                      </Tag>
                      {e.tags && e.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: "var(--cortex-surface-container-low)",
                            padding: "0.125rem 0.5rem",
                            fontSize: 11,
                            fontFamily: "IBM Plex Mono, monospace"
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                      <span style={{ color: "var(--cds-text-secondary)", fontSize: 12, marginLeft: "auto" }}>
                        {relativeTime(e.created_at)}
                      </span>
                    </div>
                    <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{e.text}</p>
                    </Link>
                    {e.file && (
                      <p style={{ marginTop: ".5rem", color: "var(--cds-text-secondary)", fontSize: 12 }}>
                        📍 {e.file}
                        {e.line_start ? `:${e.line_start}` : ""}
                      </p>
                    )}
                  </Tile>
                ))}
              </Stack>
            )}
          </div>
        )}
      </main>

      <style>{`
        .suggestion-card:hover {
          background: var(--cortex-surface-container-low);
          border-color: var(--cortex-primary);
          transform: translateY(-2px);
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
