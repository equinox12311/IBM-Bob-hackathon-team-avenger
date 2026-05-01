# Submission Statements

> These are the **judge-facing** problem and solution statements for the Cortex submission. Pasted into the submission form and `technical_report.pdf` final draft.

## Theme alignment

This submission addresses the IBM Bob Dev Day Hackathon theme: ***"Turn idea into impact faster with IBM Bob"***.

## Problem statement

Modern software engineering generates valuable but ephemeral knowledge constantly. While solving a hard bug at 11pm Tuesday, a developer learns *why* the connection pool exhausted — but Thursday morning, that learning is gone, scattered between Slack scrollback, terminal history, and notes never re-read. The cost is the **re-derivation tax**: engineers solve the same problem twice, ask the AI assistant the same question twice, or worse, repeat the same mistake.

This problem is universal across team sizes and stacks. Anecdotal estimates suggest senior engineers spend 20–30% of their time on rediscovery. AI coding assistants don't help because every session starts cold; conventional note-taking apps don't help because they require the developer to break flow to capture and break flow to recall. There is no widely-deployed solution to **make capture and recall frictionless inside the dev loop itself**.

## Solution statement

**Cortex** is a developer's second brain that lives inside IBM Bob. It removes the two friction points that doom existing journaling tools:

1. **Capture is frictionless.** Voice memo from Telegram (transcribed by watsonx.ai STT), `/diary-save` slash command in Bob, or *agentic auto-capture* — when Bob completes a task, it proposes a draft entry summarising what was done and why, requiring only one click to confirm.

2. **Recall is proactive.** When Bob opens a file you've worked on before, Cortex automatically surfaces relevant past entries — *before the developer asks*. A custom Bob mode rule fires `diary_recall` against the file's path and any matched entries appear in Bob's sidebar with `file:line` citations.

Cortex is built as a first-class IBM Bob extension — using **all five extension layers** Bob exposes:
- **MCP server** — five tools (`diary_save`, `diary_recall`, `diary_link_code`, `diary_feedback`, `diary_timeline`)
- **Custom mode** `📓 Cortex` — orients Bob's behaviour to capture/recall
- **Skill** at `.bob/skills/cortex/` — best-practice playbook for using the diary
- **Slash commands** — `/diary-save`, `/diary-recall`, `/diary-timeline`
- **Mode rules** — capture-style guide, no-secrets policy, proactive-recall trigger

The diary "evolves" via **feedback re-ranking**: 👍 boosts an entry's score, 👎 demotes it, recency decays older entries — a learning effect without any model fine-tuning.

Cortex is local-first: SQLite + sqlite-vec store entries on the user's machine; nothing leaves except embedding requests to **watsonx.ai**. It runs as a containerised stack (`docker compose up` on port 8080) so any judge can install in minutes.

## IBM technology used

- **IBM Bob** — five-layer extension (MCP, mode, skill, slash commands, rules). Bob is also used substantively *during the build*: refactoring core modules, generating the pytest suite, security/secret scanning, generating documentation, and the live demo session. Each team member exports their Bob task-session reports to `docs/bob-sessions/`.
- **watsonx.ai** — embedding model (Granite) for vector search, and speech-to-text for Telegram voice memos.
- *(Optional, time permitting)* **watsonx Orchestrate** — orchestration of the agentic auto-capture flow.
- *(Optional, time permitting)* **IBM Cloud Code Engine** — public hosting of the web UI.

## Why Cortex matches the rubric

| Criterion | How Cortex scores |
|---|---|
| **Completeness & feasibility** | End-to-end demo on `docker compose up`; all five MCP tools functional; tests pass; license-audited; clear IBM tech application (watsonx primary, not fallback) |
| **Effectiveness & efficiency** | Addresses universal dev pain (re-derivation tax); recall-count metric provides built-in ROI signal; proactive recall changes the dev loop, not just adds to it; scales naturally to teams (v2 roadmap) |
| **Design & usability** | IBM Carbon Design System; ⌘K command palette; 60-second install; demo-quality polish |
| **Creativity & innovation** | **Two novel capabilities not in any existing dev tool:** (a) proactive recall triggered by Bob's file context, (b) agentic auto-capture on task completion. Five-layer Bob integration is itself a novel demonstration of the platform's depth. |
