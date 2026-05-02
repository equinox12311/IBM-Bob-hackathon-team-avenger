// debugging_helper: chat-style UI on top of Cortex /chat endpoint.
// Each user message: save as kind=debug, then call /api/v1/chat (Granite RAG).
// If the LLM is off (LLM_PROVIDER=off), falls back to plain recall.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";

import {
  chatLLM,
  createEntry,
  llmInfo,
  searchEntries,
} from "@/api/client";
import { useAuth } from "@/hooks/useAuth";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  citations?: { id: number; text: string; score: number }[];
  model?: string;
}

export default function DebuggingHelper() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text:
        "Paste a stack trace, error message, or describe a bug. I'll search past Cortex entries for matches and (if Granite is enabled) draft a fix path grounded in your journal.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmAvailable, setLlmAvailable] = useState<boolean | null>(null);
  const [llmProviderName, setLlmProviderName] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    llmInfo(token)
      .then((info) => {
        setLlmAvailable(info.available);
        setLlmProviderName(info.provider);
      })
      .catch(() => setLlmAvailable(false));
  }, [token]);

  async function ask() {
    const text = input.trim();
    if (!text || !token || busy) return;
    setBusy(true);
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);

    try {
      // Save the user's debug context as an entry so future debugging benefits.
      await createEntry(token, { text, source: "web", kind: "debug" });

      if (llmAvailable) {
        const r = await chatLLM(token, text, 5);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: r.answer,
            citations: r.citations,
            model: r.model,
          },
        ]);
      } else {
        // Fallback: plain recall summary
        const r = await searchEntries(token, text, 3);
        const hits = r.entries;
        const reply =
          hits.length === 0
            ? "No related past entries. Saved this as a debug entry — capture the resolution when you have it so future-you finds it."
            : `Found ${hits.length} related ${hits.length === 1 ? "entry" : "entries"}. Top match: "${hits[0].text.slice(0, 200)}${hits[0].text.length > 200 ? "…" : ""}"`;
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: reply,
            citations: hits.map((h) => ({
              id: h.id,
              text: h.text,
              score: h.score,
            })),
            model: "recall-only",
          },
        ]);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack
      gap={5}
      style={{ height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 20 }}>Debugging Helper</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)", fontSize: 14 }}>
          Powered by your Cortex history{" "}
          {llmAvailable !== null && (
            <Tag type={llmAvailable ? "blue" : "gray"} size="sm">
              {llmAvailable ? llmProviderName : "LLM off — recall only"}
            </Tag>
          )}
        </p>
      </header>

      {error && (
        <InlineNotification
          kind="error"
          title="Request failed"
          subtitle={error}
          hideCloseButton
        />
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
            }}
          >
            <Tile
              style={{
                padding: "1rem",
                background: m.role === "user" ? "var(--cds-button-primary)" : undefined,
                color: m.role === "user" ? "var(--cds-text-on-color)" : undefined,
              }}
            >
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.text}</p>
              {m.citations && m.citations.length > 0 && (
                <div style={{ display: "flex", gap: ".25rem", flexWrap: "wrap", marginTop: ".5rem" }}>
                  {m.citations.map((c) => (
                    <Tag key={c.id} type="gray" size="sm">
                      #{c.id} · score {c.score.toFixed(2)}
                    </Tag>
                  ))}
                </div>
              )}
              {m.model && (
                <p style={{ margin: ".5rem 0 0", fontSize: 11, color: "var(--cds-text-secondary)" }}>
                  {m.model}
                </p>
              )}
            </Tile>
          </div>
        ))}
        {busy && <InlineLoading description="Thinking…" />}
      </div>

      <div style={{ display: "flex", gap: ".5rem" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder="Paste stack trace, error message, or describe the bug…"
          rows={2}
          style={{
            flex: 1,
            padding: ".75rem",
            fontFamily: "inherit",
            fontSize: 14,
            background: "var(--cds-field)",
            border: "1px solid var(--cds-border-strong)",
            resize: "vertical",
          }}
        />
        <Button onClick={ask} disabled={busy || !input.trim()}>
          {llmAvailable ? "Ask Granite" : "Search"}
        </Button>
      </div>
    </Stack>
  );
}
