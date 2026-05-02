// touch_grass_wellness: break-tracker for the deep-focus dev.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";

import { getWellness, logWellnessBreak } from "@/api/client";
import type { WellnessStatus } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

export default function TouchGrass() {
  const { token } = useAuth();
  const [data, setData] = useState<WellnessStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!token) return;
    try {
      setData(await getWellness(token));
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000); // refresh every minute
    return () => clearInterval(t);
  }, [token]);

  async function takeBreak() {
    if (!token) return;
    setBusy(true);
    try {
      setData(await logWellnessBreak(token));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load wellness"
        subtitle={error}
        hideCloseButton
      />
    );
  if (!data) return <InlineLoading description="Loading…" />;

  return (
    <Stack gap={6} style={{ maxWidth: 600 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>🌿 Touch Grass</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          A gentle nudge to step away when the focus stretches too long.
        </p>
      </header>

      <Tile
        style={{
          padding: "2rem",
          background: data.break_due
            ? "var(--cds-support-warning)"
            : "var(--cds-layer)",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, letterSpacing: ".32px", color: "var(--cds-text-secondary)" }}>
          MINUTES SINCE LAST BREAK
        </p>
        <p style={{ margin: ".5rem 0 0", fontSize: 64, fontWeight: 300, lineHeight: 1 }}>
          {data.minutes_since_break}
        </p>
        <p style={{ margin: "1rem 0 0", fontSize: 16 }}>
          {data.break_due
            ? "🌳 You're overdue. Stand up, stretch, look outside."
            : "✅ You're in good shape. Keep going."}
        </p>
      </Tile>

      <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
        <Button onClick={takeBreak} disabled={busy} kind="primary" size="lg">
          I took a break
        </Button>
        <Tag type="green" size="md">
          {data.breaks_today} today
        </Tag>
      </div>

      {data.last_break_at && (
        <Tile style={{ padding: "1rem" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>
            LAST BREAK
          </p>
          <p style={{ margin: ".25rem 0 0" }}>
            {new Date(data.last_break_at).toLocaleString()}
          </p>
        </Tile>
      )}
    </Stack>
  );
}
