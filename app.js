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
  integracoes: [...defaultIntegracoes],
  tabAtiva: "planejamento",
};

const refs = {
  atividade: document.getElementById("entrada-atividade"),
  prioridade: document.getElementById("entrada-prioridade"),
  lista: document.getElementById("lista-atividades"),
  listaHistorico: document.getElementById("lista-historico"),
  proxima: document.getElementById("proxima-acao"),
  energia: document.getElementById("energia"),
  energiaTexto: document.getElementById("energia-texto"),
  integracoes: document.getElementById("integracoes"),
  contador: document.getElementById("contador-caracteres"),
  tabs: document.querySelectorAll(".tab-btn"),
  panels: {
    planejamento: document.getElementById("tab-planejamento"),
    historico: document.getElementById("tab-historico"),
    graficos: document.getElementById("tab-graficos"),
  },
  graficoPrioridade: document.getElementById("grafico-prioridade"),
  graficoStatus: document.getElementById("grafico-status"),
};

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function carregar() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  const parsed = JSON.parse(raw);
  state.atividades = Array.isArray(parsed.atividades) ? parsed.atividades : [];
  state.historico = Array.isArray(parsed.historico) ? parsed.historico : [];
  state.tabAtiva = parsed.tabAtiva || "planejamento";

  if (Array.isArray(parsed.integracoes) && parsed.integracoes.length) {
    state.integracoes = defaultIntegracoes.map((base) => {
      const saved = parsed.integracoes.find((item) => item.id === base.id) || {};
      const conectadoLegado = Boolean(saved.conectado);
      return {
        ...base,
        email: saved.email || "",
        status: saved.status || (conectadoLegado ? "conectado" : "desconectado"),
      };
    });
  }

  state.atividades = state.atividades.map((item) => ({
    ...item,
    andamento: item.andamento || "nao_iniciada",
    observacoes: item.observacoes || "",
  }));
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
  refs.contador.textContent = `${refs.atividade.value.length}/300`;
}

function formatarData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR");
}

function alternarTab(tab) {
  state.tabAtiva = tab;
  refs.tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));

  Object.entries(refs.panels).forEach(([nome, panel]) => {
    panel.classList.toggle("active", nome === tab);
  });

  if (tab === "graficos") {
    renderGraficos();
  }

  salvar();
}

function renderGraficos() {
  const prioridade = { alta: 0, media: 0, baixa: 0 };
  state.historico.forEach((item) => {
    prioridade[item.prioridade] += 1;
  });

  const statusAtivo = { nao_iniciada: 0, em_andamento: 0, aguardando: 0, bloqueada: 0 };
  state.atividades.forEach((item) => {
    statusAtivo[item.andamento] += 1;
  });

  desenharBarras(
    refs.graficoPrioridade,
    [
      { label: "Alta", value: prioridade.alta, color: "#ef4444" },
      { label: "Média", value: prioridade.media, color: "#f59e0b" },
      { label: "Baixa", value: prioridade.baixa, color: "#10b981" },
    ],
  );

  desenharBarras(
    refs.graficoStatus,
    [
      { label: "Não iniciada", value: statusAtivo.nao_iniciada, color: "#60a5fa" },
      { label: "Em andamento", value: statusAtivo.em_andamento, color: "#a78bfa" },
      { label: "Aguardando", value: statusAtivo.aguardando, color: "#f59e0b" },
      { label: "Bloqueada", value: statusAtivo.bloqueada, color: "#ef4444" },
    ],
  );
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

function renderListaAtividades() {
  state.atividades.sort(prioridadeOrdenada);
  refs.lista.innerHTML = "";

  state.atividades.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="task-body">
        <div class="task-line">
          <span class="badge ${item.prioridade}">${item.prioridade.toUpperCase()}</span>
          <strong>${item.texto}</strong>
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
            Em que pé está
            <select data-id="${item.id}" data-field="andamento">
              <option value="nao_iniciada" ${item.andamento === "nao_iniciada" ? "selected" : ""}>Não iniciada</option>
              <option value="em_andamento" ${item.andamento === "em_andamento" ? "selected" : ""}>Em andamento</option>
              <option value="aguardando" ${item.andamento === "aguardando" ? "selected" : ""}>Aguardando</option>
              <option value="bloqueada" ${item.andamento === "bloqueada" ? "selected" : ""}>Bloqueada</option>
            </select>
          </label>

          <label class="task-notes">
            Observações
            <textarea
              rows="2"
              maxlength="280"
              data-id="${item.id}"
              data-field="observacoes"
              placeholder="Detalhes rápidos, próximos passos, bloqueios..."
            >${item.observacoes || ""}</textarea>
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
    ? `${proxima.texto} (${proxima.prioridade}) • ${textoAndamento(proxima.andamento)}`
    : "Nenhuma atividade ainda.";
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
          <small class="muted">Status final: ${textoAndamento(item.andamento)}</small>
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
            <input
              type="email"
              placeholder="Seu e-mail"
              value="${item.email}"
              data-integracao-email="${item.id}"
            />
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
  renderHistorico();
  renderIntegracoes();

  if (state.tabAtiva === "graficos") {
    renderGraficos();
  }
}

function adicionarAtividade() {
  const texto = refs.atividade.value.trim();
  if (!texto) return;

  state.atividades.push({
    id: crypto.randomUUID(),
    texto,
    prioridade: refs.prioridade.value,
    andamento: "nao_iniciada",
    observacoes: "",
    criadaEm: new Date().toISOString(),
  });

  refs.atividade.value = "";
  atualizarContador();
  salvar();
  render();
}

function concluirAtividade(id) {
  const atividade = state.atividades.find((a) => a.id === id);
  if (!atividade) return;

  state.historico.push({
    ...atividade,
    concluidaEm: new Date().toISOString(),
  });

  state.atividades = state.atividades.filter((a) => a.id !== id);
  salvar();
  render();
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

refs.tabs.forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => alternarTab(tabBtn.dataset.tab));
});

document.getElementById("btn-adicionar").addEventListener("click", adicionarAtividade);
refs.atividade.addEventListener("input", atualizarContador);

refs.lista.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-action='done']");
  if (!button) return;
  concluirAtividade(button.dataset.id);
});

refs.lista.addEventListener("change", (e) => {
  const select = e.target.closest("select[data-id]");
  if (!select) return;

  const item = state.atividades.find((a) => a.id === select.dataset.id);
  if (!item) return;

  item[select.dataset.field] = select.value;
  salvar();
  render();
});

refs.lista.addEventListener("input", (e) => {
  const notes = e.target.closest("textarea[data-id][data-field='observacoes']");
  if (!notes) return;

  const item = state.atividades.find((a) => a.id === notes.dataset.id);
  if (!item) return;

  item.observacoes = notes.value;
  salvar();
});

document.getElementById("btn-gerar-plano").addEventListener("click", () => {
  state.atividades.sort(prioridadeOrdenada);
  salvar();
  render();
});

document.getElementById("btn-limpar").addEventListener("click", () => {
  state.atividades = [];
  salvar();
  render();
});

refs.energia.addEventListener("input", () => {
  refs.energiaTexto.textContent = textoEnergia(Number(refs.energia.value));
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
