// idea_mapper: enhanced bento grid with search and filtering.

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

import { createEntry, listTimeline } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime } from "@/lib/format";

export default function IdeaMapper() {
  const { token } = useAuth();
  const [ideas, setIdeas] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  async function refresh() {
    if (!token) return;
    const r = await listTimeline(token, { limit: 100, kind: "idea" });
    setIdeas(r.entries);
  }

  useEffect(() => {
    if (!token) return;
    refresh().catch((e) => setError(String(e)));
  }, [token]);

  async function addIdea() {
    if (!token || !draft.trim()) return;
    const tags = draftTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    await createEntry(token, {
      text: draft.trim(),
      source: "web",
      kind: "idea",
      tags,
    });
    setDraft("");
    setDraftTags("");
    refresh();
  }

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load ideas"
        subtitle={error}
        hideCloseButton
      />
    );
  if (!ideas) return <InlineLoading description="Loading ideas…" />;

  // Get all unique tags
  const allTags = Array.from(new Set(ideas.flatMap(i => i.tags ?? [])));
  
  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = !searchFilter || idea.text.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesTag = !selectedTag || (idea.tags ?? []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Spread cards across a 12-col bento grid: 1st large (8 cols), then 4-col tiles.
  const grid = filteredIdeas.map((idea, i) => {
    const span = i === 0 ? 8 : i % 5 === 0 ? 8 : 4;
    return { idea, span };
  });

  return (
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Top Action Bar */}
      <header style={{
        background: "var(--cortex-surface-container-lowest)",
        borderBottom: "1px solid var(--cortex-outline-variant)",
        padding: "1rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--cortex-primary)", fontSize: 24 }}>polyline</span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 300 }}>Idea Mapper</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter ideas..."
            style={{
              background: "var(--cortex-surface-container-low)",
              border: "none",
              borderBottom: "1px solid var(--cortex-outline-variant)",
              padding: "0.5rem 1rem 0.5rem 2.5rem",
              fontSize: 14,
              width: 256,
              outline: "none"
            }}
          />
          <Button onClick={() => {
            const text = prompt("Enter your idea:");
            if (text) {
              setDraft(text);
              addIdea();
            }
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: "0.25rem" }}>account_tree</span>
            Map It Out
          </Button>
        </div>
      </header>

      {/* Filter Chips */}
      <div style={{
        padding: "0.5rem 1.5rem",
        borderBottom: "1px solid var(--cortex-outline-variant)",
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        marginBottom: "1.5rem"
      }}>
        <button
          onClick={() => setSelectedTag(null)}
          style={{
            background: !selectedTag ? "var(--cortex-surface-container-low)" : "var(--cortex-surface-container-lowest)",
            color: !selectedTag ? "var(--cortex-on-surface)" : "var(--cortex-on-surface-variant)",
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 12,
            padding: "0.25rem 0.5rem",
            border: "1px solid var(--cortex-outline-variant)",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          #all_nodes
        </button>
        {allTags.slice(0, 6).map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            style={{
              background: tag === selectedTag ? "var(--cortex-surface-container-low)" : "var(--cortex-surface-container-lowest)",
              color: tag === selectedTag ? "var(--cortex-on-surface)" : "var(--cortex-on-surface-variant)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 12,
              padding: "0.25rem 0.5rem",
              border: "1px solid var(--cortex-outline-variant)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{ padding: "0 1.5rem 2rem" }}>
        {filteredIdeas.length === 0 ? (
          <Tile>
            <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
              {searchFilter || selectedTag ? "No ideas match your filters." : "No ideas yet. The first one is the hardest."}
            </p>
          </Tile>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "1rem",
            }}
          >
            {grid.map(({ idea, span }) => (
              <Tile
                key={idea.id}
                style={{
                  gridColumn: `span ${span}`,
                  padding: "1rem",
                  minHeight: 160,
                  position: "relative",
                  transition: "background-color 0.15s ease"
                }}
                className="idea-card"
              >
                <Link
                  to={`/entry/${idea.id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}
                >
                  <div style={{ borderBottom: "1px solid var(--cortex-outline-variant)", paddingBottom: "0.5rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                      {idea.text.slice(0, 60)}
                      {idea.text.length > 60 ? "…" : ""}
                    </h3>
                    <span className="material-symbols-outlined" style={{ color: "var(--cortex-outline-variant)", fontSize: 16 }}>arrow_outward</span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--cortex-on-surface-variant)",
                      fontSize: 14,
                      flex: 1,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: span === 8 ? 2 : 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {idea.text.slice(60)}
                  </p>
                  <div style={{ display: "flex", gap: ".25rem", marginTop: "1rem", flexWrap: "wrap", paddingTop: "0.5rem" }}>
                    {(idea.tags ?? []).map((t) => (
                      <span
                        key={t}
                        style={{
                          background: "var(--cortex-surface-container-low)",
                          color: "var(--cortex-on-surface)",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: 12,
                          padding: "0.125rem 0.5rem",
                          border: "1px solid var(--cortex-outline-variant)"
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
              </Tile>
            ))}
          </div>
        )}
      </main>

      <style>{`
        .idea-card:hover {
          background-color: var(--cortex-surface-container-low) !important;
        }
      `}</style>
    </div>
  );
}
