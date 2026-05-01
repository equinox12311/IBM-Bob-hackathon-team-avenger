# Installing the Cortex Bob extensions

A judge installs the Cortex Bob extensions in **60 seconds**:

```bash
# 1. Clone the repo (you already have it if you're reading this)
git clone https://github.com/equinox12311/IBM-Bob.git
cd IBM-Bob

# 2. Copy the Bob extensions into your global Bob config
cp bob/custom_modes.yaml.example  ~/.bob/custom_modes.yaml
cp -r bob/skills/cortex            ~/.bob/skills/
cp -r bob/commands/                ~/.bob/commands/      # diary-save, -recall, -timeline
cp -r bob/rules-cortex             ~/.bob/rules-cortex   # 4 mode rules

# 3. Wire the MCP server (see bob/MCP_CONFIG.md for full env vars)
#    Add a "cortex" entry to your Bob mcpServers config.

# 4. Restart Bob, switch to the "📓 Cortex" mode.
```

That's it. Cortex is now a first-class extension of your Bob. Try:

- `/diary-save just figured out that …`
- `/diary-recall connection pool`
- Open any file you've worked on before — Bob will surface related Cortex entries automatically.

## Layered extension surface

Cortex uses **all five** of Bob's extension surfaces, layered:

| Layer | File(s) | Purpose |
|---|---|---|
| **MCP server** | (separate process — see `MCP_CONFIG.md`) | Five tools: diary_save / diary_recall / diary_link_code / diary_feedback / diary_timeline |
| **Custom mode** | `custom_modes.yaml.example` | The `📓 Cortex` mode that orients Bob's behaviour |
| **Skill** | `skills/cortex/SKILL.md` + `examples.md` | Best-practice playbook + concrete examples |
| **Slash commands** | `commands/diary-save.md` · `commands/diary-recall.md` · `commands/diary-timeline.md` | Explicit user-driven actions |
| **Mode rules** | `rules-cortex/01-capture-style.md` · `02-no-secrets.md` · `03-proactive-recall.md` · `04-agentic-auto-capture.md` | Capture style + safety + the two innovations |
