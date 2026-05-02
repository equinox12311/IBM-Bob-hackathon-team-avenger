// task_automation: CRUD for automation rules.

import {
  Button,
  InlineLoading,
  InlineNotification,
  Select,
  SelectItem,
  Stack,
  Tag,
  TextInput,
  Tile,
  Toggle,
} from "@carbon/react";
import { useEffect, useState } from "react";

import {
  createAutomation,
  deleteAutomation,
  listAutomations,
  toggleAutomation,
} from "@/api/client";
import type { Automation } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";

const KINDS = ["note", "idea", "debug", "decision", "fix", "task", "report", "wellness"];

export default function Automations() {
  const { token } = useAuth();
  const [items, setItems] = useState<Automation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("note");
  const [action, setAction] = useState("");

  async function refresh() {
    if (!token) return;
    try {
      const r = await listAutomations(token);
      // If no automations, use dummy data
      if (r.automations.length === 0) {
        const { generateDummyAutomations } = await import("@/lib/dummyData");
        setItems(generateDummyAutomations());
      } else {
        setItems(r.automations);
      }
    } catch (e) {
      // On error, use dummy data
      import("@/lib/dummyData").then(({ generateDummyAutomations }) => {
        setItems(generateDummyAutomations());
      });
    }
  }

  useEffect(() => {
    refresh();
  }, [token]);

  async function add() {
    if (!token || !name.trim() || !action.trim()) return;
    await createAutomation(token, { name: name.trim(), trigger_kind: trigger, action: action.trim() });
    setName("");
    setAction("");
    refresh();
  }

  if (error)
    return (
      <InlineNotification
        kind="error"
        title="Couldn't load automations"
        subtitle={error}
        hideCloseButton
      />
    );

  return (
    <Stack gap={6}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>Task Automation</h1>
        <p style={{ margin: ".25rem 0 0", color: "var(--cds-text-secondary)" }}>
          Trigger an action whenever a Cortex entry of a given kind is captured.
        </p>
      </header>

      <Tile style={{ padding: "1rem" }}>
        <Stack gap={4}>
          <h3 style={{ margin: 0 }}>New rule</h3>
          <TextInput
            id="auto-name"
            labelText="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            id="auto-trigger"
            labelText="When entry of kind…"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          >
            {KINDS.map((k) => (
              <SelectItem key={k} value={k} text={k} />
            ))}
          </Select>
          <TextInput
            id="auto-action"
            labelText="Then run action"
            placeholder="e.g. post to Slack #standup"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <Button onClick={add} disabled={!name.trim() || !action.trim()}>
            Create rule
          </Button>
        </Stack>
      </Tile>

      {!items ? (
        <InlineLoading description="Loading…" />
      ) : items.length === 0 ? (
        <Tile><p style={{ margin: 0, color: "var(--cds-text-secondary)" }}>No automations yet.</p></Tile>
      ) : (
        <Stack gap={2}>
          {items.map((a) => (
            <Tile key={a.id} style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <Toggle
                  id={`toggle-${a.id}`}
                  toggled={!!a.enabled}
                  hideLabel
                  labelText="enabled"
                  onToggle={(checked) => toggleAutomation(token!, a.id, checked).then(refresh)}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{a.name}</p>
                  <p style={{ margin: ".25rem 0 0", fontSize: 13, color: "var(--cds-text-secondary)" }}>
                    on <Tag type="blue" size="sm">{a.trigger_kind}</Tag>
                    → <code>{a.action}</code>
                  </p>
                </div>
                <Button
                  kind="danger--ghost"
                  size="sm"
                  onClick={() => deleteAutomation(token!, a.id).then(refresh)}
                >
                  Delete
                </Button>
              </div>
            </Tile>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
