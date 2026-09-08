(() => {
  const CELL_W = 14;
  const CELL_H = 28;
  const HALF = 0.5;

  const state = {
    cols: 80,
    rows: 17,
    layoutMode: "sem-tab",
    items: [],
    selectedId: null,
    menuItemUid: null,
    exportMode: "tags",
    nextSeq: 1,
  };

  const el = {
    ajCols: document.getElementById("ajCols"),
    ajRows: document.getElementById("ajRows"),
    tabBar: document.getElementById("tabBar"),
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
    itemMenu: document.getElementById("itemMenu"),
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

  function getMenuItem() {
    return state.items.find((i) => i.uid === state.menuItemUid) || null;
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
    if (!item) return { text: "", hint: "", copyText: "" };

    if (item.type === "label") {
      const text = `\t; csw:label:${fmt(item.col)},${item.lin},${fmt(item.tam)},${item.text}`;
      return { text, hint: "Tag de label", copyText: text };
    }

    if (item.type === "display") {
      const text = `\t; csw:display:${fmt(item.col)},${item.lin},${fmt(item.tam)},${item.id}`;
      return { text, hint: "Tag de display", copyText: text };
    }

    if (item.type === "campo") {
      const n = item.labelNum || Number(String(item.id).replace(/\D/g, "")) || 1000;
      const v = (item.varName || "VAR").trim() || "VAR";
      const csleLine = `do ^%CSLE(${item.lin},${fmt(item.col)},${fmt(item.tam)},"${v}",${v},,,,",,,${item.id}")`;
      const copyText = `${n}ON\t${csleLine}`;
      const text = [
        copyText,
        `\tquit:$$CSP^%CSW1UTI()`,
        "",
        `\t; CSLE = LIN,COL,TAM → ${item.lin},${fmt(item.col)},${fmt(item.tam)}`,
        `\t; Visual na tela: ${visualWidth(item)} colunas (TAM+2)`,
      ].join("\n");
      return { text, hint: "Linha CSLE", copyText };
    }

    if (item.type === "botao") {
      const nome = item.text || "Acao";
      const text = `\t; csw:botao:${fmt(item.col)},${item.lin},${item.id},<u>${nome.charAt(0)}</u>${nome.slice(1)},${nome.charAt(0).toLowerCase()},3000^ROTINA,salvar,${nome},${fmt(item.tam)}`;
      return { text, hint: "Tag de botão", copyText: text };
    }

    if (item.type === "btnConsultar") {
      const text = `\t; csw:btnConsultar:${fmt(item.col)},${item.lin},2000^ROTINA,0500^ROTINA`;
      return { text, hint: "Tag btnConsultar", copyText: text };
    }

    return { text: "", hint: "", copyText: "" };
  }

  function updateSnippetPanel(item) {
    if (!item) {
      el.snippetOut.value = "";
      el.snippetHint.textContent = "Clique no item → Copiar ou Excluir.";
      return;
    }
    const snip = buildSnippet(item);
    el.snippetOut.value = snip.text;
    el.snippetHint.textContent = snip.hint;
  }

  function hideItemMenu() {
    state.menuItemUid = null;
    el.itemMenu.classList.add("hidden");
  }

  function showItemMenu(item, clientX, clientY) {
    state.menuItemUid = item.uid;
    state.selectedId = item.uid;
    updateSnippetPanel(item);
    renderProps();

    el.itemMenu.classList.remove("hidden");
    const pad = 8;
    const mw = el.itemMenu.offsetWidth || 140;
    const mh = el.itemMenu.offsetHeight || 80;
    let left = clientX + 4;
    let top = clientY + 4;
    if (left + mw > window.innerWidth - pad) left = clientX - mw - 4;
    if (top + mh > window.innerHeight - pad) top = clientY - mh - 4;
    el.itemMenu.style.left = `${Math.max(pad, left)}px`;
    el.itemMenu.style.top = `${Math.max(pad, top)}px`;
  }

  async function copySelectedItem() {
    const item = getMenuItem() || getSelected();
    if (!item) return;
    const snip = buildSnippet(item);
    updateSnippetPanel(item);
    const ok = await copyText(snip.copyText || snip.text);
    if (ok) showToast(item.type === "campo" ? "CSLE copiado!" : "Tag copiada!");
    hideItemMenu();
  }

  function deleteSelectedItem() {
    const item = getMenuItem() || getSelected();
    if (!item) return;
    state.items = state.items.filter((i) => i.uid !== item.uid);
    state.selectedId = null;
    hideItemMenu();
    showToast("Item excluído");
    render();
  }

  function setLayoutMode(mode) {
    state.layoutMode = mode;
    const comTab = mode === "com-tab";
    el.tabBar.classList.toggle("hidden", !comTab);
    el.screenShell.classList.toggle("mode-com-tab", comTab);
    el.screenShell.classList.toggle("mode-sem-tab", !comTab);
    el.modeBadge.textContent = comTab ? "Com Tab" : "Sem Tab";
    render();
  }

  function syncAj() {
    state.cols = clamp(Number(el.ajCols.value) || 80, 20, 108);
    state.rows = clamp(Number(el.ajRows.value) || 17, 5, 28);
    el.ajCols.value = state.cols;
    el.ajRows.value = state.rows;
    el.windowTitle.textContent = `AJ ${state.cols} × ${state.rows}`;
    el.ajBadge.textContent = `${state.cols} × ${state.rows}`;
    el.canvas.style.width = `${state.cols * CELL_W}px`;
    el.canvas.style.height = `${state.rows * CELL_H}px`;
  }

  function validate() {
    const msgs = [];
    if (state.layoutMode === "com-tab") {
      msgs.push("Modo Com Tab: coordenadas relativas à aba");
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

  function maxTamFor(item) {
    const extra = item.type === "campo" ? 2 : 0;
    return Math.max(1, snapCol(state.cols - item.col + 1 - extra));
  }

  function setItemTam(item, nextTam) {
    item.tam = clamp(snapCol(nextTam), 1, maxTamFor(item));
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

    const labelEl = document.createElement("span");
    labelEl.className = "item-label";
    let label = item.id;
    if (item.type === "label") label = item.text || item.id;
    if (item.type === "campo") label = `[${item.id} · tam ${fmt(item.tam)}]`;
    if (item.type === "display") label = `${item.text || item.id} · ${fmt(item.tam)}`;
    if (item.type === "botao") label = item.text || item.id;
    if (item.type === "btnConsultar") label = "Consultar / Limpar";
    labelEl.textContent = label;
    node.appendChild(labelEl);

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.title = "Arraste para alterar o tamanho (horizontal)";
    node.appendChild(handle);
    node.addEventListener("mousedown", (ev) => onItemMouseDown(ev, item));
    return node;
  }

  function renderProps() {
    const item = getSelected();
    el.propsSection.classList.toggle("hidden", !item);
    if (!item) return;
    el.propId.value = item.id;
    el.propText.value = item.text || "";
    el.propVarRow.classList.toggle("hidden", item.type !== "campo");
    el.propVar.value = item.varName || "";
    el.propCol.value = item.col;
    el.propLin.value = item.lin;
    el.propTam.value = item.tam;
    if (item.type === "campo") {
      el.propExtra.textContent = `Visual: ${visualWidth(item)} colunas (TAM ${item.tam} + 2). Máx. TAM: ${maxTamFor(item)}`;
    } else {
      el.propExtra.textContent = `col,lin,tam → ${item.col},${item.lin},${item.tam} · Máx. TAM: ${maxTamFor(item)}`;
    }
  }

  function exportTags() {
    const lines = [];
    lines.push(`; csw:aj:${state.cols},${state.rows}`);
    lines.push(state.layoutMode === "com-tab" ? "; modo:com-tab" : "; modo:sem-tab");
    if (state.layoutMode === "com-tab") lines.push("; csw:labelseltab:0500");
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
    updateSnippetPanel(getSelected());
    renderExport();
    validate();
  }

  function onItemMouseDown(ev, item) {
    ev.preventDefault();
    ev.stopPropagation();
    hideItemMenu();

    const resizing = !!ev.target.closest(".resize-handle");
    state.selectedId = item.uid;

    // Atualiza seleção sem recriar o nó no meio do clique
    el.canvas.querySelectorAll(".item").forEach((n) => {
      n.classList.toggle("selected", n.dataset.uid === item.uid);
      n.classList.toggle("resizing", resizing && n.dataset.uid === item.uid);
    });
    renderProps();
    updateSnippetPanel(item);

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
        setItemTam(item, startTam + dx / CELL_W);
      } else {
        item.col = snapCol(clamp(startCol + dx / CELL_W, 1, state.cols));
        item.lin = Math.round(clamp(startLin + dy / CELL_H, 1, state.rows));
        // Ao mover, garante que o tamanho ainda cabe
        setItemTam(item, item.tam);
      }
      render();
      if (resizing) {
        const node = el.canvas.querySelector(`.item[data-uid="${item.uid}"]`);
        if (node) node.classList.add("resizing");
      }
    }

    function onUp(e) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      render();
      if (!moved && !resizing) {
        showItemMenu(item, e.clientX, e.clientY);
        state.selectedId = item.uid;
        el.canvas.querySelectorAll(".item").forEach((n) => {
          n.classList.toggle("selected", n.dataset.uid === item.uid);
        });
        renderProps();
        updateSnippetPanel(item);
      } else {
        updateSnippetPanel(item);
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function addFromPalette(type) {
    hideItemMenu();
    const item = createItem(type, {
      col: 1,
      lin: Math.min(state.rows, state.items.length + 1),
    });
    if (type === "campo") item.text = `Campo ${item.id}`;
    if (type === "label") item.text = "Novo Label";
    state.items.push(item);
    state.selectedId = item.uid;
    render();
  }

  function applyPropsFromForm() {
    const item = getSelected();
    if (!item) return;
    item.id = el.propId.value.trim() || item.id;
    item.text = el.propText.value;
    if (item.type === "campo") item.varName = el.propVar.value.trim() || "VAR";
    item.col = snapCol(clamp(Number(el.propCol.value) || 1, 1, state.cols));
    item.lin = Math.round(clamp(Number(el.propLin.value) || 1, 1, state.rows));
    setItemTam(item, Number(el.propTam.value) || 1);
    render();
  }

  function bumpTam(delta) {
    const item = getSelected();
    if (!item) return;
    setItemTam(item, Number(item.tam) + delta);
    render();
  }

  function parseImport(text) {
    const items = [];
    let cols = state.cols;
    let rows = state.rows;
    let mode = state.layoutMode;

    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line) return;

      let m = line.match(/csw:aj:([^,]+),([^,\s;]+)/i);
      if (m) {
        cols = Number(m[1]);
        rows = Number(m[2]);
        return;
      }
      if (/modo:com-tab/i.test(line)) {
        mode = "com-tab";
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
      if (/csw:botao:/i.test(line)) {
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

    return { items, cols, rows, mode };
  }

  function loadExampleTab() {
    hideItemMenu();
    el.ajCols.value = 80;
    el.ajRows.value = 17;
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
    state.selectedId = null;
    render();
  }

  function loadExampleNoTab() {
    hideItemMenu();
    el.ajCols.value = 70;
    el.ajRows.value = 26;
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
    state.selectedId = null;
    render();
  }

  ["ajCols", "ajRows"].forEach((k) => {
    el[k].addEventListener("change", render);
  });

  document.querySelectorAll('input[name="layoutMode"]').forEach((radio) => {
    radio.addEventListener("change", () => setLayoutMode(radio.value));
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
    if (el[id]) {
      el[id].addEventListener("change", applyPropsFromForm);
      if (id === "propTam") el[id].addEventListener("input", applyPropsFromForm);
    }
  });

  document.getElementById("btnTamMinus").addEventListener("click", () => bumpTam(-1));
  document.getElementById("btnTamPlus").addEventListener("click", () => bumpTam(1));

  el.itemMenu.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    ev.stopPropagation();
    if (btn.dataset.action === "copy") copySelectedItem();
    if (btn.dataset.action === "delete") deleteSelectedItem();
  });

  document.addEventListener("mousedown", (ev) => {
    if (!el.itemMenu.classList.contains("hidden") && !el.itemMenu.contains(ev.target)) {
      hideItemMenu();
    }
  });

  document.getElementById("btnClear").addEventListener("click", () => {
    hideItemMenu();
    state.items = [];
    state.selectedId = null;
    render();
  });

  document.getElementById("btnCopyAll").addEventListener("click", async () => {
    const ok = await copyText(el.exportOut.value);
    if (ok) showToast("Export completo copiado!");
  });

  document.getElementById("btnApplyImport").addEventListener("click", () => {
    hideItemMenu();
    const parsed = parseImport(el.importIn.value);
    el.ajCols.value = parsed.cols;
    el.ajRows.value = parsed.rows;
    document.querySelector(`input[name="layoutMode"][value="${parsed.mode}"]`).checked = true;
    setLayoutMode(parsed.mode);
    state.items = parsed.items;
    state.selectedId = null;
    render();
  });

  document.getElementById("btnExampleTab").addEventListener("click", loadExampleTab);
  document.getElementById("btnExampleNoTab").addEventListener("click", loadExampleNoTab);

  el.canvas.addEventListener("mousedown", () => {
    hideItemMenu();
    state.selectedId = null;
    render();
  });

  setLayoutMode("sem-tab");
  render();
})();
