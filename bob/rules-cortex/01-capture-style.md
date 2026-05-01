# Cortex capture style

Diary entries are written by Bob (via `diary_save`) and recalled later by the same developer. Optimise for *recall value*, not for prose.

## Do

- **Be specific.** "max_connections raised from 20 to 50 to fix pool exhaustion under load > 100 RPS" beats "fixed connection pool".
- **Cite code** with `file:line` (`repo`, `file`, `line_start`, `line_end` fields on `diary_save`) when the entry is about a specific change.
- **One idea per entry.** Don't merge unrelated learnings; create separate entries.
- **Use the developer's voice.** First-person past-tense is fine ("I tried X, it failed because Y").

## Don't

- Don't write long narratives. 1–3 sentences is plenty.
- Don't summarise what is already obvious from the code.
- Don't include secrets — see `02-no-secrets.md`.
