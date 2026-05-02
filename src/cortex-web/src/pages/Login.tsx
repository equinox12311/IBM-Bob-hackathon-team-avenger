// Mock login screen. Single bearer-token entry. Phase 1 / Phase 4 (M3).

import { Button, InlineNotification, Stack, TextInput, Tile } from "@carbon/react";
import { type FormEvent, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

// Minimum token length — matches the DIARY_TOKEN minimum in the backend.
// Prevents trivially short tokens from being accepted.
const MIN_TOKEN_LENGTH = 4;
const MAX_TOKEN_LENGTH = 512;

export default function Login() {
  const { login } = useAuth();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validateToken(t: string): string | null {
    if (!t || t.trim().length === 0) return "Token cannot be empty";
    if (t.trim().length < MIN_TOKEN_LENGTH)
      return `Token must be at least ${MIN_TOKEN_LENGTH} characters`;
    if (t.trim().length > MAX_TOKEN_LENGTH)
      return `Token too long (max ${MAX_TOKEN_LENGTH} characters)`;
    // Reject tokens that look like they contain secrets themselves
    if (/[\r\n\t]/.test(t)) return "Token contains invalid characters";
    return null;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = token.trim();
    const validationError = validateToken(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    login(trimmed);
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
              onChange={(e) => {
                setToken(e.target.value);
                setError(null); // clear error on change
              }}
              autoFocus
              invalid={!!error}
              invalidText={error ?? undefined}
            />
            {error && (
              <InlineNotification
                kind="error"
                title="Invalid token"
                subtitle={error}
                hideCloseButton
              />
            )}
            <Button type="submit" disabled={!token.trim()}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Tile>
    </div>
  );
}
