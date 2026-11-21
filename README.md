# agent-hub

![agent-hub — skill crystals and plugin tiles at the agent tooling front door](docs/assets/agent-hub-hero.jpg)


Front door for DataKnifeAI agent tooling: browse and install skills, plugins, and editor extensions for Cursor, GitHub Copilot, VS Code, Claude Code, SKILL.md-compatible agents, and Coder / Cloud Agent workspaces.

Live at [dataknifeai.github.io/agent-hub](https://dataknifeai.github.io/agent-hub/) (preview).

Skills stay in [agent-skills](https://github.com/DataKnifeAI/agent-skills). This repo holds the catalog site and, once built, the plugin bundles that package those skills with rules and MCP config templates.

## What works today vs. proposed

| Area | State |
|------|-------|
| Skill install commands | Work now. They wrap `agent-skills/scripts/install-skills.sh --target <tool dir>` |
| Editor extensions | Third-party extensions that pair with each skill. `cursor` / `code --install-extension` |
| Plugins (`dataknifeai`, `-kube`, `-scm`) | Proposed. See [Plugin layout](#plugin-layout) |
| MCP servers | Links to each repo's setup guide. Most need a local build and credentials |

## Plugin layout

Planned structure, so one plugin folder installs in every supported tool:

```text
.claude-plugin/marketplace.json   # Claude Code, Copilot CLI, VS Code
.cursor-plugin/marketplace.json   # Cursor (Customize → From GitHub Repository)
plugins/<name>/
  plugin.json                     # Agent Plugins 1.0 ($schema) — Cursor, VS Code, Copilot
  .cursor-plugin/plugin.json      # Cursor rules, commands, hooks
  .claude-plugin/plugin.json
  skills/                         # copied from agent-skills by CI, not symlinked
  rules/
  mcp.json
```

Skills must be real copies: Cursor skips `~/.cursor/plugins/local` symlinks that point elsewhere, and the Agent Plugins spec rejects files that resolve outside the plugin root.

## Site layout

- `index.html` — page structure
- `catalog.js` — tools, skills, plugins, extensions, and MCP entries; edit this to add items
- `app.js` — renders the catalog and builds install / update / remove commands per tool and scope
- `styles.css` — tokens and components from [dataknife.ai](https://github.com/DataKnifeAI/dataknife.ai)

Tool paths and plugin flows were checked against each tool's docs on 2026-09-29. Links to those docs are on each tool card.

## Preview locally

```bash
python3 -m http.server 8766
```

## Deploy

`.github/workflows/pages.yml` publishes the repo root to GitHub Pages on every push to `main`.
