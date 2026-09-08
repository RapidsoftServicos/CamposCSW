(() => {
  const CELL_W = 14;
  const CELL_H = 28;
  const HALF = 0.5;

  const state = {
    cols: 80,
    rows: 17,
    title: "Nova tela",
    layoutMode: "sem-tab",
    tabName: "Configuração Geral",
    tabId: "sheet1",
    items: [],
    selectedId: null,
    exportMode: "tags",
    nextSeq: 1,
  };

  const el = {
    ajCols: document.getElementById("ajCols"),
    ajRows: document.getElementById("ajRows"),
    ajTitle: document.getElementById("ajTitle"),
    tabOptions: document.getElementById("tabOptions"),
    tabName: document.getElementById("tabName"),
    tabId: document.getElementById("tabId"),
    tabBar: document.getElementById("tabBar"),
    tabChip: document.getElementById("tabChip"),
    screenShell: document.getElementById("screenShell"),
    canvas: document.getElementById("canvas"),
    windowTitle: document.getElementById("windowTitle"),
    ajBadge: document.getElementById("ajBadge"),
    modeBadge: document.getElementById("modeBadge"),
    warnings: document.getElementById("warnings"),
    exportOut: document.getElementById("exportOut"),
    snippetOut: document.getElementById("snippetOut"),
    snippetHint: document.getElementById("snippetHint"),
    importIn: document.getElementById("importIn"),
    propsSection: document.getElementById("propsSection"),
    propId: document.getElementById("propId"),
    propText: document.getElementById("propText"),
    propVarRow: document.getElementById("propVarRow"),
    propVar: document.getElementById("propVar"),
    propCol: document.getElementById("propCol"),
    propLin: document.getElementById("propLin"),
    propTam: document.getElementById("propTam"),
    propExtra: document.getElementById("propExtra"),
    toast: document.getElementById("toast"),
  };

  const defaultsByType = {
    label: { text: "Novo Label", tam: 12, idPrefix: "lb" },
    campo: { text: "", tam: 5, idPrefix: "cp" },
    display: { text: "", tam: 20, idPrefix: "ds" },
    botao: { text: "Salvar", tam: 15, idPrefix: "bt" },
    btnConsultar: { text: "Consultar/Limpar", tam: 12, idPrefix: "btnConsultar" },
  };

  function snapCol(v) {
    return Math.round(Number(v) / HALF) * HALF;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function visualWidth(item) {
    if (item.type === "campo") return Number(item.tam) + 2;
    return Number(item.tam);
  }

  function uid() {
    return `i${Date.now().toString(36)}_${state.nextSeq++}`;
  }

  function fmt(n) {
    const x = Number(n);
    return Number.isInteger(x) ? String(x) : String(x);
  }

  function nextFieldLabel() {
    const used = state.items
      .filter((i) => i.type === "campo")
      .map((i) => Number(String(i.id).replace(/\D/g, "")))
      .filter((n) => !Number.isNaN(n));
    return used.length ? Math.max(...used) + 100 : 1000;
  }

  function createItem(type, overrides = {}) {
    const def = defaultsByType[type];
    const labelNum = type === "campo" || type === "display" ? nextFieldLabel() : state.nextSeq;
    let id = overrides.id;
    if (!id) {
      if (type === "campo") id = `cp${labelNum}`;
      else if (type === "display") id = `ds${labelNum}`;
      else if (type === "botao") id = `bt${(def.text || "Acao").replace(/\W/g, "")}`;
      else if (type === "btnConsultar") id = "btnConsultar";
      else id = `${def.idPrefix}${state.nextSeq}`;
    }

    return {
      uid: uid(),
      type,
      id,
      text: overrides.text ?? def.text,
      varName: overrides.varName ?? (type === "campo" ? "VAR" : ""),
      col: snapCol(overrides.col ?? 1),
      lin: Math.round(overrides.lin ?? 1),
      tam: snapCol(overrides.tam ?? def.tam),
      labelNum: overrides.labelNum ?? (type === "campo" ? Number(String(id).replace(/\D/g, "")) || 1000 : null),
    };
  }

  function getSelected() {
    return state.items.find((i) => i.uid === state.selectedId) || null;
  }

  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.toast.classList.add("hidden"), 1400);
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  function buildSnippet(item) {
    if (!item) return { text: "", hint: "" };

    if (item.type === "label") {
      return {
        text: `\t; csw:label:${fmt(item.col)},${item.lin},${fmt(item.tam)},${item.text}`,
        hint: "Tag de label — igual ao final da .mac",
      };
    }

    if (item.type === "display") {
      return {
        text: `\t; csw:display:${fmt(item.col)},${item.lin},${fmt(item.tam)},${item.id}`,
        hint: "Tag de display — igual ao final da .mac",
      };
    }

    if (item.type === "campo") {
      const n = item.labelNum || Number(String(item.id).replace(/\D/g, "")) || 1000;
      const v = (item.varName || "VAR").trim() || "VAR";
      // Linha principal no formato de uso (copiável); bloco completo abaixo
      const csleLine = `do ^%CSLE(${item.lin},${fmt(item.col)},${fmt(item.tam)},"${v}",${v},,,,",,,${item.id}")`;
      const text = [
        `${n}ON\t${csleLine}`,
        `\tquit:$$CSP^%CSW1UTI()`,
        "",
        `\t; csw:label / display relacionados usam as mesmas coordenadas de linha`,
        `\t; CSLE = LIN,COL,TAM → ${item.lin},${fmt(item.col)},${fmt(item.tam)}`,
      ].join("\n");
      return {
        text,
        hint: `Clique copia o CSLE · visual ${visualWidth(item)} colunas (TAM+2)`,
        copyText: `${n}ON\t${csleLine}`,
      };
    }

    if (item.type === "botao") {
      const nome = item.text || "Acao";
      const atalho = nome.charAt(0).toLowerCase();
      return {
        text: `\t; csw:botao:${fmt(item.col)},${item.lin},${item.id},<u>${nome.charAt(0)}</u>${nome.slice(1)},${atalho},3000^ROTINA,salvar,${nome},${fmt(item.tam)}`,
        hint: "Tag de botão",
      };
    }

    if (item.type === "btnConsultar") {
      return {
        text: `\t; csw:btnConsultar:${fmt(item.col)},${item.lin},2000^ROTINA,0500^ROTINA`,
        hint: "Tag btnConsultar",
      };
    }

    return { text: "", hint: "" };
  }

  async function showAndCopySnippet(item, { copy = true } = {}) {
    if (!item) {
      el.snippetOut.value = "";
      el.snippetHint.textContent = "";
      return;
    }
    const snip = buildSnippet(item);
    el.snippetOut.value = snip.text;
    el.snippetHint.textContent = snip.hint;
    if (copy) {
      const payload = snip.copyText || snip.text;
      const ok = await copyText(payload);
      if (ok) showToast(item.type === "campo" ? "CSLE copiado!" : "Tag copiada!");
    }
  }

  function setLayoutMode(mode) {
    state.layoutMode = mode;
    const comTab = mode === "com-tab";
    el.tabOptions.classList.toggle("hidden", !comTab);
    el.tabBar.classList.toggle("hidden", !comTab);
    el.screenShell.classList.toggle("mode-com-tab", comTab);
    el.screenShell.classList.toggle("mode-sem-tab", !comTab);
    el.modeBadge.textContent = comTab ? "Com Tab" : "Sem Tab";
    el.tabChip.textContent = state.tabName;
    render();
  }

  function syncAj() {
    state.cols = clamp(Number(el.ajCols.value) || 80, 20, 108);
    state.rows = clamp(Number(el.ajRows.value) || 17, 5, 28);
    state.title = el.ajTitle.value || "Nova tela";
    el.ajCols.value = state.cols;
    el.ajRows.value = state.rows;
    el.windowTitle.textContent = state.title;
    el.ajBadge.textContent = `${state.cols} × ${state.rows}`;
    el.canvas.style.width = `${state.cols * CELL_W}px`;
    el.canvas.style.height = `${state.rows * CELL_H}px`;
  }

  function validate() {
    const msgs = [];
    if (state.layoutMode === "com-tab") {
      msgs.push(`Modo Com Tab: coords relativas à aba "${state.tabName}" (${state.tabId})`);
    }
    for (const item of state.items) {
      const w = visualWidth(item);
      if (item.lin < 1 || item.lin > state.rows) msgs.push(`${item.id}: linha fora da tela`);
      if (item.col + w - 1 > state.cols + 0.01) msgs.push(`${item.id}: ultrapassa largura`);
    }
    const byLin = {};
    for (const item of state.items) (byLin[item.lin] ||= []).push(item);
    Object.values(byLin).forEach((list) => {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if (a.col < b.col + visualWidth(b) && b.col < a.col + visualWidth(a)) {
            msgs.push(`Sobreposição L${a.lin}: ${a.id} × ${b.id}`);
          }
        }
      }
    });
    el.warnings.textContent = msgs.join(" · ");
  }

  function renderItem(item) {
    const node = document.createElement("div");
    node.className = `item ${item.type}${item.uid === state.selectedId ? " selected" : ""}`;
    node.dataset.uid = item.uid;
    node.style.left = `${(item.col - 1) * CELL_W}px`;
    node.style.top = `${(item.lin - 1) * CELL_H}px`;
    node.style.width = `${visualWidth(item) * CELL_W}px`;
    node.style.height = `${CELL_H - 4}px`;
    node.style.marginTop = "2px";

    let label = item.id;
    if (item.type === "label") label = item.text || item.id;
    if (item.type === "campo") label = `[${item.id}]`;
    if (item.type === "display") label = item.text || item.id;
    if (item.type === "botao") label = item.text || item.id;
    if (item.type === "btnConsultar") label = "Consultar / Limpar";
    node.textContent = label;

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    node.appendChild(handle);
    node.addEventListener("mousedown", (ev) => onItemMouseDown(ev, item, handle));
    return node;
  }

  function renderProps() {
    const item = getSelected();
    el.propsSection.classList.toggle("hidden", !item);
    if (!item) {
      el.snippetOut.value = "";
      el.snippetHint.textContent = "Clique em um item no canvas para copiar.";
      return;
    }
    el.propId.value = item.id;
    el.propText.value = item.text || "";
    el.propVarRow.classList.toggle("hidden", item.type !== "campo");
    el.propVar.value = item.varName || "";
    el.propCol.value = item.col;
    el.propLin.value = item.lin;
    el.propTam.value = item.tam;
    if (item.type === "campo") {
      el.propExtra.textContent = `Visual: ${visualWidth(item)} colunas (TAM ${item.tam} + 2)`;
    } else {
      el.propExtra.textContent = `col,lin,tam → ${item.col},${item.lin},${item.tam}`;
    }
    const snip = buildSnippet(item);
    el.snippetOut.value = snip.text;
    el.snippetHint.textContent = `${snip.hint} · Clique no item para copiar.`;
  }

  function exportTags() {
    const lines = [];
    lines.push(`; csw:aj:${state.cols},${state.rows},${state.title}`);
    if (state.layoutMode === "com-tab") {
      lines.push(`; modo:com-tab; tabId=${state.tabId}; tabName=${state.tabName}`);
      lines.push(`; csw:labelseltab:0500`);
    } else {
      lines.push(`; modo:sem-tab`);
    }
    lines.push("");
    state.items
      .filter((i) => i.type === "label")
      .sort((a, b) => a.lin - b.lin || a.col - b.col)
      .forEach((i) => lines.push(`; csw:label:${fmt(i.col)},${i.lin},${fmt(i.tam)},${i.text}`));
    const displays = state.items.filter((i) => i.type === "display");
    if (displays.length) lines.push("");
    displays
      .sort((a, b) => a.lin - b.lin || a.col - b.col)
      .forEach((i) => lines.push(`; csw:display:${fmt(i.col)},${i.lin},${fmt(i.tam)},${i.id}`));
    const botoes = state.items.filter((i) => i.type === "botao");
    if (botoes.length) lines.push("");
    botoes.forEach((i) => {
      const nome = i.text || "Acao";
      lines.push(`; csw:botao:${fmt(i.col)},${i.lin},${i.id},<u>${nome.charAt(0)}</u>${nome.slice(1)},${nome.charAt(0).toLowerCase()},3000^ROTINA,salvar,${nome},${fmt(i.tam)}`);
    });
    const btnC = state.items.filter((i) => i.type === "btnConsultar");
    if (btnC.length) lines.push("");
    btnC.forEach((i) => lines.push(`; csw:btnConsultar:${fmt(i.col)},${i.lin},2000^ROTINA,0500^ROTINA`));
    return lines.join("\n");
  }

  function exportCsle() {
    const lines = [];
    lines.push(`; modo ${state.layoutMode}`);
    lines.push("");
    state.items
      .filter((i) => i.type === "campo")
      .sort((a, b) => a.lin - b.lin || a.col - b.col)
      .forEach((i) => {
        const n = i.labelNum || Number(String(i.id).replace(/\D/g, "")) || 1000;
        const v = (i.varName || "VAR").trim() || "VAR";
        lines.push(`${n}ON\tdo ^%CSLE(${i.lin},${fmt(i.col)},${fmt(i.tam)},"${v}",${v},,,,",,,${i.id}")`);
        lines.push(`\tquit:$$CSP^%CSW1UTI()`);
        lines.push("");
      });
    return lines.join("\n");
  }

  function renderExport() {
    if (state.exportMode === "tags") el.exportOut.value = exportTags();
    else if (state.exportMode === "csle") el.exportOut.value = exportCsle();
    else el.exportOut.value = `${exportTags()}\n\n${exportCsle()}`;
  }

  function render() {
    syncAj();
    el.canvas.innerHTML = "";
    state.items.forEach((item) => el.canvas.appendChild(renderItem(item)));
    renderProps();
    renderExport();
    validate();
  }

  function onItemMouseDown(ev, item, handle) {
    ev.preventDefault();
    ev.stopPropagation();
    state.selectedId = item.uid;
    render();

    const resizing = ev.target === handle;
    const startX = ev.clientX;
    const startY = ev.clientY;
    const startCol = item.col;
    const startLin = item.lin;
    const startTam = item.tam;
    let moved = false;

    function onMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (resizing) {
        item.tam = clamp(snapCol(startTam + dx / CELL_W), 1, state.cols);
      } else {
        item.col = snapCol(clamp(startCol + dx / CELL_W, 1, state.cols));
        item.lin = Math.round(clamp(startLin + dy / CELL_H, 1, state.rows));
      }
      render();
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      // Clique simples (sem arrastar) → copia snippet
      // Também copia ao soltar após mover, para pegar a posição final
      showAndCopySnippet(item, { copy: true });
      if (moved) render();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function addFromPalette(type) {
    const item = createItem(type, {
      col: 1,
      lin: Math.min(state.rows, state.items.length + 1),
    });
    if (type === "campo") item.text = `Campo ${item.id}`;
    if (type === "label") item.text = "Novo Label";
    state.items.push(item);
    state.selectedId = item.uid;
    render();
    showAndCopySnippet(item, { copy: true });
  }

  function applyPropsFromForm() {
    const item = getSelected();
    if (!item) return;
    item.id = el.propId.value.trim() || item.id;
    item.text = el.propText.value;
    if (item.type === "campo") item.varName = el.propVar.value.trim() || "VAR";
    item.col = snapCol(clamp(Number(el.propCol.value) || 1, 1, state.cols));
    item.lin = Math.round(clamp(Number(el.propLin.value) || 1, 1, state.rows));
    item.tam = snapCol(clamp(Number(el.propTam.value) || 1, 1, state.cols));
    render();
    showAndCopySnippet(item, { copy: false });
  }

  function parseImport(text) {
    const items = [];
    let cols = state.cols;
    let rows = state.rows;
    let title = state.title;
    let mode = state.layoutMode;
    let tabName = state.tabName;
    let tabId = state.tabId;

    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line) return;

      let m = line.match(/csw:aj:([^,]+),([^,]+),(.+)$/i);
      if (m) {
        cols = Number(m[1]);
        rows = Number(m[2]);
        title = m[3].trim();
        return;
      }
      if (/modo:com-tab/i.test(line)) {
        mode = "com-tab";
        const id = line.match(/tabId=([^;]+)/i);
        const name = line.match(/tabName=([^;]+)/i);
        if (id) tabId = id[1].trim();
        if (name) tabName = name[1].trim();
        return;
      }
      if (/modo:sem-tab/i.test(line)) {
        mode = "sem-tab";
        return;
      }
      m = line.match(/csw:label:([^,]+),([^,]+),([^,]+),(.+)$/i);
      if (m) {
        items.push(createItem("label", { col: Number(m[1]), lin: Number(m[2]), tam: Number(m[3]), text: m[4].trim() }));
        return;
      }
      m = line.match(/csw:display:([^,]+),([^,]+),([^,]+),([^,\s]+)/i);
      if (m) {
        items.push(createItem("display", { col: Number(m[1]), lin: Number(m[2]), tam: Number(m[3]), id: m[4].trim() }));
        return;
      }
      m = line.match(/csw:botao:/i);
      if (m) {
        const body = line.replace(/^;?\s*csw:botao:/i, "");
        const p = body.split(",");
        items.push(createItem("botao", {
          col: Number(p[0]),
          lin: Number(p[1]),
          id: p[2],
          text: (p[7] || p[3] || "Botão").replace(/<[^>]+>/g, ""),
          tam: Number(p[8] || 15),
        }));
        return;
      }
      m = line.match(/csw:btnConsultar:([^,]+),([^,]+)/i);
      if (m) items.push(createItem("btnConsultar", { col: Number(m[1]), lin: Number(m[2]), tam: 12 }));
    });

    return { items, cols, rows, title, mode, tabName, tabId };
  }

  function loadExampleTab() {
    el.ajCols.value = 80;
    el.ajRows.value = 17;
    el.ajTitle.value = "Naturezas a Descontar do Saldo de Estoque na Análise de Materiais";
    el.tabName.value = "Configuração Geral";
    el.tabId.value = "sheet1";
    state.tabName = el.tabName.value;
    state.tabId = el.tabId.value;
    document.querySelector('input[name="layoutMode"][value="com-tab"]').checked = true;
    setLayoutMode("com-tab");
    state.items = [
      createItem("label", { col: 1, lin: 1, tam: 11, text: "Cód. Natureza em Poder de Terceiros" }),
      createItem("campo", { col: 12.5, lin: 1, tam: 5, id: "cp1000", labelNum: 1000, varName: "NAT" }),
      createItem("display", { col: 18.5, lin: 1, tam: 20, id: "ds1000", text: "EM PODER DE 3ºS" }),
      createItem("label", { col: 1, lin: 2, tam: 11, text: "Cód. Natureza Pendente Retorno Inv." }),
      createItem("campo", { col: 12.5, lin: 2, tam: 21, id: "cp1100", labelNum: 1100, text: "36 / 56 / 58 / 75" }),
      createItem("botao", { col: 1, lin: 15, tam: 15, id: "btSalvar", text: "Salvar" }),
      createItem("botao", { col: 16.5, lin: 15, tam: 15, id: "btCancelar", text: "Cancelar" }),
    ];
    state.selectedId = state.items[0].uid;
    render();
    showAndCopySnippet(state.items[0], { copy: true });
  }

  function loadExampleNoTab() {
    el.ajCols.value = 70;
    el.ajRows.value = 26;
    el.ajTitle.value = "Consulta de Eficiência Detalhada por Movimentação da OP";
    document.querySelector('input[name="layoutMode"][value="sem-tab"]').checked = true;
    setLayoutMode("sem-tab");
    state.items = [
      createItem("label", { col: 1, lin: 1, tam: 15, text: "Empresas" }),
      createItem("campo", { col: 16, lin: 1, tam: 4, id: "cp1000", labelNum: 1000, varName: "CDCE" }),
      createItem("display", { col: 21, lin: 1, tam: 10, id: "ds1000", text: "Selecionados" }),
      createItem("label", { col: 1, lin: 2, tam: 15, text: "Centro de Custo" }),
      createItem("campo", { col: 16, lin: 2, tam: 12, id: "cp1100", labelNum: 1100 }),
      createItem("label", { col: 1, lin: 3, tam: 15, text: "Data Início" }),
      createItem("campo", { col: 16, lin: 3, tam: 8, id: "cp1200", labelNum: 1200, varName: "DATINI" }),
      createItem("display", { col: 25, lin: 3, tam: 10, id: "ds1200", text: "" }),
      createItem("label", { col: 1, lin: 4, tam: 15, text: "Data Fim" }),
      createItem("campo", { col: 16, lin: 4, tam: 8, id: "cp1300", labelNum: 1300, varName: "DATFIM" }),
      createItem("btnConsultar", { col: 50, lin: 2, tam: 12 }),
    ];
    state.selectedId = state.items[0].uid;
    render();
    showAndCopySnippet(state.items[0], { copy: true });
  }

  ["ajCols", "ajRows", "ajTitle"].forEach((k) => {
    el[k].addEventListener("change", render);
    el[k].addEventListener("input", () => {
      if (k === "ajTitle") {
        state.title = el.ajTitle.value;
        el.windowTitle.textContent = state.title;
      }
    });
  });

  document.querySelectorAll('input[name="layoutMode"]').forEach((radio) => {
    radio.addEventListener("change", () => setLayoutMode(radio.value));
  });

  el.tabName.addEventListener("input", () => {
    state.tabName = el.tabName.value || "Aba";
    el.tabChip.textContent = state.tabName;
    renderExport();
  });
  el.tabId.addEventListener("input", () => {
    state.tabId = el.tabId.value || "sheet1";
    renderExport();
  });

  document.querySelectorAll(".palette-item").forEach((btn) => {
    btn.addEventListener("click", () => addFromPalette(btn.dataset.type));
  });

  document.querySelectorAll(".export-tabs .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".export-tabs .tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.exportMode = btn.dataset.export;
      renderExport();
    });
  });

  ["propId", "propText", "propVar", "propCol", "propLin", "propTam"].forEach((id) => {
    if (el[id]) el[id].addEventListener("change", applyPropsFromForm);
  });

  document.getElementById("btnCopyItem").addEventListener("click", () => {
    const item = getSelected();
    if (item) showAndCopySnippet(item, { copy: true });
  });

  document.getElementById("btnDelete").addEventListener("click", () => {
    state.items = state.items.filter((i) => i.uid !== state.selectedId);
    state.selectedId = null;
    render();
  });

  document.getElementById("btnClear").addEventListener("click", () => {
    state.items = [];
    state.selectedId = null;
    render();
  });

  document.getElementById("btnCopyAll").addEventListener("click", async () => {
    const ok = await copyText(el.exportOut.value);
    if (ok) showToast("Export completo copiado!");
  });

  document.getElementById("btnApplyImport").addEventListener("click", () => {
    const parsed = parseImport(el.importIn.value);
    el.ajCols.value = parsed.cols;
    el.ajRows.value = parsed.rows;
    el.ajTitle.value = parsed.title;
    el.tabName.value = parsed.tabName;
    el.tabId.value = parsed.tabId;
    state.tabName = parsed.tabName;
    state.tabId = parsed.tabId;
    document.querySelector(`input[name="layoutMode"][value="${parsed.mode}"]`).checked = true;
    setLayoutMode(parsed.mode);
    state.items = parsed.items;
    state.selectedId = state.items[0]?.uid || null;
    render();
  });

  document.getElementById("btnExampleTab").addEventListener("click", loadExampleTab);
  document.getElementById("btnExampleNoTab").addEventListener("click", loadExampleNoTab);

  el.canvas.addEventListener("mousedown", () => {
    state.selectedId = null;
    render();
  });

  setLayoutMode("sem-tab");
  render();
})();
