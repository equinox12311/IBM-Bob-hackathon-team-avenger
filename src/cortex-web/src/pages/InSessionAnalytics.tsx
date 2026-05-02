// in_session_analytics: real-time stats for the current dev session window.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";

import { getSessionAnalytics } from "@/api/client";
import type { SessionAnalytics } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

const WINDOWS: { minutes: number; label: string }[] = [
  { minutes: 15, label: "15m" },
  { minutes: 60, label: "1h" },
  { minutes: 90, label: "90m" },
  { minutes: 240, label: "4h" },
];

export default function InSessionAnalytics() {
  const { token } = useAuth();
  const [windowMin, setWindowMin] = useState(90);
  const [data, setData] = useState<SessionAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setData(null);
    const fetch = () => getSessionAnalytics(token, windowMin).then(setData).catch((e) => setError(String(e)));
    fetch();
    const t = setInterval(fetch, 30_000); // auto-refresh every 30s
    return () => clearInterval(t);
  }, [token, windowMin]);

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load analytics"
        subtitle={error}
        hideCloseButton
      />
    );

  return (
    <Stack gap={6}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>Session Analytics</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          Live stats for your current work window. Updates every 30s.
        </p>
      </header>

      <div style={{ display: "flex", gap: ".5rem" }}>
        {WINDOWS.map((w) => (
          <Button
            key={w.minutes}
            kind={windowMin === w.minutes ? "primary" : "tertiary"}
            size="sm"
            onClick={() => setWindowMin(w.minutes)}
          >
            {w.label}
          </Button>
        ))}
      </div>

      {!data ? (
        <InlineLoading description="Computing…" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <Tile style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>ENTRIES</p>
              <p style={{ margin: ".25rem 0 0", fontSize: 32, fontWeight: 300 }}>{data.total}</p>
            </Tile>
            <Tile style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>FILES TOUCHED</p>
              <p style={{ margin: ".25rem 0 0", fontSize: 32, fontWeight: 300 }}>{data.files_touched.length}</p>
            </Tile>
            <Tile style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>WINDOW</p>
              <p style={{ margin: ".25rem 0 0", fontSize: 32, fontWeight: 300 }}>{data.window_minutes}m</p>
            </Tile>
          </div>

          <Tile style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>Captures by kind</h3>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {Object.entries(data.by_kind).length === 0 ? (
                <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>No captures in this window.</p>
              ) : (
                Object.entries(data.by_kind).map(([k, n]) => (
                  <Tag key={k} type="blue" size="md">
                    {k}: {n}
                  </Tag>
                ))
              )}
            </div>
          </Tile>

          <Tile style={{ padding: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>Captures by source</h3>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {Object.entries(data.by_source).length === 0 ? (
                <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>None yet.</p>
              ) : (
                Object.entries(data.by_source).map(([s, n]) => (
                  <Tag key={s} type="purple" size="md">
                    {s}: {n}
                  </Tag>
                ))
              )}
            </div>
          </Tile>

          {data.files_touched.length > 0 && (
            <Tile style={{ padding: "1rem" }}>
              <h3 style={{ marginTop: 0 }}>Files referenced</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: ".25rem" }}>
                {data.files_touched.map((f) => (
                  <code key={f} style={{ fontSize: 13 }}>📍 {f}</code>
                ))}
              </div>
            </Tile>
          )}
        </>
      )}
    </Stack>
  );
}
