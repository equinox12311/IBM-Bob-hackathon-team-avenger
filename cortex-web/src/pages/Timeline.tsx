// Timeline view — reverse-chron list of entries. Phase 1 / 2 (M3).

import { Loading, Tag, Tile } from "@carbon/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listTimeline } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

export default function Timeline() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listTimeline(token, 20)
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(String(e)));
  }, [token]);

  if (error) return <p style={{ color: "var(--cds-support-error)" }}>{error}</p>;
  if (!entries) return <Loading withOverlay={false} />;
  if (entries.length === 0)
    return (
      <Tile>
        <h3>No entries yet</h3>
        <p>Capture your first insight via Bob, Telegram, or this UI.</p>
      </Tile>
    );

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 720 }}>
      <h2>Timeline</h2>
      {entries.map((e) => (
        <Tile key={e.id} style={{ padding: "1rem" }}>
          <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
            <Tag type="blue">{e.source}</Tag>
            <span style={{ color: "var(--cds-text-secondary)", fontSize: 12 }}>
              {new Date(e.created_at).toLocaleString()}
            </span>
          </div>
          <Link to={`/entry/${e.id}`} style={{ textDecoration: "none" }}>
            <p style={{ margin: 0 }}>{e.text.slice(0, 200)}{e.text.length > 200 ? "…" : ""}</p>
          </Link>
        </Tile>
      ))}
    </div>
  );
}
