// today_hub_soft_v1 implemented in Carbon.

import {
  Button,
  ClickableTile,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createEntry, getToday } from "@/api/client";
import type { TodaySummary } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";

const QUICK_ACTIONS: {
  kind: "fix" | "decision" | "note";
  title: string;
  hint: string;
  emoji: string;
}[] = [
  { kind: "fix", title: "Log a Fix", hint: "Document a resolved issue or bug.", emoji: "🐛" },
  { kind: "decision", title: "Save a Decision", hint: "Record an architectural choice.", emoji: "🏛️" },
  { kind: "note", title: "Quick Note", hint: "Jot down a fleeting thought.", emoji: "📝" },
];

export default function TodayHub() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  useEffect(() => {
    if (!token) return;
    getToday(token)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [token]);

  async function quickSave(kind: "fix" | "decision" | "note") {
    if (!token || !draftText.trim()) return;
    await createEntry(token, { text: draftText.trim(), source: "web", kind });
    setDraftText("");
    setDrafting(null);
    const fresh = await getToday(token);
    setData(fresh);
  }

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load today"
        subtitle={error}
        hideCloseButton
      />
    );
  if (!data) return <InlineLoading description="Loading dashboard…" />;

  return (
    <Stack gap={6}>
      <h1 style={{ fontSize: 42, fontWeight: 300, lineHeight: "48px", margin: 0 }}>
        {data.greeting}, {data.recent[0]?.tags?.[0] ?? "Dev"}
      </h1>

      {data.current_focus && (
        <Tile style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: 12, letterSpacing: ".32px", color: "var(--cds-text-secondary)", margin: 0 }}>
            CURRENT FOCUS
          </p>
          <h2 style={{ marginTop: ".5rem" }}>
            <Link to={`/entry/${data.current_focus.id}`} style={{ color: "inherit", textDecoration: "none" }}>
              {data.current_focus.text.slice(0, 120)}
              {data.current_focus.text.length > 120 ? "…" : ""}
            </Link>
          </h2>
          <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem", alignItems: "center" }}>
            <Tag type={sourceBadgeColor(data.current_focus.source)}>
              {data.current_focus.kind}
            </Tag>
            <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
              {relativeTime(data.current_focus.created_at)}
            </span>
            {data.current_focus.file && (
              <code style={{ fontSize: 12 }}>📍 {data.current_focus.file}</code>
            )}
          </div>
        </Tile>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {QUICK_ACTIONS.map((a) => (
          <ClickableTile
            key={a.kind}
            onClick={() => setDrafting(a.kind)}
            style={{ padding: "1.5rem", minHeight: 140 }}
          >
            <div style={{ fontSize: 24, marginBottom: ".5rem" }}>{a.emoji}</div>
            <h3 style={{ margin: 0 }}>{a.title}</h3>
            <p style={{ margin: ".5rem 0 0", color: "var(--cds-text-secondary)", fontSize: 14 }}>
              {a.hint}
            </p>
          </ClickableTile>
        ))}
      </div>

      {drafting && (
        <Tile style={{ padding: "1rem" }}>
          <h4 style={{ marginTop: 0 }}>
            New {drafting} entry
          </h4>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="What did you just figure out?"
            rows={3}
            style={{
              width: "100%",
              padding: ".5rem",
              fontFamily: "inherit",
              fontSize: 14,
              background: "var(--cds-field)",
              border: "1px solid var(--cds-border-strong)",
            }}
          />
          <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
            <Button onClick={() => quickSave(drafting as "fix" | "decision" | "note")} disabled={!draftText.trim()}>
              Save
            </Button>
            <Button kind="ghost" onClick={() => { setDrafting(null); setDraftText(""); }}>
              Cancel
            </Button>
          </div>
        </Tile>
      )}

      <Stack gap={3}>
        <h3>Today's entries ({data.recent.length})</h3>
        {data.recent.length === 0 && (
          <Tile><p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>Nothing captured today yet.</p></Tile>
        )}
        {data.recent.map((e) => (
          <Tile key={e.id} style={{ padding: "1rem" }}>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", alignItems: "center" }}>
              <Tag type={sourceBadgeColor(e.source)}>{e.kind}</Tag>
              <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                #{e.id} · {relativeTime(e.created_at)}
              </span>
            </div>
            <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <p style={{ margin: 0 }}>{e.text.slice(0, 200)}{e.text.length > 200 ? "…" : ""}</p>
            </Link>
          </Tile>
        ))}
        <Button kind="ghost" onClick={() => navigate("/timeline")}>
          See full timeline →
        </Button>
      </Stack>
    </Stack>
  );
}
