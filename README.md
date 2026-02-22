# FocoJá — Planejamento diário para sair da sobrecarga

Aplicativo web para organizar **trabalho** e **pessoal/casa** em abas separadas.

## O que já faz

- Aba separada para **Atividades de Trabalho**.
- Aba separada para **Atividades Pessoal/Casa**.
- Classificação por prioridade, tipo (diária/com prazo/sem prazo), estimativa e andamento.
- Seleção automática do que fazer no dia por contexto (trabalho ou pessoal/casa).
- Lista de entregas com prazo no contexto atual.
- Aba de gráficos com:
  - gráfico das atividades de **trabalho**;
  - gráfico das atividades de **pessoal/casa**.
- Histórico de atividades concluídas.

## Como rodar

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173`.

## Publicação no GitHub Pages (automática e corrigida)

Seu Pages está em **Deploy from branch** usando a branch **`principal`**.

Agora o repositório usa o workflow:
- `.github/workflows/publish-principal.yml`

Ele faz o seguinte:
1. Quando houver push em `main` **ou** `principal`, o Actions publica o conteúdo para a branch `principal`.
2. Como o Pages já lê a branch `principal`, o site atualiza automaticamente.

### Se ainda aparecer versão antiga
1. Abra **Actions** e confira se o workflow **Publish to principal (GitHub Pages branch mode)** terminou com sucesso.
2. Em seguida, abra **Settings > Pages** e confirme que a origem continua `principal` + `/ (root)`.
3. Faça hard refresh (`Ctrl+F5` / `Cmd+Shift+R`) ou teste em aba anônima.

