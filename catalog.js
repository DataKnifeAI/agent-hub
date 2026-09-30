const HUB_REPO = "DataKnifeAI/agent-hub";
const HUB_CACHE = "~/.cache/agent-hub";
const hubSettings = (file, p) =>
  `// ${file}\n{\n  "extraKnownMarketplaces": {\n    "dataknifeai": { "source": { "source": "github", "repo": "${HUB_REPO}" } }\n  },\n  "enabledPlugins": { "${p}@dataknifeai": true }\n}`;
const copyLocalPlugin = (p) =>
  `[ -d ${HUB_CACHE} ] || git clone --depth 1 https://github.com/${HUB_REPO}.git ${HUB_CACHE}\ngit -C ${HUB_CACHE} pull --ff-only\nrm -rf ~/.cursor/plugins/local/${p}\ncp -r ${HUB_CACHE}/plugins/${p} ~/.cursor/plugins/local/`;

window.HUB = {
  source: {
    repo: "https://github.com/DataKnifeAI/agent-skills",
    clone: "https://github.com/DataKnifeAI/agent-skills.git",
    installer: "https://raw.githubusercontent.com/DataKnifeAI/agent-skills/main/scripts/install-skills.sh",
    cache: "~/.cache/agent-skills",
  },

  tools: [
    {
      id: "cursor",
      name: "Cursor",
      mark: "Cu",
      project: ".cursor/skills",
      user: "~/.cursor/skills",
      note: "Also reads .agents/skills and the Claude and Codex folders. Turn on Sync Skills for Cloud Agents to take ~/.cursor/skills to the cloud.",
      docs: "https://cursor.com/docs/context/skills",
      manageLabel: "Customize → Skills",
      plugin: {
        how: `Import <code>${HUB_REPO}</code> in Customize → From GitHub Repository, or copy a plugin into <code>~/.cursor/plugins/local</code> and reload. Cursor skips symlinks that point outside that folder.`,
        install: (p) => `${copyLocalPlugin(p)}\n# Then run "Developer: Reload Window"`,
        update: (p) => copyLocalPlugin(p),
        remove: (p) => `rm -rf ~/.cursor/plugins/local/${p}`,
        list: () => "ls ~/.cursor/plugins/local",
        docs: "https://cursor.com/docs/plugins",
      },
      extensions: { cli: "cursor", registry: "Open VSX", scheme: "cursor" },
    },
    {
      id: "copilot",
      name: "GitHub Copilot",
      mark: "GH",
      project: ".github/skills",
      user: "~/.copilot/skills",
      note: "Used by the Copilot cloud agent, code review, Copilot CLI, and the Copilot app. Also reads .claude/skills and .agents/skills. Commit project skills so the cloud agent sees them.",
      docs: "https://docs.github.com/en/copilot/concepts/agents/about-agent-skills",
      manageLabel: "gh skill · copilot plugin",
      plugin: {
        how: `Copilot CLI installs from the marketplace in this repo. The cloud agent enables plugins from <code>.github/copilot/settings.json</code> (Project scope).`,
        install: (p) => `copilot plugin marketplace add ${HUB_REPO}\ncopilot plugin install ${p}@dataknifeai`,
        project: (p) => hubSettings(".github/copilot/settings.json", p),
        update: (p) => `copilot plugin marketplace update dataknifeai\ncopilot plugin update ${p}`,
        remove: (p) => `copilot plugin uninstall ${p}`,
        list: () => "copilot plugin list",
        docs: "https://docs.github.com/en/copilot/concepts/agents/about-plugins",
      },
      extensions: null,
      extensionsAlt: "Runs on github.com, so editor extensions don't apply. Pick VS Code to see them.",
    },
    {
      id: "vscode",
      name: "VS Code",
      mark: "VS",
      project: ".github/skills",
      user: "~/.copilot/skills",
      note: "Copilot agent mode reads the same folders as GitHub Copilot, plus ~/.claude/skills and ~/.agents/skills.",
      docs: "https://code.visualstudio.com/docs/copilot/customization/agent-skills",
      manageLabel: "/skills · Chat: Open Customizations",
      plugin: {
        how: `Add <code>${HUB_REPO}</code> to <code>chat.plugins.marketplaces</code>, then install from the Extensions view with <code>@agentPlugins</code>. Project scope recommends plugins to everyone who opens the repo.`,
        install: () =>
          `// settings.json\n"chat.plugins.enabled": true,\n"chat.plugins.marketplaces": ["${HUB_REPO}"]\n\n// Then: Extensions view → @agentPlugins → Install`,
        project: (p) => hubSettings(".github/copilot/settings.json", p),
        update: () => "# Command Palette\nExtensions: Check for Extension Updates",
        remove: () => "# Extensions view → Agent Plugins - Installed\n# Right-click the plugin → Uninstall",
        docs: "https://code.visualstudio.com/docs/agent-customization/agent-plugins",
      },
      extensions: { cli: "code", registry: "VS Marketplace", scheme: "vscode" },
    },
    {
      id: "claude",
      name: "Claude Code",
      mark: "CC",
      project: ".claude/skills",
      user: "~/.claude/skills",
      note: "Also read by Cursor, VS Code, and Copilot, so it doubles as a shared location for mixed teams.",
      docs: "https://code.claude.com/docs/en/skills",
      manageLabel: "/skills in a session",
      plugin: {
        how: `Installs from the marketplace in this repo (<code>.claude-plugin/marketplace.json</code>). Project scope enables plugins for everyone who opens the repo.`,
        install: (p) => `/plugin marketplace add ${HUB_REPO}\n/plugin install ${p}@dataknifeai`,
        project: (p) => hubSettings(".claude/settings.json", p),
        update: () => "/plugin marketplace update dataknifeai",
        remove: (p) => `/plugin uninstall ${p}@dataknifeai`,
        docs: "https://code.claude.com/docs/en/plugins",
      },
      extensions: null,
      extensionsAlt: "Terminal agent, so editor extensions don't apply. Plugins cover skills, commands, and MCP.",
    },
    {
      id: "agents",
      name: "Agents standard",
      mark: "AS",
      project: ".agents/skills",
      user: "~/.agents/skills",
      note: "The most portable target: read natively by Cursor, GitHub Copilot, VS Code, and Codex. Pick this if your team mixes tools.",
      docs: "https://agentskills.io",
      manageLabel: "agentskills.io spec",
      plugin: null,
      pluginAlt: `Plugins follow the separate <a href="https://agent-plugins.org">Agent Plugins</a> standard. Every DataKnifeAI plugin ships a root <code>plugin.json</code> for it, but installing goes through each tool's marketplace. Pick a tool above.`,
      extensions: null,
      extensionsAlt: "Not tied to an editor. Pick Cursor or VS Code to see editor extensions.",
    },
    {
      id: "workspace",
      name: "Coder / Cloud Agents",
      mark: "CA",
      project: ".cursor/skills",
      user: "~/.cursor/skills",
      note: "agent-workspace vendors agent-skills as a submodule. Cloud Agents and self-hosted workers use project skills from the repo, not ~/.agents/skills.",
      docs: "https://github.com/DataKnifeAI/agent-workspace",
      manageLabel: "agent-workspace submodule",
      submodule: true,
      plugin: {
        how: "Bake plugins into the Coder template or worker image by copying them into ~/.cursor/plugins/local at build time.",
        install: (p) => `# In the workspace image build\n${copyLocalPlugin(p)}`,
        update: () => "# Rebuild the image, or re-run the copy step in the workspace",
        remove: (p) => `rm -rf ~/.cursor/plugins/local/${p}`,
        docs: "https://cursor.com/docs/plugins",
      },
      extensions: { cli: "code-server", registry: "Open VSX", scheme: null, note: "Preinstall in coder-templates so every workspace starts with them." },
    },
  ],

  categories: ["Source control", "Kubernetes", "Workspaces"],

  skills: [
    {
      name: "gh-cli",
      category: "Source control",
      requires: "gh",
      description:
        "Uses the GitHub CLI for auth, repos, issues, PRs, Actions, API calls, and browsing. Applies when a task involves GitHub operations, CI status, or authenticated GitHub API access from a shell.",
    },
    {
      name: "glab-cli",
      category: "Source control",
      requires: "glab",
      description:
        "Uses the GitLab CLI for merge requests, issues, CI/CD, releases, and GitLab API access. Applies when the remote is GitLab.com or self-managed, or the user mentions MRs or pipelines.",
    },
    {
      name: "kubectl-cli",
      category: "Kubernetes",
      requires: "kubectl",
      description:
        "Inspects and changes Kubernetes clusters: resources, logs, exec, port-forward, rollouts, and apply. Applies to pods, deployments, services, namespaces, events, and cluster debugging.",
    },
    {
      name: "rancher-cli",
      category: "Kubernetes",
      requires: "rancher",
      description:
        "Logs into Rancher Server, selects a project context, and runs cluster and project operations including passthrough kubectl. Applies when clusters are managed through Rancher.",
    },
    {
      name: "coder-cli",
      category: "Workspaces",
      requires: "coder",
      description:
        "Manages Coder login, workspaces, SSH, port-forwarding, templates, and deployment URLs. Applies when starting, stopping, or updating workspaces, or troubleshooting connectivity.",
    },
  ],

  plugins: [
    {
      name: "dataknifeai",
      title: "DataKnifeAI toolkit",
      description:
        "Every agent-skills skill, the org workflow rules (conventional commits, small MRs), and MCP config templates in one install. Works in Cursor, VS Code, Copilot, and Claude Code.",
      contains: ["5 skills", "2 rules", "MCP templates"],
    },
    {
      name: "dataknifeai-kube",
      title: "Kubernetes & Rancher",
      description:
        "kubectl-cli and rancher-cli skills with config templates for rancher-manager-mcp and proxmox-ve-mcp.",
      contains: ["2 skills", "2 MCP templates"],
    },
    {
      name: "dataknifeai-scm",
      title: "GitHub & GitLab",
      description:
        "gh-cli and glab-cli skills plus commit and merge-request conventions for mirrored GitHub → GitLab repos.",
      contains: ["2 skills", "1 rule"],
    },
  ],

  extensions: [
    {
      title: "Coder Remote",
      ids: { default: "coder.coder-remote" },
      pairs: ["coder-cli"],
      description: "Open Coder workspaces from the editor. Pairs with the coder-cli skill for start, stop, and SSH.",
    },
    {
      title: "Remote - SSH",
      ids: { cursor: "anysphere.remote-ssh", default: "ms-vscode-remote.remote-ssh" },
      pairs: ["coder-cli"],
      description: "SSH into workspaces and servers. Cursor and VS Code publish different extensions for this.",
    },
    {
      title: "GitHub Pull Requests",
      ids: { default: "GitHub.vscode-pull-request-github" },
      pairs: ["gh-cli"],
      description: "Review and manage PRs and issues in the editor, alongside the gh-cli skill.",
    },
    {
      title: "GitLab Workflow",
      ids: { default: "GitLab.gitlab-workflow" },
      pairs: ["glab-cli"],
      description: "Merge requests, pipelines, and issues for GitLab.com and self-managed, alongside glab-cli.",
    },
    {
      title: "Kubernetes",
      ids: { default: "ms-kubernetes-tools.vscode-kubernetes-tools" },
      pairs: ["kubectl-cli", "rancher-cli"],
      description: "Cluster explorer, logs, and manifests. Pairs with kubectl-cli and rancher-cli.",
    },
  ],

  mcp: [
    { name: "rancher-manager-mcp", description: "Rancher Manager API with stdio and HTTP transports.", setup: "Documented config" },
    { name: "proxmox-ve-mcp", description: "Proxmox VE infrastructure management and monitoring.", setup: "Build from source" },
    { name: "unifi-network-mcp", description: "UniFi Network devices, WiFi, and firewall.", setup: "Build from source" },
    { name: "unifi-protect-mcp", description: "UniFi Protect cameras, sensors, and lights.", setup: "Build from source" },
    { name: "unifi-manager-mcp", description: "UniFi Site Manager API at scale.", setup: "Build from source" },
    { name: "gitops-mcp", description: "GitOps workflows exposed to agents.", setup: "Build from source" },
  ],
};
