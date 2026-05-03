# Cortex — Architecture

Diagrams as Mermaid (renders natively on GitHub). Each one targets a specific question — read the headers and skip the rest.

---

## 1. The mental model — three tiers of memory

Cortex is **memory · reasoning · action.** Local-first by default; escalates to IBM Bob when the work outgrows the phone.

```mermaid
flowchart LR
    classDef tier fill:#dbe1ff,stroke:#004cca,stroke-width:1px,color:#00174b
    classDef act  fill:#ebdcff,stroke:#731be5,stroke-width:1px,color:#270058
    classDef bob  fill:#ffdbc9,stroke:#8e4000,stroke-width:1px,color:#321200

    capture[Capture<br/>phone · terminal · telegram]:::tier
    diary[Diary<br/>sqlite-vec on-device]:::tier
    granite[Granite RAG<br/>local + watsonx]:::act
    queue[pending_actions<br/>queue]:::act
    bob[IBM Bob<br/>full session w/ context]:::bob

    capture --> diary
    diary -- vector + recency rerank --> granite
    granite -- "answer + citations" --> user((you))
    granite -- "needs work" --> queue
    queue -- diary_pending_actions MCP --> bob
    bob -- edits files / replies --> user
```

---

## 2. System topology — what runs where

The full process graph. Every arrow is over loopback or LAN; nothing crosses the internet except the optional watsonx call.

```mermaid
flowchart TB
    classDef svc fill:#f9f9fe,stroke:#004cca,stroke-width:1.5px,color:#1a1c1f
    classDef db  fill:#ebdcff,stroke:#731be5,stroke-width:1px,color:#270058
    classDef ext fill:#ffdbc9,stroke:#8e4000,stroke-width:1px,color:#321200

    subgraph mac[macOS / Linux / Windows]
      api[cortex-api · uvicorn :8080]:::svc
      mcp[cortex-mcp · stdio]:::svc
      bot[cortex-bot · telegram poll]:::svc
      sched[scheduler<br/>asyncio loop]:::svc
      sqlite[(sqlite + sqlite-vec)]:::db
      bob[IBM Bob<br/>~/.bob/ extensions]:::ext
    end

    phone[Cortex mobile<br/>Expo Go on phone]:::svc
    watsonx[watsonx.ai<br/>granite-embeddings + chat]:::ext

    api <-- LAN HTTP+token --> phone
    api -- reads/writes --> sqlite
    sched -- ticks every 30s --> api
    mcp -- shares process w/ api --> sqlite
    bot -- writes entries --> api
    bob -- spawns --> mcp
    api -- optional --> watsonx
```

---

## 3. One-command boot (`make start`)

What `scripts/start.py` does, in order. Each step is **idempotent** — skipped if already done.

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant Sh  as scripts/start.py
    participant Pip as pip / venv
    participant Npm as npm
    participant Api as uvicorn (background)
    participant Qr  as scripts/pair.py
    participant Expo as expo dev server
    participant Phone as phone (Expo Go)

    Dev->>Sh: make start  /  start.bat  /  ./start.ps1
    Sh->>Pip: ensure .venv + cortex-api deps
    Sh->>Sh: ensure .env + DIARY_TOKEN
    Sh->>Npm: npm install --legacy-peer-deps (if missing)
    Sh->>Api: spawn uvicorn (logs → .logs/api.log)
    Sh-->>Sh: poll /health (≤30s)
    Sh->>Qr: print pairing QR + Expo Go install steps
    Sh->>Expo: npx expo start --clear (foreground)
    Expo-->>Dev: prints Expo QR
    Dev->>Phone: scan Expo QR (Camera or Expo Go)
    Phone->>Expo: load JS bundle
    Dev->>Phone: open Settings → Scan to connect
    Phone->>Qr: scan pairing QR
    Phone->>Api: GET /health (verify)
    Api-->>Phone: 200 ok
    Note over Phone: API URL + token persisted to AsyncStorage
```

---

## 4. IBM Bob extension surfaces

Cortex uses **all five** of Bob's documented extension layers. `make install-bob` copies the right files to `~/.bob/`.

```mermaid
flowchart LR
    classDef src  fill:#dbe1ff,stroke:#004cca,color:#00174b
    classDef bob  fill:#ffdbc9,stroke:#8e4000,color:#321200

    subgraph repo[bob/ in this repo]
      mode[custom_modes.yaml.example<br/>📓 Cortex mode]:::src
      skill[skills/cortex/SKILL.md]:::src
      cmds[commands/diary-*.md]:::src
      rules[rules-cortex/01..05.md]:::src
      mcpconf[MCP config snippet]:::src
    end

    subgraph dot[~/.bob/]
      bmode[modes/cortex.yaml]:::bob
      bskill[skills/cortex/]:::bob
      bcmds[commands/]:::bob
      brules[rules-cortex/]:::bob
      bmcp[settings/mcp_settings.json]:::bob
    end

    mode -- make install-bob --> bmode
    skill -- make install-bob --> bskill
    cmds  -- make install-bob --> bcmds
    rules -- make install-bob --> brules
    mcpconf -- make install-bob --> bmcp
```

---

## 5. The handoff — phone → Bob

What happens when the user taps **"Send to Bob"** in the Workspace screen. The phone never blocks waiting for Bob; Bob picks the action up on its next session.

```mermaid
sequenceDiagram
    autonumber
    participant Phone as Cortex mobile
    participant Api as cortex-api :8080
    participant Sql as sqlite
    participant Mcp as cortex-mcp (stdio)
    participant Bob as IBM Bob

    Phone->>Api: POST /api/v1/actions/queue { kind, payload, source:"mobile" }
    Api->>Sql: INSERT INTO pending_actions
    Api-->>Phone: 201 created
    Note over Phone: UI shows "Sent to Bob"
    rect rgba(115,27,229,0.08)
      Note over Bob,Mcp: minutes / hours later — new Bob session
    end
    Bob->>Mcp: tool call diary_pending_actions(consume=true)
    Mcp->>Sql: SELECT … WHERE consumed_at IS NULL
    Sql-->>Mcp: pending rows
    Mcp-->>Bob: action list
    Bob-->>Bob: applies rule 05-pending-actions:<br/>maps kind → behaviour
    Bob->>Mcp: diary_save / diary_recall as needed
    Bob->>Sql: marks consumed_at
```

---

## 6. The cron scheduler

`automations` rows now have a `schedule` (5-field cron) + `last_run_at` + `run_count`. The scheduler ticks every 30 s and dispatches by trigger kind.

```mermaid
flowchart TB
    classDef ok  fill:#defbe6,stroke:#198038,color:#0d3018
    classDef bg  fill:#f9f9fe,stroke:#c2c6d9,color:#1a1c1f

    tick[asyncio loop · 30s]:::bg
    listing[list_scheduled_automations<br/>enabled=1, schedule≠""]:::bg
    due{is_due?<br/>croniter.next<= now}:::bg
    notify[notify → audit_log only]:::ok
    recall[recall → pending_actions/recall]:::ok
    report[report → daily_narrative<br/>→ pending_actions/free]:::ok
    audit[audit_log row<br/>action=automation.fired]:::ok

    tick --> listing --> due
    due -- yes notify --> notify --> audit
    due -- yes recall --> recall --> audit
    due -- yes report --> report --> audit
    due -- no --> tick
```

---

## 7. The mobile design system

Every screen composes from `cortex-mobile/src/components/ui/`. Theme-aware via `useThemeMode()`; dark mode propagates without per-screen wiring.

```mermaid
flowchart LR
    classDef prim fill:#dbe1ff,stroke:#004cca,color:#00174b
    classDef screen fill:#f9f9fe,stroke:#c2c6d9,color:#1a1c1f

    Theme[useThemeMode]:::prim
    Screen[Screen]:::prim
    Header[Header]:::prim
    Card[Card]:::prim
    Button[Button]:::prim
    Pill[Pill]:::prim
    Empty[EmptyState]:::prim
    Section[Section]:::prim
    Banner[StatusBanner]:::prim
    IconBtn[IconButton]:::prim

    today[Today]:::screen
    chat[Ask · Granite]:::screen
    capture[Capture]:::screen
    skills[Skills]:::screen
    sched[Scheduler]:::screen
    work[Workspace]:::screen
    expl[Explorer]:::screen
    wiki[Wiki]:::screen
    sec[Security]:::screen
    set[Settings]:::screen
    onb[Onboarding]:::screen

    Theme --> Screen
    Theme --> Header
    Theme --> Card
    Theme --> Button
    Theme --> Pill
    Theme --> Empty
    Theme --> Section
    Theme --> Banner
    Theme --> IconBtn

    Screen --> today & chat & capture & skills & sched & work & expl & wiki & sec & set & onb
```

---

*Generated diagrams — keep this file in sync when the architecture changes. The Mermaid source can be re-rendered into PNG/SVG with `mmdc` if needed for slide decks.*
