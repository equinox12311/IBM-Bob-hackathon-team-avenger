// idea_mapper implemented in Carbon: bento grid of "kind=idea" entries.

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

  async function refresh() {
    if (!token) return;
    const r = await listTimeline(token, { limit: 50, kind: "idea" });
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

  // Spread cards across a 12-col bento grid: 1st large (8 cols), then 4-col tiles.
  const grid = ideas.map((idea, i) => {
    const span = i === 0 ? 8 : i % 5 === 0 ? 8 : 4;
    return { idea, span };
  });

  return (
    <Stack gap={6}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>Idea Mapper</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          Persistent space for the ideas you'll come back to.
        </p>
      </header>

      <Tile style={{ padding: "1rem" }}>
        <Stack gap={3}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="A new idea — what is it about?"
            rows={2}
            style={{
              width: "100%",
              padding: ".5rem",
              fontFamily: "inherit",
              fontSize: 14,
              background: "var(--cds-field)",
              border: "1px solid var(--cds-border-strong)",
            }}
          />
          <input
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            placeholder="tags, comma-separated (e.g. architecture, ai_ml)"
            style={{
              width: "100%",
              padding: ".5rem",
              fontFamily: "inherit",
              fontSize: 14,
              background: "var(--cds-field)",
              border: "1px solid var(--cds-border-strong)",
            }}
          />
          <Button onClick={addIdea} disabled={!draft.trim()}>
            Capture idea
          </Button>
        </Stack>
      </Tile>

      {ideas.length === 0 ? (
        <Tile>
          <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
            No ideas yet. The first one is the hardest.
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
              }}
            >
              <Link
                to={`/entry/${idea.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
              >
                <h3 style={{ margin: 0, marginBottom: ".5rem" }}>
                  {idea.text.slice(0, 80)}
                  {idea.text.length > 80 ? "…" : ""}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--cds-text-secondary)",
                    fontSize: 14,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {idea.text.slice(80, 320)}
                </p>
                <div style={{ display: "flex", gap: ".25rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  {(idea.tags ?? []).map((t) => (
                    <Tag key={t} type="gray" size="sm">
                      #{t}
                    </Tag>
                  ))}
                  <span style={{ fontSize: 11, color: "var(--cds-text-secondary)", marginLeft: "auto" }}>
                    {relativeTime(idea.created_at)}
                  </span>
                </div>
              </Link>
            </Tile>
          ))}
        </div>
      )}
    </Stack>
  );
}
