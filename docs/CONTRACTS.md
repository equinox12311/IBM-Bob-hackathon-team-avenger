# Shared Contracts — `dev-diary-mcp`

> Lock these in Phase 0 (Hour 0–2). Every other team member's work depends on them. **Do not change without a sync call.**

## MCP tools ↔ REST endpoints

The MCP server and the REST/SSE server share the same handlers; clients pick the transport that suits them.

| Action | MCP tool | REST endpoint | Request | Response |
|---|---|---|---|---|
| Save | `diary_save` | `POST /api/v1/entries` | `{text, source, repo?, file?, line_start?, line_end?, tags?}` | `{id: number, created_at: number}` |
| Recall | `diary_recall` | `GET /api/v1/search?q=...&k=5` | — | `{entries: Entry[]}` |
| Link code | `diary_link_code` | `PATCH /api/v1/entries/:id/link` | `{repo, file, line_start, line_end}` | `{id}` |
| Feedback | `diary_feedback` | `POST /api/v1/entries/:id/feedback` | `{signal: "boost" \| "flag"}` | `{id, score}` |
| Timeline | `diary_timeline` | `GET /api/v1/entries?since=...&limit=20` | — | `{entries: Entry[]}` |

### `Entry` shape (TypeScript)

```ts
interface Entry {
  id: number;
  text: string;
  score: number;            // current cumulative score (post-feedback)
  source: "bob" | "telegram-text" | "telegram-voice" | "web";
  repo?: string;            // e.g. "github.com/user/repo"
  file?: string;            // relative path
  line_start?: number;
  line_end?: number;
  tags?: string[];          // server splits comma-separated TEXT into array
  created_at: number;       // unix epoch ms
}
```

## SQLite schema

`sqlite-vec` extension is loaded on startup. Db file: `data/diary.db` (gitignored).

```sql
CREATE TABLE entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  text        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  score       REAL NOT NULL DEFAULT 1.0,
  source      TEXT NOT NULL,
  repo        TEXT,
  file        TEXT,
  line_start  INTEGER,
  line_end    INTEGER,
  tags        TEXT
);

CREATE VIRTUAL TABLE vec_entries USING vec0(
  embedding FLOAT[384]   -- MiniLM-L6-v2 dim; change if watsonx model differs
);

CREATE TABLE feedback (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id  INTEGER NOT NULL REFERENCES entries(id),
  signal    TEXT NOT NULL CHECK (signal IN ('boost','flag')),
  ts        INTEGER NOT NULL
);

CREATE INDEX idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX idx_feedback_entry ON feedback(entry_id);
```

## Re-ranking math

```
final_score = entry.score
            * exp(-λ * days_since_created)         # λ = 0.005
            * cosine_similarity(q_embedding, entry_embedding)

# Feedback updates entry.score in-place, clamped to [0.1, 5.0]:
boost: entry.score += 0.2
flag:  entry.score -= 0.3
```

## Auth

- All REST endpoints require `Authorization: Bearer <DIARY_TOKEN>`
- `DIARY_TOKEN` is a single shared secret in `.env` (never committed)
- MCP transport (stdio) is local-only and inherits the OS user; no header needed

## Embeddings

- **Default:** watsonx.ai embedding model (M4 to confirm exact model + dim during Phase 0)
- **Fallback:** local `sentence-transformers/all-MiniLM-L6-v2` (384-dim)
- If watsonx model dim differs from 384, recreate the `vec_entries` table with the correct dim

## Bob extension manifests (paths in repo)

```
bob/
├── custom_modes.yaml              # 📓 Cortex mode, slug: cortex
├── skills/
│   └── cortex/
│       ├── SKILL.md               # YAML frontmatter + instructions
│       └── (supporting files)
├── commands/
│   ├── diary-save.md
│   ├── diary-recall.md
│   └── diary-timeline.md
└── rules-cortex/
    ├── 01-capture-style.md
    ├── 02-no-secrets.md
    └── 03-proactive-recall.md
```

A judge installs by copying `bob/` contents into their `~/.bob/`.

## Repo layout

```
.
├── README.md
├── LICENSE                       # MIT
├── .gitignore
├── .env.example                  # template; no secrets
├── docker-compose.yml            # api on 8080, web on 8081, bot is long-running
├── team_info.json                # team metadata
├── docs/
│   ├── PLAN.md                   # master plan (single source of truth)
│   ├── CONTRACTS.md              # this file
│   ├── SUBMISSION.md             # judge-facing problem & solution statements
│   ├── BOB_USAGE.md              # ledger of every Bob session
│   ├── AGENT_PROMPT.md           # starting prompt for non-Bob AI agents
│   ├── TRELLO_BOARD.md           # Trello board structure & initial cards
│   ├── IDEA.md                   # pitch one-pager
│   ├── technical_report.pdf      # 4-page A4 technical write-up (Phase 4)
│   ├── bob-sessions/             # exported Bob task-session reports
│   └── security/                 # Bob-generated secret-scan report
├── src/                          # all application source code
│   ├── cortex-api/               # Python: MCP server + REST API (port 8080)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   └── cortex_api/           # Python package
│   │       ├── __init__.py
│   │       ├── server.py         # FastAPI app
│   │       ├── mcp_server.py     # MCP stdio server
│   │       ├── storage.py        # sqlite-vec wrapper
│   │       ├── retrieval.py      # search + re-ranking
│   │       ├── embeddings.py     # watsonx.ai + sentence-transformers
│   │       ├── tools.py          # the 5 MCP tools
│   │       ├── secrets.py        # secret-detection middleware
│   │       ├── models.py         # pydantic models (per CONTRACTS.md)
│   │       ├── auth.py           # bearer-token dependency
│   │       └── config.py         # env-based settings
│   ├── cortex-bot/               # Python: Telegram bot
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── cortex_bot/
│   │       ├── main.py
│   │       ├── handlers.py
│   │       ├── transcription.py
│   │       ├── api_client.py
│   │       ├── secret_guard.py
│   │       └── config.py
│   └── cortex-web/               # React + Vite + TS UI (port 8081)
│       ├── Dockerfile
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── App.tsx
│           ├── pages/
│           ├── components/
│           ├── api/
│           ├── hooks/
│           └── lib/
├── bob/                          # Bob extensions (mode + skill + cmds + rules + INSTALL/MCP_CONFIG)
├── tests/                        # pytest
└── assets/                       # UI mockups, screenshots, demo stills
```
