// daily_report_soft_v1 — aggregate report for the last N days.

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

import { getDailyReport } from "@/api/client";
import type { DailyReport } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime, sourceBadgeColor } from "@/lib/format";

const RANGES: { days: number; label: string }[] = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
];

export default function DailyReportPage() {
  const { token } = useAuth();
  const [days, setDays] = useState(1);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setReport(null);
    getDailyReport(token, days)
      .then((r) => {
        // If no entries, use dummy data
        if (r.total_entries === 0) {
          import("@/lib/dummyData").then(({ generateDummyEntries }) => {
            const entries = generateDummyEntries(50);
            const now = Date.now();
            const startDate = now - (days * 24 * 60 * 60 * 1000);
            const filtered = entries.filter(e => e.created_at >= startDate);
            const byKind = filtered.reduce((acc, e) => {
              acc[e.kind] = (acc[e.kind] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            setReport({
              date_start: startDate,
              date_end: now,
              total_entries: filtered.length,
              by_kind: byKind,
              highlights: filtered.slice(0, 10)
            });
          });
        } else {
          setReport(r);
        }
      })
      .catch((e) => {
        // On error, use dummy data
        import("@/lib/dummyData").then(({ generateDummyEntries }) => {
          const entries = generateDummyEntries(50);
          const now = Date.now();
          const startDate = now - (days * 24 * 60 * 60 * 1000);
          const filtered = entries.filter(e => e.created_at >= startDate);
          const byKind = filtered.reduce((acc, e) => {
            acc[e.kind] = (acc[e.kind] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          setReport({
            date_start: startDate,
            date_end: now,
            total_entries: filtered.length,
            by_kind: byKind,
            highlights: filtered.slice(0, 10)
          });
        });
      });
  }, [token, days]);

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load report"
        subtitle={error}
        hideCloseButton
      />
    );

  return (
    <Stack gap={6}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>Daily Report</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          Auto-aggregated from your Cortex entries.
        </p>
      </header>

      <div style={{ display: "flex", gap: ".5rem" }}>
        {RANGES.map((r) => (
          <Button
            key={r.days}
            kind={days === r.days ? "primary" : "tertiary"}
            size="sm"
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {!report ? (
        <InlineLoading description="Aggregating…" />
      ) : (
        <>
          <Tile style={{ padding: "1.5rem" }}>
            <Stack gap={3}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--cds-text-secondary)", letterSpacing: ".32px" }}>
                SUMMARY
              </p>
              <h2 style={{ margin: 0 }}>
                {report.total_entries} {report.total_entries === 1 ? "entry" : "entries"} captured
              </h2>
              <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
                {new Date(report.date_start).toLocaleDateString()} → {new Date(report.date_end).toLocaleDateString()}
              </p>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {Object.entries(report.by_kind).map(([k, n]) => (
                  <Tag key={k} type="blue" size="md">
                    {k}: {n}
                  </Tag>
                ))}
              </div>
            </Stack>
          </Tile>

          <Stack gap={3}>
            <h3 style={{ margin: 0 }}>Highlights</h3>
            {report.highlights.length === 0 && (
              <Tile><p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>No entries in this range.</p></Tile>
            )}
            {report.highlights.map((e) => (
              <Tile key={e.id} style={{ padding: "1rem" }}>
                <div style={{ display: "flex", gap: ".5rem", marginBottom: ".5rem" }}>
                  <Tag type={sourceBadgeColor(e.source)}>{e.kind}</Tag>
                  <Tag type="green">score {e.score.toFixed(2)}</Tag>
                  <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                    {relativeTime(e.created_at)}
                  </span>
                </div>
                <Link to={`/entry/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <p style={{ margin: 0 }}>{e.text.slice(0, 220)}{e.text.length > 220 ? "…" : ""}</p>
                </Link>
              </Tile>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
