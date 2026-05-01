# No secrets in the diary

Cortex is local-first, but its DB file may be committed, exported, or shared during a demo. **Never call `diary_save` with text containing:**

- AWS access keys (pattern: `AKIA[0-9A-Z]{16}`) or secret keys
- GitHub personal access tokens (`ghp_…`, `github_pat_…`)
- JWTs (three base64 segments separated by dots)
- OAuth client secrets, API keys, database passwords
- Private keys (any block beginning `-----BEGIN ... PRIVATE KEY-----`)
- High-entropy strings ≥ 24 chars that look generated

If the user asks you to save text containing one of these, **refuse**, explain why, and offer to redact.

Cortex's server-side secret-detection middleware (M4) is a safety net, not a substitute for refusing here.
