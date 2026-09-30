# agent-hub

Front door for DataKnifeAI agent tooling: browse and install skills, plugins, and editor extensions for Cursor, GitHub Copilot, VS Code, Claude Code, SKILL.md-compatible agents, and Coder / Cloud Agent workspaces.

Skills stay in [agent-skills](https://github.com/DataKnifeAI/agent-skills). This repo holds the catalog site and, once built, the plugin bundles that package those skills with rules and MCP config templates.

**Status: review mock.** Not deployed.

## What works today vs. proposed

| Area | State |
|------|-------|
| Skill install commands | Work now. They wrap `agent-skills/scripts/install-skills.sh --target <tool dir>` |
| Editor extensions | Third-party extensions that pair with each skill. `cursor` / `code --install-extension` |
| Plugins (`dataknifeai`, `-kube`, `-scm`) | Proposed. Needs `plugins/<name>/` with `.cursor-plugin/plugin.json` and `.claude-plugin/plugin.json`, plus a root `.claude-plugin/marketplace.json` |
| MCP servers | Links to each repo's setup guide. Most need a local build and credentials |

## Layout

- `index.html` — page structure
- `catalog.js` — tools, skills, plugins, extensions, and MCP entries; edit this to add items
- `app.js` — renders the catalog and builds install / update / remove commands per tool and scope
- `styles.css` — tokens and components from [dataknife.ai](https://github.com/DataKnifeAI/dataknife.ai)

## Preview

```bash
python3 -m http.server 8766
```

Opening `index.html` directly also works; there's no fetch or build step.

## Before deploying

- Re-check each tool's skill and plugin paths against current docs (they move quickly).
- Decide hosting: GitHub Pages on this repo, or a `hub.dataknife.ai` / `dataknife.ai/hub` route.
- Build at least the `dataknifeai` plugin or drop the Plugins tab to "coming soon".
- Remove `<meta name="robots" content="noindex">` and the mock banner.
