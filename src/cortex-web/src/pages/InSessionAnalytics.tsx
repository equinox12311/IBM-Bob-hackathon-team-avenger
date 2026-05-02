// in_session_analytics: enhanced with focus timer and timeline view.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";

import { getSessionAnalytics, listTimeline } from "@/api/client";
import type { Entry, SessionAnalytics } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { relativeTime } from "@/lib/format";

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
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [focusTime, setFocusTime] = useState(25 * 60); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    if (!token) return;
    setData(null);
    const fetch = () => {
      getSessionAnalytics(token, windowMin).then(setData).catch((e) => setError(String(e)));
      listTimeline(token, { limit: 10 }).then((r) => setRecentEntries(r.entries));
    };
    fetch();
    const t = setInterval(fetch, 30_000); // auto-refresh every 30s
    return () => clearInterval(t);
  }, [token, windowMin]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setFocusTime((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case "note": return "var(--cortex-primary)";
      case "idea": return "var(--cortex-secondary)";
      default: return "var(--cortex-outline)";
    }
  };

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
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem",
        background: "var(--cortex-surface)",
        borderBottom: "1px solid var(--cortex-outline-variant)"
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Session Analytics</h1>
        <button style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          color: "var(--cortex-on-surface-variant)",
          background: "transparent",
          border: "1px solid transparent",
          cursor: "pointer"
        }}>
          <span className="material-symbols-outlined">calendar_today</span>
        </button>
      </header>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--cortex-outline-variant)",
        background: "var(--cortex-surface)",
        padding: "0 1rem"
      }}>
        {(["day", "week", "month"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "0.5rem",
              textAlign: "center",
              borderBottom: activeTab === tab ? "3px solid var(--cortex-primary)" : "3px solid transparent",
              color: activeTab === tab ? "var(--cortex-on-surface)" : "var(--cortex-on-surface-variant)",
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textTransform: "capitalize"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "6rem" }}>
        {!data ? (
          <InlineLoading description="Computing…" />
        ) : (
          <>
            {/* Time Allocation */}
            <section style={{ background: "var(--cortex-surface)", border: "1px solid var(--cortex-outline-variant)", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: "1rem", borderBottom: "1px solid var(--cortex-outline-variant)", paddingBottom: "0.5rem" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Time Allocation</h2>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--cortex-on-surface-variant)" }}>Total active time</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 42, fontWeight: 300, lineHeight: 1 }}>
                    {Math.floor(windowMin / 60)}h {windowMin % 60}m
                  </p>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Object.entries(data.by_kind).map(([kind, count]) => (
                  <div key={kind} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem",
                    background: "var(--cortex-surface-container-low)",
                    border: "1px solid var(--cortex-outline-variant)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 12, height: 12, background: getKindColor(kind) }}></div>
                      <span style={{ fontSize: 14, textTransform: "capitalize" }}>{kind}</span>
                    </div>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14 }}>{count} entries</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Focus Timer */}
            <section style={{ background: "var(--cortex-surface)", border: "1px solid var(--cortex-outline-variant)", padding: "1rem" }}>
              <h2 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 600, borderBottom: "1px solid var(--cortex-outline-variant)", paddingBottom: "0.25rem" }}>
                Focus Timer
              </h2>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: 64, fontFamily: "IBM Plex Mono, monospace", lineHeight: 1, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
                  {formatTime(focusTime)}
                </div>
                <div style={{ display: "flex", gap: "1rem", width: "100%", maxWidth: 320 }}>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    style={{
                      flex: 1,
                      padding: "0.5rem 1rem",
                      background: "var(--cortex-primary)",
                      color: "var(--cortex-on-primary)",
                      fontSize: 14,
                      fontWeight: 600,
                      border: "1px solid transparent",
                      cursor: "pointer"
                    }}
                  >
                    {isTimerRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setFocusTime(25 * 60);
                    }}
                    style={{
                      flex: 1,
                      padding: "0.5rem 1rem",
                      background: "var(--cortex-surface)",
                      color: "var(--cortex-primary)",
                      fontSize: 14,
                      fontWeight: 600,
                      border: "1px solid var(--cortex-outline)",
                      cursor: "pointer"
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section style={{ background: "var(--cortex-surface)", border: "1px solid var(--cortex-outline-variant)", padding: "1rem" }}>
              <h2 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 600, borderBottom: "1px solid var(--cortex-outline-variant)", paddingBottom: "0.5rem" }}>
                Today's Sessions
              </h2>
              <div style={{ position: "relative", paddingLeft: "0.5rem" }}>
                {/* Vertical Line */}
                <div style={{
                  position: "absolute",
                  left: 11,
                  top: 8,
                  bottom: 8,
                  width: 1,
                  background: "var(--cortex-outline-variant)"
                }}></div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {recentEntries.slice(0, 5).map((entry, idx) => (
                    <div key={entry.id} style={{ position: "relative", paddingLeft: "1.5rem" }}>
                      <div style={{
                        position: "absolute",
                        left: -5,
                        top: 6,
                        width: 8,
                        height: 8,
                        background: getKindColor(entry.kind),
                        outline: "2px solid var(--cortex-surface)"
                      }}></div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.25rem" }}>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "var(--cortex-on-surface-variant)" }}>
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
                          {relativeTime(entry.created_at)}
                        </span>
                      </div>
                      <div style={{
                        background: "var(--cortex-surface-container-low)",
                        border: "1px solid var(--cortex-outline-variant)",
                        padding: "0.5rem"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{
                            background: "var(--cortex-surface-dim)",
                            padding: "0.125rem 0.5rem",
                            fontFamily: "IBM Plex Mono, monospace",
                            fontSize: 12,
                            color: "var(--cortex-on-surface-variant)",
                            textTransform: "capitalize"
                          }}>
                            {entry.kind}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>
                            {entry.file || "General Entry"}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--cortex-on-surface-variant)" }}>
                          {entry.text.slice(0, 100)}{entry.text.length > 100 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
