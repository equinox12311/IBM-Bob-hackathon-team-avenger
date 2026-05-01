// Mock login screen. Single bearer-token entry. Phase 1 / Phase 4 (M3).

import { Button, Stack, TextInput, Tile } from "@carbon/react";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const [token, setToken] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (token.trim()) login(token.trim());
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--cds-background)",
      }}
    >
      <Tile style={{ width: 400, padding: "2rem" }}>
        <form onSubmit={onSubmit}>
          <Stack gap={5}>
            <h1 style={{ margin: 0 }}>📓 Cortex</h1>
            <p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
              Paste your DIARY_TOKEN to continue.
            </p>
            <TextInput
              id="token"
              labelText="Bearer token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={!token.trim()}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Tile>
    </div>
  );
}
