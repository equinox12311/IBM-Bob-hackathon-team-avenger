import {
  Button,
  InlineLoading,
  InlineNotification,
  Link as CarbonLink,
  Stack,
  Tag,
  Tile,
} from "@carbon/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEntry, sendFeedback } from "@/api/client";
import type { Entry } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import { gitHubUrl, relativeTime, sourceBadgeColor } from "@/lib/format";
import { validateEntryId } from "@/lib/validation";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    
    try {
      // Validate entry ID before making API call (OWASP Phase 1)
      const validId = validateEntryId(id);
      getEntry(token, validId)
        .then(setEntry)
        .catch((e) => setError(String(e)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid entry ID");
    }
  }, [token, id]);

  async function vote(signal: "boost" | "flag") {
    if (!token || !entry || busy) return;
    setBusy(true);
    try {
      const res = await sendFeedback(token, entry.id, signal);
      setEntry({ ...entry, score: res.score });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <InlineNotification
        kind="error"
        title="Error"
        subtitle={error}
        hideCloseButton
      />
    );
  }
  if (!entry) return <InlineLoading description="Loading entry…" />;

  const ghUrl = gitHubUrl(
    entry.repo,
    entry.file,
    entry.line_start,
    entry.line_end,
  );

  return (
    <Stack gap={5} style={{ maxWidth: 720 }}>
      <Button kind="ghost" size="sm" onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <Tile style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
          <Tag type={sourceBadgeColor(entry.source)}>{entry.source}</Tag>
          <Tag type="green">score {entry.score.toFixed(2)}</Tag>
          <span style={{ color: "var(--cds-text-secondary)", fontSize: 12 }}>
            #{entry.id} · {relativeTime(entry.created_at)}
          </span>
        </div>
        <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 16 }}>
          {entry.text}
        </p>
        {entry.tags && entry.tags.length > 0 && (
          <div style={{ marginTop: "1rem", display: "flex", gap: ".25rem", flexWrap: "wrap" }}>
            {entry.tags.map((t) => (
              <Tag key={t} type="gray">
                {t}
              </Tag>
            ))}
          </div>
        )}
        {ghUrl && (
          <p style={{ marginTop: "1rem" }}>
            📍{" "}
            <CarbonLink href={ghUrl} target="_blank" rel="noopener noreferrer">
              {entry.file}
              {entry.line_start ? `:${entry.line_start}` : ""}
              {entry.line_end && entry.line_end !== entry.line_start ? `-${entry.line_end}` : ""}
            </CarbonLink>
          </p>
        )}
      </Tile>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <Button kind="primary" disabled={busy} onClick={() => vote("boost")}>
          👍 Boost
        </Button>
        <Button kind="danger--ghost" disabled={busy} onClick={() => vote("flag")}>
          👎 Flag
        </Button>
      </div>
    </Stack>
  );
}
