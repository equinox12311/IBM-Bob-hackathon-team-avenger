import {
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

export default function Timeline() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listTimeline(token, { limit: 50 })
      .then((r) => {
        if (!cancelled) setEntries(r.entries);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load timeline"
        subtitle={error}
        hideCloseButton
      />
    );
  if (!entries) return <InlineLoading description="Loading timeline…" />;
  if (entries.length === 0)
    return (
      <Tile style={{ padding: "1.5rem" }}>
        <h3>No entries yet</h3>
        <p style={{ marginTop: ".5rem", color: "var(--cds-text-secondary)" }}>
          Capture your first insight via Bob (<code>/diary-save</code>),
          Telegram, or this web UI.
        </p>
      </Tile>
    );

  return (
    <Stack gap={4} style={{ maxWidth: 720 }}>
      <h2>Timeline</h2>
      {entries.map((e) => (
        <Tile key={e.id} style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem", alignItems: "center" }}>
            <Tag type={sourceBadgeColor(e.source)}>{e.source}</Tag>
            <span style={{ color: "var(--cds-text-secondary)", fontSize: 12 }}>
              #{e.id} · {relativeTime(e.created_at)}
            </span>
          </div>
          <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <p style={{ margin: 0 }}>
              {e.text.slice(0, 240)}
              {e.text.length > 240 ? "…" : ""}
            </p>
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
  );
}
