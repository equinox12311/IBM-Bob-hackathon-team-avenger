import {
  Button,
  InlineNotification,
  Stack,
  TextInput,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";

import { checkHealth } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { validateApiUrl } from "@/lib/validation";

const API_URL_KEY = "cortex.api_base_url";

export default function Settings() {
  const { token, login, logout } = useAuth();
  const envBase =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const [apiBase, setApiBase] = useState<string>(
    () => localStorage.getItem(API_URL_KEY) || envBase,
  );
  const [tokenInput, setTokenInput] = useState<string>(token || "");
  const [healthMsg, setHealthMsg] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  useEffect(() => {
    setTokenInput(token || "");
  }, [token]);

  function saveApiBase() {
    // Validate API URL before saving (OWASP Phase 2)
    try {
      const validUrl = validateApiUrl(apiBase);
      if (validUrl === envBase) localStorage.removeItem(API_URL_KEY);
      else localStorage.setItem(API_URL_KEY, validUrl);
      setHealthMsg("API base URL saved.");
      setHealthOk(true);
    } catch (e) {
      setHealthOk(false);
      setHealthMsg(e instanceof Error ? e.message : "Invalid API URL");
    }
  }

  async function testHealth() {
    setHealthMsg(null);
    setHealthOk(null);
    try {
      const r = await checkHealth();
      setHealthOk(true);
      setHealthMsg(`OK — status: ${r.status}`);
    } catch (e) {
      setHealthOk(false);
      setHealthMsg(String(e));
    }
  }

  function rotateToken() {
    const t = tokenInput.trim();
    if (t) login(t);
  }

  return (
    <Stack gap={6} style={{ maxWidth: 720 }}>
      <h2>Settings</h2>

      <Tile style={{ padding: "1rem" }}>
        <Stack gap={5}>
          <TextInput
            id="api-base"
            labelText="API base URL"
            helperText={`Defaults to ${envBase}; override here for the demo.`}
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
          />
          <div style={{ display: "flex", gap: ".5rem" }}>
            <Button onClick={saveApiBase}>Save</Button>
            <Button kind="tertiary" onClick={testHealth}>
              Test connection
            </Button>
          </div>
          {healthMsg && (
            <InlineNotification
              kind={healthOk ? "success" : "error"}
              title={healthOk ? "Reachable" : "Unreachable"}
              subtitle={healthMsg}
              hideCloseButton
            />
          )}
        </Stack>
      </Tile>

      <Tile style={{ padding: "1rem" }}>
        <Stack gap={5}>
          <TextInput
            id="token"
            labelText="Bearer token"
            type="password"
            helperText="Stored in localStorage."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <div style={{ display: "flex", gap: ".5rem" }}>
            <Button onClick={rotateToken}>Update token</Button>
            <Button kind="danger" onClick={logout}>
              Sign out
            </Button>
          </div>
        </Stack>
      </Tile>
    </Stack>
  );
}
