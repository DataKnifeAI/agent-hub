(() => {
  const { source, tools, categories, skills, plugins, extensions, mcp } = window.HUB;
  const GH = "https://github.com/DataKnifeAI";
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, html = "") => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    node.innerHTML = html;
    return node;
  };

  const saved = JSON.parse(localStorage.getItem("agent-hub") || "{}");
  const state = {
    tool: tools.some((t) => t.id === saved.tool) ? saved.tool : "cursor",
    scope: saved.scope === "project" ? "project" : "user",
    category: "All",
    addon: "plugins",
    query: "",
  };
  const persist = () => localStorage.setItem("agent-hub", JSON.stringify({ tool: state.tool, scope: state.scope }));
  const currentTool = () => tools.find((t) => t.id === state.tool);
  const targetDir = (tool) => (state.scope === "user" ? tool.user : tool.project);

  function skillCommands(tool, only) {
    if (tool.submodule) {
      return {
        install: `git clone --recurse-submodules ${GH}/agent-workspace.git`,
        update: "git submodule update --remote --merge",
        list: "ls .cursor/skills",
      };
    }
    const dir = targetDir(tool);
    const flags = [`--target ${dir}`];
    if (state.scope === "project") flags.push("--copy");
    if (only) flags.push(`--only ${only}`);
    const install = `curl -fsSL ${source.installer} \\\n  | bash -s -- --clone ${source.clone} \\\n    ${flags.join(" ")}`;
    const names = only ? only.split(",") : skills.map((s) => s.name);
    const removeTarget = names.length === 1 ? `${dir}/${names[0]}` : `${dir}/{${names.join(",")}}`;
    return {
      install,
      update:
        state.scope === "user"
          ? `git -C ${source.cache} pull --ff-only`
          : `# Re-run install; the cache pulls before copying\n${install}`,
      remove: `rm -rf ${removeTarget}`,
      list: `ls -l ${dir}`,
    };
  }

  const pluginUsesProject = (tool) => state.scope === "project" && !!tool.plugin.project;

  function pluginCommands(tool, name) {
    const p = tool.plugin;
    const cmds = {
      install: pluginUsesProject(tool) ? p.project(name) : p.install(name),
      update: p.update(name),
      remove: p.remove(name),
    };
    if (p.list) cmds.list = p.list();
    return cmds;
  }

  const extensionId = (tool, ext) => ext.ids[tool.id] || ext.ids.default;

  function extensionCommands(tool, ext) {
    const { cli } = tool.extensions;
    const id = extensionId(tool, ext);
    return {
      install: `${cli} --install-extension ${id}`,
      update: `${cli} --install-extension ${id} --force`,
      remove: `${cli} --uninstall-extension ${id}`,
      list: `${cli} --list-extensions | grep -i ${id}`,
    };
  }

  function extensionLinks(tool, ext) {
    const id = extensionId(tool, ext);
    const links = [];
    if (tool.extensions.scheme) links.push({ href: `${tool.extensions.scheme}:extension/${id}`, label: `Open in ${tool.name}` });
    if (tool.extensions.registry === "VS Marketplace") {
      links.push({ href: `https://marketplace.visualstudio.com/items?itemName=${id}`, label: "VS Marketplace" });
    } else if (!id.startsWith("anysphere.")) {
      links.push({ href: `https://open-vsx.org/extension/${id.replace(".", "/")}`, label: "Open VSX" });
    }
    return links;
  }

  function copyButton(getText) {
    const btn = el("button", { type: "button", class: "copy", "aria-label": "Copy command" }, "Copy");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(getText().replace(/\\\n\s*/g, ""));
        btn.textContent = "Copied";
      } catch {
        btn.textContent = "Select text";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1400);
    });
    return btn;
  }

  function renderPicker() {
    $("#tool-picker").replaceChildren(
      ...tools.map((t) => {
        const b = el("button", { type: "button", role: "tab", "aria-selected": String(t.id === state.tool) },
          `<span class="mark">${t.mark}</span>${t.name}`);
        b.addEventListener("click", () => setTool(t.id));
        return b;
      })
    );
    for (const b of document.querySelectorAll("#scope button")) {
      b.setAttribute("aria-pressed", String(b.dataset.scope === state.scope));
    }
    $("#scope").hidden = !!currentTool().submodule;
    document.querySelectorAll("[data-tool-name]").forEach((n) => (n.textContent = currentTool().name));
  }

  function renderHero() {
    const tool = currentTool();
    $("#hero-cmd").textContent = skillCommands(tool).install;
    $("#hero-caption").innerHTML = tool.submodule
      ? `Clones <a href="${GH}/agent-workspace">agent-workspace</a> with all ${skills.length} skills vendored as a submodule.`
      : `Installs all ${skills.length} skills into <code>${targetDir(tool)}</code> as ${state.scope === "project" ? "copies you can commit" : "symlinks to a shared cache"}.`;
  }

  const yes = (label) => `<span class="support yes">${label}</span>`;
  const no = (label) => `<span class="support no">${label}</span>`;

  function renderTools() {
    $("#tool-grid").replaceChildren(
      ...tools.map((t) => {
        const card = el("article", { class: "tool-card" + (t.id === state.tool ? " is-selected" : "") }, `
          <header>
            <span class="mark mark-lg">${t.mark}</span>
            <h3>${t.name}</h3>
          </header>
          <dl class="paths">
            <div><dt>Project</dt><dd><code>${t.project}/</code></dd></div>
            <div><dt>User</dt><dd><code>${t.user}/</code></dd></div>
          </dl>
          <p class="supports">${yes("Skills")}${t.plugin ? yes("Plugins") : no("Plugins")}${t.extensions ? yes("Extensions") : no("Extensions")}</p>
          <p>${t.note}</p>
          <p class="manage"><span>Manage</span>${t.manageLabel}</p>
          <footer>
            <a href="${t.docs}">Docs</a>
            <button type="button" class="btn btn-small">Use ${t.name}</button>
          </footer>`);
        $("button", card).addEventListener("click", () => {
          setTool(t.id);
          $("#top").scrollIntoView();
        });
        return card;
      })
    );
  }

  function renderFilters() {
    const all = ["All", ...categories];
    $("#category-tabs").replaceChildren(
      ...all.map((c) => {
        const n = c === "All" ? skills.length : skills.filter((s) => s.category === c).length;
        const b = el("button", { type: "button", role: "tab", "aria-selected": String(c === state.category) },
          `${c} <span class="count">${n}</span>`);
        b.addEventListener("click", () => {
          state.category = c;
          renderFilters();
          renderSkills();
        });
        return b;
      })
    );
  }

  function renderSkills() {
    const q = state.query.toLowerCase();
    const visible = skills.filter(
      (s) =>
        (state.category === "All" || s.category === state.category) &&
        (!q || `${s.name} ${s.description} ${s.requires}`.toLowerCase().includes(q))
    );
    const grid = $("#skill-grid");
    if (!visible.length) {
      grid.replaceChildren(el("p", { class: "empty" }, "No skills match. Try another search or category."));
      return;
    }
    const tool = currentTool();
    grid.replaceChildren(
      ...visible.map((s) => {
        const card = el("article", { class: "item-card" }, `
          <header>
            <h3><a href="${source.repo}/tree/main/skills/${s.name}">${s.name}</a></h3>
            <span class="pill">${s.category}</span>
          </header>
          <p class="item-desc">${s.description}</p>
          <p class="meta">Requires <code>${s.requires}</code> on PATH</p>
          <footer>
            <a href="${source.repo}/blob/main/skills/${s.name}/SKILL.md">SKILL.md</a>
            <button type="button" class="btn btn-small btn-primary">Install in ${tool.name}</button>
          </footer>`);
        $("button", card).addEventListener("click", () =>
          openDialog({
            title: s.name,
            sub: tool.submodule
              ? `${tool.name} · included in agent-workspace`
              : `${tool.name} · ${state.scope} scope · <code>${targetDir(tool)}/${s.name}</code>`,
            commands: skillCommands(tool, tool.submodule ? null : s.name),
            links: [
              { href: tool.docs, label: `${tool.name} skills docs` },
              { href: `${source.repo}/tree/main/skills/${s.name}`, label: "Source" },
            ],
          })
        );
        return card;
      })
    );
  }

  function renderAddonTabs() {
    const tabs = [
      ["plugins", "Plugins", plugins.length],
      ["extensions", "Editor extensions", extensions.length],
      ["mcp", "MCP servers", mcp.length],
    ];
    $("#addon-tabs").replaceChildren(
      ...tabs.map(([id, label, n]) => {
        const b = el("button", { type: "button", role: "tab", "aria-selected": String(id === state.addon) },
          `${label} <span class="count">${n}</span>`);
        b.addEventListener("click", () => {
          state.addon = id;
          renderAddonTabs();
          renderAddons();
        });
        return b;
      })
    );
  }

  function unsupported(message) {
    return el("div", { class: "notice" }, `<strong>Not available in ${currentTool().name}.</strong> ${message}`);
  }

  function renderAddons() {
    const tool = currentTool();
    const grid = $("#addon-grid");
    const intro = $("#addon-intro");

    if (state.addon === "plugins") {
      intro.innerHTML = tool.plugin
        ? `${tool.plugin.how} <a href="${tool.plugin.docs}">Plugin docs</a>`
        : "Plugins bundle skills, rules, and MCP configs into one install. Each DataKnifeAI plugin ships manifests for Agent Plugins, Cursor, and Claude, so one folder works everywhere.";
      const cards = plugins.map((p) => {
        const card = el("article", { class: "item-card" }, `
          <header>
            <h3>${p.title}</h3>
            <span class="status status-design">Proposed</span>
          </header>
          <p class="plugin-id"><code>${p.name}</code></p>
          <p class="item-desc">${p.description}</p>
          <p class="chips">${p.contains.map((c) => `<span>${c}</span>`).join("")}</p>
          <footer>
            <a href="#plugin-layout">Layout</a>
            ${tool.plugin ? `<button type="button" class="btn btn-small btn-primary">Install in ${tool.name}</button>` : `<span class="muted small">Not supported in ${tool.name}</span>`}
          </footer>`);
        $("button", card)?.addEventListener("click", () =>
          openDialog({
            title: p.title,
            sub: `${tool.name} plugin · <code>${p.name}</code>${pluginUsesProject(tool) ? " · project scope, commit to repo" : ""}`,
            commands: pluginCommands(tool, p.name),
            links: [{ href: tool.plugin.docs, label: `${tool.name} plugin docs` }, { href: "#plugin-layout", label: "Plugin layout" }],
          })
        );
        return card;
      });
      grid.replaceChildren(...(tool.plugin ? [] : [unsupported(tool.pluginAlt)]), ...cards);
      return;
    }

    if (state.addon === "extensions") {
      if (!tool.extensions) {
        intro.textContent = "Editor extensions that pair with each skill: the skill teaches the agent the CLI, the extension gives you the UI.";
        grid.replaceChildren(unsupported(tool.extensionsAlt));
        return;
      }
      intro.innerHTML = `Installed with <code>${tool.extensions.cli}</code> from ${tool.extensions.registry}. ${tool.extensions.note || "Each one pairs with a skill: the skill teaches the agent the CLI, the extension gives you the UI."}`;
      grid.replaceChildren(
        ...extensions.map((x) => {
          const id = extensionId(tool, x);
          const card = el("article", { class: "item-card" }, `
            <header>
              <h3>${x.title}</h3>
              <span class="pill">Third-party</span>
            </header>
            <p class="plugin-id"><code>${id}</code></p>
            <p class="item-desc">${x.description}</p>
            <p class="meta">Pairs with ${x.pairs.map((s) => `<code>${s}</code>`).join(" ")}</p>
            <footer>
              ${extensionLinks(tool, x).map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}
              <button type="button" class="btn btn-small btn-primary">Install</button>
            </footer>`);
          $("button", card).addEventListener("click", () =>
            openDialog({
              title: x.title,
              sub: `${tool.name} extension · <code>${id}</code>`,
              commands: extensionCommands(tool, x),
              links: extensionLinks(tool, x),
            })
          );
          return card;
        })
      );
      return;
    }

    intro.innerHTML = "DataKnifeAI MCP servers need a local build and credentials, so each links to its own setup guide. Plugins will carry config templates once packaged.";
    grid.replaceChildren(
      ...mcp.map((m) =>
        el("article", { class: "item-card" }, `
          <header>
            <h3><a href="${GH}/${m.name}">${m.name}</a></h3>
            <span class="pill">${m.setup}</span>
          </header>
          <p class="item-desc">${m.description}</p>
          <footer>
            <a href="${GH}/${m.name}#readme">Setup guide</a>
          </footer>`)
      )
    );
  }

  let dialogItem = null;
  let dialogTab = "install";
  const TAB_LABELS = { install: "Install", update: "Update", remove: "Remove", list: "List" };

  function renderDialog() {
    const { title, sub, commands, links } = dialogItem;
    $("#dlg-title").textContent = title;
    $("#dlg-sub").innerHTML = sub;
    if (!commands[dialogTab]) dialogTab = "install";
    $("#dlg-tabs").replaceChildren(
      ...Object.keys(commands).map((k) => {
        const b = el("button", { type: "button", role: "tab", "aria-selected": String(k === dialogTab) }, TAB_LABELS[k]);
        b.addEventListener("click", () => {
          dialogTab = k;
          renderDialog();
        });
        return b;
      })
    );
    $("#dlg-cmd").textContent = commands[dialogTab];
    $("#dlg-links").innerHTML = links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("");
  }

  function openDialog(item) {
    dialogItem = item;
    dialogTab = "install";
    renderDialog();
    $("#install-dialog").showModal();
  }

  function setTool(id) {
    state.tool = id;
    persist();
    renderAll();
  }

  function renderAll() {
    renderPicker();
    renderHero();
    renderTools();
    renderSkills();
    renderAddons();
    if ($("#install-dialog").open) $("#install-dialog").close();
  }

  for (const b of document.querySelectorAll("#scope button")) {
    b.addEventListener("click", () => {
      state.scope = b.dataset.scope;
      persist();
      renderAll();
    });
  }
  $("#skill-search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderSkills();
  });
  $("#dlg-close").addEventListener("click", () => $("#install-dialog").close());
  $("#install-dialog").addEventListener("click", (e) => {
    if (e.target.id === "install-dialog" || e.target.closest("#dlg-links a[href^='#']")) $("#install-dialog").close();
  });
  $("#hero-copy").append(copyButton(() => $("#hero-cmd").textContent));
  $("#dlg-copy").append(copyButton(() => $("#dlg-cmd").textContent));

  document.querySelectorAll("[data-skill-count]").forEach((n) => (n.textContent = skills.length));
  document.querySelectorAll("[data-tool-count]").forEach((n) => (n.textContent = tools.length));
  document.querySelectorAll("[data-addon-count]").forEach((n) => (n.textContent = plugins.length + extensions.length + mcp.length));

  renderFilters();
  renderAddonTabs();
  renderAll();
})();
