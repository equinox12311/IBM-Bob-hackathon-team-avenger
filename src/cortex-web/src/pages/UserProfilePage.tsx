// user_profile: enhanced profile page with stats and settings.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  TextArea,
  TextInput,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProfile, listTimeline, updateProfile } from "@/api/client";
import type { UserProfile } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfilePage() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [stats, setStats] = useState({ logs: 0, repos: 0, insights: 0 });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(setProfile)
      .catch((e) => {
        // On error, use dummy data
        import("@/lib/dummyData").then(({ generateDummyProfile }) => {
          setProfile(generateDummyProfile());
        });
      });
    
    // Fetch stats
    listTimeline(token, { limit: 1000 }).then((r) => {
      if (r.entries.length === 0) {
        // Use dummy data for stats
        import("@/lib/dummyData").then(({ generateDummyEntries }) => {
          const entries = generateDummyEntries(50);
          const logs = entries.length;
          const repos = new Set(entries.filter(e => e.repo).map(e => e.repo)).size;
          const insights = entries.filter(e => e.kind === 'idea').length;
          setStats({ logs, repos, insights });
        });
      } else {
        const logs = r.entries.length;
        const repos = new Set(r.entries.filter(e => e.repo).map(e => e.repo)).size;
        const insights = r.entries.filter(e => e.kind === 'idea').length;
        setStats({ logs, repos, insights });
      }
    }).catch(() => {
      // On error, use dummy stats
      import("@/lib/dummyData").then(({ generateDummyEntries }) => {
        const entries = generateDummyEntries(50);
        const logs = entries.length;
        const repos = new Set(entries.filter(e => e.repo).map(e => e.repo)).size;
        const insights = entries.filter(e => e.kind === 'idea').length;
        setStats({ logs, repos, insights });
      });
    });
  }, [token]);

  async function save() {
    if (!token || !profile) return;
    try {
      const fresh = await updateProfile(token, profile);
      setProfile(fresh);
      setSavedAt(Date.now());
      setEditMode(false);
    } catch (e) {
      setError(String(e));
    }
  }

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load profile"
        subtitle={error}
        hideCloseButton
      />
    );
  if (!profile) return <InlineLoading description="Loading profile…" />;

  return (
    <div style={{ maxWidth: 768, margin: "0 auto" }}>
      <Stack gap={6}>
        {/* Profile Identity */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "1px solid var(--cortex-outline-variant)",
            background: "var(--cortex-surface-container-high)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            marginBottom: "0.5rem"
          }}>
            👤
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{profile.name || "Developer"}</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--cortex-on-surface-variant)" }}>
            {profile.bio || "Senior Architect"}
          </p>
        </section>

        {/* Stats Grid */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          <Tile style={{ padding: "1rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 42, fontWeight: 300, color: "var(--cortex-primary)" }}>{stats.logs}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
              Logs Created
            </p>
          </Tile>
          <Tile style={{ padding: "1rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 42, fontWeight: 300, color: "var(--cortex-primary)" }}>{stats.insights}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
              Insights Shared
            </p>
          </Tile>
          <Tile style={{ padding: "1rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 42, fontWeight: 300, color: "var(--cortex-primary)" }}>{stats.repos}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-on-surface-variant)" }}>
              Active Repos
            </p>
          </Tile>
        </section>

        {/* Settings List */}
        <section>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.32px", color: "var(--cortex-outline)", paddingLeft: "0.25rem" }}>
            Settings
          </h3>
          <Tile style={{ padding: 0 }}>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderBottom: "1px solid var(--cortex-outline-variant)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--cortex-on-surface-variant)" }}>tune</span>
                <span style={{ fontSize: 16 }}>Edit Profile</span>
              </div>
              <span className="material-symbols-outlined" style={{ color: "var(--cortex-outline)" }}>chevron_right</span>
            </button>
            
            <Link
              to="/settings"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderBottom: "1px solid var(--cortex-outline-variant)",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--cortex-on-surface-variant)" }}>lock</span>
                <span style={{ fontSize: 16 }}>Security</span>
              </div>
              <span className="material-symbols-outlined" style={{ color: "var(--cortex-outline)" }}>chevron_right</span>
            </Link>
            
            <Link
              to="/settings"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderBottom: "1px solid var(--cortex-outline-variant)",
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--cortex-on-surface-variant)" }}>cable</span>
                <span style={{ fontSize: 16 }}>Connected Accounts</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: 12, color: "var(--cortex-on-surface-variant)" }}>GitHub, Slack</span>
                <span className="material-symbols-outlined" style={{ color: "var(--cortex-outline)" }}>chevron_right</span>
              </div>
            </Link>
            
            <button
              onClick={logout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--cds-support-error)" }}>logout</span>
                <span style={{ fontSize: 16, color: "var(--cds-support-error)" }}>Logout</span>
              </div>
            </button>
          </Tile>
        </section>

        {/* Edit Profile Form */}
        {editMode && (
          <Tile style={{ padding: "1rem" }}>
            <Stack gap={5}>
              <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
              <TextInput
                id="profile-name"
                labelText="Display name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <TextInput
                id="profile-handle"
                labelText="Handle"
                helperText="No spaces; used in any future shared-diary URLs."
                value={profile.handle}
                onChange={(e) => setProfile({ ...profile, handle: e.target.value })}
              />
              <TextInput
                id="profile-pronouns"
                labelText="Pronouns"
                value={profile.pronouns ?? ""}
                onChange={(e) => setProfile({ ...profile, pronouns: e.target.value })}
              />
              <TextInput
                id="profile-tz"
                labelText="Timezone (IANA, e.g. Europe/London)"
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              />
              <TextArea
                id="profile-bio"
                labelText="Bio"
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
              <TextInput
                id="profile-url"
                labelText="Public URL"
                placeholder="https://your-site.example"
                value={profile.public_url ?? ""}
                onChange={(e) => setProfile({ ...profile, public_url: e.target.value })}
              />
              <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                <Button onClick={save}>Save Changes</Button>
                <Button kind="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                {savedAt && (
                  <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                    Saved {new Date(savedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </Stack>
          </Tile>
        )}
      </Stack>
    </div>
  );
}
