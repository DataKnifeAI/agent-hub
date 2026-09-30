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
      note: "Loaded automatically in Agent chat. Project skills win over user skills with the same name.",
      docs: "https://cursor.com/docs/context/skills",
      manageLabel: "Cursor Settings → Rules & Skills",
      plugin: {
        how: "Local plugin (symlink into ~/.cursor/plugins/local). Marketplace listing later.",
        install: (p) =>
          `git clone https://github.com/DataKnifeAI/agent-hub.git ~/.cache/agent-hub\nln -s ~/.cache/agent-hub/plugins/${p} ~/.cursor/plugins/local/${p}`,
        update: () => "git -C ~/.cache/agent-hub pull --ff-only",
        remove: (p) => `rm ~/.cursor/plugins/local/${p}`,
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
      note: "Used by the Copilot coding agent on github.com and by Copilot CLI. Commit project skills so the cloud agent sees them.",
      docs: "https://docs.github.com/en/copilot/concepts/agents/about-agent-skills",
      manageLabel: "Repository → .github/skills",
      plugin: null,
      pluginAlt: "Copilot on github.com has no plugin bundle format. Use skills plus MCP servers configured in repository settings.",
      extensions: null,
      extensionsAlt: "Runs on github.com, so editor extensions don't apply. Pick VS Code to see them.",
    },
    {
      id: "vscode",
      name: "VS Code",
      mark: "VS",
      project: ".github/skills",
      user: "~/.copilot/skills",
      note: "Copilot agent mode reads the same folders as GitHub Copilot. Requires the chat.useAgentSkills setting.",
      docs: "https://code.visualstudio.com/docs/copilot/customization/agent-skills",
      manageLabel: "Settings → chat.useAgentSkills",
      plugin: null,
      pluginAlt: "VS Code has no skills-plus-MCP plugin bundle. Install the skills, add MCP servers in .vscode/mcp.json, and use the paired editor extensions.",
      extensions: { cli: "code", registry: "VS Marketplace", scheme: "vscode" },
    },
    {
      id: "claude",
      name: "Claude Code",
      mark: "CC",
      project: ".claude/skills",
      user: "~/.claude/skills",
      note: "Discovered at session start. Also read by several other agents as a fallback location.",
      docs: "https://code.claude.com/docs/en/skills",
      manageLabel: "/skills in a session",
      plugin: {
        how: "Plugin marketplace served from this repo (.claude-plugin/marketplace.json).",
        install: (p) => `/plugin marketplace add DataKnifeAI/agent-hub\n/plugin install ${p}@dataknifeai`,
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
      note: "The vendor-neutral Agent Skills layout, used by Codex and other SKILL.md-compatible agents.",
      docs: "https://agentskills.io",
      manageLabel: "agentskills.io spec",
      plugin: null,
      pluginAlt: "The Agent Skills standard covers skills only. Plugin formats are per tool, so install skills here and MCP servers in your agent's own config.",
      extensions: null,
      extensionsAlt: "Not tied to an editor. Pick Cursor or VS Code to see editor extensions.",
    },
    {
      id: "workspace",
      name: "Coder / Cloud Agents",
      mark: "CA",
      project: ".cursor/skills",
      user: "~/.cursor/skills",
      note: "agent-workspace vendors agent-skills as a submodule, so Cloud Agent pools and Coder workspaces start with every skill.",
      docs: "https://github.com/DataKnifeAI/agent-workspace",
      manageLabel: "agent-workspace submodule",
      submodule: true,
      plugin: {
        how: "agent-workspace would vendor agent-hub next to agent-skills, so plugins ship with every workspace.",
        install: (p) => `git submodule add https://github.com/DataKnifeAI/agent-hub.git agent-hub\nln -s "$PWD/agent-hub/plugins/${p}" ~/.cursor/plugins/local/${p}`,
        update: () => "git submodule update --remote --merge agent-hub",
        remove: (p) => `rm ~/.cursor/plugins/local/${p}`,
        docs: "https://github.com/DataKnifeAI/agent-workspace",
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
        "Every agent-skills skill, the org workflow rules (conventional commits, small MRs), and MCP config templates in one install.",
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
