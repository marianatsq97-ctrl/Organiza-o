const STORAGE_KEY = "focoja-dados";

const defaultIntegracoes = [
  { id: "google_calendar", nome: "Google Agenda", status: "desconectado", email: "" },
  { id: "clickup", nome: "ClickUp", status: "desconectado", email: "" },
  { id: "apple_notes", nome: "Notas (celular)", status: "desconectado", email: "" },
  { id: "outlook", nome: "Outlook", status: "desconectado", email: "" },
];

const state = {
  atividades: [],
  historico: [],
  planoHojeIds: [],
  integracoes: [...defaultIntegracoes],
  tabAtiva: "planejamento",
};

const refs = {
  atividade: document.getElementById("entrada-atividade"),
  prioridade: document.getElementById("entrada-prioridade"),
  tipo: document.getElementById("entrada-tipo"),
  prazo: document.getElementById("entrada-prazo"),
  estimativa: document.getElementById("entrada-estimativa"),
  lista: document.getElementById("lista-atividades"),
  listaHistorico: document.getElementById("lista-historico"),
  listaPlanoHoje: document.getElementById("lista-plano-hoje"),
  listaEntregas: document.getElementById("lista-entregas"),
  proxima: document.getElementById("proxima-acao"),
  energia: document.getElementById("energia"),
  energiaTexto: document.getElementById("energia-texto"),
  insightRapido: document.getElementById("insight-rapido"),
  integracoes: document.getElementById("integracoes"),
  contador: document.getElementById("contador-caracteres"),
  tabs: document.querySelectorAll(".tab-btn"),
  panels: {
    planejamento: document.getElementById("tab-planejamento"),
    historico: document.getElementById("tab-historico"),
    graficos: document.getElementById("tab-graficos"),
  },
  graficoPrioridadeTotal: document.getElementById("grafico-prioridade-total"),
  graficoStatus: document.getElementById("grafico-status"),
  graficoTempo: document.getElementById("grafico-tempo"),
  graficoTipos: document.getElementById("grafico-tipos"),
};

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizar(item) {
  return {
    ...item,
    andamento: item.andamento || "nao_iniciada",
    observacoes: item.observacoes || "",
    estimativaMin: Number(item.estimativaMin) > 0 ? Number(item.estimativaMin) : 30,
    tipo: item.tipo || "sem_prazo",
    prazoData: item.tipo === "com_prazo" ? (item.prazoData || "") : "",
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

  if (Array.isArray(parsed.integracoes) && parsed.integracoes.length) {
    state.integracoes = defaultIntegracoes.map((base) => {
      const saved = parsed.integracoes.find((item) => item.id === base.id) || {};
      return {
        ...base,
        email: saved.email || "",
        status: saved.status || "desconectado",
      };
    });
  }
}

function textoEnergia(v) {
  if (v <= 2) return "Baixo: priorize tarefas curtas e operacionais.";
  if (v === 3) return "Médio: ideal para tarefas importantes.";
  return "Alto: ótimo momento para tarefas de alta complexidade.";
}

function prioridadeOrdenada(a, b) {
  const ordem = { alta: 1, media: 2, baixa: 3 };
  return ordem[a.prioridade] - ordem[b.prioridade];
}

function textoTipo(tipo) {
  if (tipo === "diaria") return "Diária";
  if (tipo === "com_prazo") return "Com prazo";
  return "Sem prazo";
}

function diasParaPrazo(prazoData) {
  if (!prazoData) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${prazoData}T00:00:00`);
  return Math.floor((prazo - hoje) / 86400000);
}

function textoStatusIntegracao(status) {
  if (status === "conectado") return "Conectado";
  if (status === "pendente") return "Solicitação enviada";
  return "Desconectado";
}

function classeStatusIntegracao(status) {
  if (status === "conectado") return "connected";
  if (status === "pendente") return "pending";
  return "muted";
}

function textoAndamento(andamento) {
  const mapa = {
    nao_iniciada: "Não iniciada",
    em_andamento: "Em andamento",
    aguardando: "Aguardando",
    bloqueada: "Bloqueada",
  };
  return mapa[andamento] || "Não iniciada";
}

function atualizarContador() {
  refs.contador.textContent = `${refs.atividade.value.length}/1000`;
}

function formatarData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR");
}

function formatarTempo(minTotal) {
  const horas = Math.floor(minTotal / 60);
  const min = minTotal % 60;
  if (!horas) return `${min} min`;
  return `${horas}h ${min}min`;
}

function scoreTarefa(item) {
  const basePrioridade = { alta: 5, media: 3, baixa: 1 }[item.prioridade] || 1;
  const rapidez = item.estimativaMin <= 30 ? 3 : item.estimativaMin <= 90 ? 1 : 0;
  const diaria = item.tipo === "diaria" ? 2 : 0;
  let urgenciaPrazo = 0;
  if (item.tipo === "com_prazo") {
    const dias = diasParaPrazo(item.prazoData);
    if (dias === null) urgenciaPrazo = 1;
    else if (dias < 0) urgenciaPrazo = 6;
    else if (dias <= 1) urgenciaPrazo = 5;
    else if (dias <= 3) urgenciaPrazo = 3;
    else urgenciaPrazo = 1;
  }
  return basePrioridade + rapidez + diaria + urgenciaPrazo;
}

function montarPlanoHoje() {
  const energia = Number(refs.energia.value);
  const limite = energia <= 2 ? 3 : energia === 3 ? 5 : 7;

  const candidatas = state.atividades
    .filter((t) => !["bloqueada", "aguardando"].includes(t.andamento))
    .sort((a, b) => scoreTarefa(b) - scoreTarefa(a));

  state.planoHojeIds = candidatas.slice(0, limite).map((t) => t.id);
  salvar();
  renderPlanoHoje();
}

function alternarTab(tab) {
  state.tabAtiva = tab;
  refs.tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));

  Object.entries(refs.panels).forEach(([nome, panel]) => {
    panel.classList.toggle("active", nome === tab);
  });

  if (tab === "graficos") renderGraficos();
  salvar();
}

function desenharBarras(canvas, dados) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const margem = 20;
  const base = height - 40;
  const areaAltura = height - 70;
  const larguraBarra = (width - margem * 2) / dados.length - 14;
  const max = Math.max(1, ...dados.map((d) => d.value));

  dados.forEach((dado, i) => {
    const x = margem + i * (larguraBarra + 14);
    const altura = (dado.value / max) * areaAltura;
    const y = base - altura;

    ctx.fillStyle = dado.color;
    ctx.fillRect(x, y, larguraBarra, altura);

    ctx.fillStyle = "#f5f7ff";
    ctx.font = "12px sans-serif";
    ctx.fillText(String(dado.value), x + 6, y - 6);
    ctx.fillStyle = "#aab2d5";
    ctx.fillText(dado.label, x, height - 16);
  });
}

function renderGraficos() {
  const prioridadeTotal = { alta: 0, media: 0, baixa: 0 };
  [...state.atividades, ...state.historico].forEach((item) => {
    prioridadeTotal[item.prioridade] += 1;
  });

  const statusAtivo = { nao_iniciada: 0, em_andamento: 0, aguardando: 0, bloqueada: 0 };
  const tempoPorPrioridade = { alta: 0, media: 0, baixa: 0 };
  const tipoAtivo = { diaria: 0, com_prazo: 0, sem_prazo: 0 };

  state.atividades.forEach((item) => {
    statusAtivo[item.andamento] += 1;
    tempoPorPrioridade[item.prioridade] += item.estimativaMin;
    tipoAtivo[item.tipo] += 1;
  });

  desenharBarras(refs.graficoPrioridadeTotal, [
    { label: "Alta", value: prioridadeTotal.alta, color: "#ef4444" },
    { label: "Média", value: prioridadeTotal.media, color: "#f59e0b" },
    { label: "Baixa", value: prioridadeTotal.baixa, color: "#10b981" },
  ]);

  desenharBarras(refs.graficoStatus, [
    { label: "Não iniciada", value: statusAtivo.nao_iniciada, color: "#60a5fa" },
    { label: "Em andamento", value: statusAtivo.em_andamento, color: "#a78bfa" },
    { label: "Aguardando", value: statusAtivo.aguardando, color: "#f59e0b" },
    { label: "Bloqueada", value: statusAtivo.bloqueada, color: "#ef4444" },
  ]);

  desenharBarras(refs.graficoTempo, [
    { label: "Alta", value: tempoPorPrioridade.alta, color: "#fb7185" },
    { label: "Média", value: tempoPorPrioridade.media, color: "#fbbf24" },
    { label: "Baixa", value: tempoPorPrioridade.baixa, color: "#34d399" },
  ]);

  desenharBarras(refs.graficoTipos, [
    { label: "Diária", value: tipoAtivo.diaria, color: "#22d3ee" },
    { label: "Com prazo", value: tipoAtivo.com_prazo, color: "#f97316" },
    { label: "Sem prazo", value: tipoAtivo.sem_prazo, color: "#93c5fd" },
  ]);
}

function renderInsight() {
  const energia = Number(refs.energia.value);
  const rapidas = state.atividades.filter(
    (t) => t.estimativaMin <= 30 && !["bloqueada", "aguardando"].includes(t.andamento),
  );
  const travadas = state.atividades.filter((t) => ["bloqueada", "aguardando"].includes(t.andamento));

  const entregasAtrasadas = state.atividades.filter((t) => t.tipo === "com_prazo" && (diasParaPrazo(t.prazoData) ?? 1) < 0);
  const totalMin = state.atividades.reduce((soma, t) => soma + t.estimativaMin, 0);
  const diasEstimados = Math.ceil(totalMin / 120);

  let dicaEnergia = "";
  if (energia <= 2) dicaEnergia = "Com energia baixa, foque em tarefas rápidas e diárias essenciais.";
  else if (energia === 3) dicaEnergia = "Com energia média, faça 1 entrega de prazo + tarefas rápidas.";
  else dicaEnergia = "Com energia alta, avance nas entregas longas com prazo próximo.";

  refs.insightRapido.innerHTML = `
    <strong>O que fazer rápido agora:</strong> ${rapidas.length} tarefa(s) até 30 min.<br>
    <strong>O que evitar agora:</strong> ${travadas.length} tarefa(s) bloqueadas/aguardando.<br>
    <strong>Entregas críticas:</strong> ${entregasAtrasadas.length} entrega(s) atrasada(s).<br>
    <strong>Tempo estimado do backlog ativo:</strong> ${formatarTempo(totalMin)} (aprox. ${Math.max(1, diasEstimados)} dia(s) a 2h/dia).<br>
    <strong>Dica por energia:</strong> ${dicaEnergia}
  `;
}

function renderListaAtividades() {
  state.atividades.sort(prioridadeOrdenada);
  refs.lista.innerHTML = "";

  state.atividades.forEach((item) => {
    const dias = item.tipo === "com_prazo" ? diasParaPrazo(item.prazoData) : null;
    const infoPrazo =
      item.tipo === "com_prazo"
        ? ` • prazo: ${item.prazoData || "sem data"}${dias === null ? "" : dias < 0 ? " (atrasada)" : ` (${dias}d)`}`
        : "";

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="task-body">
        <div class="task-line">
          <span class="badge ${item.prioridade}">${item.prioridade.toUpperCase()}</span>
          <strong>${item.texto}</strong>
          <small class="muted">${textoTipo(item.tipo)} • ${item.estimativaMin} min${infoPrazo}</small>
        </div>

        <div class="task-grid">
          <label>
            Prioridade
            <select data-id="${item.id}" data-field="prioridade">
              <option value="alta" ${item.prioridade === "alta" ? "selected" : ""}>Alta</option>
              <option value="media" ${item.prioridade === "media" ? "selected" : ""}>Média</option>
              <option value="baixa" ${item.prioridade === "baixa" ? "selected" : ""}>Baixa</option>
            </select>
          </label>

          <label>
            Tipo
            <select data-id="${item.id}" data-field="tipo">
              <option value="diaria" ${item.tipo === "diaria" ? "selected" : ""}>Diária</option>
              <option value="com_prazo" ${item.tipo === "com_prazo" ? "selected" : ""}>Com prazo</option>
              <option value="sem_prazo" ${item.tipo === "sem_prazo" ? "selected" : ""}>Sem prazo</option>
            </select>
          </label>

          <label>
            Entrega (data)
            <input type="date" value="${item.prazoData || ""}" data-id="${item.id}" data-field="prazoData" />
          </label>

          <label>
            Em que pé está
            <select data-id="${item.id}" data-field="andamento">
              <option value="nao_iniciada" ${item.andamento === "nao_iniciada" ? "selected" : ""}>Não iniciada</option>
              <option value="em_andamento" ${item.andamento === "em_andamento" ? "selected" : ""}>Em andamento</option>
              <option value="aguardando" ${item.andamento === "aguardando" ? "selected" : ""}>Aguardando</option>
              <option value="bloqueada" ${item.andamento === "bloqueada" ? "selected" : ""}>Bloqueada</option>
            </select>
          </label>

          <label>
            Tempo estimado (min)
            <input type="number" min="5" step="5" value="${item.estimativaMin}" data-id="${item.id}" data-field="estimativaMin" />
          </label>

          <label class="task-notes">
            Observações
            <textarea rows="2" maxlength="1000" data-id="${item.id}" data-field="observacoes" placeholder="Detalhes rápidos...">${item.observacoes || ""}</textarea>
          </label>
        </div>
      </div>

      <div class="actions">
        <button data-id="${item.id}" data-action="done">Concluir</button>
      </div>
    `;

    refs.lista.appendChild(li);
  });

  const proxima = state.atividades[0];
  refs.proxima.textContent = proxima
    ? `${proxima.texto} (${proxima.prioridade}) • ${textoTipo(proxima.tipo)} • ${proxima.estimativaMin} min`
    : "Nenhuma atividade ainda.";
}

function renderPlanoHoje() {
  refs.listaPlanoHoje.innerHTML = "";
  const selecionadas = state.planoHojeIds
    .map((id) => state.atividades.find((t) => t.id === id))
    .filter(Boolean);

  if (!selecionadas.length) {
    const li = document.createElement("li");
    li.innerHTML = '<span class="muted">Clique em "Selecionar atividades de hoje" para montar seu dia.</span>';
    refs.listaPlanoHoje.appendChild(li);
  } else {
    selecionadas.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.texto}</span><small class="muted">${item.estimativaMin} min • ${textoTipo(item.tipo)}</small>`;
      refs.listaPlanoHoje.appendChild(li);
    });
  }

  refs.listaEntregas.innerHTML = "";
  const entregas = state.atividades
    .filter((t) => t.tipo === "com_prazo")
    .sort((a, b) => (a.prazoData || "9999-12-31").localeCompare(b.prazoData || "9999-12-31"));

  if (!entregas.length) {
    const li = document.createElement("li");
    li.innerHTML = '<span class="muted">Sem entregas com prazo no momento.</span>';
    refs.listaEntregas.appendChild(li);
  } else {
    entregas.forEach((item) => {
      const dias = diasParaPrazo(item.prazoData);
      const status = daysLabel(dias);
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.texto}</span><small class="muted">${item.prazoData || "sem data"} • ${status}</small>`;
      refs.listaEntregas.appendChild(li);
    });
  }
}

function daysLabel(dias) {
  if (dias === null) return "sem data";
  if (dias < 0) return `atrasada (${Math.abs(dias)}d)`;
  if (dias === 0) return "vence hoje";
  return `vence em ${dias}d`;
}

function renderHistorico() {
  refs.listaHistorico.innerHTML = "";

  if (!state.historico.length) {
    const vazio = document.createElement("li");
    vazio.innerHTML = '<span class="muted">Nenhuma atividade concluída ainda.</span>';
    refs.listaHistorico.appendChild(vazio);
    return;
  }

  [...state.historico]
    .sort((a, b) => new Date(b.concluidaEm) - new Date(a.concluidaEm))
    .forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="task-body">
          <div class="task-line">
            <span class="badge ${item.prioridade}">${item.prioridade.toUpperCase()}</span>
            <strong>${item.texto}</strong>
          </div>
          <small class="muted">Concluída em: ${formatarData(item.concluidaEm)}</small>
          <small class="muted">Tipo: ${textoTipo(item.tipo)} | Tempo estimado: ${item.estimativaMin} min</small>
          <small class="muted">Observações: ${item.observacoes || "-"}</small>
        </div>
      `;
      refs.listaHistorico.appendChild(li);
    });
}

function renderIntegracoes() {
  refs.integracoes.innerHTML = "";

  state.integracoes.forEach((item) => {
    const box = document.createElement("div");
    box.className = "integration";

    const botoes =
      item.status === "pendente"
        ? `
          <button data-integracao="${item.id}" data-action="connect">Conectar agora</button>
          <button data-integracao="${item.id}" data-action="reset" class="ghost">Cancelar solicitação</button>
        `
        : item.status === "conectado"
          ? `<button data-integracao="${item.id}" data-action="disconnect">Desconectar</button>`
          : `
            <input type="email" placeholder="Seu e-mail" value="${item.email}" data-integracao-email="${item.id}" />
            <button data-integracao="${item.id}" data-action="request">Solicitar conexão</button>
          `;

    box.innerHTML = `
      <strong>${item.nome}</strong>
      <p class="${classeStatusIntegracao(item.status)}">${textoStatusIntegracao(item.status)}</p>
      ${botoes}
    `;

    refs.integracoes.appendChild(box);
  });
}

function render() {
  renderListaAtividades();
  renderPlanoHoje();
  renderHistorico();
  renderIntegracoes();
  renderInsight();
  if (state.tabAtiva === "graficos") renderGraficos();
}

function adicionarAtividade() {
  const texto = refs.atividade.value.trim();
  if (!texto) return;

  const tipo = refs.tipo.value;
  const prazoData = tipo === "com_prazo" ? refs.prazo.value : "";

  state.atividades.push({
    id: crypto.randomUUID(),
    texto,
    prioridade: refs.prioridade.value,
    tipo,
    prazoData,
    andamento: "nao_iniciada",
    observacoes: "",
    estimativaMin: Math.max(5, Number(refs.estimativa.value) || 30),
    criadaEm: new Date().toISOString(),
  });

  refs.atividade.value = "";
  refs.estimativa.value = "30";
  refs.prazo.value = "";
  atualizarContador();
  salvar();
  render();
}

function concluirAtividade(id) {
  const atividade = state.atividades.find((a) => a.id === id);
  if (!atividade) return;
  state.historico.push({ ...atividade, concluidaEm: new Date().toISOString() });
  state.atividades = state.atividades.filter((a) => a.id !== id);
  state.planoHojeIds = state.planoHojeIds.filter((taskId) => taskId !== id);
  salvar();
  render();
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

refs.tabs.forEach((tabBtn) => tabBtn.addEventListener("click", () => alternarTab(tabBtn.dataset.tab)));
document.getElementById("btn-adicionar").addEventListener("click", adicionarAtividade);
document.getElementById("btn-montar-dia").addEventListener("click", () => {
  montarPlanoHoje();
  renderInsight();
});
refs.atividade.addEventListener("input", atualizarContador);

refs.lista.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-action='done']");
  if (!button) return;
  concluirAtividade(button.dataset.id);
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
  const fieldInput = e.target.closest("input[data-id], textarea[data-id]");
  if (!fieldInput) return;

  const item = state.atividades.find((a) => a.id === fieldInput.dataset.id);
  if (!item) return;

  if (fieldInput.dataset.field === "estimativaMin") {
    item.estimativaMin = Math.max(5, Number(fieldInput.value) || 5);
  }
  if (fieldInput.dataset.field === "observacoes") {
    item.observacoes = fieldInput.value;
  }

  salvar();
  renderInsight();
  if (state.tabAtiva === "graficos") renderGraficos();
});

document.getElementById("btn-gerar-plano").addEventListener("click", () => {
  state.atividades.sort(prioridadeOrdenada);
  salvar();
  render();
});

document.getElementById("btn-limpar").addEventListener("click", () => {
  state.atividades = [];
  state.planoHojeIds = [];
  salvar();
  render();
});

refs.energia.addEventListener("input", () => {
  refs.energiaTexto.textContent = textoEnergia(Number(refs.energia.value));
  renderInsight();
});

refs.integracoes.addEventListener("input", (e) => {
  const input = e.target.closest("input[data-integracao-email]");
  if (!input) return;
  const integracao = state.integracoes.find((i) => i.id === input.dataset.integracaoEmail);
  if (!integracao) return;
  integracao.email = input.value.trim();
  salvar();
});

refs.integracoes.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-integracao]");
  if (!button) return;

  const { integracao: id, action } = button.dataset;
  const item = state.integracoes.find((i) => i.id === id);
  if (!item) return;

  if (action === "request") {
    if (!emailValido(item.email)) {
      alert("Digite um e-mail válido para solicitar conexão.");
      return;
    }
    item.status = "pendente";
  }

  if (action === "connect") {
    if (item.status !== "pendente" || !emailValido(item.email)) {
      alert("Envie uma solicitação com e-mail válido antes de conectar.");
      return;
    }
    item.status = "conectado";
  }

  if (action === "disconnect" || action === "reset") {
    item.status = "desconectado";
  }

  salvar();
  render();
});

carregar();
refs.energiaTexto.textContent = textoEnergia(Number(refs.energia.value));
atualizarContador();
alternarTab(state.tabAtiva);
render();
