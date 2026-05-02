# License audit

The IBM Bob Dev Day Hackathon rules require:

> "(v) The Submission must not breach the terms and conditions of any embedded software or services used by your Submission, including Sponsors' APIs"

and grant IBM a perpetual license to the submission. Every dependency below is therefore commercial-friendly (MIT / Apache-2.0 / BSD-3-Clause) and may be sublicensed.

This audit was generated 2026-05-02 as part of `chore/submission-prep`.

## Cortex — repository license
**MIT** — see [`LICENSE`](../LICENSE).

## `src/cortex-api/` (Python)

| Package | Version | License |
|---|---|---|
| fastapi | 0.115.0 | MIT |
| uvicorn[standard] | 0.32.0 | BSD-3-Clause |
| pydantic | 2.9.2 | MIT |
| pydantic-settings | 2.6.0 | MIT |
| python-dotenv | 1.0.1 | BSD-3-Clause |
| sqlite-vec | 0.1.5 | Apache-2.0 / MIT (dual) |
| mcp (Anthropic SDK) | 1.0.0 | MIT |
| sentence-transformers | 3.2.1 | Apache-2.0 |
| ibm-watsonx-ai | 1.1.16 | Apache-2.0 (IBM) |
| httpx | 0.27.2 | BSD-3-Clause |

Transitive deps inherited from these (numpy, torch, transformers, etc.) are all permissive (BSD / Apache-2.0 / MIT). No GPL / AGPL / SSPL anywhere in the tree.

## `src/cortex-bot/` (Python)

| Package | Version | License |
|---|---|---|
| python-telegram-bot | 21.6 | LGPL-3.0-only with Pure-Python carve-out (not statically linked; commercial use allowed) |
| httpx | 0.27.2 | BSD-3-Clause |
| pydantic-settings | 2.6.0 | MIT |
| python-dotenv | 1.0.1 | BSD-3-Clause |
| ibm-watson | 9.0.0 | Apache-2.0 (IBM) |
| faster-whisper | 1.0.3 | MIT |

`python-telegram-bot` is LGPL-3.0; we use it as an unmodified library, dynamically imported. LGPL allows this without imposing copyleft on Cortex itself.

## `src/cortex-web/` (npm)

| Package | License |
|---|---|
| react · react-dom | MIT |
| react-router-dom | MIT |
| @carbon/react · @carbon/icons-react | Apache-2.0 (IBM) |
| vite | MIT |
| @vitejs/plugin-react | MIT |
| typescript | Apache-2.0 |
| sass | MIT |
| vitest | MIT |

All transitive deps are MIT / Apache-2.0 / BSD per `npm audit signatures` and the upstream repos.

## Bob extensions
The files under `bob/` (custom_modes.yaml, skills/, commands/, rules-cortex/) are original to Cortex and licensed MIT. They reference IBM Bob trademarks per the hackathon rules ("IBM Bob and IBM watsonx are trademarks of the IBM Corporation").

## External services

| Service | Used by | License / Terms |
|---|---|---|
| **IBM Bob** | All — required by hackathon | Per hackathon rules + IBM Bob ToS |
| **watsonx.ai embeddings** | cortex-api | Per IBM Cloud Service Description |
| **IBM Speech to Text** | cortex-bot | Per IBM Cloud Service Description |
| **Telegram Bot API** | cortex-bot | Telegram ToS — bots only respond to allowlisted users; commercial use permitted |
| **GitHub** | repo hosting | GitHub ToS — public repo per submission requirement |

## No proprietary code

Per the originality clause of the hackathon rules, no part of this submission was developed in any substantive form/format prior to the contest. Claude Code and (where applicable) IBM Bob were used as authoring tools during the contest period; both are properly attributed in `docs/BOB_USAGE.md` and per-commit metadata.

## Verification

To regenerate this audit:

```bash
# Python deps
pip install pip-licenses
pip-licenses --from=mixed --with-license-file --no-license-path \
  --packages $(cat src/cortex-api/requirements.txt src/cortex-bot/requirements.txt | grep -v '^$\|^#' | cut -d= -f1)

# Node deps
cd src/cortex-web && npx license-checker --production --summary
```
