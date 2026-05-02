// Developer Identity: knowledge graph and cognitive profile visualization

import { InlineLoading, Tile } from "@carbon/react";
import { useEffect, useState } from "react";
import { getProfile, listTimeline } from "@/api/client";
import type { Entry, UserProfile } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

export default function DeveloperIdentity() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topConcepts, setTopConcepts] = useState<Array<{ name: string; count: number; lastSeen: string }>>([]);

  useEffect(() => {
    if (!token) return;
    getProfile(token).then(setProfile);
    listTimeline(token, { limit: 500 }).then((r) => {
      setEntries(r.entries);
      
      // Extract top concepts from tags
      const tagCounts = new Map<string, { count: number; lastSeen: number }>();
      r.entries.forEach(entry => {
        (entry.tags ?? []).forEach(tag => {
          const existing = tagCounts.get(tag) || { count: 0, lastSeen: 0 };
          tagCounts.set(tag, {
            count: existing.count + 1,
            lastSeen: Math.max(existing.lastSeen, entry.created_at)
          });
        });
      });
      
      const concepts = Array.from(tagCounts.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          lastSeen: getRelativeTime(data.lastSeen)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      
      setTopConcepts(concepts);
    });
  }, [token]);

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${weeks}w ago`;
  };

  if (!profile) return <InlineLoading description="Loading identity…" />;

  const totalEntries = entries.length;
  const filesCount = new Set(entries.filter(e => e.file).map(e => e.file)).size;

  return (
    <div style={{ maxWidth: "100%", margin: 0 }}>
      {/* Top App Bar */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: "0 1rem",
        height: 48,
        background: "white",
        borderBottom: "1px solid #e0e0e0"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f62fe" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: "bold", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          Cortex
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--cortex-surface-container-high)", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              👤
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "1rem", display: "grid", gridTemplateColumns: "1fr", gap: "1rem", paddingTop: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1rem" }}>
          {/* Left Column: Profile & Graph */}
          <div style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Profile Header */}
            <section style={{ background: "white", border: "1px solid #e0e0e0", padding: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--cortex-surface-container-high)", overflow: "hidden", border: "1px solid #e0e0e0", flexShrink: 0 }}>
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                    👤
                  </div>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{profile.name || "Developer"}</h1>
                  <p style={{ margin: "0.25rem 0 0", fontSize: 16, color: "#5d5f5f" }}>
                    {profile.bio || "Senior Systems Architect"}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", background: "#f4f4f4", border: "1px solid #e0e0e0", padding: "0.25rem 0.5rem", fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
                      Lvl. {Math.floor(totalEntries / 10)}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", background: "#f4f4f4", border: "1px solid #e0e0e0", padding: "0.25rem 0.5rem", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#0f62fe" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: "0.25rem" }}>hub</span>
                      Core Node
                    </span>
                  </div>
                </div>
                <div style={{ width: "100%", maxWidth: 320, marginTop: "1rem", padding: "1rem", background: "#f4f4f4", border: "1px solid #e0e0e0" }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.32px", color: "#5d5f5f", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    AI Summary
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>
                    Demonstrates expertise in {topConcepts[0]?.name || "software development"}, with {totalEntries} documented entries across {filesCount} files.
                  </p>
                </div>
              </div>
            </section>

            {/* Knowledge Graph Visual */}
            <section style={{ background: "white", border: "1px solid #e0e0e0", overflow: "hidden", position: "relative", height: 400 }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid #e0e0e0", position: "absolute", top: 0, left: 0, width: "100%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Knowledge Graph</h2>
                <span className="material-symbols-outlined" style={{ color: "#5d5f5f", cursor: "pointer" }}>fullscreen</span>
              </div>
              
              {/* Simulated Graph */}
              <div style={{ width: "100%", height: "100%", background: "#f4f4f4", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                  <line x1="50%" y1="50%" x2="30%" y2="30%" stroke="#e0e0e0" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="70%" y2="25%" stroke="#0f62fe" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="80%" y2="60%" stroke="#e0e0e0" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="25%" y2="70%" stroke="#0f62fe" strokeWidth="2" />
                  <line x1="30%" y1="30%" x2="20%" y2="45%" stroke="#e0e0e0" strokeWidth="1" />
                </svg>
                
                {/* Central Node */}
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", background: "white", border: "2px solid #0f62fe", borderRadius: "50%", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 4px rgba(15,98,254,0.1)", zIndex: 10 }}>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14, fontWeight: "bold", color: "#0f62fe" }}>
                    {topConcepts[0]?.name.slice(0, 8) || "Core"}
                  </span>
                </div>
                
                {/* Peripheral Nodes */}
                {topConcepts.slice(1, 5).map((concept, idx) => {
                  const positions = [
                    { left: "30%", top: "30%" },
                    { left: "70%", top: "25%" },
                    { left: "80%", top: "60%" },
                    { left: "25%", top: "70%" }
                  ];
                  const pos = positions[idx] || positions[0];
                  const isPrimary = idx === 1 || idx === 3;
                  
                  return (
                    <div
                      key={concept.name}
                      style={{
                        position: "absolute",
                        ...pos,
                        transform: "translate(-50%, -50%)",
                        background: isPrimary ? "#0f62fe" : "white",
                        color: isPrimary ? "white" : "#191b24",
                        border: isPrimary ? "none" : "1px solid #e0e0e0",
                        borderRadius: "50%",
                        width: isPrimary ? 56 : 48,
                        height: isPrimary ? 56 : 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        cursor: "pointer",
                        fontSize: isPrimary ? 14 : 12,
                        fontFamily: "IBM Plex Mono, monospace"
                      }}
                    >
                      {concept.name.slice(0, 6)}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Stats & Concepts */}
          <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* Cognitive Profile */}
            <section style={{ background: "white", border: "1px solid #e0e0e0" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid #e0e0e0" }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Cognitive Profile</h2>
              </div>
              <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "Conciseness", value: 85 },
                  { label: "Technical Depth", value: 92 },
                  { label: "Exploratory", value: 45 }
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: 12, letterSpacing: "0.32px", textTransform: "uppercase" }}>{item.label}</span>
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#5d5f5f" }}>{item.value}%</span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#f4f4f4", border: "1px solid #e0e0e0" }}>
                      <div style={{ height: "100%", background: item.value > 50 ? "#0f62fe" : "#5d5f5f", width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Concepts */}
            <section style={{ background: "white", border: "1px solid #e0e0e0" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid #e0e0e0" }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Top Concepts</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {topConcepts.map((concept, idx) => (
                  <div
                    key={concept.name}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: idx < topConcepts.length - 1 ? "1px solid #e0e0e0" : "none",
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      cursor: "pointer"
                    }}
                    className="concept-item"
                  >
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#0f62fe", opacity: 0 }} className="concept-indicator" />
                    <span className="material-symbols-outlined" style={{ color: "#5d5f5f", marginRight: "0.75rem" }}>
                      {idx === 0 ? "data_object" : idx === 1 ? "database" : idx === 2 ? "api" : "memory"}
                    </span>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: 16, textTransform: "capitalize" }}>{concept.name}</div>
                      <div style={{ fontSize: 12, color: "#5d5f5f" }}>{concept.count} references</div>
                    </div>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#5d5f5f" }}>
                      {concept.lastSeen}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .concept-item:hover {
          background: #f4f4f4;
        }
        .concept-item:hover .concept-indicator {
          opacity: 1 !important;
          transition: opacity 0.15s ease;
        }
      `}</style>
    </div>
  );
}
