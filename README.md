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


## Publicação no GitHub Pages (quando não atualiza)

Se o site não refletir a última versão:

1. Garanta que o commit foi enviado para o GitHub:
   ```bash
   git push origin <sua-branch>
   ```
2. Se a publicação usa `main`, faça merge da PR e confirme em **Settings > Pages**.
3. Force atualização no navegador:
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
4. Se ainda mostrar versão antiga, abra em aba anônima e confira o selo de versão no topo (ex.: `2026.02.17-2`).

> Esta versão já inclui cache-busting em `styles.css` e `app.js` via query string (`?v=...`).
