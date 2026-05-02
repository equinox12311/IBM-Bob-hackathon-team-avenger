import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listTimeline } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";
import { generateDummyEntries } from "@/lib/dummyData";

export default function Timeline() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listTimeline(token, { limit: 100 })
      .then((r) => {
        if (!cancelled) {
          // If no entries, use dummy data
          const data = r.entries.length > 0 ? r.entries : generateDummyEntries(50);
          setEntries(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          // On error, use dummy data
          setEntries(generateDummyEntries(50));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!entries) return <InlineLoading description="Loading timeline…" />;

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (filterKind && e.kind !== filterKind) return false;
    if (filterSource && e.source !== filterSource) return false;
    if (searchQuery && !e.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get unique kinds and sources for filters
  const kinds = Array.from(new Set(entries.map((e) => e.kind)));
  const sources = Array.from(new Set(entries.map((e) => e.source)));

  return (
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Header with Search */}
      <header style={{
        background: "var(--cortex-surface-container-lowest)",
        borderBottom: "1px solid var(--cortex-outline-variant)",
        padding: "1rem 1.5rem",
        marginBottom: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--cortex-primary)", fontSize: 24 }}>timeline</span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 300 }}>Timeline</h1>
            <span style={{ fontSize: 14, color: "var(--cortex-on-surface-variant)", marginLeft: "0.5rem" }}>
              {filteredEntries.length} entries
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "0.5rem",
                background: viewMode === "list" ? "var(--cortex-primary)" : "transparent",
                color: viewMode === "list" ? "white" : "var(--cortex-on-surface-variant)",
                border: "1px solid var(--cortex-outline-variant)",
                cursor: "pointer"
              }}
              title="List view"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>view_list</span>
            </button>
            <button
              onClick={() => setViewMode("compact")}
              style={{
                padding: "0.5rem",
                background: viewMode === "compact" ? "var(--cortex-primary)" : "transparent",
                color: viewMode === "compact" ? "white" : "var(--cortex-on-surface-variant)",
                border: "1px solid var(--cortex-outline-variant)",
                cursor: "pointer"
              }}
              title="Compact view"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>view_agenda</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <span className="material-symbols-outlined" style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--cortex-on-surface-variant)",
            fontSize: 20
          }}>search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            style={{
              width: "100%",
              padding: "0.75rem 0.75rem 0.75rem 2.5rem",
              background: "var(--cortex-surface-container-low)",
              border: "1px solid var(--cortex-outline-variant)",
              fontSize: 14,
              outline: "none"
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterKind(null)}
            style={{
              padding: "0.25rem 0.75rem",
              background: !filterKind ? "var(--cortex-primary)" : "var(--cortex-surface-container-low)",
              color: !filterKind ? "white" : "var(--cortex-on-surface)",
              border: "1px solid var(--cortex-outline-variant)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono, monospace"
            }}
          >
            All
          </button>
          {kinds.map((kind) => (
            <button
              key={kind}
              onClick={() => setFilterKind(kind === filterKind ? null : kind)}
              style={{
                padding: "0.25rem 0.75rem",
                background: kind === filterKind ? "var(--cortex-primary)" : "var(--cortex-surface-container-low)",
                color: kind === filterKind ? "white" : "var(--cortex-on-surface)",
                border: "1px solid var(--cortex-outline-variant)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "IBM Plex Mono, monospace",
                textTransform: "capitalize"
              }}
            >
              {kind}
            </button>
          ))}
        </div>
      </header>

      {/* Timeline Content */}
      <main style={{ padding: "0 1.5rem 2rem" }}>
        {filteredEntries.length === 0 ? (
          <Tile style={{ padding: "2rem", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--cortex-outline)", marginBottom: "1rem" }}>
              search_off
            </span>
            <h3 style={{ margin: "0 0 0.5rem" }}>No entries found</h3>
            <p style={{ margin: 0, color: "var(--cortex-on-surface-variant)" }}>
              Try adjusting your filters or search query
            </p>
          </Tile>
        ) : (
          <Stack gap={viewMode === "list" ? 4 : 2}>
            {filteredEntries.map((e, idx) => (
              <Tile
                key={e.id}
                style={{
                  padding: viewMode === "list" ? "1rem" : "0.75rem",
                  animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`,
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: `var(--cortex-${e.kind === "idea" ? "primary" : e.kind === "fix" ? "success" : "outline"})`
                }} />
                <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", alignItems: "center", paddingLeft: "0.5rem" }}>
                  <Tag type={sourceBadgeColor(e.source)} size="sm">{e.kind}</Tag>
                  {e.tags && e.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "var(--cortex-surface-container-low)",
                        padding: "0.125rem 0.5rem",
                        fontSize: 11,
                        fontFamily: "IBM Plex Mono, monospace",
                        color: "var(--cortex-on-surface-variant)"
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  <span style={{ color: "var(--cds-text-secondary)", fontSize: 12, marginLeft: "auto" }}>
                    {relativeTime(e.created_at)}
                  </span>
                </div>
                <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit", paddingLeft: "0.5rem" }}>
                  <p style={{ margin: 0, fontSize: viewMode === "list" ? 14 : 13 }}>
                    {e.text.slice(0, viewMode === "list" ? 240 : 120)}
                    {e.text.length > (viewMode === "list" ? 240 : 120) ? "…" : ""}
                  </p>
                </Link>
                {e.file && viewMode === "list" && (
                  <p style={{ marginTop: ".5rem", color: "var(--cds-text-secondary)", fontSize: 12, paddingLeft: "0.5rem" }}>
                    📍 {e.file}
                    {e.line_start ? `:${e.line_start}` : ""}
                  </p>
                )}
              </Tile>
            ))}
          </Stack>
        )}
      </main>

      <style>{`
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
