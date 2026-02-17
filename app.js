const STORAGE_KEY = "focoja-dados";

const state = {
  atividades: [],
  integracoes: [
    { id: "google_calendar", nome: "Google Agenda", conectado: false },
    { id: "clickup", nome: "ClickUp", conectado: false },
    { id: "apple_notes", nome: "Notas (celular)", conectado: false },
    { id: "outlook", nome: "Outlook", conectado: false },
  ],
};

const refs = {
  atividade: document.getElementById("entrada-atividade"),
  prioridade: document.getElementById("entrada-prioridade"),
  lista: document.getElementById("lista-atividades"),
  proxima: document.getElementById("proxima-acao"),
  energia: document.getElementById("energia"),
  energiaTexto: document.getElementById("energia-texto"),
  integracoes: document.getElementById("integracoes"),
};

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function carregar() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  state.atividades = parsed.atividades || [];
  state.integracoes = parsed.integracoes || state.integracoes;
}

function textoEnergia(v) {
  if (v <= 2) return "Baixo: priorize tarefas curtas e operacionais.";
  if (v === 3) return "Médio: ideal para tarefas importantes.";
  return "Alto: ótimo momento para tarefas de alta complexidade.";
}

function priorizar() {
  const ordem = { alta: 1, media: 2, baixa: 3 };
  state.atividades.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);
}

function render() {
  priorizar();
  refs.lista.innerHTML = "";

  state.atividades.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <span class="badge ${item.prioridade}">${item.prioridade.toUpperCase()}</span>
        ${item.texto}
      </div>
      <div class="actions">
        <button data-id="${item.id}" data-action="done">Concluir</button>
      </div>
    `;
    refs.lista.appendChild(li);
  });

  const proxima = state.atividades[0];
  refs.proxima.textContent = proxima
    ? `${proxima.texto} (${proxima.prioridade})`
    : "Nenhuma atividade ainda.";

  refs.integracoes.innerHTML = "";
  state.integracoes.forEach((item) => {
    const box = document.createElement("div");
    box.className = "integration";
    box.innerHTML = `
      <strong>${item.nome}</strong>
      <p class="${item.conectado ? "connected" : "muted"}">
        ${item.conectado ? "Conectado" : "Desconectado"}
      </p>
      <button data-integracao="${item.id}">
        ${item.conectado ? "Desconectar" : "Conectar"}
      </button>
    `;
    refs.integracoes.appendChild(box);
  });
}

function adicionarAtividade() {
  const texto = refs.atividade.value.trim();
  if (!texto) return;

  state.atividades.push({
    id: crypto.randomUUID(),
    texto,
    prioridade: refs.prioridade.value,
  });

  refs.atividade.value = "";
  salvar();
  render();
}

document.getElementById("btn-adicionar").addEventListener("click", adicionarAtividade);

refs.lista.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-action='done']");
  if (!button) return;
  const id = button.dataset.id;
  state.atividades = state.atividades.filter((a) => a.id !== id);
  salvar();
  render();
});

document.getElementById("btn-gerar-plano").addEventListener("click", () => {
  priorizar();
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

refs.integracoes.addEventListener("click", (e) => {
  const button = e.target.closest("button[data-integracao]");
  if (!button) return;

  const id = button.dataset.integracao;
  const integracao = state.integracoes.find((i) => i.id === id);
  if (!integracao) return;

  integracao.conectado = !integracao.conectado;
  salvar();
  render();
});

carregar();
refs.energiaTexto.textContent = textoEnergia(Number(refs.energia.value));
render();
