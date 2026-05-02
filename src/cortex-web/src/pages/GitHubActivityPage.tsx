// github_activity_graph: heatmap derived from entry timestamps.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";

import { getGitHubActivity } from "@/api/client";
import type { GitHubActivity } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

const RANGES = [7, 30, 90];

export default function GitHubActivityPage() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<GitHubActivity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setData(null);
    getGitHubActivity(token, "demo", days)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [token, days]);

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load activity"
        subtitle={error}
        hideCloseButton
      />
    );

  return (
    <Stack gap={6}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>GitHub Velocity</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          Captures plotted day-by-day. Real GitHub API integration is a v2 enhancement.
        </p>
      </header>

      <div style={{ display: "flex", gap: ".5rem" }}>
        {RANGES.map((d) => (
          <Button
            key={d}
            kind={days === d ? "primary" : "tertiary"}
            size="sm"
            onClick={() => setDays(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      {!data ? (
        <InlineLoading description="Loading…" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            <Tile style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>STREAK</p>
              <p style={{ margin: ".25rem 0 0", fontSize: 32, fontWeight: 300 }}>{data.streak}d</p>
            </Tile>
            <Tile style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>TOTAL</p>
              <p style={{ margin: ".25rem 0 0", fontSize: 32, fontWeight: 300 }}>
                {data.contributions.reduce((s, c) => s + c.count, 0)}
              </p>
            </Tile>
            <Tile style={{ padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)" }}>WINDOW</p>
              <p style={{ margin: ".25rem 0 0", fontSize: 32, fontWeight: 300 }}>{data.days}d</p>
            </Tile>
          </div>

          <Tile style={{ padding: "1.5rem" }}>
            <h3 style={{ marginTop: 0 }}>Daily heatmap</h3>
            <Heatmap contributions={data.contributions} />
          </Tile>
        </>
      )}
    </Stack>
  );
}

function Heatmap({ contributions }: { contributions: { date: string; count: number }[] }) {
  if (contributions.length === 0) {
    return <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>No activity in this range yet.</p>;
  }
  const max = Math.max(...contributions.map((c) => c.count), 1);
  return (
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {contributions.map((c) => {
        const intensity = c.count === 0 ? 0 : Math.ceil((c.count / max) * 4);
        const colors = [
          "var(--cds-layer-accent)",
          "#bcd5ff",
          "#7aa6ff",
          "#3878ff",
          "#0f62fe",
        ];
        return (
          <div
            key={c.date}
            title={`${c.date}: ${c.count} ${c.count === 1 ? "entry" : "entries"}`}
            style={{
              width: 14,
              height: 14,
              background: colors[intensity],
              border: "1px solid var(--cds-border-subtle)",
            }}
          />
        );
      })}
    </div>
  );
}
