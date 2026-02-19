const APP_VERSION = "2026.02.17-2";
const STORAGE_KEY = "focoja-dados";

const state = {
  atividades: [],
  historico: [],
  planoHojeIds: [],
  tabAtiva: "planejamento",
  categoriaAtiva: "trabalho",
};

const refs = {
  atividade: document.getElementById("entrada-atividade"),
  prioridade: document.getElementById("entrada-prioridade"),
  tipo: document.getElementById("entrada-tipo"),
  prazo: document.getElementById("entrada-prazo"),
  estimativa: document.getElementById("entrada-estimativa"),
  categoriaLabel: document.getElementById("categoria-atual-label"),
  lista: document.getElementById("lista-atividades"),
  listaHistorico: document.getElementById("lista-historico"),
  listaPlanoHoje: document.getElementById("lista-plano-hoje"),
  listaEntregas: document.getElementById("lista-entregas"),
  proxima: document.getElementById("proxima-acao"),
  energia: document.getElementById("energia"),
  energiaTexto: document.getElementById("energia-texto"),
  insightRapido: document.getElementById("insight-rapido"),
  contador: document.getElementById("contador-caracteres"),
  tabs: document.querySelectorAll(".tab-btn"),
  subtabs: document.querySelectorAll(".subtab-btn"),
  panels: {
    planejamento: document.getElementById("tab-planejamento"),
    historico: document.getElementById("tab-historico"),
    graficos: document.getElementById("tab-graficos"),
  },
  graficoTrabalho: document.getElementById("grafico-trabalho"),
  graficoPessoal: document.getElementById("grafico-pessoal"),
  version: document.getElementById("app-version"),
  buildInfo: document.getElementById("build-info"),
};

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizar(item) {
  return {
    ...item,
    categoria: item.categoria || "trabalho",
    andamento: item.andamento || "nao_iniciada",
    observacoes: item.observacoes || "",
    estimativaMin: Number(item.estimativaMin) > 0 ? Number(item.estimativaMin) : 30,
    tipo: item.tipo || "sem_prazo",
    prazoData: item.tipo === "com_prazo" ? item.prazoData || "" : "",
  };
}

function carregar() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  state.atividades = Array.isArray(parsed.atividades) ? parsed.atividades.map(normalizar) : [];
  state.historico = Array.isArray(parsed.historico) ? parsed.historico.map(normalizar) : [];
  state.planoHojeIds = Array.isArray(parsed.planoHojeIds) ? parsed.planoHojeIds : [];
  state.tabAtiva = parsed.tabAtiva || "planejamento";
  state.categoriaAtiva = parsed.categoriaAtiva || "trabalho";
}

async function forcarAtualizacao() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    // sem falhar se o navegador bloquear alguma API
  }

  const url = new URL(window.location.href);
  url.searchParams.set("v", APP_VERSION);
  url.searchParams.set("t", String(Date.now()));
  window.location.replace(url.toString());
}

function textoEnergia(v) {
  if (v <= 2) return "Baixo: priorize tarefas curtas e operacionais.";
  if (v === 3) return "Médio: ideal para tarefas importantes.";
  return "Alto: ótimo momento para tarefas de alta complexidade.";
}

function atualizarContador() {
  refs.contador.textContent = `${refs.atividade.value.length}/1000`;
}

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "-";
}

function diasParaPrazo(prazoData) {
  if (!prazoData) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${prazoData}T00:00:00`);
  return Math.floor((prazo - hoje) / 86400000);
}

function textoTipo(tipo) {
  if (tipo === "diaria") return "Diária";
  if (tipo === "com_prazo") return "Com prazo";
  return "Sem prazo";
}

function prioridadePeso(pr) {
  return { alta: 5, media: 3, baixa: 1 }[pr] || 1;
}

function scoreTarefa(item) {
  const rapidez = item.estimativaMin <= 30 ? 3 : item.estimativaMin <= 90 ? 1 : 0;
  const diaria = item.tipo === "diaria" ? 2 : 0;
  let urgencia = 0;
  if (item.tipo === "com_prazo") {
    const d = diasParaPrazo(item.prazoData);
    if (d === null) urgencia = 1;
    else if (d < 0) urgencia = 6;
    else if (d <= 1) urgencia = 5;
    else if (d <= 3) urgencia = 3;
    else urgencia = 1;
  }
  return prioridadePeso(item.prioridade) + rapidez + diaria + urgencia;
}

function getAtivasCategoria() {
  return state.atividades.filter((t) => t.categoria === state.categoriaAtiva);
}

function alternarTab(tab) {
  state.tabAtiva = tab;
  refs.tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  Object.entries(refs.panels).forEach(([k, panel]) => panel.classList.toggle("active", k === tab));
  if (tab === "graficos") renderGraficos();
  salvar();
}

function alternarCategoria(cat) {
  state.categoriaAtiva = cat;
  refs.subtabs.forEach((b) => b.classList.toggle("active", b.dataset.categoria === cat));
  refs.categoriaLabel.textContent = `Você está organizando: ${cat === "trabalho" ? "Trabalho" : "Pessoal/Casa"}.`;
  render();
  salvar();
}

function desenharBarras(canvas, dados) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const m = 20;
  const base = height - 40;
  const area = height - 70;
  const w = (width - m * 2) / dados.length - 14;
  const max = Math.max(1, ...dados.map((d) => d.value));
  dados.forEach((d, i) => {
    const x = m + i * (w + 14);
    const h = (d.value / max) * area;
    const y = base - h;
    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#f5f7ff";
    ctx.font = "12px sans-serif";
    ctx.fillText(String(d.value), x + 6, y - 6);
    ctx.fillStyle = "#aab2d5";
    ctx.fillText(d.label, x, height - 16);
  });
}

function metricasCategoria(categoria) {
  const ativos = state.atividades.filter((t) => t.categoria === categoria);
  const concluidas = state.historico.filter((t) => t.categoria === categoria);
  const total = [...ativos, ...concluidas];
  return {
    alta: total.filter((t) => t.prioridade === "alta").length,
    media: total.filter((t) => t.prioridade === "media").length,
    baixa: total.filter((t) => t.prioridade === "baixa").length,
  };
}

function renderGraficos() {
  const mTrab = metricasCategoria("trabalho");
  const mPes = metricasCategoria("pessoal");
  desenharBarras(refs.graficoTrabalho, [
    { label: "Alta", value: mTrab.alta, color: "#ef4444" },
    { label: "Média", value: mTrab.media, color: "#f59e0b" },
    { label: "Baixa", value: mTrab.baixa, color: "#10b981" },
  ]);
  desenharBarras(refs.graficoPessoal, [
    { label: "Alta", value: mPes.alta, color: "#ef4444" },
    { label: "Média", value: mPes.media, color: "#f59e0b" },
    { label: "Baixa", value: mPes.baixa, color: "#10b981" },
  ]);
}

function renderLista() {
  const list = getAtivasCategoria().sort((a, b) => scoreTarefa(b) - scoreTarefa(a));
  refs.lista.innerHTML = "";
  list.forEach((item) => {
    const dias = item.tipo === "com_prazo" ? diasParaPrazo(item.prazoData) : null;
    const prazoInfo = item.tipo === "com_prazo" ? ` • ${item.prazoData || "sem data"}${dias !== null ? ` (${dias}d)` : ""}` : "";
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="task-body">
        <div class="task-line">
          <span class="badge ${item.prioridade}">${item.prioridade.toUpperCase()}</span>
          <strong>${item.texto}</strong>
          <small class="muted">${textoTipo(item.tipo)} • ${item.estimativaMin} min${prazoInfo}</small>
        </div>
        <div class="task-grid">
          <label>Prioridade
            <select data-id="${item.id}" data-field="prioridade">
              <option value="alta" ${item.prioridade === "alta" ? "selected" : ""}>Alta</option>
              <option value="media" ${item.prioridade === "media" ? "selected" : ""}>Média</option>
              <option value="baixa" ${item.prioridade === "baixa" ? "selected" : ""}>Baixa</option>
            </select>
          </label>
          <label>Tipo
            <select data-id="${item.id}" data-field="tipo">
              <option value="diaria" ${item.tipo === "diaria" ? "selected" : ""}>Diária</option>
              <option value="com_prazo" ${item.tipo === "com_prazo" ? "selected" : ""}>Com prazo</option>
              <option value="sem_prazo" ${item.tipo === "sem_prazo" ? "selected" : ""}>Sem prazo</option>
            </select>
          </label>
          <label>Data de entrega
            <input type="date" value="${item.prazoData || ""}" data-id="${item.id}" data-field="prazoData" />
          </label>
          <label>Andamento
            <select data-id="${item.id}" data-field="andamento">
              <option value="nao_iniciada" ${item.andamento === "nao_iniciada" ? "selected" : ""}>Não iniciada</option>
              <option value="em_andamento" ${item.andamento === "em_andamento" ? "selected" : ""}>Em andamento</option>
              <option value="aguardando" ${item.andamento === "aguardando" ? "selected" : ""}>Aguardando</option>
              <option value="bloqueada" ${item.andamento === "bloqueada" ? "selected" : ""}>Bloqueada</option>
            </select>
          </label>
          <label>Tempo estimado (min)
            <input type="number" min="5" step="5" value="${item.estimativaMin}" data-id="${item.id}" data-field="estimativaMin" />
          </label>
          <label class="task-notes">Observações
            <textarea rows="2" maxlength="1000" data-id="${item.id}" data-field="observacoes">${item.observacoes}</textarea>
          </label>
        </div>
      </div>
      <div class="actions"><button data-id="${item.id}" data-action="done">Concluir</button></div>
    `;
    refs.lista.appendChild(li);
  });

  const p = list[0];
  refs.proxima.textContent = p ? `${p.texto} (${p.prioridade}) • ${textoTipo(p.tipo)} • ${p.estimativaMin} min` : "Nenhuma atividade ainda.";
}

function renderPlanoEEntregas() {
  const ativos = getAtivasCategoria();
  const selecionadas = state.planoHojeIds.map((id) => ativos.find((t) => t.id === id)).filter(Boolean);
  refs.listaPlanoHoje.innerHTML = "";
  if (!selecionadas.length) {
    refs.listaPlanoHoje.innerHTML = '<li><span class="muted">Clique em "Selecionar atividades de hoje".</span></li>';
  } else {
    selecionadas.forEach((i) => {
      refs.listaPlanoHoje.innerHTML += `<li><span>${i.texto}</span><small class="muted">${i.estimativaMin} min</small></li>`;
    });
  }

  const entregas = ativos.filter((t) => t.tipo === "com_prazo").sort((a, b) => (a.prazoData || "9999-12-31").localeCompare(b.prazoData || "9999-12-31"));
  refs.listaEntregas.innerHTML = "";
  if (!entregas.length) refs.listaEntregas.innerHTML = '<li><span class="muted">Sem entregas com prazo.</span></li>';
  entregas.forEach((i) => {
    const d = diasParaPrazo(i.prazoData);
    const st = d === null ? "sem data" : d < 0 ? `atrasada (${Math.abs(d)}d)` : d === 0 ? "vence hoje" : `vence em ${d}d`;
    refs.listaEntregas.innerHTML += `<li><span>${i.texto}</span><small class="muted">${i.prazoData || "sem data"} • ${st}</small></li>`;
  });
}

function renderInsight() {
  const ativos = getAtivasCategoria();
  const rapidas = ativos.filter((t) => t.estimativaMin <= 30 && !["bloqueada", "aguardando"].includes(t.andamento)).length;
  const travadas = ativos.filter((t) => ["bloqueada", "aguardando"].includes(t.andamento)).length;
  const total = ativos.reduce((s, t) => s + t.estimativaMin, 0);
  const dias = Math.max(1, Math.ceil(total / 120));
  refs.insightRapido.innerHTML = `<strong>Rápidas agora:</strong> ${rapidas} • <strong>Evitar:</strong> ${travadas} travadas • <strong>Entrega estimada:</strong> ${total} min (~${dias} dia(s) a 2h/dia)`;
}

function renderHistorico() {
  refs.listaHistorico.innerHTML = "";
  if (!state.historico.length) {
    refs.listaHistorico.innerHTML = '<li><span class="muted">Nenhuma atividade concluída ainda.</span></li>';
    return;
  }
  [...state.historico].sort((a, b) => new Date(b.concluidaEm) - new Date(a.concluidaEm)).forEach((i) => {
    refs.listaHistorico.innerHTML += `<li><div class="task-body"><div class="task-line"><span class="badge ${i.prioridade}">${i.prioridade.toUpperCase()}</span><strong>${i.texto}</strong></div><small class="muted">${i.categoria === "trabalho" ? "Trabalho" : "Pessoal/Casa"} • ${formatarData(i.concluidaEm)}</small></div></li>`;
  });
}

function render() {
  renderLista();
  renderPlanoEEntregas();
  renderInsight();
  renderHistorico();
  if (state.tabAtiva === "graficos") renderGraficos();
}

function montarPlanoHoje() {
  const energia = Number(refs.energia.value);
  const limite = energia <= 2 ? 3 : energia === 3 ? 5 : 7;
  const candidatas = getAtivasCategoria().filter((t) => !["bloqueada", "aguardando"].includes(t.andamento)).sort((a, b) => scoreTarefa(b) - scoreTarefa(a));
  state.planoHojeIds = candidatas.slice(0, limite).map((t) => t.id);
  salvar();
  renderPlanoEEntregas();
}

function adicionarAtividade() {
  const texto = refs.atividade.value.trim();
  if (!texto) return;
  const tipo = refs.tipo.value;
  state.atividades.push(normalizar({
    id: crypto.randomUUID(),
    texto,
    categoria: state.categoriaAtiva,
    prioridade: refs.prioridade.value,
    tipo,
    prazoData: tipo === "com_prazo" ? refs.prazo.value : "",
    andamento: "nao_iniciada",
    observacoes: "",
    estimativaMin: Math.max(5, Number(refs.estimativa.value) || 30),
    criadaEm: new Date().toISOString(),
  }));
  refs.atividade.value = "";
  refs.estimativa.value = "30";
  refs.prazo.value = "";
  atualizarContador();
  salvar();
  render();
}

function concluirAtividade(id) {
  const item = state.atividades.find((a) => a.id === id);
  if (!item) return;
  state.historico.push({ ...item, concluidaEm: new Date().toISOString() });
  state.atividades = state.atividades.filter((a) => a.id !== id);
  state.planoHojeIds = state.planoHojeIds.filter((taskId) => taskId !== id);
  salvar();
  render();
}

refs.tabs.forEach((b) => b.addEventListener("click", () => alternarTab(b.dataset.tab)));
refs.subtabs.forEach((b) => b.addEventListener("click", () => alternarCategoria(b.dataset.categoria)));
document.getElementById("btn-adicionar").addEventListener("click", adicionarAtividade);
document.getElementById("btn-montar-dia").addEventListener("click", montarPlanoHoje);
document.getElementById("btn-gerar-plano").addEventListener("click", render);
document.getElementById("btn-force-refresh").addEventListener("click", forcarAtualizacao);
document.getElementById("btn-limpar").addEventListener("click", () => {
  state.atividades = [];
  state.planoHojeIds = [];
  salvar();
  render();
});

refs.atividade.addEventListener("input", atualizarContador);
refs.energia.addEventListener("input", () => {
  refs.energiaTexto.textContent = textoEnergia(Number(refs.energia.value));
  renderInsight();
});

refs.lista.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='done']");
  if (!btn) return;
  concluirAtividade(btn.dataset.id);
});

refs.lista.addEventListener("change", (e) => {
  const field = e.target.closest("select[data-id], input[data-id][type='date']");
  if (!field) return;
  const item = state.atividades.find((a) => a.id === field.dataset.id);
  if (!item) return;
  item[field.dataset.field] = field.value;
  if (field.dataset.field === "tipo" && field.value !== "com_prazo") item.prazoData = "";
  salvar();
  render();
});

refs.lista.addEventListener("input", (e) => {
  const field = e.target.closest("input[data-id], textarea[data-id]");
  if (!field) return;
  const item = state.atividades.find((a) => a.id === field.dataset.id);
  if (!item) return;
  if (field.dataset.field === "estimativaMin") item.estimativaMin = Math.max(5, Number(field.value) || 5);
  if (field.dataset.field === "observacoes") item.observacoes = field.value;
  salvar();
  renderInsight();
  if (state.tabAtiva === "graficos") renderGraficos();
});

if (refs.version) refs.version.textContent = APP_VERSION;
if (refs.buildInfo) refs.buildInfo.textContent = `Build ativo: ${APP_VERSION}`;

carregar();
refs.energiaTexto.textContent = textoEnergia(Number(refs.energia.value));
atualizarContador();
alternarTab(state.tabAtiva);
alternarCategoria(state.categoriaAtiva);
render();
