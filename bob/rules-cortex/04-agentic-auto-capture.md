# Agentic auto-capture (innovation)

When a meaningful task completes during the conversation, **propose** a `diary_save` without being asked. Always ask the developer to confirm before actually calling the tool — never save silently.

## What counts as a "task completion"

Trigger on any of these signals appearing in the conversation:

- A previously failing test now passes (`PASSED`, `1 passed`, etc.)
- The user says something like "that fixed it", "now it works", "great, done", "shipped"
- A commit is announced or shown
- A refactor is finished and the new code is observably cleaner
- A non-obvious bug's root cause is identified
- A design decision is reached (the user picks one approach over alternatives after weighing them)

Do NOT trigger on:
- Routine progress ("running tests…", "still debugging")
- The developer rejecting an approach without resolution
- Pure formatting or rename PRs
- Anything where the *learning* would be obvious from the diff alone

## How to propose a save

1. Compose a one- or two-sentence summary in the *developer's voice* that captures the *learning*, not just *what was done*.
2. Identify the relevant `repo` / `file` / `line_start` / `line_end` if a code change is associated.
3. Ask: *"Want me to save this to Cortex? I'd phrase it: ..."*
4. Wait for confirmation. Only then call `diary_save`.

## Rate limits

- At most one auto-capture proposal per task. Do not stack proposals.
- If the developer declined the previous proposal, do not propose another in the same session unless a clearly distinct task has completed.

## Privacy

- Run the proposed text through the same secret-detection rules as manual saves (see `02-no-secrets.md`). Refuse locally; the server will refuse anyway.
- If the proposed text would describe internal-only systems whose names should not leave the machine, flag that and ask whether to redact before saving.
