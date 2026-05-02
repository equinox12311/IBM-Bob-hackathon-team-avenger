// user_profile: simple profile editor.

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

import { getProfile, updateProfile } from "@/api/client";
import type { UserProfile } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(setProfile)
      .catch((e) => setError(String(e)));
  }, [token]);

  async function save() {
    if (!token || !profile) return;
    try {
      const fresh = await updateProfile(token, profile);
      setProfile(fresh);
      setSavedAt(Date.now());
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
    <Stack gap={5} style={{ maxWidth: 720 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>Profile</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          How Cortex addresses you and presents your public footprint.
        </p>
      </header>

      <Tile style={{ padding: "1rem" }}>
        <Stack gap={5}>
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
            <Button onClick={save}>Save</Button>
            {savedAt && (
              <span style={{ fontSize: 12, color: "var(--cds-text-secondary)" }}>
                Saved {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </Stack>
      </Tile>
    </Stack>
  );
}
