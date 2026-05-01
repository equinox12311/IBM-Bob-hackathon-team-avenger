// Settings: API endpoint, token, default repo. Phase 3 (M3).

import { Button, Stack, TextInput, Tile } from "@carbon/react";

import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { logout } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

  return (
    <Tile style={{ padding: "1rem", maxWidth: 720 }}>
      <h2>Settings</h2>
      <Stack gap={5} style={{ marginTop: "1rem" }}>
        <TextInput
          id="api-base"
          labelText="API base URL"
          value={apiBase}
          readOnly
        />
        {/* TODO(M3 Phase 3): default repo, secret-detection rules toggle, watsonx creds */}
        <Button kind="danger" onClick={logout}>
          Sign out
        </Button>
      </Stack>
    </Tile>
  );
}
