// Single-entry detail with citations + feedback buttons. Phase 3 (M3).

import { Button, Tag, Tile } from "@carbon/react";
import { useParams } from "react-router-dom";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();

  // TODO(M3 Phase 3):
  // - Fetch the entry via GET /api/v1/entries/:id (add to api/client + cortex-api)
  // - Render full text + repo/file:line citation (clickable to GitHub URL)
  // - Wire boost/flag buttons to sendFeedback()
  return (
    <Tile style={{ padding: "1rem", maxWidth: 720 }}>
      <h2>Entry #{id}</h2>
      <p>TODO: render entry detail here.</p>
      <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
        <Button kind="primary">👍 Boost</Button>
        <Button kind="danger--ghost">👎 Flag</Button>
      </div>
      <Tag type="gray" style={{ marginTop: "1rem" }}>recall count: 0</Tag>
    </Tile>
  );
}
